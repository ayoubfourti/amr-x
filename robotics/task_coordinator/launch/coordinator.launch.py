# TODO(team): launch the task coordinator node.
from launch import LaunchDescription
from launch_ros.actions import Node


def generate_launch_description():
    return LaunchDescription([
        Node(package='task_coordinator', executable='coordinator_node',
             name='task_coordinator', output='screen'),
    ])
