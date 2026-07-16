from setuptools import find_packages, setup
import os
from glob import glob

package_name = 'task_coordinator'

setup(
    name=package_name,
    version='0.1.0',
    packages=find_packages(exclude=['test']),
    data_files=[
        ('share/ament_index/resource_index/packages', ['resource/' + package_name]),
        ('share/' + package_name, ['package.xml']),
        (os.path.join('share', package_name, 'launch'), glob('launch/*.launch.py')),
        (os.path.join('share', package_name, 'config'), glob('config/*')),
        (os.path.join('share', package_name, 'behavior_trees'), glob('behavior_trees/*')),
    ],
    install_requires=['setuptools'],
    zip_safe=True,
    maintainer='ZEYNEB',
    maintainer_email='zeyneb@amr-x.local',
    description='Mission-level behavior orchestration (mobile manipulation).',
    license='Apache-2.0',
    tests_require=['pytest'],
    entry_points={
        'console_scripts': [
            'coordinator_node=task_coordinator.coordinator_node:main',
        ],
    },
)
