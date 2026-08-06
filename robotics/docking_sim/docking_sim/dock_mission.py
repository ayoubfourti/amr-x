#!/usr/bin/env python3
"""
AMR-X Autonomous Docking Mission
==================================
Drives the robot to the dock station via Nav2, attaches the arm module,
then navigates to a delivery pose with the arm.

Depends on:
  - Nav2 stack running (BT navigator + AMCL or SLAM)
  - /sim/dock/attach, /sim/dock/detach  (your docking_sim_node)
  - /sim/docking/module_detected         (your docking_sim_node)
  - /sim/docking/mechanical_lock         (your docking_sim_node)

Usage:
  ros2 run docking_sim dock_mission   # if installed as entry point
  # or
  python3 dock_mission.py
"""

import rclpy
from rclpy.node import Node
from rclpy.action import ActionClient
from rclpy.callback_groups import ReentrantCallbackGroup
from rclpy.executors import MultiThreadedExecutor

from nav2_msgs.action import NavigateToPose
from geometry_msgs.msg import PoseStamped, Twist
from std_msgs.msg import Bool, String
from action_msgs.msg import GoalStatus

import math
import time
import threading
from enum import Enum, auto


# ---------------------------------------------------------------------------
# Waypoints  (map frame — tune these to your warehouse_fortress.sdf layout)
# ---------------------------------------------------------------------------
# Dock station: arm_module spawned at x=10, y=-5.4 in the world.
# The robot needs to stop ~0.4 m in front of the dock plate face.
DOCK_POSE = {
    "x": 9.55,        # stop short so dock_plate_link kisses the module
    "y": -5.4,
    "yaw": 0.0,       # facing +X  (adjust if dock face is oriented differently)
}

# Delivery pose — wherever you want the arm delivered
DELIVERY_POSE = {
    "x": 2.0,
    "y": 0.0,
    "yaw": math.pi,   # facing -X when parked at delivery
}

# Fine-approach: slow creep after Nav2 parks, to seat the dock plate
CREEP_SPEED    = 0.05   # m/s
CREEP_DURATION = 2.5    # seconds  (~12 cm travel)

# Attach settle time after mechanical_lock confirmed
ATTACH_SETTLE  = 1.5    # seconds


# ---------------------------------------------------------------------------
# State machine
# ---------------------------------------------------------------------------
class MissionState(Enum):
    IDLE              = auto()
    NAV_TO_DOCK       = auto()
    CREEP_FORWARD     = auto()
    WAITING_DETECT    = auto()
    ATTACHING         = auto()
    WAITING_LOCK      = auto()
    NAV_TO_DELIVERY   = auto()
    DONE              = auto()
    FAILED            = auto()


def yaw_to_quaternion(yaw: float):
    """Convert a yaw angle (radians) to a geometry_msgs Quaternion."""
    from geometry_msgs.msg import Quaternion
    q = Quaternion()
    q.z = math.sin(yaw / 2.0)
    q.w = math.cos(yaw / 2.0)
    return q


def make_pose_stamped(x: float, y: float, yaw: float) -> PoseStamped:
    ps = PoseStamped()
    ps.header.frame_id = "map"
    ps.pose.position.x = x
    ps.pose.position.y = y
    ps.pose.position.z = 0.0
    ps.pose.orientation = yaw_to_quaternion(yaw)
    return ps


# ---------------------------------------------------------------------------
# Mission node
# ---------------------------------------------------------------------------
class DockMissionNode(Node):

    def __init__(self):
        super().__init__("dock_mission")

        self._cbg = ReentrantCallbackGroup()

        # --- Nav2 action client ---
        self._nav_client = ActionClient(
            self,
            NavigateToPose,
            "navigate_to_pose",
            callback_group=self._cbg,
        )

        # --- Docking publishers (your existing topics) ---
        self._attach_pub  = self.create_publisher(Bool, "/sim/dock/attach",  10)
        self._detach_pub  = self.create_publisher(Bool, "/sim/dock/detach",  10)

        # --- Docking state subscribers ---
        self._module_detected = False
        self._mechanical_lock = False

        self.create_subscription(
            Bool, "/sim/docking/module_detected",
            self._cb_module_detected, 10,
            callback_group=self._cbg,
        )
        self.create_subscription(
            Bool, "/sim/docking/mechanical_lock",
            self._cb_mechanical_lock, 10,
            callback_group=self._cbg,
        )

        # --- cmd_vel for the creep phase ---
        self._vel_pub = self.create_publisher(Twist, "/cmd_vel", 10)

        # --- State ---
        self._state = MissionState.IDLE
        self._nav_goal_handle = None

        self.get_logger().info("DockMission node ready.")

    # -----------------------------------------------------------------------
    # Subscriber callbacks
    # -----------------------------------------------------------------------
    def _cb_module_detected(self, msg: Bool):
        self._module_detected = msg.data

    def _cb_mechanical_lock(self, msg: Bool):
        self._mechanical_lock = msg.data

    # -----------------------------------------------------------------------
    # High-level mission  (call from a thread, not the spin thread)
    # -----------------------------------------------------------------------
    def run_mission(self):
        self.get_logger().info("=== AMR-X DOCKING MISSION START ===")

        # 1. Navigate to dock station
        self._transition(MissionState.NAV_TO_DOCK)
        if not self._navigate_to(DOCK_POSE):
            return self._abort("Nav2 failed to reach dock station.")

        # 2. Fine-approach creep so dock_plate_link seats against arm_module
        self._transition(MissionState.CREEP_FORWARD)
        self._creep_forward()

        # 3. Check module detection
        self._transition(MissionState.WAITING_DETECT)
        if not self._wait_for(lambda: self._module_detected, timeout=5.0,
                               msg="module_detected"):
            self.get_logger().warn(
                "module_detected not true — proceeding anyway (may be pose offset)."
            )

        # 4. Send attach command
        self._transition(MissionState.ATTACHING)
        self.get_logger().info("Publishing /sim/dock/attach → True")
        msg = Bool(); msg.data = True
        self._attach_pub.publish(msg)

        # 5. Wait for mechanical_lock confirmation
        self._transition(MissionState.WAITING_LOCK)
        if not self._wait_for(lambda: self._mechanical_lock, timeout=5.0,
                               msg="mechanical_lock"):
            return self._abort("mechanical_lock never confirmed.")

        self.get_logger().info(f"Arm attached! Settling {ATTACH_SETTLE}s …")
        time.sleep(ATTACH_SETTLE)

        # 6. Navigate to delivery pose (arm is now attached)
        self._transition(MissionState.NAV_TO_DELIVERY)
        if not self._navigate_to(DELIVERY_POSE):
            return self._abort("Nav2 failed to reach delivery pose.")

        self._transition(MissionState.DONE)
        self.get_logger().info("=== MISSION COMPLETE — arm delivered ===")

    # -----------------------------------------------------------------------
    # Nav2 helper
    # -----------------------------------------------------------------------
    def _navigate_to(self, pose_dict: dict, timeout_sec: float = 120.0) -> bool:
        """Send a NavigateToPose goal, block until result. Returns True on success."""
        if not self._nav_client.wait_for_server(timeout_sec=10.0):
            self.get_logger().error("NavigateToPose action server not available!")
            return False

        goal = NavigateToPose.Goal()
        goal.pose = make_pose_stamped(**pose_dict)
        goal.pose.header.stamp = self.get_clock().now().to_msg()

        self.get_logger().info(
            f"  → Navigating to  x={pose_dict['x']:.2f}  y={pose_dict['y']:.2f}  "
            f"yaw={math.degrees(pose_dict['yaw']):.0f}°"
        )

        done_event = threading.Event()
        result_holder = [None]

        def _feedback_cb(fb):
            dist = fb.feedback.distance_remaining
            self.get_logger().info(f"  Nav2 remaining: {dist:.2f} m", throttle_duration_sec=3.0)

        def _result_cb(future):
            result_holder[0] = future.result()
            done_event.set()

        send_future = self._nav_client.send_goal_async(goal, feedback_callback=_feedback_cb)

        # Block until goal accepted
        goal_accepted_event = threading.Event()
        goal_handle_holder = [None]

        def _goal_response_cb(future):
            goal_handle_holder[0] = future.result()
            goal_accepted_event.set()

        send_future.add_done_callback(_goal_response_cb)
        goal_accepted_event.wait(timeout=15.0)

        gh = goal_handle_holder[0]
        if gh is None or not gh.accepted:
            self.get_logger().error("Nav2 goal rejected!")
            return False

        self._nav_goal_handle = gh
        result_future = gh.get_result_async()
        result_future.add_done_callback(_result_cb)

        if not done_event.wait(timeout=timeout_sec):
            self.get_logger().error("Nav2 timed out!")
            gh.cancel_goal_async()
            return False

        result = result_holder[0]
        if result is None:
            return False

        status = result.status
        if status == GoalStatus.STATUS_SUCCEEDED:
            self.get_logger().info("  Nav2 → SUCCEEDED")
            return True
        else:
            self.get_logger().error(f"  Nav2 → status {status} (not SUCCEEDED)")
            return False

    # -----------------------------------------------------------------------
    # Creep helper
    # -----------------------------------------------------------------------
    def _creep_forward(self):
        self.get_logger().info(
            f"Creeping forward {CREEP_SPEED} m/s for {CREEP_DURATION}s …"
        )
        twist = Twist()
        twist.linear.x = CREEP_SPEED
        end = time.time() + CREEP_DURATION
        rate_hz = 20
        sleep_s = 1.0 / rate_hz
        while time.time() < end:
            self._vel_pub.publish(twist)
            time.sleep(sleep_s)
        # Stop
        self._vel_pub.publish(Twist())
        time.sleep(0.2)

    # -----------------------------------------------------------------------
    # Utility
    # -----------------------------------------------------------------------
    def _wait_for(self, condition_fn, timeout: float, msg: str) -> bool:
        deadline = time.time() + timeout
        while time.time() < deadline:
            if condition_fn():
                self.get_logger().info(f"  ✓ {msg} confirmed")
                return True
            time.sleep(0.1)
        self.get_logger().warn(f"  ✗ Timed out waiting for {msg}")
        return False

    def _transition(self, new_state: MissionState):
        self.get_logger().info(f"[STATE] {self._state.name} → {new_state.name}")
        self._state = new_state

    def _abort(self, reason: str):
        self.get_logger().error(f"MISSION ABORT: {reason}")
        self._transition(MissionState.FAILED)
        # Safety: make sure arm is detached if we failed mid-attach
        msg = Bool(); msg.data = True
        self._detach_pub.publish(msg)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
def main(args=None):
    rclpy.init(args=args)
    node = DockMissionNode()

    executor = MultiThreadedExecutor()
    executor.add_node(node)

    # Spin in a background thread so our blocking mission can run in main
    spin_thread = threading.Thread(target=executor.spin, daemon=True)
    spin_thread.start()

    try:
        # Give ROS a moment to wire up
        time.sleep(1.5)
        node.run_mission()
    except KeyboardInterrupt:
        node.get_logger().info("Mission interrupted by user.")
    finally:
        executor.shutdown()
        rclpy.shutdown()
        spin_thread.join()


if __name__ == "__main__":
    main()
