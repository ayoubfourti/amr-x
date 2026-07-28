#!/usr/bin/env python3

import rclpy
from rclpy.node import Node
from rclpy.action import ActionClient
from control_msgs.action import FollowJointTrajectory
from trajectory_msgs.msg import JointTrajectory, JointTrajectoryPoint
from builtin_interfaces.msg import Duration
import time


class DualArmTrajectoryNode(Node):

    def __init__(self):
        super().__init__('dual_arm_trajectory_node')

        self.left_arm_joints = [
            'shoulder1_joint', 'shoulder2_joint', 'shoulder3_joint',
            'shoulder4_joint', 'shoulder5_joint', 'shoulder6_joint',
            'wrist_joint'
        ]

        self.right_arm_joints = [
            'shoulderR_joint', 'shoulderR_2_joint', 'shoulderR_3joint',
            'shoulderR_4joint', 'shoulderR_5joint', 'shoulderR_6joint',
            'wristR_joint'
        ]

        self.left_client = ActionClient(
            self, FollowJointTrajectory, '/left_arm_controller/follow_joint_trajectory'
        )
        self.right_client = ActionClient(
            self, FollowJointTrajectory, '/right_arm_controller/follow_joint_trajectory'
        )

        self.get_logger().info('Dual Arm Trajectory Node initialized')

    def wait_for_servers(self, timeout=5.0):
        self.get_logger().info('Waiting for arm controllers...')
        left_ready = self.left_client.wait_for_server(timeout_sec=timeout)
        right_ready = self.right_client.wait_for_server(timeout_sec=timeout)

        if left_ready and right_ready:
            self.get_logger().info('Both arm controllers ready!')
            return True
        else:
            self.get_logger().error('Arm controllers not available')
            return False

    def move_to_position(self, left_positions, right_positions, duration_sec=3.0):
        self.get_logger().info(f'Moving arms over {duration_sec}s...')
        self.get_logger().info(f'  Left:  {[f"{x:.2f}" for x in left_positions]}')
        self.get_logger().info(f'  Right: {[f"{x:.2f}" for x in right_positions]}')

        left_traj = self._create_trajectory(self.left_arm_joints, left_positions, duration_sec)
        right_traj = self._create_trajectory(self.right_arm_joints, right_positions, duration_sec)

        left_future = self.left_client.send_goal_async(
            FollowJointTrajectory.Goal(trajectory=left_traj)
        )
        right_future = self.right_client.send_goal_async(
            FollowJointTrajectory.Goal(trajectory=right_traj)
        )

        rclpy.spin_until_future_complete(self, left_future, timeout_sec=2.0)
        rclpy.spin_until_future_complete(self, right_future, timeout_sec=2.0)

        left_handle = left_future.result()
        right_handle = right_future.result()

        if not left_handle.accepted or not right_handle.accepted:
            self.get_logger().error('One or both arms rejected the trajectory')
            return False, False

        self.get_logger().info('Both arms accepted trajectory, executing...')

        left_result_future = left_handle.get_result_async()
        right_result_future = right_handle.get_result_async()

        timeout = duration_sec + 5.0
        rclpy.spin_until_future_complete(self, left_result_future, timeout_sec=timeout)
        rclpy.spin_until_future_complete(self, right_result_future, timeout_sec=timeout)

        left_ok = left_result_future.done()
        right_ok = right_result_future.done()

        if left_ok:
            self.get_logger().info('Left arm reached target')
        else:
            self.get_logger().error('Left arm failed')

        if right_ok:
            self.get_logger().info('Right arm reached target')
        else:
            self.get_logger().error('Right arm failed')

        return left_ok, right_ok

    def _create_trajectory(self, joints, positions, duration_sec):
        traj = JointTrajectory()
        traj.joint_names = joints
        point = JointTrajectoryPoint()
        point.positions = positions
        point.time_from_start = Duration(
            sec=int(duration_sec),
            nanosec=int((duration_sec % 1) * 1e9)
        )
        traj.points = [point]
        return traj


def main(args=None):
    rclpy.init(args=args)
    node = DualArmTrajectoryNode()

    try:
        if not node.wait_for_servers():
            return

        home = [0.0] * 7
        pos_a = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]
        pos_b = [-0.5, 0.3, -0.3, 0.4, -0.4, 0.2, -0.2]

        node.get_logger().info('=== STARTING TRAJECTORY SEQUENCE ===')

        node.get_logger().info('Step 1: HOME')
        node.move_to_position(home, home, duration_sec=2.0)
        time.sleep(1.0)

        node.get_logger().info('Step 2: Position A')
        node.move_to_position(pos_a, pos_a, duration_sec=3.0)
        time.sleep(1.0)

        node.get_logger().info('Step 3: Position B')
        node.move_to_position(pos_b, pos_b, duration_sec=3.0)
        time.sleep(1.0)

        node.get_logger().info('Step 4: Back to HOME')
        node.move_to_position(home, home, duration_sec=2.0)

        node.get_logger().info('=== SEQUENCE COMPLETE ===')

    except KeyboardInterrupt:
        node.get_logger().info('Interrupted by user')
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    main()
