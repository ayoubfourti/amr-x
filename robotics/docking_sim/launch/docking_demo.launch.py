"""
docking_demo.launch.py
=======================
Full autonomous docking demo:
  1. Opens warehouse_fortress.sdf
  2. Spawns bare AMR robot at x=0, y=-5.4
  3. Spawns real mycobot_280 arm at dock station x=10, y=-5.4
  4. Starts Nav2 + AMCL
  5. Starts docking_sim_node
  6. Starts RViz

Then run:  ros2 run docking_sim dock_mission
"""

import os
from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import (
    DeclareLaunchArgument, ExecuteProcess, TimerAction, IncludeLaunchDescription,
)
from launch.conditions import IfCondition
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import LaunchConfiguration, Command, FindExecutable
from launch_ros.actions import Node
from launch_ros.parameter_descriptions import ParameterValue


def pkg(name):
    return get_package_share_directory(name)


def generate_launch_description():

    map_arg = DeclareLaunchArgument(
        "map",
        default_value=os.path.join(pkg("navigation"), "maps", "amr_warehouse_map.yaml"),
    )
    use_rviz_arg = DeclareLaunchArgument("use_rviz", default_value="true")

    map       = LaunchConfiguration("map")
    use_rviz  = LaunchConfiguration("use_rviz")

    # ── 1. Gazebo Fortress ─────────────────────────────────────────────────
    gazebo = ExecuteProcess(
        cmd=["ign", "gazebo",
             os.path.expanduser("~/amr-x/robotics/simulation/worlds/warehouse_fortress.sdf"),
             "-r"],
        output="screen",
        additional_env={
            "IGN_GAZEBO_RESOURCE_PATH": os.path.expanduser(
                "~/amr-x/robotics/simulation/models"
            ),
        },
    )

    # ── 2. Robot state publisher (bare robot — no arm) ─────────────────────
    robot_urdf = ParameterValue(
        Command([
            FindExecutable(name="xacro"), " ",
            os.path.expanduser(
                "~/amr-x/robotics/robot_description/urdf/amr.urdf.xacro"
            ),
            " use_gazebo:=true",
        ]),
        value_type=str,
    )

    rsp = Node(
        package="robot_state_publisher",
        executable="robot_state_publisher",
        name="robot_state_publisher",
        output="screen",
        parameters=[{"robot_description": robot_urdf, "use_sim_time": True}],
    )

    # ── 3. Spawn bare robot at x=0, y=-5.4 (3s delay) ────────────────────
    spawn_robot = TimerAction(period=3.0, actions=[
        ExecuteProcess(
            cmd=[
                "ros2", "run", "ros_gz_sim", "create",
                "-world", "amr_warehouse",
                "-topic", "/robot_description",
                "-name", "amr",
                "-x", "0", "-y", "-5.4", "-z", "0.15",
            ],
            output="screen",
        )
    ])

    # ── 4. Spawn real arm at dock station x=10, y=-5.4 (4s delay) ─────────
    # Generate arm URDF first via xacro, then spawn from file
    arm_urdf_path = "/tmp/arm_station.urdf"

    generate_arm_urdf = TimerAction(period=3.5, actions=[
        ExecuteProcess(
            cmd=[
                "bash", "-c",
                f"xacro "
                f"$HOME/amr-x/robotics/arm_description/urdf/arm_module.xacro "
                f"use_gazebo:=false add_world:=true "
                f"> {arm_urdf_path} && echo 'Arm URDF generated'"
            ],
            output="screen",
        )
    ])

    spawn_arm = TimerAction(period=5.0, actions=[
        ExecuteProcess(
            cmd=[
                "ros2", "run", "ros_gz_sim", "create",
                "-world", "amr_warehouse",
                "-file", arm_urdf_path,
                "-name", "arm_module",
                "-x", "10", "-y", "-5.4", "-z", "0.15",
            ],
            output="screen",
        )
    ])

    # ── 5. Bridge ──────────────────────────────────────────────────────────
    bridge = Node(
        package="ros_gz_bridge",
        executable="parameter_bridge",
        name="gz_ros_bridge",
        output="screen",
        parameters=[{"use_sim_time": True}],
        arguments=[
            "/clock@rosgraph_msgs/msg/Clock[ignition.msgs.Clock",
            "/cmd_vel@geometry_msgs/msg/Twist]ignition.msgs.Twist",
            "/odom@nav_msgs/msg/Odometry[ignition.msgs.Odometry",
            "/tf@tf2_msgs/msg/TFMessage[ignition.msgs.Pose_V",
            "/joint_states@sensor_msgs/msg/JointState[ignition.msgs.Model",
            "/scan@sensor_msgs/msg/LaserScan[ignition.msgs.LaserScan",
            "scan_2@sensor_msgs/msg/LaserScan[gz.msgs.LaserScan",
            "/imu@sensor_msgs/msg/Imu[ignition.msgs.IMU",
        ],
    )

    # ── 6. Nav2 localization + navigation (8s delay) ───────────────────────
    nav2 = TimerAction(period=8.0, actions=[
        IncludeLaunchDescription(
            PythonLaunchDescriptionSource(
                os.path.join(pkg("navigation"), "launch", "localization.launch.py")
            ),
            launch_arguments={
                "map":          map,
                "use_sim_time": "true",
                "rviz":         "false",   # we launch our own RViz below
            }.items(),
        )
    ])

    # ── 7. Docking node (6s delay) ─────────────────────────────────────────
    docking_node = TimerAction(period=6.0, actions=[
        Node(
            package="docking_sim",
            executable="docking_sim_node",
            name="docking_sim",
            output="screen",
            parameters=[{"use_sim_time": True}],
        )
    ])

    # ── 8. RViz (10s delay) ────────────────────────────────────────────────
    rviz = TimerAction(period=10.0, actions=[
        Node(
            package="rviz2",
            executable="rviz2",
            name="rviz2",
            arguments=["-d", os.path.join(
                pkg("nav2_bringup"), "rviz", "nav2_default_view.rviz"
            )],
            parameters=[{"use_sim_time": True}],
            condition=IfCondition(use_rviz),
            output="screen",
        )
    ])

    return LaunchDescription([
        map_arg,
        use_rviz_arg,
        gazebo,
        rsp,
        bridge,
        spawn_robot,
        generate_arm_urdf,
        spawn_arm,
        nav2,
        docking_node,
        rviz,
    ])
