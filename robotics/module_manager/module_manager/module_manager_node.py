#!/usr/bin/env python3
"""Runtime module attach/detach + mode transitions.

STUB - scaffolding only. TODO(team): implement.
"""
import rclpy
from rclpy.node import Node


class ModuleManagerNode(Node):
    def __init__(self):
        super().__init__('module_manager_node')
        self.get_logger().info('module_manager_node stub started - TODO: implement')


def main(args=None):
    rclpy.init(args=args)
    node = ModuleManagerNode()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
