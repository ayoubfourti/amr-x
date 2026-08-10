import os
import yaml
from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch_ros.actions import Node
from moveit_configs_utils import MoveItConfigsBuilder


def load_yaml(package_name, file_path):
    package_path = get_package_share_directory(package_name)
    absolute_file_path = os.path.join(package_path, file_path)
    with open(absolute_file_path, 'r') as f:
        return yaml.safe_load(f)


def generate_launch_description():

    xacro_path = os.path.join(
        get_package_share_directory('dual_arm_description'),
        'urdf',
        'dual_arm.urdf.xacro',
    )

    moveit_config = (
        MoveItConfigsBuilder('dual_arm', package_name='dual_arm_moveit_config')
        .robot_description(file_path=xacro_path)
        .robot_description_semantic(file_path='config/dual_arm.srdf')
        .robot_description_kinematics(file_path='config/kinematics.yaml')
        .joint_limits(file_path='config/joint_limits.yaml')
        .trajectory_execution(file_path='config/moveit_controllers.yaml')
        .planning_pipelines(pipelines=['ompl', 'pilz_industrial_motion_planner'])
        .to_moveit_configs()
    )

    # Load pilz cartesian limits manually so they are guaranteed to be passed
    pilz_cartesian_limits = load_yaml(
        'dual_arm_moveit_config', 'config/pilz_cartesian_limits.yaml'
    )

    move_group_node = Node(
        package='moveit_ros_move_group',
        executable='move_group',
        output='screen',
        parameters=[
            moveit_config.to_dict(),
            pilz_cartesian_limits,
            {'use_sim_time': True},
            {'publish_planning_scene': True},
            {'publish_geometry_updates': True},
            {'publish_state_updates': True},
            {'publish_transforms_updates': True},
            {'start_state_max_bounds_error': 0.01},
        ],
        arguments=['--ros-args', '--log-level', 'info'],
    )

    robot_state_publisher = Node(
        package='robot_state_publisher',
        executable='robot_state_publisher',
        output='screen',
        parameters=[
            moveit_config.robot_description,
            {'use_sim_time': True},
        ],
    )

    return LaunchDescription([
        robot_state_publisher,
        move_group_node,
    ])
