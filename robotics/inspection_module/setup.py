import os
from glob import glob
from setuptools import find_packages, setup

package_name = 'inspection_module'

setup(
    name=package_name,
    version='0.0.0',
    packages=find_packages(exclude=['test']),
    data_files=[
        ('share/ament_index/resource_index/packages',
            ['resource/' + package_name]),
        ('share/' + package_name, ['package.xml']),
        (os.path.join('share', package_name, 'launch'), glob('launch/*.launch.py')),
        (os.path.join('share', package_name, 'config'), glob('config/*.yaml')),
    ],
    install_requires=['setuptools'],
    zip_safe=True,
    maintainer='manar',
    maintainer_email='manarafli5@gmail.com',
    description='Inspection module ROS2 nodes',
    license='Apache-2.0',
    tests_require=['pytest'],
    entry_points={
        'console_scripts': [
            'inspection_action_server = inspection_module.inspection_action_server:main',
            'static_transforms = inspection_module.static_transforms:main',
        ],
    },
)
