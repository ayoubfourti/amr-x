import os
from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch_ros.actions import Node
from moveit_configs_utils import MoveItConfigsBuilder


def generate_launch_description():
    xacro_path = os.path.join(
        get_package_share_directory("arm_description"),
        "urdf",
        "arm_module.xacro",
    )

    moveit_config = (
        MoveItConfigsBuilder("arm_module", package_name="arm_moveit_config")
        .robot_description(file_path=xacro_path)
        .to_moveit_configs()
    )

    move_group_node = Node(
        package="moveit_ros_move_group",
        executable="move_group",
        output="screen",
        parameters=[
            moveit_config.to_dict(),
            {"use_sim_time": True},
        ],
    )

    return LaunchDescription([move_group_node])