#!/usr/bin/env python3
import os
from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import IncludeLaunchDescription, TimerAction, SetEnvironmentVariable
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch_ros.actions import Node
from launch.substitutions import Command
from launch_ros.parameter_descriptions import ParameterValue

def generate_launch_description():

    pkg_dual_arm_description = get_package_share_directory('dual_arm_description')
    pkg_dual_arm_control = get_package_share_directory('dual_arm_control')
    pkg_ros_gz_sim = get_package_share_directory('ros_gz_sim')

    xacro_file = os.path.join(pkg_dual_arm_description, 'urdf', 'dual_arm.urdf.xacro')
    controllers_file = os.path.join(
        pkg_dual_arm_control,
        'config',
        'dual_arm_controllers.yaml',
    )
    robot_description = ParameterValue(
        Command([
            'xacro',
            ' ',
            xacro_file,
            ' controllers_file:=',
            controllers_file,
        ]),
        value_type=str
    )
    set_gz_resource_path = SetEnvironmentVariable(
        name='GZ_SIM_RESOURCE_PATH',
        value=pkg_dual_arm_description)
    set_ign_resource_path = SetEnvironmentVariable(
        name='IGN_GAZEBO_RESOURCE_PATH',
        value=pkg_dual_arm_description)
    
    # Start Gazebo (bullet-featherstone: required for mimic constraint support)
    start_gazebo = IncludeLaunchDescription(
        PythonLaunchDescriptionSource(
            os.path.join(pkg_ros_gz_sim, 'launch', 'gz_sim.launch.py')),
        launch_arguments={'gz_args': '-r empty.sdf --physics-engine gz-physics-bullet-featherstone-plugin'}.items())

    # Clock bridge
    clock_bridge = Node(
        package='ros_gz_bridge',
        executable='parameter_bridge',
        arguments=['/clock@rosgraph_msgs/msg/Clock[gz.msgs.Clock'],
        output='screen')

    # Publish robot description
    robot_state_publisher = Node(
        package='robot_state_publisher',
        executable='robot_state_publisher',
        name='robot_state_publisher',
        output='screen',
        parameters=[{
            'use_sim_time': True,
            'robot_description': robot_description}])

    # Spawn robot into Gazebo
    spawn_robot = Node(
        package='ros_gz_sim',
        executable='create',
        arguments=[
            '-topic', '/robot_description',
            '-name', 'dual_arm',
            '-z', '0.0',
        '-Y', '3.14159'],
        output='screen')

    # Start joint state broadcaster
    joint_state_broadcaster = TimerAction(
        period=3.0,
        actions=[Node(
            package='controller_manager',
            executable='spawner',
            arguments=['joint_state_broadcaster',
                       '--controller-manager', '/controller_manager'],
            output='screen')])

    # Start left arm controller
    left_arm_controller = TimerAction(
        period=6.0,
        actions=[Node(
            package='controller_manager',
            executable='spawner',
            arguments=['left_arm_controller',
                       '--controller-manager', '/controller_manager'],
            output='screen')])

    # Start right arm controller
    right_arm_controller = TimerAction(
        period=6.0,
        actions=[Node(
            package='controller_manager',
            executable='spawner',
            arguments=['right_arm_controller',
                       '--controller-manager', '/controller_manager'],
            output='screen')])
    # Start base controller
    base_controller = TimerAction(
    period=6.0,
    actions=[Node(
        package='controller_manager',
        executable='spawner',
        arguments=['base_controller',
                   '--controller-manager', '/controller_manager'],
        output='screen')])
    
    # Start pinion position controller
    pinion_position_controller = TimerAction(
        period=6.0,
        actions=[Node(
            package='controller_manager',
            executable='spawner',
            arguments=['pinion_position_controller',
                       '--controller-manager', '/controller_manager'],
            output='screen')])
    return LaunchDescription([
        set_gz_resource_path,
        start_gazebo,
        clock_bridge,
        robot_state_publisher,
        spawn_robot,
        joint_state_broadcaster,
        left_arm_controller,
        right_arm_controller,
        pinion_position_controller,
        base_controller,
    ])
