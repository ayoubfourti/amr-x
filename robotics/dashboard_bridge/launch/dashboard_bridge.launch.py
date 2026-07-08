# TODO(team): launch the dashboard bridge node.
from launch import LaunchDescription
from launch_ros.actions import Node


def generate_launch_description():
    return LaunchDescription([
        Node(package='dashboard_bridge', executable='bridge_node',
             name='dashboard_bridge', output='screen'),
    ])
