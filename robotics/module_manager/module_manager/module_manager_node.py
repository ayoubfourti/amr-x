#!/usr/bin/env python3
"""module_manager node.

The transition layer for AMR-X. Owns:
  * DockModule / UndockModule  (actions)  - attach/detach a module
  * SetRobotMode               (service)  - change operating mode
  * RobotState / ModuleStatus / DockingStatus (topics) - published continuously

Integration points still to fill (marked TODO(integration)):
  * spawning/unspawning the module's controllers via controller_manager
  * reading the real mechanical-lock / module-detected sensors
Both depend on work that lands later (arm_control, the dockable Gazebo module).
Until then those steps are simulated so the node runs and can be integrated
against end-to-end.
"""
import time

import rclpy
from rclpy.action import ActionServer, CancelResponse, GoalResponse
from rclpy.callback_groups import ReentrantCallbackGroup
from rclpy.executors import MultiThreadedExecutor
from rclpy.node import Node

from ament_index_python.packages import get_package_share_directory
import os
import yaml

from amr_interfaces.action import DockModule, UndockModule
from amr_interfaces.srv import SetRobotMode
from amr_interfaces.msg import ModuleStatus, RobotState, DockingStatus

from module_manager.mode_state_machine import ModeStateMachine

from nav_msgs.msg import Odometry


class ModuleManager(Node):
    def __init__(self):
        super().__init__("module_manager")

        self._cb = ReentrantCallbackGroup()
        self._sm = ModeStateMachine()
        self._modules = self._load_modules()      # name -> config dict
        self._attached = {}                        # name -> ModuleStatus
        self._docking = DockingStatus()
        self._docking.state = DockingStatus.STATE_UNDOCKED
        self._safe = True                          # updated from SafetyState later

        #Add Subscription to /odom
        self._latest_pose = None
        self._latest_velocity = None
        self.create_subscription(
            Odometry, "odom", self._odom_callback, 10,
            callback_group=self._cb)

        # --- publishers (continuous state) ---
        self._pub_robot = self.create_publisher(RobotState, "robot_state", 10)
        self._pub_dock = self.create_publisher(DockingStatus, "docking_status", 10)
        self.create_timer(0.5, self._publish_state)   # 2 Hz

        # --- service: set mode ---
        self.create_service(
            SetRobotMode, "set_robot_mode", self._on_set_mode,
            callback_group=self._cb)

        # --- actions: dock / undock ---
        self._dock_srv = ActionServer(
            self, DockModule, "dock_module",
            execute_callback=self._exec_dock,
            goal_callback=self._accept_goal,
            cancel_callback=self._accept_cancel,
            callback_group=self._cb)
        self._undock_srv = ActionServer(
            self, UndockModule, "undock_module",
            execute_callback=self._exec_undock,
            goal_callback=self._accept_goal,
            cancel_callback=self._accept_cancel,
            callback_group=self._cb)

        self.get_logger().info(
            "module_manager up. Known modules: %s" % list(self._modules))

    # ----- config -----
    def _load_modules(self):
        try:
            share = get_package_share_directory("module_manager")
            path = os.path.join(share, "config", "modules.yaml")
            with open(path) as f:
                data = yaml.safe_load(f) or {}
            return data.get("modules", {})
        except Exception as exc:  # noqa: BLE001
            self.get_logger().warn("could not load modules.yaml: %s" % exc)
            return {}

    # ----- mode service -----
    def _on_set_mode(self, req, resp):
        ok, reason = self._sm.transition(req.mode, safe=self._safe, moving=False)
        resp.success = ok
        resp.message = reason
        self.get_logger().info("SetRobotMode('%s') -> %s (%s)"
                               % (req.mode, ok, reason))
        return resp

    # ----- action goal gating -----
    def _accept_goal(self, goal):
        return GoalResponse.ACCEPT

    def _accept_cancel(self, goal):
        return CancelResponse.ACCEPT

    # ----- dock -----
    def _exec_dock(self, goal_handle):
        req = goal_handle.request
        result = DockModule.Result()

        if req.module_name not in self._modules:
            result.success = False
            result.message = "unknown module '%s'" % req.module_name
            goal_handle.abort()
            return result

        stages = ["approaching", "aligning", "locking", "confirming"]
        for i, stage in enumerate(stages):
            if goal_handle.is_cancel_requested:
                goal_handle.canceled()
                result.success = False
                result.message = "cancelled during %s" % stage
                self._set_dock_state(DockingStatus.STATE_UNDOCKED)
                return result
            self._set_dock_state(DockingStatus.STATE_DOCKING, req.dock_id)
            fb = DockModule.Feedback()
            fb.stage = stage
            fb.progress = (i + 1) / len(stages)
            goal_handle.publish_feedback(fb)
            # TODO(integration): drive/align via Nav2 opennav_docking on 'approaching',
            # engage the physical latch on 'locking', read the real sensors on
            # 'confirming'. For now each stage is simulated with a short delay.
            time.sleep(0.5)

        # TODO(integration): spawn this module's controllers via controller_manager
        #   ros2 control load_controller / set_controller_state, using
        #   self._modules[req.module_name]['controllers_package'].
        self._docking.mechanical_lock = True     # TODO(integration): real sensor
        self._docking.module_detected = True     # TODO(integration): real sensor
        self._set_dock_state(DockingStatus.STATE_DOCKED, req.dock_id)

        ms = ModuleStatus()
        ms.module_name = req.module_name
        ms.mount_point = self._modules[req.module_name].get(
            "mount_point", "module_mount_top")
        ms.attached = True
        ms.state = ModuleStatus.STATE_ATTACHED
        ms.detail = "docked"
        self._attached[req.module_name] = ms

        result.success = True
        result.message = "module '%s' docked" % req.module_name
        goal_handle.succeed()
        self.get_logger().info(result.message)
        return result

    # ----- undock -----
    def _exec_undock(self, goal_handle):
        req = goal_handle.request
        result = UndockModule.Result()

        if req.module_name not in self._attached:
            result.success = False
            result.message = "module '%s' is not attached" % req.module_name
            goal_handle.abort()
            return result

        for i, stage in enumerate(["releasing", "retracting", "confirming"]):
            if goal_handle.is_cancel_requested:
                goal_handle.canceled()
                result.success = False
                result.message = "cancelled during %s" % stage
                return result
            self._set_dock_state(DockingStatus.STATE_UNDOCKING)
            fb = UndockModule.Feedback()
            fb.stage = stage
            fb.progress = (i + 1) / 3.0
            goal_handle.publish_feedback(fb)
            # TODO(integration): unspawn controllers, break the DetachableJoint.
            time.sleep(0.5)

        self._attached.pop(req.module_name, None)
        self._docking.mechanical_lock = False
        self._docking.module_detected = False
        self._set_dock_state(DockingStatus.STATE_UNDOCKED)

        result.success = True
        result.message = "module '%s' undocked" % req.module_name
        goal_handle.succeed()
        self.get_logger().info(result.message)
        return result

    # ----- state publishing -----
    def _set_dock_state(self, state, dock_id=""):
        self._docking.state = state
        if dock_id:
            self._docking.dock_id = dock_id
    
    def _odom_callback(self, msg):
        self._latest_pose = msg.pose.pose
        self._latest_velocity = msg.twist.twist

    def _publish_state(self):
        now = self.get_clock().now().to_msg()

        self._docking.header.stamp = now
        self._pub_dock.publish(self._docking)

        rs = RobotState()
        rs.header.stamp = now
        mode_map = {
            "idle": RobotState.MODE_IDLE,
            "navigation": RobotState.MODE_NAVIGATION,
            "manipulation": RobotState.MODE_MANIPULATION,
            "combined": RobotState.MODE_COMBINED,
        }
        rs.mode = mode_map.get(self._sm.mode, RobotState.MODE_IDLE)
        if self._latest_pose is not None:
            rs.base_pose = self._latest_pose
        if self._latest_velocity is not None:
            rs.base_velocity = self._latest_velocity
        rs.modules = list(self._attached.values())
        rs.localized = True     # TODO(integration): wire from AMCL/SLAM
        rs.safe = self._safe
        self._pub_robot.publish(rs)


def main(args=None):
    rclpy.init(args=args)
    node = ModuleManager()
    executor = MultiThreadedExecutor()
    executor.add_node(node)
    try:
        executor.spin()
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == "__main__":
    main()
