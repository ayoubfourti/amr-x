#!/usr/bin/env python3

import time

from action_msgs.msg import GoalStatus
from builtin_interfaces.msg import Duration
from control_msgs.action import FollowJointTrajectory
import rclpy
from rclpy.action import ActionClient
from rclpy.node import Node
from trajectory_msgs.msg import JointTrajectory, JointTrajectoryPoint


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

        unavailable = []
        if not left_ready:
            unavailable.append('left')
        if not right_ready:
            unavailable.append('right')
        self.get_logger().error(
            f"Arm controller unavailable: {', '.join(unavailable)}"
        )
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

        left_handle = self._goal_handle(left_future, 'Left')
        right_handle = self._goal_handle(right_future, 'Right')

        if left_handle is None or right_handle is None:
            self._cancel_accepted_goal(left_handle)
            self._cancel_accepted_goal(right_handle)
            self.get_logger().error(
                'Both trajectories must be accepted; canceling partial motion'
            )
            return False, False

        self.get_logger().info('Both arms accepted trajectory, executing...')

        left_result_future = left_handle.get_result_async()
        right_result_future = right_handle.get_result_async()

        timeout = duration_sec + 5.0
        rclpy.spin_until_future_complete(self, left_result_future, timeout_sec=timeout)
        rclpy.spin_until_future_complete(self, right_result_future, timeout_sec=timeout)

        left_ok = self._result_succeeded(left_result_future, 'Left')
        right_ok = self._result_succeeded(right_result_future, 'Right')

        return left_ok, right_ok

    def _goal_handle(self, future, arm_name):
        if not future.done():
            self.get_logger().error(
                f'{arm_name} arm timed out waiting for goal acceptance'
            )
            return None

        try:
            handle = future.result()
        except Exception as exc:  # ROS action transport errors surface via Future.
            self.get_logger().error(
                f'{arm_name} arm goal request failed: {exc}'
            )
            return None

        if handle is None or not handle.accepted:
            self.get_logger().error(f'{arm_name} arm rejected the trajectory')
            return None
        return handle

    @staticmethod
    def _cancel_accepted_goal(handle):
        if handle is not None and handle.accepted:
            handle.cancel_goal_async()

    def _result_succeeded(self, future, arm_name):
        if not future.done():
            self.get_logger().error(
                f'{arm_name} arm timed out while executing the trajectory'
            )
            return False

        try:
            response = future.result()
        except Exception as exc:  # ROS action transport errors surface via Future.
            self.get_logger().error(
                f'{arm_name} arm result failed: {exc}'
            )
            return False

        if response is None:
            self.get_logger().error(f'{arm_name} arm returned no action result')
            return False
        if response.status != GoalStatus.STATUS_SUCCEEDED:
            self.get_logger().error(
                f'{arm_name} arm finished with action status {response.status}'
            )
            return False
        if response.result.error_code != FollowJointTrajectory.Result.SUCCESSFUL:
            detail = response.result.error_string or 'no controller detail'
            self.get_logger().error(
                f'{arm_name} arm controller failed with code '
                f'{response.result.error_code}: {detail}'
            )
            return False

        self.get_logger().info(f'{arm_name} arm reached target')
        return True

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
            return 1

        home = [0.0] * 7
        pos_a = [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 0.5]
        pos_b = [-0.5, 0.3, -0.3, 0.4, -0.4, 0.2, -0.2]

        node.get_logger().info('=== STARTING TRAJECTORY SEQUENCE ===')

        sequence = [
            ('HOME', home, 2.0),
            ('Position A', pos_a, 3.0),
            ('Position B', pos_b, 3.0),
            ('HOME', home, 2.0),
        ]
        for step, (label, positions, duration) in enumerate(sequence, start=1):
            node.get_logger().info(f'Step {step}: {label}')
            outcomes = node.move_to_position(
                positions,
                positions,
                duration_sec=duration,
            )
            if not all(outcomes):
                node.get_logger().error(
                    f'=== SEQUENCE ABORTED AT STEP {step}: {label} ==='
                )
                return 1
            if step < len(sequence):
                time.sleep(1.0)

        node.get_logger().info('=== SEQUENCE COMPLETE ===')
        return 0

    except KeyboardInterrupt:
        node.get_logger().info('Interrupted by user')
        return 130
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == '__main__':
    raise SystemExit(main())
