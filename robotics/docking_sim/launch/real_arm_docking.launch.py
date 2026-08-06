"""
real_arm_docking.launch.py
===========================
Full bringup for AMR-X with real mycobot_280 arm + Nav2 + docking.

Corrected from previous version using actual bridge_fortress.yaml:
  - Lidar topics: /scan  and  scan_2   (NOT /lidar_front/scan)
  - TF topic:     /tf
  - IMU topic:    /imu

Two modes:
  bare_robot:=true   → spawn AMR without arm (navigation testing)
  bare_robot:=false  → spawn AMR with real mycobot_280 attached (default)

Usage:
  ros2 launch docking_sim real_arm_docking.launch.py
  ros2 launch docking_sim real_arm_docking.launch.py bare_robot:=true
  ros2 launch docking_sim real_arm_docking.launch.py \
    map:=$HOME/amr-x/robotics/navigation/maps/warehouse.yaml use_rviz:=false
"""

import os
from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import (
    DeclareLaunchArgument,
    IncludeLaunchDescription,
    ExecuteProcess,
    TimerAction,
)
from launch.conditions import IfCondition, UnlessCondition
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import (
    LaunchConfiguration,
    Command,
    FindExecutable,
    PythonExpression,
)
from launch_ros.actions import Node
from launch_ros.parameter_descriptions import ParameterValue


def pkg(name: str) -> str:
    return get_package_share_directory(name)


def generate_launch_description():

    # ── Arguments ──────────────────────────────────────────────────────────
    map_arg = DeclareLaunchArgument(
        "map",
        default_value=os.path.join(pkg("navigation"), "maps", "warehouse.yaml"),
        description="Nav2 map YAML",
    )
    use_rviz_arg = DeclareLaunchArgument(
        "use_rviz", default_value="true",
    )
    bare_robot_arg = DeclareLaunchArgument(
        "bare_robot", default_value="false",
        description="true = no arm attached (nav testing only)",
    )
    world_arg = DeclareLaunchArgument(
        "world",
        default_value=os.path.expanduser(
            "~/amr-x/robotics/simulation/worlds/warehouse_fortress.sdf"
        ),
    )

    map         = LaunchConfiguration("map")
    use_rviz    = LaunchConfiguration("use_rviz")
    bare_robot  = LaunchConfiguration("bare_robot")
    world       = LaunchConfiguration("world")

    # ── 1. Gazebo Fortress ─────────────────────────────────────────────────
    gazebo = ExecuteProcess(
        cmd=["ign", "gazebo", world, "-r"],
        output="screen",
        additional_env={
            "IGN_GAZEBO_RESOURCE_PATH": os.path.expanduser(
                "~/amr-x/robotics/simulation/models"
            ),
        },
    )

    # ── 2a. Robot description — WITH arm ───────────────────────────────────
    robot_desc_with_arm = Command([
        FindExecutable(name="xacro"), " ",
        os.path.expanduser(
            "~/amr-x/robotics/robot_description/urdf/amr_with_arm.xacro"
        ),
        " use_gazebo:=true attach_arm:=true",
    ])

    # ── 2b. Robot description — bare robot ─────────────────────────────────
    robot_desc_bare = Command([
        FindExecutable(name="xacro"), " ",
        os.path.expanduser(
            "~/amr-x/robotics/robot_description/urdf/amr.urdf.xacro"
        ),
        " use_gazebo:=true",
    ])

    rsp_with_arm = Node(
        package="robot_state_publisher",
        executable="robot_state_publisher",
        name="robot_state_publisher",
        output="screen",
        parameters=[{
            "robot_description": ParameterValue(robot_desc_with_arm, value_type=str),
            "use_sim_time": True,
        }],
        condition=UnlessCondition(bare_robot),
    )

    rsp_bare = Node(
        package="robot_state_publisher",
        executable="robot_state_publisher",
        name="robot_state_publisher",
        output="screen",
        parameters=[{
            "robot_description": ParameterValue(robot_desc_bare, value_type=str),
            "use_sim_time": True,
        }],
        condition=IfCondition(bare_robot),
    )

    # ── 3. Spawn robot (3s delay for Gazebo to load) ───────────────────────
    spawn_robot = TimerAction(
        period=3.0,
        actions=[
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
        ],
    )

    # ── 4. Bridge — using exact topics from bridge_fortress.yaml ──────────
    bridge = Node(
        package="ros_gz_bridge",
        executable="parameter_bridge",
        name="gz_ros_bridge",
        output="screen",
        parameters=[{"use_sim_time": True}],
        arguments=[
            # Clock
            "/clock@rosgraph_msgs/msg/Clock[ignition.msgs.Clock",
            # Drive
            "/cmd_vel@geometry_msgs/msg/Twist]ignition.msgs.Twist",
            "/odom@nav_msgs/msg/Odometry[ignition.msgs.Odometry",
            # TF
            "/tf@tf2_msgs/msg/TFMessage[ignition.msgs.Pose_V",
            # Joint states (needed for arm viz in RViz)
            "/joint_states@sensor_msgs/msg/JointState[ignition.msgs.Model",
            # Lidar — exact names from bridge_fortress.yaml
            "/scan@sensor_msgs/msg/LaserScan[ignition.msgs.LaserScan",
            "scan_2@sensor_msgs/msg/LaserScan[gz.msgs.LaserScan",
            # IMU
            "/imu@sensor_msgs/msg/Imu[ignition.msgs.IMU",
        ],
    )

    # ── 5. AMCL localization (5s delay) ────────────────────────────────────
    localization = TimerAction(
        period=5.0,
        actions=[
            IncludeLaunchDescription(
                PythonLaunchDescriptionSource(
                    os.path.join(pkg("navigation"), "launch", "localization.launch.py")
                ),
                launch_arguments={
                    "map":          map,
                    "use_sim_time": "true",
                }.items(),
            )
        ],
    )

    # ── 6. Nav2 (8s delay) ─────────────────────────────────────────────────
    nav2 = TimerAction(
        period=8.0,
        actions=[
            IncludeLaunchDescription(
                PythonLaunchDescriptionSource(
                    os.path.join(pkg("navigation"), "launch", "nav2.launch.py")
                ),
                launch_arguments={
                    "map":          map,
                    "use_sim_time": "true",
                    "params_file":  os.path.join(
                        pkg("navigation"), "config", "nav2_params.yaml"
                    ),
                }.items(),
            )
        ],
    )

    # ── 7. Docking node v2 (6s delay, after arm controllers up) ───────────
    docking_node = TimerAction(
        period=6.0,
        actions=[
            Node(
                package="docking_sim",
                executable="docking_sim_node",   # points to v2 after setup.py update
                name="docking_sim",
                output="screen",
                parameters=[{"use_sim_time": True}],
            )
        ],
    )

    # ── 8. RViz2 (10s delay) ───────────────────────────────────────────────
    rviz_config = os.path.join(pkg("navigation"), "rviz", "nav2_default_view.rviz")
    rviz = TimerAction(
        period=10.0,
        actions=[
            Node(
                package="rviz2",
                executable="rviz2",
                name="rviz2",
                arguments=["-d", rviz_config] if os.path.exists(rviz_config) else [],
                parameters=[{"use_sim_time": True}],
                condition=IfCondition(use_rviz),
                output="screen",
            )
        ],
    )

    return LaunchDescription([
        map_arg,
        use_rviz_arg,
        bare_robot_arg,
        world_arg,

        gazebo,
        rsp_with_arm,
        rsp_bare,
        bridge,
        spawn_robot,
        localization,
        nav2,
        docking_node,
        rviz,
    ])
