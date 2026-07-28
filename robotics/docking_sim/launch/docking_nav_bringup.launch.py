"""
AMR-X Docking + Nav2 Bringup
==============================
Launches (in order):
  1. Gazebo Fortress with warehouse world
  2. ros_gz_bridge  (clock, cmd_vel, odom, tf, scan)
  3. robot_state_publisher
  4. AMCL / localization (from navigation-slam-dual-lidar config)
  5. Nav2 stack  (uses existing robotics/navigation/launch/nav2.launch.py)
  6. docking_sim_node
  7. (optional) RViz2

Run:
  ros2 launch docking_sim docking_nav_bringup.launch.py
  ros2 launch docking_sim docking_nav_bringup.launch.py use_rviz:=false
  ros2 launch docking_sim docking_nav_bringup.launch.py map:=/path/to/mymap.yaml
"""

import os
from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import (
    DeclareLaunchArgument,
    IncludeLaunchDescription,
    ExecuteProcess,
    TimerAction,
    GroupAction,
)
from launch.conditions import IfCondition
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import (
    LaunchConfiguration,
    PathJoinSubstitution,
    Command,
    FindExecutable,
)
from launch_ros.actions import Node
from launch_ros.substitutions import FindPackageShare


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def pkg(name: str) -> str:
    return get_package_share_directory(name)


# ---------------------------------------------------------------------------
# Launch description
# ---------------------------------------------------------------------------
def generate_launch_description():

    # ---- Arguments --------------------------------------------------------
    map_arg = DeclareLaunchArgument(
        "map",
        default_value=os.path.join(
            pkg("amr_navigation"),   # adjust to your nav package name
            "maps", "warehouse.yaml"
        ),
        description="Path to the Nav2 map YAML file",
    )

    use_rviz_arg = DeclareLaunchArgument(
        "use_rviz", default_value="true",
        description="Launch RViz2",
    )

    world_arg = DeclareLaunchArgument(
        "world",
        default_value=os.path.join(
            pkg("docking_sim"),
            "..", "..", "..", "..",          # walk back to workspace root
            "robotics", "simulation", "worlds", "warehouse_fortress.sdf",
        ),
        description="Path to Gazebo world SDF",
    )

    robot_xacro_arg = DeclareLaunchArgument(
        "robot_xacro",
        default_value=os.path.join(
            pkg("amr_description"),   # adjust to your description package
            "urdf", "amr.urdf.xacro",
        ),
        description="Path to robot xacro file",
    )

    # ---- Resolved values --------------------------------------------------
    map            = LaunchConfiguration("map")
    use_rviz       = LaunchConfiguration("use_rviz")
    world          = LaunchConfiguration("world")
    robot_xacro    = LaunchConfiguration("robot_xacro")

    # ---- 1. Gazebo Fortress -----------------------------------------------
    gazebo = ExecuteProcess(
        cmd=["ign", "gazebo", world, "-r"],
        output="screen",
        additional_env={
            "IGN_GAZEBO_RESOURCE_PATH": os.path.expanduser(
                "~/amr-x/robotics/simulation/models"
            ),
        },
    )

    # ---- 2. Robot state publisher -----------------------------------------
    robot_description = Command(
        [FindExecutable(name="xacro"), " ", robot_xacro,
         " simulator_variant:=fortress"]
    )

    rsp = Node(
        package="robot_state_publisher",
        executable="robot_state_publisher",
        name="robot_state_publisher",
        output="screen",
        parameters=[{
            "robot_description": robot_description,
            "use_sim_time": True,
        }],
    )

    # ---- 3. Spawn robot in Gazebo -----------------------------------------
    spawn_robot = TimerAction(
        period=3.0,   # wait for Gazebo to fully load
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

    # ---- 4. ros_gz_bridge -------------------------------------------------
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
            # Lidar — adjust topic names to match your URDF sensor names
            "/lidar_front/scan@sensor_msgs/msg/LaserScan[ignition.msgs.LaserScan",
            "/lidar_rear/scan@sensor_msgs/msg/LaserScan[ignition.msgs.LaserScan",
            # IMU (if used by AMCL/SLAM)
            "/imu@sensor_msgs/msg/Imu[ignition.msgs.IMU",
            # Tf from Gazebo (gz-ros tf bridge — Fortress supports this via pose_publisher)
            "/model/amr/pose@tf2_msgs/msg/TFMessage[ignition.msgs.Pose_V",
        ],
    )

    # ---- 5. Localization (AMCL) -------------------------------------------
    #  Uses existing robotics/navigation/launch/localization.launch.py
    localization = TimerAction(
        period=5.0,
        actions=[
            IncludeLaunchDescription(
                PythonLaunchDescriptionSource(
                    os.path.join(
                        pkg("amr_navigation"),
                        "launch", "localization.launch.py",
                    )
                ),
                launch_arguments={
                    "map": map,
                    "use_sim_time": "true",
                }.items(),
            )
        ],
    )

    # ---- 6. Nav2 stack ----------------------------------------------------
    nav2 = TimerAction(
        period=8.0,
        actions=[
            IncludeLaunchDescription(
                PythonLaunchDescriptionSource(
                    os.path.join(
                        pkg("amr_navigation"),
                        "launch", "nav2.launch.py",
                    )
                ),
                launch_arguments={
                    "map":          map,
                    "use_sim_time": "true",
                    "params_file":  os.path.join(
                        pkg("amr_navigation"),
                        "config", "nav2_params.yaml",
                    ),
                }.items(),
            )
        ],
    )

    # ---- 7. Docking sim node ----------------------------------------------
    docking_node = TimerAction(
        period=6.0,
        actions=[
            Node(
                package="docking_sim",
                executable="docking_sim_node",
                name="docking_sim",
                output="screen",
                parameters=[{"use_sim_time": True}],
            )
        ],
    )

    # ---- 8. RViz2 (optional) ----------------------------------------------
    rviz_config = os.path.join(
        pkg("amr_navigation"), "rviz", "nav2_default_view.rviz"
    )
    rviz = TimerAction(
        period=10.0,
        actions=[
            Node(
                package="rviz2",
                executable="rviz2",
                name="rviz2",
                arguments=["-d", rviz_config],
                parameters=[{"use_sim_time": True}],
                condition=IfCondition(use_rviz),
                output="screen",
            )
        ],
    )

    return LaunchDescription([
        map_arg,
        use_rviz_arg,
        world_arg,
        robot_xacro_arg,

        gazebo,
        rsp,
        bridge,
        spawn_robot,
        localization,
        nav2,
        docking_node,
        rviz,
    ])
