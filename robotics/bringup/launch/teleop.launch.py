#!/usr/bin/env python3
# =============================================================================
# AMR-X  -  teleop.launch.py
# Keyboard teleoperation. Run this in its OWN terminal (it needs the keyboard
# focus). It publishes geometry_msgs/Twist on /cmd_vel, which the bridge
# forwards to the Gazebo DiffDrive plugin.
#
#   ros2 launch bringup teleop.launch.py
#
# NOTE: this launch opens teleop in an xterm window so it can capture keys
#       (requires `sudo apt install xterm`). If you prefer, skip the launch
#       file and just run the node directly in any terminal:
#
#   ros2 run teleop_twist_keyboard teleop_twist_keyboard
#
# Controls (teleop_twist_keyboard):
#   u i o            move forward / forward+turn
#   j k l            rotate / stop / rotate
#   m , .            move backward / backward+turn
#   q/z  w/x  e/c    adjust speeds
# =============================================================================
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node


def generate_launch_description():
    cmd_vel_topic = LaunchConfiguration("cmd_vel_topic")

    return LaunchDescription([
        DeclareLaunchArgument(
            "cmd_vel_topic", default_value="/cmd_vel",
            description="Topic to publish velocity commands on."),

        Node(
            package="teleop_twist_keyboard",
            executable="teleop_twist_keyboard",
            name="teleop_twist_keyboard",
            output="screen",
            prefix="xterm -e",      # open in its own terminal for key capture
            remappings=[("/cmd_vel", cmd_vel_topic)],
        ),
    ])
