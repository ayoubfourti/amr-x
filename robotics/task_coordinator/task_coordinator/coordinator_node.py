#!/usr/bin/env python3
"""Mission behavior orchestration (mobile manipulation).

STUB - scaffolding only. TODO(team): implement.
"""
import rclpy
from rclpy.node import Node


class CoordinatorNode(Node):
    def __init__(self):
        super().__init__('coordinator_node')
        self.get_logger().info('coordinator_node stub started - TODO: implement')


def main(args=None):
    rclpy.init(args=args)
    node = CoordinatorNode()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
