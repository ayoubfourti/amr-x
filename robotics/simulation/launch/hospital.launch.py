#!/usr/bin/env python3
# =============================================================================
# AMR-X  -  hospital.launch.py
# Start Gazebo with the AMR-X hospital world (no robot).
#
# Works on BOTH simulator stacks - pick with simulator_variant:
#   ros2 launch simulation hospital.launch.py                        # harmonic (default)
#   ros2 launch simulation hospital.launch.py simulator_variant:=fortress
#   ros2 launch simulation hospital.launch.py simulator_variant:=fortress gui:=false
#
# fortress -> uses ign gazebo + hospital_fortress.sdf
# harmonic -> uses gz sim     + hospital_harmonic.sdf
# The AWS hospital models live in simulation/models, added to the resource path
# so the furniture (beds, curtains, elevators...) resolves on either stack.
# =============================================================================
import os
from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import (DeclareLaunchArgument, IncludeLaunchDescription,
                            SetEnvironmentVariable)
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import LaunchConfiguration, PythonExpression


def generate_launch_description():
    pkg_sim = get_package_share_directory("simulation")
    pkg_ros_gz_sim = get_package_share_directory("ros_gz_sim")

    resource_path = os.pathsep.join([
        pkg_sim,
        os.path.join(pkg_sim, "models"),
    ])

    simulator_variant = LaunchConfiguration("simulator_variant")
    gui = LaunchConfiguration("gui")

    world_path = PythonExpression([
        "'",
        os.path.join(pkg_sim, "worlds", "hospital_fortress.sdf"),
        "' if '", simulator_variant, "' == 'fortress' else '",
        os.path.join(pkg_sim, "worlds", "hospital_harmonic.sdf"),
        "'"
    ])

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
        SetEnvironmentVariable("GZ_SIM_RESOURCE_PATH", resource_path),
        SetEnvironmentVariable("IGN_GAZEBO_RESOURCE_PATH", resource_path),
        DeclareLaunchArgument(
            "gui", default_value="true",
            description="Run the Gazebo GUI (false = headless server only)."),
        DeclareLaunchArgument(
            "simulator_variant", default_value="harmonic",
            description="Gazebo variant: harmonic (default) or fortress."),
        gazebo,
    ])
