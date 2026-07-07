#!/usr/bin/env python3
# =============================================================================
# AMR-X  -  warehouse.launch.py
# Start Gazebo with the AMR-X warehouse world (no robot).
# Useful for inspecting / editing the environment on its own.
#
#   ros2 launch simulation warehouse.launch.py
#   ros2 launch simulation warehouse.launch.py gui:=false      # headless server
# =============================================================================
import os

from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import (DeclareLaunchArgument, IncludeLaunchDescription,
                            SetEnvironmentVariable)
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import LaunchConfiguration, PythonExpression


def generate_launch_description():
    pkg_gazebo = get_package_share_directory("simulation")
    pkg_ros_gz_sim = get_package_share_directory("ros_gz_sim")
    gazebo_resource_path = os.pathsep.join([
        pkg_gazebo,
        os.path.join(pkg_gazebo, "models"),
    ])

    simulator_variant = LaunchConfiguration("simulator_variant")
    world_path = PythonExpression([
        "'",
        os.path.join(pkg_gazebo, "worlds", "warehouse.sdf"),
        "' if '", simulator_variant, "' == 'harmonic' else '",
        os.path.join(pkg_gazebo, "worlds", "warehouse_fortress.sdf"),
        "'"
    ])
    gui = LaunchConfiguration("gui")

    # gz_args: "-r" runs immediately; "-s" would be server-only (headless).
    # We compose flags from the gui argument.
    gz_args = PythonExpression([
        "'", world_path, " -r' if '", gui, "' == 'true' else '",
        world_path, " -r -s'"
    ])

    gazebo = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            os.path.join(pkg_ros_gz_sim, "launch", "gz_sim.launch.py")
        ),
        launch_arguments={"gz_args": gz_args}.items(),
    )

    return LaunchDescription([
        SetEnvironmentVariable("GZ_SIM_RESOURCE_PATH", gazebo_resource_path),
        SetEnvironmentVariable("IGN_GAZEBO_RESOURCE_PATH", gazebo_resource_path),

        DeclareLaunchArgument(
            "gui", default_value="true",
            description="Run the Gazebo GUI (false = headless server only)."),
        DeclareLaunchArgument(
            "simulator_variant", default_value="harmonic",
            description="Gazebo integration variant: harmonic (default) or fortress."
        ),
        gazebo,
    ])
