#!/usr/bin/env python3
# =============================================================================
# AMR-X  -  localization.launch.py   (AMCL-mode: navigate on a saved map)
# =============================================================================
# STEP 2 of navigation: localize + navigate in OUR warehouse using the map
# you built in step 1 (slam.launch.py) and the tuned nav2_params.yaml.
#
# Order (each in its own sourced terminal):
#   ros2 launch bringup simulation.launch.py
#   ros2 launch navigation localization.launch.py
#
# In RViz:
#   1. Click "2D Pose Estimate" and click-drag on the robot's real location
#      so AMCL's particle cloud converges on the true pose.
#   2. Click "Nav2 Goal" and click-drag a destination. The robot plans and
#      drives there autonomously using the static map (no more mapping).
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
    map_yaml = LaunchConfiguration("map")
    params_file = LaunchConfiguration("params_file")
    autostart = LaunchConfiguration("autostart")

    default_map = os.path.join(pkg_nav, "maps", "amr_warehouse_map.yaml")
    default_params = os.path.join(pkg_nav, "config", "nav2_params.yaml")
    default_rviz = os.path.join(pkg_nav2_bringup, "rviz", "nav2_default_view.rviz")

    # map_server + amcl, lifecycle-managed, publishing the map -> odom transform.
    localization = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            os.path.join(pkg_nav2_bringup, "launch", "localization_launch.py")),
        launch_arguments={
            "map": map_yaml,
            "use_sim_time": use_sim_time,
            "params_file": params_file,
            "autostart": autostart,
        }.items(),
    )

    # Navigation servers (planner, controller, bt_navigator, behaviors,
    # velocity_smoother, lifecycle manager) on top of the static map.
    navigation = IncludeLaunchDescription(
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
        DeclareLaunchArgument("map", default_value=default_map,
                              description="Path to the map .yaml to localize in."),
        DeclareLaunchArgument("params_file", default_value=default_params,
                              description="Nav2 parameter file."),
        DeclareLaunchArgument("autostart", default_value="true",
                              description="Auto-activate the Nav2 lifecycle nodes."),
        localization,
        navigation,
        rviz,
    ])
