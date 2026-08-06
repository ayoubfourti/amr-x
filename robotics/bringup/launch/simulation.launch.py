#!/usr/bin/env python3
# =============================================================================
# AMR-X  -  simulation.launch.py   (full digital twin bring-up)
# =============================================================================
# Brings up the complete simulation in one command:
#   1. robot_state_publisher  (URDF -> /robot_description + static TF)
#   2. Gazebo                 (warehouse world)
#   3. spawn the AMR-X robot   (from the /robot_description topic)
#   4. ros_gz_bridge          (cmd_vel, odom, scan, imu, joint_states, clock, tf)
#   5. RViz                    (visualisation)
#
#   ros2 launch bringup simulation.launch.py
#   ros2 launch bringup simulation.launch.py rviz:=false
#   ros2 launch bringup simulation.launch.py gui:=false        # headless gz
#   ros2 launch bringup simulation.launch.py world:=/abs/x.sdf
#   ros2 launch bringup simulation.launch.py environment:=hospital
#
# Mapping workflow (run each command in a sourced terminal):
#   ros2 launch bringup simulation.launch.py rviz:=false
#   ros2 launch navigation slam.launch.py
#   ros2 run teleop_twist_keyboard teleop_twist_keyboard
#
# Built-in environments are "warehouse" (default) and "hospital". The
# environment argument also selects a verified robot spawn position.
# =============================================================================
import os

from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import (DeclareLaunchArgument, IncludeLaunchDescription,
                            SetEnvironmentVariable, TimerAction)
from launch.conditions import IfCondition
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import (Command, LaunchConfiguration,
                                   PathJoinSubstitution, PythonExpression)
from launch_ros.actions import Node
from launch_ros.parameter_descriptions import ParameterValue
from launch_ros.substitutions import FindPackageShare

is_wsl = "microsoft" in open("/proc/version").read().lower() if os.path.exists("/proc/version") else False
default_render_engine = "ogre" if is_wsl else "ogre2"

def generate_launch_description():
    pkg_gazebo = get_package_share_directory("simulation")
    pkg_bringup = get_package_share_directory("bringup")
    pkg_robot_description = get_package_share_directory("robot_description")
    pkg_ros_gz_sim = get_package_share_directory("ros_gz_sim")

    # ---- launch arguments ---------------------------------------------------
    use_sim_time = LaunchConfiguration("use_sim_time")
    use_rviz = LaunchConfiguration("rviz")
    gui = LaunchConfiguration("gui")
    world = LaunchConfiguration("world")

    simulator_variant = LaunchConfiguration("simulator_variant")
    environment = LaunchConfiguration("environment")

    render_engine = LaunchConfiguration("render_engine")


    default_world = PythonExpression([
        "'",
        os.path.join(pkg_gazebo, "worlds", "hospital_harmonic.sdf"),
        "' if '", environment, "' == 'hospital' else ('",
        os.path.join(pkg_gazebo, "worlds", "warehouse_harmonic.sdf"),
        "' if '", simulator_variant, "' == 'harmonic' else '",
        os.path.join(pkg_gazebo, "worlds", "warehouse_fortress.sdf"),
        "')"
    ])
    # Spawn in the warehouse_harmonic.sdf empty marked bay (verified by
    # placing a box there in the GUI and reading its pose - the AWS
    # RoboMaker warehouse layout has no world-coordinate markers of its
    # own to derive this from), or in the hospital's main corridor
    # (verified clear of walls/furniture - min. 1.7m clearance).
    default_spawn_x = PythonExpression([
        "'0.0' if '", environment, "' == 'hospital' else '-1.2639'"])
    default_spawn_y = PythonExpression([
        "'8.0' if '", environment, "' == 'hospital' else '-3.9049'"])
    # aws_robomaker_warehouse_GroundB_01's floor surface doesn't sit at
    # world Z=0 (physics settles the robot to Z=0.034 there, not 0.02) -
    # spawn a hair above that measured resting height instead of guessing.
    default_spawn_z = PythonExpression([
        "'0.02' if '", environment, "' == 'hospital' else '0.045'"])
    gazebo_resource_path = os.pathsep.join([
        pkg_gazebo,
        os.path.join(pkg_gazebo, "models"),
        os.path.join(pkg_gazebo, "fuel_models"),
        os.path.join(pkg_gazebo, "photos"),
        os.path.dirname(pkg_robot_description),
    ])
    rviz_config = os.path.join(pkg_bringup, "rviz", "simulation.rviz")
    xacro_file = PathJoinSubstitution(
        [FindPackageShare("robot_description"), "urdf", "amr_2lidar.urdf.xacro"])

    # ---- robot description (with Gazebo plugins) ----------------------------
    robot_description = ParameterValue(
        Command([
            "xacro ", xacro_file, " use_gazebo:=true",
            " simulator_variant:=", simulator_variant,
        ]),
        value_type=str,
    )

    robot_state_publisher = Node(
        package="robot_state_publisher",
        executable="robot_state_publisher",
        name="robot_state_publisher",
        output="screen",
        parameters=[{
            "robot_description": robot_description,
            "use_sim_time": use_sim_time,
        }],
    )

    bridge_config = PythonExpression([
        "'",
        os.path.join(pkg_gazebo, "config", "bridge_harmonic.yaml"),
        "' if '", simulator_variant, "' == 'harmonic' else '",
        os.path.join(pkg_gazebo, "config", "bridge_fortress.yaml"),
        "'"
    ])

    # ---- Gazebo with the warehouse world -----------------------------------
    gz_args = PythonExpression([
        "'", world, " -r --render-engine ", render_engine,
        "' if '", gui, "' == 'true' else '", world, " -r -s'"
    ])
    gazebo = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            os.path.join(pkg_ros_gz_sim, "launch", "gz_sim.launch.py")),
        launch_arguments={"gz_args": gz_args}.items(),
    )

    # ---- spawn the robot from /robot_description ----------------------------
    # Spawn just above the floor so contacts initialize cleanly without a
    # 12 cm impact that can excite the passive caster joints.
    spawn_robot = Node(
        package="ros_gz_sim",
        executable="create",
        name="spawn_amr_x",
        output="screen",
        arguments=[
            "-topic", "/robot_description",
            "-name", "amr_x",
            "-x", default_spawn_x, "-y", default_spawn_y, "-z", default_spawn_z,
            "-Y", "0.0",
        ],
    )

    # ---- ROS <-> Gazebo bridge ---------------------------------------------
    bridge = Node(
        package="ros_gz_bridge",
        executable="parameter_bridge",
        name="ros_gz_bridge",
        output="screen",
        parameters=[{
            "config_file": bridge_config,
            "use_sim_time": use_sim_time,
            "qos_overrides./tf_static.publisher.durability": "transient_local",
        }],
    )

    # ---- RViz ---------------------------------------------------------------
    rviz = Node(
        package="rviz2",
        executable="rviz2",
        name="rviz2",
        output="screen",
        arguments=["-d", rviz_config],
        parameters=[{"use_sim_time": use_sim_time}],
        condition=IfCondition(use_rviz),
    )

    # Start the bridge + spawn a little after Gazebo so the world is ready.
    # (The hospital world has far more meshes/props than the warehouse and
    # needs longer to finish loading - spawning the robot too early races
    # the scene manager and can crash the renderer, so we wait 10s for any
    # world rather than tuning per-world.)
    delayed_spawn = TimerAction(period=10.0, actions=[spawn_robot])
    delayed_bridge = TimerAction(period=2.0, actions=[bridge])

    return LaunchDescription([
        SetEnvironmentVariable("GZ_SIM_RESOURCE_PATH", gazebo_resource_path),
        SetEnvironmentVariable("IGN_GAZEBO_RESOURCE_PATH", gazebo_resource_path),

        DeclareLaunchArgument("use_sim_time", default_value="true",
                              description="Use the /clock published by Gazebo."),
        DeclareLaunchArgument("rviz", default_value="true",
                              description="Open RViz."),
        DeclareLaunchArgument("gui", default_value="true",
                              description="Gazebo GUI (false = headless server)."),
        DeclareLaunchArgument(
            "simulator_variant", default_value="harmonic",
            description="Gazebo integration variant: harmonic (default) or fortress."
        ),
        DeclareLaunchArgument(
            "environment", default_value="warehouse",
            description="Which built-in world to load: warehouse (default) or hospital."
        ),
        DeclareLaunchArgument("world", default_value=default_world,
                              description="Absolute path to the .sdf world."),
        DeclareLaunchArgument("render_engine", default_value=default_render_engine,
                              description="Gazebo render engine ('ogre' or 'ogre2')."),

        robot_state_publisher,
        gazebo,
        delayed_bridge,
        delayed_spawn,
        rviz,
    ])
