#!/usr/bin/env python3
import os
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument
from launch.conditions import IfCondition
from launch.substitutions import Command, LaunchConfiguration, PathJoinSubstitution
from launch_ros.actions import Node
from launch_ros.parameter_descriptions import ParameterValue
from launch_ros.substitutions import FindPackageShare


ARGUMENTS = [
    DeclareLaunchArgument('robot_name', default_value='arm_module',
                          description='Name of the robot'),
    DeclareLaunchArgument('prefix', default_value='',
                          description='Prefix for robot joints and links'),
    DeclareLaunchArgument('add_world', default_value='true',
                          choices=['true', 'false'],
                          description='Whether to add world link'),
    DeclareLaunchArgument('base_link', default_value='base_link',
                          description='Name of the base link'),
    DeclareLaunchArgument('base_type', default_value='g_shape',
                          description='Type of the base'),
    DeclareLaunchArgument('flange_link', default_value='link6_flange',
                          description='Name of the flange link'),
    DeclareLaunchArgument('gripper_type', default_value='gripper',
                          description='Type of the gripper'),
    DeclareLaunchArgument('use_camera', default_value='false',
                          choices=['true', 'false'],
                          description='Whether to use camera'),
    DeclareLaunchArgument('use_gazebo', default_value='false',
                          choices=['true', 'false'],
                          description='Whether to use Gazebo simulation'),
    DeclareLaunchArgument('use_gripper', default_value='true',
                          choices=['true', 'false'],
                          description='Whether to attach a gripper'),
    DeclareLaunchArgument('jsp_gui', default_value='true',
                          choices=['true', 'false'],
                          description='Enable joint_state_publisher_gui'),
    DeclareLaunchArgument('use_rviz', default_value='true',
                          choices=['true', 'false'],
                          description='Whether to start RViz'),
    DeclareLaunchArgument('use_sim_time', default_value='false',
                          description='Use simulation clock if true'),
]


def generate_launch_description():
    pkg_share_description = FindPackageShare('arm_description')

    default_urdf_model_path = PathJoinSubstitution(
        [pkg_share_description, 'urdf', 'arm_module.xacro'])
    default_rviz_config_path = PathJoinSubstitution(
        [pkg_share_description, 'rviz', 'arm_display.rviz'])

    declare_urdf_model_cmd = DeclareLaunchArgument(
        name='urdf_model',
        default_value=default_urdf_model_path,
        description='Absolute path to robot urdf/xacro file')

    declare_rviz_config_cmd = DeclareLaunchArgument(
        name='rviz_config_file',
        default_value=default_rviz_config_path,
        description='Full path to the RViz config file to use')

    urdf_model = LaunchConfiguration('urdf_model')
    rviz_config_file = LaunchConfiguration('rviz_config_file')
    use_sim_time = LaunchConfiguration('use_sim_time')
    jsp_gui = LaunchConfiguration('jsp_gui')
    use_rviz = LaunchConfiguration('use_rviz')

    robot_description_content = ParameterValue(Command([
        'xacro', ' ', urdf_model, ' ',
        'robot_name:=', LaunchConfiguration('robot_name'), ' ',
        'prefix:=', LaunchConfiguration('prefix'), ' ',
        'add_world:=', LaunchConfiguration('add_world'), ' ',
        'base_link:=', LaunchConfiguration('base_link'), ' ',
        'base_type:=', LaunchConfiguration('base_type'), ' ',
        'flange_link:=', LaunchConfiguration('flange_link'), ' ',
        'gripper_type:=', LaunchConfiguration('gripper_type'), ' ',
        'use_camera:=', LaunchConfiguration('use_camera'), ' ',
        'use_gazebo:=', LaunchConfiguration('use_gazebo'), ' ',
        'use_gripper:=', LaunchConfiguration('use_gripper')
    ]), value_type=str)

    start_robot_state_publisher_cmd = Node(
        package='robot_state_publisher',
        executable='robot_state_publisher',
        name='robot_state_publisher',
        output='screen',
        parameters=[{
            'use_sim_time': use_sim_time,
            'robot_description': robot_description_content}])

    start_joint_state_publisher_gui_cmd = Node(
        package='joint_state_publisher_gui',
        executable='joint_state_publisher_gui',
        name='joint_state_publisher_gui',
        parameters=[{'use_sim_time': use_sim_time}],
        condition=IfCondition(jsp_gui))

    start_rviz_cmd = Node(
        condition=IfCondition(use_rviz),
        package='rviz2',
        executable='rviz2',
        output='screen',
        arguments=['-d', rviz_config_file],
        parameters=[{'use_sim_time': use_sim_time}])

    ld = LaunchDescription(ARGUMENTS)
    ld.add_action(declare_urdf_model_cmd)
    ld.add_action(declare_rviz_config_cmd)
    ld.add_action(start_robot_state_publisher_cmd)
    ld.add_action(start_joint_state_publisher_gui_cmd)
    ld.add_action(start_rviz_cmd)

    return ld