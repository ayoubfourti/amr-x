#!/usr/bin/env python3
# =============================================================================
# AMR-X  -  nav2.launch.py
# =============================================================================
# STEP 2 of navigation: autonomous navigation in OUR warehouse with Nav2,
# using the map you built in step 1 (slam.launch.py) and the tuned
# nav2_params.yaml.
#
# Run the simulation FIRST in another terminal:
#     ros2 launch bringup simulation.launch.py
#
# Then run Nav2:
#     ros2 launch navigation nav2.launch.py
#
# In RViz:
#   1. Click "2D Pose Estimate" and click-drag on the robot's real location
#      so AMCL localises (tightens the particle cloud).
#   2. Click "Nav2 Goal" and click-drag a destination. The robot plans and
#      drives there autonomously.
#
# Useful arguments:
#   map:=/abs/path/to/your_map.yaml      # use a different map
#   rviz:=false                          # no RViz
#   params_file:=/abs/path/params.yaml   # different Nav2 params
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
    self_hit_range = LaunchConfiguration("self_hit_range")
    scan_pipeline = LaunchConfiguration("scan_pipeline")


    # Defaults: the map you save from slam.launch.py, and Ghassen's tuned params.
    default_map = os.path.join(pkg_nav, "maps", "amr_warehouse_map.yaml")
    default_params = os.path.join(pkg_nav, "config", "nav2_params.yaml")
    default_rviz = os.path.join(pkg_nav2_bringup, "rviz", "nav2_default_view.rviz")


     
    # ------------------------------------------------------------------
    # Scan pipeline: two self-hit filters + merger -> /scan_merged
    # (installed executables, run via ros2 run navigation ...)
    # ------------------------------------------------------------------
    filter1 = Node(
        package="navigation", executable="scan_filter_node.py",
        name="scan_filter_1", output="screen",
        condition=IfCondition(scan_pipeline),
        parameters=[{
            "use_sim_time": use_sim_time,
            "min_range": self_hit_range,
            "input_topic": "/scan",
            "output_topic": "/scan_clean",
        }],
    )
    filter2 = Node(
        package="navigation", executable="scan_filter_node.py",
        name="scan_filter_2", output="screen",
        condition=IfCondition(scan_pipeline),
        parameters=[{
            "use_sim_time": use_sim_time,
            "min_range": self_hit_range,
            "input_topic": "/scan_2",
            "output_topic": "/scan_2_clean",
        }],
    )
    merger = Node(
        package="navigation", executable="scan_merger_node.py",
        name="scan_merger", output="screen",
        condition=IfCondition(scan_pipeline),
        parameters=[{
            "use_sim_time": use_sim_time,
            "target_frame": "base_link",
            "output_topic": "/scan_merged",
            "scan1_topic": "/scan_clean",
            "scan2_topic": "/scan_2_clean",
        }],
    )
 


    # Bring up the full Nav2 stack (map_server, amcl, planner, controller,
    # bt_navigator, behaviors, lifecycle manager) via the standard launch.
    nav2 = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            os.path.join(pkg_nav2_bringup, "launch", "bringup_launch.py")),
        launch_arguments={
            "use_sim_time": use_sim_time,
            "map": map_yaml,
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
                              description="Path to the map .yaml to navigate in."),
        DeclareLaunchArgument("params_file", default_value=default_params,
                              description="Nav2 parameter file."),
        DeclareLaunchArgument("autostart", default_value="true",
                              description="Auto-activate the Nav2 lifecycle nodes."),
        DeclareLaunchArgument("self_hit_range", default_value="0.9",
                              description="Range (m) below which scans are the robot's own body."),
        DeclareLaunchArgument("scan_pipeline", default_value="true",
                              description="Start the two filters + merger. Set false if run elsewhere."),
        # scan pipeline first, then Nav2
        filter1,
        filter2,
        merger,
        nav2,
        rviz,
    ])
