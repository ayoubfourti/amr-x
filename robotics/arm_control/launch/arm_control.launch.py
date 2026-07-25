#!/usr/bin/env python3
"""
Launch ROS 2 controllers for the arm module.

Activates controllers on an already-running controller_manager
(started by the Gazebo gz_ros2_control plugin) in sequence:
    1. Joint State Broadcaster
    2. Arm Controller (after Joint State Broadcaster)
    3. Gripper Action Controller (after Arm Controller)
"""

from launch import LaunchDescription
from launch.actions import ExecuteProcess, RegisterEventHandler, TimerAction
from launch.event_handlers import OnProcessExit


def generate_launch_description():
    start_arm_controller_cmd = ExecuteProcess(
        cmd=['ros2', 'control', 'load_controller', '--set-state', 'active',
             'arm_controller'],
        output='screen')

    start_gripper_action_controller_cmd = ExecuteProcess(
        cmd=['ros2', 'control', 'load_controller', '--set-state', 'active',
             'gripper_action_controller'],
        output='screen')

    start_joint_state_broadcaster_cmd = ExecuteProcess(
        cmd=['ros2', 'control', 'load_controller', '--set-state', 'active',
             'joint_state_broadcaster'],
        output='screen')

    delayed_start = TimerAction(
        period=10.0,
        actions=[start_joint_state_broadcaster_cmd]
    )

    load_arm_controller_cmd = RegisterEventHandler(
        event_handler=OnProcessExit(
            target_action=start_joint_state_broadcaster_cmd,
            on_exit=[start_arm_controller_cmd]))

    load_gripper_controller_cmd = RegisterEventHandler(
        event_handler=OnProcessExit(
            target_action=start_arm_controller_cmd,
            on_exit=[start_gripper_action_controller_cmd]))

    ld = LaunchDescription()
    ld.add_action(delayed_start)
    ld.add_action(load_arm_controller_cmd)
    ld.add_action(load_gripper_controller_cmd)

    return ld