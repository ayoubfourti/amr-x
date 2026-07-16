#!/usr/bin/env python3
# =============================================================================
# AMR-X  -  nav2.launch.py   (SLAM-mode: navigation servers only)
# =============================================================================
# Runs the Nav2 planner + controller + behaviors ONLY (no map_server, no AMCL),
# so it works on top of a live slam_toolbox session without fighting over the
# `map` frame. Use this for mapping-while-navigating (click Nav2 Goals).
#
# Order (each in its own sourced terminal):
#   ros2 launch bringup simulation.launch.py rviz:=false
#   ros2 launch navigation slam.launch.py
#   ros2 launch navigation nav2.launch.py rviz:=false
#
# In the SLAM RViz window, click "Nav2 Goal". The robot plans, drives, and
# continues mapping. Keep SLAM running; do not start AMCL or map_server.
# (No "2D Pose Estimate" needed — SLAM provides map->odom.)
# =============================================================================
import os

from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, IncludeLaunchDescription
from launch.conditions import IfCondition
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node


def generate_launch_description():
    pkg_nav = get_package_share_directory("navigation")
    pkg_nav2_bringup = get_package_share_directory("nav2_bringup")

    use_sim_time = LaunchConfiguration("use_sim_time")
    use_rviz = LaunchConfiguration("rviz")
    params_file = LaunchConfiguration("params_file")
    autostart = LaunchConfiguration("autostart")

    default_params = os.path.join(pkg_nav, "config", "nav2_params.yaml")
    default_rviz = os.path.join(pkg_nav2_bringup, "rviz", "nav2_default_view.rviz")

    # Navigation servers ONLY (planner, controller, bt_navigator, behaviors,
    # velocity_smoother, lifecycle manager) — NO map_server, NO amcl.
    # The map + map->odom transform come from slam_toolbox.
    nav2 = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            os.path.join(pkg_nav2_bringup, "launch", "navigation_launch.py")),
        launch_arguments={
            "use_sim_time": use_sim_time,
            "params_file": params_file,
            "autostart": autostart,
        }.items(),
    )

    rviz = Node(
        package="rviz2",
        executable="rviz2",
        name="rviz2",
        output="screen",
        arguments=["-d", default_rviz],
        parameters=[{"use_sim_time": use_sim_time}],
        condition=IfCondition(use_rviz),
    )

    return LaunchDescription([
        DeclareLaunchArgument("use_sim_time", default_value="true",
                              description="Use Gazebo sim clock."),
        DeclareLaunchArgument("rviz", default_value="true",
                              description="Open the Nav2 RViz view."),
        DeclareLaunchArgument("params_file", default_value=default_params,
                              description="Nav2 parameter file."),
        DeclareLaunchArgument("autostart", default_value="true",
                              description="Auto-activate the Nav2 lifecycle nodes."),
        nav2,
        rviz,
    ])
