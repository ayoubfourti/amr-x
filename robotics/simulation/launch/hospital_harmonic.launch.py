import os
from ament_index_python.packages import get_package_share_directory
from launch import LaunchDescription
from launch.actions import ExecuteProcess, SetEnvironmentVariable

def generate_launch_description():
    pkg_share = get_package_share_directory('simulation')
    world_path = os.path.join(pkg_share, 'worlds', 'hospital_harmonic.sdf')
    models_path = os.path.join(pkg_share, 'models')
    fuel_models_path = os.path.join(pkg_share, 'fuel_models')
    photos_path = os.path.join(pkg_share, 'photos')

    resource_path = os.pathsep.join([pkg_share, models_path, fuel_models_path, photos_path])

    return LaunchDescription([
        SetEnvironmentVariable('GZ_SIM_RESOURCE_PATH', resource_path),
        ExecuteProcess(
            cmd=['gz', 'sim', world_path],
            output='screen'
        ),
    ])
