#!/usr/bin/env python3
# Spawns the AMR robot into an already-running Gazebo world + starts the
# ROS plumbing for navigation: robot_state_publisher, bridge (with tf), spawn.
# Launch the world first, THEN:
#   ros2 launch simulation spawn_robot.launch.py world:=hospital x:=3.0 y:=0.0
import os
from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument
from launch.substitutions import LaunchConfiguration, Command
from launch_ros.actions import Node
from launch_ros.parameter_descriptions import ParameterValue


def generate_launch_description():
    pkg_robot = get_package_share_directory("robot_description")
    urdf_xacro = os.path.join(pkg_robot, "urdf", "amr_real.urdf.xacro")

    world = LaunchConfiguration("world")
    x = LaunchConfiguration("x")
    y = LaunchConfiguration("y")
    z = LaunchConfiguration("z")

    robot_description = ParameterValue(
        Command(["xacro ", urdf_xacro]), value_type=str)

    rsp = Node(
        package="robot_state_publisher",
        executable="robot_state_publisher",
        output="screen",
        parameters=[{"use_sim_time": True, "robot_description": robot_description}],
    )

    spawn = Node(
        package="ros_gz_sim",
        executable="create",
        output="screen",
        arguments=["-world", world, "-topic", "robot_description",
                   "-name", "amr", "-x", x, "-y", y, "-z", z],
    )

    bridge = Node(
        package="ros_gz_bridge",
        executable="parameter_bridge",
        output="screen",
        arguments=[
            "/clock@rosgraph_msgs/msg/Clock[ignition.msgs.Clock",
            "/cmd_vel@geometry_msgs/msg/Twist]ignition.msgs.Twist",
            "/odom@nav_msgs/msg/Odometry[ignition.msgs.Odometry",
            "/scan@sensor_msgs/msg/LaserScan[ignition.msgs.LaserScan",
            "/tf@tf2_msgs/msg/TFMessage[ignition.msgs.Pose_V",
        ],
        parameters=[{"use_sim_time": True}],
    )

    return LaunchDescription([
        DeclareLaunchArgument("world", default_value="hospital"),
        DeclareLaunchArgument("x", default_value="3.0"),
        DeclareLaunchArgument("y", default_value="0.0"),
        DeclareLaunchArgument("z", default_value="0.3"),
        rsp, spawn, bridge,
    ])
