import os

from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch_ros.actions import Node
from moveit_configs_utils import MoveItConfigsBuilder


def generate_launch_description():
    xacro_path = os.path.join(
        get_package_share_directory('dual_arm_description'),
        'urdf',
        'dual_arm.urdf.xacro',
    )

    moveit_config = (
        MoveItConfigsBuilder('dual_arm', package_name='dual_arm_moveit_config')
        .robot_description(file_path=xacro_path)
        .to_moveit_configs()
    )

    rviz_config_path = os.path.join(
        get_package_share_directory('dual_arm_moveit_config'),
        'config',
        'moveit.rviz',
    )

    rviz_node = Node(
        package='rviz2',
        executable='rviz2',
        output='log',
        arguments=['-d', rviz_config_path],
        parameters=[
            moveit_config.robot_description,
            moveit_config.robot_description_semantic,
            moveit_config.robot_description_kinematics,
            moveit_config.planning_pipelines,
            moveit_config.joint_limits,
            {'use_sim_time': True},
        ],
    )

    return LaunchDescription([rviz_node])
