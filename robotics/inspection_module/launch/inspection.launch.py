import os
from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch_ros.actions import Node


def generate_launch_description():
    params_file = os.path.join(
        get_package_share_directory('inspection_module'),
        'config',
        'inspection_params.yaml'
    )

    return LaunchDescription([
        Node(
            package='inspection_module',
            executable='inspection_action_server',
            name='inspection_action_server',
            parameters=[params_file],
            output='screen'
        ),
        Node(
            package='inspection_module',
            executable='static_transforms',
            name='inspection_static_transforms',
            output='screen'
        ),
    ])
