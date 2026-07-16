#!/usr/bin/env python3
# =============================================================================
# AMR-X  -  display.launch.py
# View the robot model in RViz only (no Gazebo / no physics).
# Uses joint_state_publisher_gui so the wheels can be moved with sliders.
#
#   ros2 launch robot_description display.launch.py
# =============================================================================
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument
from launch.conditions import IfCondition, UnlessCondition
from launch.substitutions import Command, LaunchConfiguration, PathJoinSubstitution
from launch_ros.actions import Node
from launch_ros.substitutions import FindPackageShare
from launch_ros.parameter_descriptions import ParameterValue


def generate_launch_description():
    pkg = FindPackageShare("robot_description")

    xacro_file = PathJoinSubstitution([pkg, "urdf", "amr_2lidar.urdf.xacro"])
    rviz_config = PathJoinSubstitution([pkg, "rviz", "display.rviz"])

    use_gui = LaunchConfiguration("gui")

    # use_gazebo:=false -> model without Gazebo plugins (pure visualization)
    robot_description = ParameterValue(
        Command(["xacro ", xacro_file, " use_gazebo:=false"]),
        value_type=str,
    )

    return LaunchDescription([
        DeclareLaunchArgument(
            "gui", default_value="true",
            description="Start joint_state_publisher_gui with sliders "
                        "(false = headless joint_state_publisher)."),

        Node(
            package="robot_state_publisher",
            executable="robot_state_publisher",
            name="robot_state_publisher",
            output="screen",
            parameters=[{"robot_description": robot_description}],
        ),

        # With sliders (default)
        Node(
            package="joint_state_publisher_gui",
            executable="joint_state_publisher_gui",
            name="joint_state_publisher_gui",
            condition=IfCondition(use_gui),
        ),
        # Headless fallback
        Node(
            package="joint_state_publisher",
            executable="joint_state_publisher",
            name="joint_state_publisher",
            condition=UnlessCondition(use_gui),
        ),

        Node(
            package="rviz2",
            executable="rviz2",
            name="rviz2",
            output="screen",
            arguments=["-d", rviz_config],
        ),
    ])
