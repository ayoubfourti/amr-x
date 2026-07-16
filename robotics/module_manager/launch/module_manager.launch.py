from launch import LaunchDescription
from launch_ros.actions import Node


def generate_launch_description():
    return LaunchDescription([
        Node(
            package="module_manager",
            executable="module_manager_node",
            name="module_manager",
            output="screen",
        ),
    ])
