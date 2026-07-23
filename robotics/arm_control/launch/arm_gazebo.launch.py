#!/usr/bin/env python3
"""
Standalone Gazebo bringup for the arm module.

Starts Gazebo, publishes the robot description with the Gazebo
hardware plugin enabled, spawns the robot into the simulation,
and activates the ros2_control controllers.
"""

import os

from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, IncludeLaunchDescription
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import Command, LaunchConfiguration, PathJoinSubstitution
from launch_ros.actions import Node
from launch_ros.parameter_descriptions import ParameterValue
from launch_ros.substitutions import FindPackageShare


ARGUMENTS = [
    DeclareLaunchArgument('robot_name', default_value='arm_module',
                          description='Name of the robot'),
    DeclareLaunchArgument('prefix', default_value='',
                          description='Prefix for robot joints and links'),
    DeclareLaunchArgument('base_link', default_value='base_link',
                          description='Name of the base link'),
    DeclareLaunchArgument('base_type', default_value='g_shape',
                          description='Type of the base'),
    DeclareLaunchArgument('flange_link', default_value='link6_flange',
                          description='Name of the flange link'),
    DeclareLaunchArgument('gripper_type', default_value='gripper',
                          description='Type of the gripper'),
    DeclareLaunchArgument('use_gripper', default_value='true',
                          choices=['true', 'false'],
                          description='Whether to attach a gripper'),
]

clock_bridge_cmd = Node(
    package='ros_gz_bridge',
    executable='parameter_bridge',
    arguments=['/clock@rosgraph_msgs/msg/Clock[gz.msgs.Clock'],
    output='screen'
)
def generate_launch_description():
    pkg_arm_description = FindPackageShare('arm_description')
    pkg_arm_control = get_package_share_directory('arm_control')
    pkg_ros_gz_sim = get_package_share_directory('ros_gz_sim')

    default_urdf_model_path = PathJoinSubstitution(
        [pkg_arm_description, 'urdf', 'arm_module.xacro'])

    urdf_model = LaunchConfiguration('urdf_model')
    declare_urdf_model_cmd = DeclareLaunchArgument(
        name='urdf_model',
        default_value=default_urdf_model_path,
        description='Absolute path to robot urdf/xacro file')

    # Start Gazebo (empty world for now)
    start_gazebo_cmd = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            os.path.join(pkg_ros_gz_sim, 'launch', 'gz_sim.launch.py')),
        launch_arguments={'gz_args': '-r empty.sdf'}.items())

    # Expand xacro with use_gazebo forced to true so the ros2_control
    # hardware plugin and Gazebo plugin get included
    robot_description_content = ParameterValue(Command([
        'xacro', ' ', urdf_model, ' ',
        'robot_name:=', LaunchConfiguration('robot_name'), ' ',
        'prefix:=', LaunchConfiguration('prefix'), ' ',
        'add_world:=', 'true', ' ',
        'base_link:=', LaunchConfiguration('base_link'), ' ',
        'base_type:=', LaunchConfiguration('base_type'), ' ',
        'flange_link:=', LaunchConfiguration('flange_link'), ' ',
        'gripper_type:=', LaunchConfiguration('gripper_type'), ' ',
        'use_camera:=', 'false', ' ',
        'use_gazebo:=', 'true', ' ',
        'use_gripper:=', LaunchConfiguration('use_gripper')
    ]), value_type=str)

    start_robot_state_publisher_cmd = Node(
        package='robot_state_publisher',
        executable='robot_state_publisher',
        name='robot_state_publisher',
        output='screen',
        parameters=[{
            'use_sim_time': True,
            'robot_description': robot_description_content}])

    # Spawn the robot into Gazebo from the /robot_description topic
    spawn_robot_cmd = Node(
        package='ros_gz_sim',
        executable='create',
        arguments=[
            '-topic', '/robot_description',
            '-name', LaunchConfiguration('robot_name'),
            '-z', '0.0'],
        output='screen')

    # Activate controllers once the robot is spawned and controller_manager is up
    start_controllers_cmd = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            os.path.join(pkg_arm_control, 'launch', 'arm_control.launch.py')))

    ld = LaunchDescription(ARGUMENTS)
    ld.add_action(declare_urdf_model_cmd)
    ld.add_action(start_gazebo_cmd)
    ld.add_action(clock_bridge_cmd)
    ld.add_action(start_robot_state_publisher_cmd)
    ld.add_action(spawn_robot_cmd)
    ld.add_action(start_controllers_cmd)

    return ld