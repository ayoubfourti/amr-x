import os
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument
from launch.conditions import IfCondition
from launch.substitutions import Command, LaunchConfiguration, PathJoinSubstitution
from launch_ros.actions import Node
from launch_ros.parameter_descriptions import ParameterValue
from launch_ros.substitutions import FindPackageShare


def generate_launch_description():
    pkg_share_description = FindPackageShare('dual_arm_description')

    default_urdf_model_path = PathJoinSubstitution(
        [pkg_share_description, 'urdf', 'dual_arm.urdf.xacro'])
    default_rviz_config_path = PathJoinSubstitution(
        [pkg_share_description, 'rviz', 'dual_arm_display.rviz'])

    declare_model_cmd = DeclareLaunchArgument(
        name='model',
        default_value=default_urdf_model_path,
        description='Absolute path to the robot xacro file')

    declare_jsp_gui_cmd = DeclareLaunchArgument(
        name='jsp_gui',
        default_value='true',
        choices=['true', 'false'],
        description='Use joint_state_publisher_gui to move joints with sliders')

    declare_rviz_config_cmd = DeclareLaunchArgument(
        name='rviz_config',
        default_value=default_rviz_config_path,
        description='Absolute path to rviz config file')

    robot_description = ParameterValue(
        Command(['xacro ', LaunchConfiguration('model')]),
        value_type=str
    )

    robot_state_publisher_node = Node(
        package='robot_state_publisher',
        executable='robot_state_publisher',
        name='robot_state_publisher',
        output='screen',
        parameters=[{'robot_description': robot_description}]
    )

    joint_state_publisher_gui_node = Node(
        package='joint_state_publisher_gui',
        executable='joint_state_publisher_gui',
        name='joint_state_publisher_gui',
        condition=IfCondition(LaunchConfiguration('jsp_gui'))
    )

    rviz_node = Node(
        package='rviz2',
        executable='rviz2',
        name='rviz2',
        output='screen',
        arguments=['-d', LaunchConfiguration('rviz_config')],
    )

    return LaunchDescription([
        declare_model_cmd,
        declare_jsp_gui_cmd,
        declare_rviz_config_cmd,
        robot_state_publisher_node,
        joint_state_publisher_gui_node,
        rviz_node,
    ])
