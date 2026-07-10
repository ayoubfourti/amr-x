#!/usr/bin/env python3
"""ROS 2 <-> dashboard telemetry/command bridge.

STUB - scaffolding only. TODO(team): implement.
"""
import rclpy
from rclpy.node import Node
from nav_msgs.msg import Odometry
from amr_interfaces.msg import RobotState
from amr_interfaces.srv import SetMode


class BridgeNode(Node):
    def __init__(self):
        super().__init__('bridge_node')
        
        # store latest odom data to be republished as part of RobotState
        self.latest_pose = None
        self.latest_velocity = None
        self.current_mode = "idle"

        # subscribe to /odom topic
        self.odom_subscriber = self.create_subscription(
            Odometry,
            '/odom',
            self.odom_callback,
            10
        )

        # publisher to /robot_state topic
        self.robot_state_publisher = self.create_publisher(
            RobotState,
            '/robot_state',
            10
        )

        # service server for /set_mode
        self.set_mode_service = self.create_service(
            SetMode,
            '/set_mode',
            self.set_mode_callback
        )

        # timer for publishing robot_state at 10 Hz
        self.timer = self.create_timer(0.1, self.publish_state)

        self.get_logger().info('BridgeNode initialized and running.')

    def odom_callback(self, msg):
        self.latest_pose = msg.pose.pose
        self.latest_velocity = msg.twist.twist
    
    def set_mode_callback(self, request, response):
        self.current_mode = request.mode
        response.success = True
        response.message = f'Mode set to {self.current_mode}'
        self.get_logger().info(f'Mode changed to: {request.mode}')
        return response
    
    def publish_state(self):
        if self.latest_pose is None:
            return
        msg = RobotState()
        msg.mode = self.current_mode
        msg.base_pose = self.latest_pose
        msg.base_velocity = self.latest_velocity
        self.robot_state_publisher.publish(msg)

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
