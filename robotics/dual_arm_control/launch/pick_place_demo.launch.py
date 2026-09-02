#!/usr/bin/env python3

import os

from ament_index_python.packages import get_package_share_directory

from launch import LaunchDescription
from launch_ros.actions import Node


def generate_launch_description():

    sim_time_params = os.path.join(
        get_package_share_directory("dual_arm_control"),
        "config",
        "sim_time.yaml",
    )

    pick_place_node = Node(
        package="dual_arm_control",
        executable="pick_place_demo.py",
        output="screen",
        parameters=[
            sim_time_params,
        ],
    )

    return LaunchDescription([
        pick_place_node,
    ])