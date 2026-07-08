#!/usr/bin/env python3
"""ROS 2 <-> dashboard telemetry/command bridge.

STUB - scaffolding only. TODO(team): implement.
"""
import rclpy
from rclpy.node import Node


class BridgeNode(Node):
    def __init__(self):
        super().__init__('bridge_node')
        self.get_logger().info('bridge_node stub started - TODO: implement')


def main(args=None):
    rclpy.init(args=args)
    node = BridgeNode()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
