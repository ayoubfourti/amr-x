import os
from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import ExecuteProcess, SetEnvironmentVariable

def generate_launch_description():
    pkg_share = get_package_share_directory('simulation')
    world_path = os.path.join(pkg_share, 'worlds', 'warehouse_harmonic.sdf')
    models_path = os.path.join(pkg_share, 'models')

    resource_path = pkg_share + os.pathsep + models_path

    return LaunchDescription([
        SetEnvironmentVariable('GZ_SIM_RESOURCE_PATH', resource_path),
        ExecuteProcess(
            cmd=['gz', 'sim', world_path],
            output='screen'
        ),
    ])
