#!/usr/bin/env python3
"""
docking_sim_node.py  —  AMR-X docking state manager
=====================================================
Listens for attach/detach commands, tracks proximity to dock station,
publishes lock and detection state.

Topics IN:
  /sim/dock/attach   std_msgs/Bool
  /sim/dock/detach   std_msgs/Bool

Topics OUT:
  /sim/docking/mechanical_lock   std_msgs/Bool
  /sim/docking/module_detected   std_msgs/Bool
  /sim/docking/state             std_msgs/String
"""

import rclpy
from rclpy.node import Node
from std_msgs.msg import Bool, String
from nav_msgs.msg import Odometry
import math


DOCK_X = 10.0
DOCK_Y = -5.4
DETECT_RADIUS = 0.8   # metres


class DockingSimNode(Node):

    def __init__(self):
        super().__init__("docking_sim")

        self._locked   = False
        self._detected = False
        self._state    = "DETACHED"
        self._robot_x  = 0.0
        self._robot_y  = 0.0

        # Publishers
        self._lock_pub   = self.create_publisher(Bool,   "/sim/docking/mechanical_lock", 10)
        self._detect_pub = self.create_publisher(Bool,   "/sim/docking/module_detected",  10)
        self._state_pub  = self.create_publisher(String, "/sim/docking/state",            10)

        # Subscribers
        self.create_subscription(Bool, "/sim/dock/attach", self._on_attach, 10)
        self.create_subscription(Bool, "/sim/dock/detach", self._on_detach, 10)
        self.create_subscription(Odometry, "/odom", self._on_odom, 10)

        # Timers
        self.create_timer(0.2, self._publish)
        self.create_timer(0.5, self._update_detection)

        self.get_logger().info("docking_sim_node ready.")

    def _on_attach(self, msg: Bool):
        if msg.data and not self._locked:
            self._locked = True
            self._state  = "ATTACHED"
            self.get_logger().info("✓ ATTACHED")

    def _on_detach(self, msg: Bool):
        if msg.data and self._locked:
            self._locked = False
            self._state  = "DETACHED"
            self.get_logger().info("✓ DETACHED")

    def _on_odom(self, msg: Odometry):
        self._robot_x = msg.pose.pose.position.x
        self._robot_y = msg.pose.pose.position.y

    def _update_detection(self):
        dx = self._robot_x - DOCK_X
        dy = self._robot_y - DOCK_Y
        self._detected = math.sqrt(dx*dx + dy*dy) < DETECT_RADIUS

    def _publish(self):
        self._lock_pub.publish(Bool(data=self._locked))
        self._detect_pub.publish(Bool(data=self._detected))
        self._state_pub.publish(String(data=self._state))


def main(args=None):
    rclpy.init(args=args)
    rclpy.spin(DockingSimNode())
    rclpy.shutdown()


if __name__ == "__main__":
    main()
