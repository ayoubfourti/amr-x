#!/usr/bin/env python3
# =============================================================================
# AMR-X  -  teleop_joy.launch.py
# Gamepad teleoperation: joy_node reads the controller, teleop_twist_joy
# converts it to /cmd_vel. Hold the deadman (LB) and use the sticks.
#
#   ros2 launch bringup teleop_joy.launch.py
#   ros2 launch bringup teleop_joy.launch.py joy_dev:=/dev/input/js0
# =============================================================================
import os

from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node
from launch_ros.parameter_descriptions import ParameterValue


def generate_launch_description():
    pkg_bringup = get_package_share_directory("bringup")
    joy_config = os.path.join(pkg_bringup, "config", "teleop_joy.yaml")

    joy_dev = LaunchConfiguration("joy_dev")
    cmd_vel_topic = LaunchConfiguration("cmd_vel_topic")

    return LaunchDescription([
        DeclareLaunchArgument("joy_dev", default_value="0",
                              description="Joystick device id (integer; 0 = first device)."),
        DeclareLaunchArgument("cmd_vel_topic", default_value="/cmd_vel",
                              description="Output velocity topic."),

        Node(
            package="joy",
            executable="joy_node",
            name="joy_node",
            parameters=[{
                # device_id must be an int; ParameterValue coerces the string arg.
                "device_id": ParameterValue(joy_dev, value_type=int),
                "deadzone": 0.05,
            }],
            output="screen",
        ),

        Node(
            package="teleop_twist_joy",
            executable="teleop_node",
            name="teleop_twist_joy_node",
            parameters=[joy_config],
            remappings=[("/cmd_vel", cmd_vel_topic)],
            output="screen",
        ),
    ])
