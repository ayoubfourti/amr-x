#!/usr/bin/env python3
# =============================================================================
# AMR-X  -  mapping.launch.py
# =============================================================================
# AUTONOMOUS MAPPING: the robot explores and builds a map by itself.
#
# Starts, from ONE command:
#   - scan filter 1   (/scan   -> /scan_clean)
#   - scan filter 2   (/scan_2 -> /scan_2_clean)
#   - scan merger     (/scan_clean + /scan_2_clean -> /scan_merged)
#   - SLAM Toolbox    (reads /scan_merged, builds map, publishes map->odom)
#   - Nav2 NAVIGATION servers ONLY (planner, controller, bt_navigator,
#     behaviors, smoother, velocity_smoother, collision_monitor)
#       --> NO map_server, NO amcl.  SLAM is the localizer here, so there is
#           no second publisher on /map and no localization conflict.
#   - explore_lite    (drives the robot to frontiers autonomously)
#
# Run the simulation FIRST in another terminal:
#     ros2 launch bringup simulation.launch.py
# Then:
#     ros2 launch navigation mapping.launch.py
#
# When the map looks complete in RViz, SAVE it (keep SLAM running):
#     ros2 run nav2_map_server map_saver_cli -f navigation/maps/amr_warehouse_map
#
# Later, to NAVIGATE that saved map, use the separate nav2.launch.py
# (which brings up map_server + amcl). Never run both at once.
# =============================================================================
import os

from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import (DeclareLaunchArgument, ExecuteProcess,
                            IncludeLaunchDescription, TimerAction)
from launch.conditions import IfCondition
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import LaunchConfiguration, PathJoinSubstitution
from launch_ros.actions import Node
from launch_ros.substitutions import FindPackageShare


def generate_launch_description():
    pkg_nav = get_package_share_directory("navigation")
    pkg_slam = get_package_share_directory("slam_toolbox")
    pkg_nav2_bringup = get_package_share_directory("nav2_bringup")
    # NOT get_package_share_directory("explore_lite") here: that resolves
    # eagerly at generation time and crashes the whole launch file even
    # when explore:=false, since explore_lite isn't always installed.
    # FindPackageShare is a launch-time substitution - it's only resolved
    # when the IncludeLaunchDescription below actually executes, which the
    # IfCondition(explore) skips entirely when explore_lite isn't wanted.

    use_sim_time = LaunchConfiguration("use_sim_time")
    use_rviz = LaunchConfiguration("rviz")
    slam_params = LaunchConfiguration("slam_params_file")
    params_file = LaunchConfiguration("params_file")
    autostart = LaunchConfiguration("autostart")
    blank_min_deg_LIDAR1 = LaunchConfiguration("blank_min_deg_LIDAR1")
    blank_max_deg_LIDAR1 = LaunchConfiguration("blank_max_deg_LIDAR1")
    blank_min_deg_LIDAR2 = LaunchConfiguration("blank_min_deg_LIDAR2")
    blank_max_deg_LIDAR2 = LaunchConfiguration("blank_max_deg_LIDAR2")
    blank2_min_deg_LIDAR1 = LaunchConfiguration("blank2_min_deg_LIDAR1")
    blank2_max_deg_LIDAR1 = LaunchConfiguration("blank2_max_deg_LIDAR1")

    default_slam_params = os.path.join(pkg_nav, "config", "slam_params.yaml")
    default_params = os.path.join(pkg_nav, "config", "nav2_mapping_params.yaml")
    default_rviz = os.path.join(pkg_nav2_bringup, "rviz", "nav2_default_view.rviz")

    # --- absolute paths to your python scripts (run via python3, no build) ---
    # NOTE: these live in the SOURCE tree, not install/, because you run them
    #       directly. Adjust HOME path if your username/layout differs.
    scripts_dir = os.path.expanduser("~/amr-x/robotics/navigation")
    filter_script = os.path.join(scripts_dir, "scan_filter_node.py")
    merger_script = os.path.join(scripts_dir, "scan_merger_node.py")

    # ---------------------------------------------------------------
    # 1. Scan pipeline: two filters + merger
    # ---------------------------------------------------------------
    filter1 = Node(
        package="navigation", executable="scan_filter_node.py", name="scan_filter_1",
        output="screen",
        parameters=[{"use_sim_time": True, "blank_min_deg": blank_min_deg_LIDAR1, "blank_max_deg": blank_max_deg_LIDAR1,
                     "blank2_min_deg": blank2_min_deg_LIDAR1,"blank2_max_deg": blank2_max_deg_LIDAR1,
                     "input_topic": "/scan", "output_topic": "/scan_clean"}],
    )
    filter2 = Node(
        package="navigation", executable="scan_filter_node.py", name="scan_filter_2",
        output="screen",
        parameters=[{"use_sim_time": True, "blank_min_deg": blank_min_deg_LIDAR2, "blank_max_deg": blank_max_deg_LIDAR2,
                     "input_topic": "/scan_2", "output_topic": "/scan_2_clean"}],
    )
    merger = Node(
        package="navigation", executable="scan_merger_node.py", name="scan_merger",
        output="screen",
        parameters=[{"use_sim_time": True, "target_frame": "base_link",
                     "output_topic": "/scan_merged",
                     "scan1_topic": "/scan_clean", "scan2_topic": "/scan_2_clean"}],
    )

    # ---------------------------------------------------------------
    # 2. SLAM Toolbox (reads /scan_merged via slam_params.yaml)
    #    Delayed slightly so the merger is publishing /scan_merged first.
    # ---------------------------------------------------------------
    slam = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            os.path.join(pkg_slam, "launch", "online_async_launch.py")),
        launch_arguments={
            "use_sim_time": use_sim_time,
            "slam_params_file": slam_params,
        }.items(),
    )
    slam_delayed = TimerAction(period=3.0, actions=[slam])

    # ---------------------------------------------------------------
    # 3. Nav2 NAVIGATION servers only (NO map_server, NO amcl).
    #    nav2_bringup ships navigation_launch.py for exactly this.
    # ---------------------------------------------------------------
    nav2_nav = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            os.path.join(pkg_nav2_bringup, "launch", "navigation_launch.py")),
        launch_arguments={
            "use_sim_time": use_sim_time,
            "params_file": params_file,
            "autostart": autostart,
        }.items(),
    )
    nav2_delayed = TimerAction(period=5.0, actions=[nav2_nav])

    # ---------------------------------------------------------------
    # 4. Explorer (autonomous frontier exploration)
    #    Started last, once SLAM + Nav2 are up and a map exists.
    # ---------------------------------------------------------------
    explore = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            PathJoinSubstitution(
                [FindPackageShare("explore_lite"), "launch", "explore.launch.py"])),
        launch_arguments={"use_sim_time": use_sim_time}.items(),
        condition=IfCondition(LaunchConfiguration("explore")),
    )
    explore_delayed = TimerAction(period=10.0, actions=[explore])

    # ---------------------------------------------------------------
    # 5. RViz
    # ---------------------------------------------------------------
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
                              description="Open RViz to watch the map build."),
        DeclareLaunchArgument("slam_params_file", default_value=default_slam_params,
                              description="SLAM Toolbox parameter file."),
        DeclareLaunchArgument("params_file", default_value=default_params,
                              description="Nav2 parameter file."),
        DeclareLaunchArgument("autostart", default_value="true",
                              description="Auto-activate Nav2 lifecycle nodes."),
        DeclareLaunchArgument("blank_min_deg_LIDAR1", default_value="-180.0",
                              description="Inferior limit of the self-hit filter 1 range, in degrees, over it detected scans are the robot's own body."),
        DeclareLaunchArgument("blank_max_deg_LIDAR1", default_value="-92.0",
                              description="Superior limit of the self-hit filter 1 range, in degrees, below it detected scans are the robot's own body."), 
        DeclareLaunchArgument("blank_min_deg_LIDAR2", default_value="-8.0",
                              description="Inferior limit of the self-hit filter 2 range, in degrees, over it detected scans are the robot's own body."),
        DeclareLaunchArgument("blank_max_deg_LIDAR2", default_value="88.0",
                              description="Superior limit of the self-hit filter 2 range, in degrees, below it detected scans are the robot's own body."),
        DeclareLaunchArgument("blank2_min_deg_LIDAR1", default_value="170.0",
                              description="LiDAR 1 second self-hit wedge start (deg). "
                                          "The chassis view wraps the +/-180 seam, so "
                                          "LiDAR 1 needs two wedges."),
        DeclareLaunchArgument("blank2_max_deg_LIDAR1", default_value="180.0",
                              description="LiDAR 1 second self-hit wedge end (deg)."),
        DeclareLaunchArgument("scan_pipeline", default_value="true",
                              description="Start the two filters + merger. Set false if run elsewhere."),
        # scan pipeline first, then Nav2
        DeclareLaunchArgument("explore", default_value="false",
                              description="Autonomous exploration. false = teleop mapping."),
        # scan pipeline first
        filter1,
        filter2,
        merger,
        # then localizer + navigation + explorer, staggered
        slam_delayed,
        nav2_delayed,
        explore_delayed,
        rviz,
    ])
