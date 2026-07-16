import os
from glob import glob
from setuptools import find_packages, setup

package_name = 'module_manager'

setup(
    name=package_name,
    version='0.1.0',
    packages=find_packages(exclude=['test']),
    data_files=[
        ('share/ament_index/resource_index/packages', ['resource/' + package_name]),
        ('share/' + package_name, ['package.xml']),
        (os.path.join('share', package_name, 'launch'), glob('launch/*.launch.py')),
        (os.path.join('share', package_name, 'config'), glob('config/*')),
    ],
    install_requires=['setuptools'],
    zip_safe=True,
    maintainer='ZEYNEB',
    maintainer_email='zeyneb@amr-x.local',
    description='Transition layer: module attach/detach and mode transitions.',
    license='Apache-2.0',
    tests_require=['pytest'],
    entry_points={
        'console_scripts': [
            'module_manager_node = module_manager.module_manager_node:main',
        ],
    },
)
