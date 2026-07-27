#!/usr/bin/env python3
"""
docking_mission.py  —  AMR-X Docking Demo
==========================================
Run in Terminal 4 after:
  - Terminal 1: launch_demo.sh      (Gazebo + models)
  - Terminal 2: launch_bridge.sh    (ROS-Gazebo bridge)
  - Terminal 3: ros2 run docking_sim docking_sim_node

What this script does:
  1. Drives robot from x=2 to arm station at x=10
  2. Stops when close enough
  3. Publishes /sim/dock/attach
  4. Removes arm_station from Gazebo world
  5. Spawns amr_armed (robot + arm) at robot position
  6. Waits for Ctrl+C to undock
"""

import rclpy
from rclpy.node import Node
from nav_msgs.msg import Odometry
from geometry_msgs.msg import Twist
from std_msgs.msg import Bool, String
import subprocess
import time
import threading


# ── Config ──────────────────────────────────────────────────────────────────
ROBOT_START_WORLD_X = 2.0      # world x where robot was spawned
ROBOT_START_WORLD_Y = -5.4     # world y where robot was spawned
TRAVEL_DISTANCE     = 7.5      # meters to travel (odom frame)
DRIVE_SPEED         = 0.3      # m/s
WORLD               = "amr_warehouse"
ARMED_URDF          = "/tmp/amr_armed_visual.urdf"


class DockingMission(Node):

    def __init__(self):
        super().__init__("docking_mission")
        self.odom_x   = 0.0
        self.state    = "DETACHED"
        self.start_x  = None

        self.vel_pub    = self.create_publisher(Twist,  "/cmd_vel",         10)
        self.attach_pub = self.create_publisher(Bool,   "/sim/dock/attach", 10)
        self.detach_pub = self.create_publisher(Bool,   "/sim/dock/detach", 10)

        self.create_subscription(Odometry, "/odom",              self._odom_cb,  10)
        self.create_subscription(String,   "/sim/docking/state", self._state_cb, 10)

    def _odom_cb(self, msg):
        self.odom_x = msg.pose.pose.position.x
        if self.start_x is None:
            self.start_x = self.odom_x

    def _state_cb(self, msg):
        self.state = msg.data

    def traveled(self):
        if self.start_x is None:
            return 0.0
        return abs(self.odom_x - self.start_x)

    def world_x(self):
        return round(self.odom_x + ROBOT_START_WORLD_X, 2)

    def drive(self, speed):
        t = Twist()
        t.linear.x = speed
        self.vel_pub.publish(t)

    def stop(self):
        self.vel_pub.publish(Twist())

    def ign_remove(self, model_name):
        subprocess.run(
            f'ign service -s /world/{WORLD}/remove '
            f'--reqtype ignition.msgs.Entity '
            f'--reptype ignition.msgs.Boolean '
            f'--timeout 2000 '
            f'--req \'name: "{model_name}" type: MODEL\'',
            shell=True, capture_output=True,
        )

    def spawn_armed(self, x, y):
        subprocess.run(
            f'ros2 run ros_gz_sim create '
            f'-world {WORLD} '
            f'-file {ARMED_URDF} '
            f'-name amr_armed '
            f'-x {x} -y {y} -z 0.0',
            shell=True,
        )


def main():
    rclpy.init()
    node = DockingMission()

    spin_thread = threading.Thread(target=rclpy.spin, args=(node,), daemon=True)
    spin_thread.start()

    time.sleep(2.0)

    print("\n" + "="*50)
    print("  AMR-X DOCKING MISSION")
    print("="*50)

    # ── Step 1: Drive to arm ──────────────────────────────────────────────
    print("\n[STEP 1] Driving to arm station...")
    print(f"  Target: travel {TRAVEL_DISTANCE}m at {DRIVE_SPEED}m/s")

    while node.traveled() < TRAVEL_DISTANCE:
        node.drive(DRIVE_SPEED)
        time.sleep(0.1)
        print(f"  traveled={node.traveled():.2f}m  odom_x={node.odom_x:.2f}", end="\r")

    node.stop()
    time.sleep(0.5)

    wx = node.world_x()
    print(f"\n  Stopped at world x={wx}, y={ROBOT_START_WORLD_Y}")

    # ── Step 2: Attach ────────────────────────────────────────────────────
    print("\n[STEP 2] Attaching arm...")
    msg = Bool(); msg.data = True
    node.attach_pub.publish(msg)
    time.sleep(0.5)
    print("  ✓ Attach command sent")

    # ── Step 3: Remove arm station from world ─────────────────────────────
    print("\n[STEP 3] Removing arm from dock station...")
    node.ign_remove("arm_station")
    time.sleep(1.0)
    print("  ✓ Arm station removed")

    # ── Step 4: Spawn robot with arm ──────────────────────────────────────
    print("\n[STEP 4] Spawning robot with arm on top...")
    node.spawn_armed(wx, ROBOT_START_WORLD_Y)
    time.sleep(1.0)
    print("  ✓ Robot + arm spawned")

    print("\n" + "="*50)
    print("  ✓ DOCKING COMPLETE!")
    print("  Arm is now on top of the robot.")
    print("  Press Ctrl+C to undock.")
    print("="*50 + "\n")

    # ── Wait for undock ───────────────────────────────────────────────────
    try:
        while True:
            time.sleep(1.0)
    except KeyboardInterrupt:
        pass

    # ── Step 5: Undock ────────────────────────────────────────────────────
    print("\n[STEP 5] Undocking...")
    msg = Bool(); msg.data = True
    node.detach_pub.publish(msg)
    time.sleep(0.5)
    print("  ✓ Detach command sent")
    print("  State:", node.state)

    print("\n" + "="*50)
    print("  MISSION COMPLETE")
    print("="*50 + "\n")

    rclpy.shutdown()
    spin_thread.join()


if __name__ == "__main__":
    main()
