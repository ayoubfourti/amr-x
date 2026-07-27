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
from launch_ros.actions import Node
from launch.substitutions import LaunchConfiguration, PythonExpression, PathJoinSubstitution

def generate_launch_description():
    pkg_nav = get_package_share_directory("navigation")
    pkg_nav2_bringup = get_package_share_directory("nav2_bringup")

    use_sim_time = LaunchConfiguration("use_sim_time")
    use_rviz = LaunchConfiguration("rviz")
    map_yaml = LaunchConfiguration("map")
    params_file = LaunchConfiguration("params_file")
    autostart = LaunchConfiguration("autostart")
    blank_min_deg_LIDAR1 = LaunchConfiguration("blank_min_deg_LIDAR1")
    blank_max_deg_LIDAR1 = LaunchConfiguration("blank_max_deg_LIDAR1")
    blank_min_deg_LIDAR2 = LaunchConfiguration("blank_min_deg_LIDAR2")
    blank_max_deg_LIDAR2 = LaunchConfiguration("blank_max_deg_LIDAR2")
    blank2_min_deg_LIDAR1 = LaunchConfiguration("blank2_min_deg_LIDAR1")
    blank2_max_deg_LIDAR1 = LaunchConfiguration("blank2_max_deg_LIDAR1")
    scan_pipeline = LaunchConfiguration("scan_pipeline")
    keepout_filter = LaunchConfiguration("keepout_filter")
    mission_server_enabled = LaunchConfiguration("mission_server")
    stations_file = LaunchConfiguration("stations_file")


    # Defaults: the map you save from slam.launch.py, and Ghassen's tuned params.
    default_map = os.path.join(pkg_nav, "maps", "amr_warehouse_map.yaml")
    default_params = os.path.join(pkg_nav, "config", "nav2_params.yaml")
    default_rviz = os.path.join(pkg_nav2_bringup, "rviz", "nav2_default_view.rviz")
    keepout_params = os.path.join(pkg_nav, "config", "keepout_params.yaml")


     
    # ------------------------------------------------------------------
    # Scan pipeline: two self-hit filters + merger -> /scan_merged
    # (installed executables, run via ros2 run navigation ...)
    # ------------------------------------------------------------------
    use_keepout = PythonExpression(["'", keepout_filter, "' != 'none'"])
    mask_yaml = PathJoinSubstitution([
        pkg_nav, "maps", PythonExpression(["'", keepout_filter, "' + '_keepout.yaml'"])
    ])




    filter1 = Node(
        package="navigation", executable="scan_filter_node.py",
        name="scan_filter_1", output="screen",
        condition=IfCondition(scan_pipeline),
        parameters=[{
            "use_sim_time": use_sim_time,
            "blank_min_deg": blank_min_deg_LIDAR1, 
            "blank_max_deg": blank_max_deg_LIDAR1,
            "blank2_min_deg": blank2_min_deg_LIDAR1,
            "blank2_max_deg": blank2_max_deg_LIDAR1,
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
            "blank_min_deg": blank_min_deg_LIDAR2, 
            "blank_max_deg": blank_max_deg_LIDAR2,
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


    # ------------------------------------------------------------------
    # Mission server: accepts goals on /mission/go_to_station and
    # /mission/go_to_pose, validates them against the global costmap,
    # reports progress and parking error on /mission/status.
    # ------------------------------------------------------------------
    mission_server = Node(
        package="navigation", executable="mission_server_node.py",
        name="mission_server", output="screen",
        condition=IfCondition(mission_server_enabled),
        parameters=[{
            "use_sim_time": use_sim_time,
            "stations_file": stations_file,
            "cost_threshold": 200,
        }],
    )

    filter_mask = Node(
        package="nav2_map_server", executable="map_server",
        name="filter_mask_server", output="screen",
        condition=IfCondition(use_keepout),
        parameters=[keepout_params, {"yaml_filename": mask_yaml}],
    )
    costmap_filter_info = Node(
        package="nav2_map_server", executable="costmap_filter_info_server",
        name="costmap_filter_info_server", output="screen",
        condition=IfCondition(use_keepout),
        parameters=[keepout_params],
    )
    lifecycle_filters = Node(
        package="nav2_lifecycle_manager", executable="lifecycle_manager",
        name="lifecycle_manager_costmap_filters", output="screen",
        condition=IfCondition(use_keepout),
        parameters=[{"use_sim_time": True, "autostart": True,
                     "node_names": ["filter_mask_server",
                                    "costmap_filter_info_server"]}],
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
        DeclareLaunchArgument("keepout_filter", default_value="none",
                              description="Keepout zone set to load, e.g. 'hospital' "
                                          "loads maps/hospital_keepout.yaml. 'none' disables."),
        DeclareLaunchArgument("mission_server", default_value="true",
                              description="Start the mission server node."),
        DeclareLaunchArgument(
    "stations_file",
    default_value=os.path.expanduser(
        "~/amr-x/robotics/navigation/config/stations.yaml"),
    description="Named station poses (READ and WRITTEN). Must be a PERSISTENT "
                "path in the source tree - NOT install/, which colcon build "
                "overwrites."),
        # scan pipeline first, then Nav2
        filter1,
        filter2,
        merger,
        mission_server,
        filter_mask,              
        costmap_filter_info,      
        lifecycle_filters,
        nav2,
        rviz,
    ])
