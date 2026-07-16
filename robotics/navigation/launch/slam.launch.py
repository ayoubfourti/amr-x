#!/usr/bin/env python3
# =============================================================================
# AMR-X  -  slam.launch.py
# =============================================================================
# STEP 1 of navigation: build a map of OUR warehouse with SLAM Toolbox.
#
# Run the simulation FIRST in another terminal:
#     ros2 launch bringup simulation.launch.py rviz:=false
#
# Then run this. It opens the configured mapping RViz layout with /map, /scan,
# RobotModel, and TF already enabled. Drive until the environment is mapped:
#     ros2 launch navigation slam.launch.py
#     ros2 run teleop_twist_keyboard teleop_twist_keyboard   # 3rd terminal
#
# Do not use "2D Pose Estimate" in SLAM mode; slam_toolbox publishes the
# map->odom transform. Use that tool only with localization.launch.py.
#
# When the map looks complete in RViz, SAVE it (keep this naming so nav2.launch
# finds it by default):
#     ros2 run nav2_map_server map_saver_cli -f \
#         /absolute/path/to/amr-x/robotics/navigation/maps/amr_warehouse_map
#
# That writes amr_warehouse_map.pgm + amr_warehouse_map.yaml into maps/.
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
    pkg_slam = get_package_share_directory("slam_toolbox")

    use_sim_time = LaunchConfiguration("use_sim_time")
    use_rviz = LaunchConfiguration("rviz")
    slam_params = LaunchConfiguration("slam_params_file")

    default_slam_params = os.path.join(pkg_nav, "config", "slam_params.yaml")
    default_rviz_config = os.path.join(pkg_nav, "rviz", "slam.rviz")

    slam = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            os.path.join(pkg_slam, "launch", "online_async_launch.py")),
        launch_arguments={
            "use_sim_time": use_sim_time,
            "slam_params_file": slam_params,
        }.items(),
    )

    rviz = Node(
        package="rviz2",
        executable="rviz2",
        name="rviz2",
        output="screen",
        arguments=["-d", default_rviz_config],
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
        slam,
        rviz,
    ])
