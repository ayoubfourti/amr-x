# Robotics Environment Policy

The project has one default robotics environment:

- Ubuntu 24.04
- ROS 2 Jazzy
- Gazebo Harmonic

This is the environment used for current development, demos, fixes, and
acceptance checks.

## Compatibility Environment

The older stack is still allowed only as a compatibility path:

- Ubuntu 22.04
- ROS 2 Humble
- Gazebo Fortress

Compatibility users must launch with:

```bash
ros2 launch bringup simulation.launch.py simulator_variant:=fortress
```

Compatibility support is not a second implementation track. New features,
fixes, demonstrations, and acceptance checks are developed against
Jazzy/Harmonic first. Humble/Fortress differences should be isolated to small
compatibility files such as launch arguments, bridge config, plugin names, and
world variants.

## Rules

- Do not mix ROS distributions in one shell.
- Always source exactly one ROS setup file before building or launching.
- Rebuild the workspace after changing launch, URDF, Xacro, worlds, models, or
  config files.
- Report crashes, bridge mismatches, plugin errors, dependency conflicts, and
  environment-specific behavior immediately.
- Do not duplicate robot behavior, navigation logic, control logic, or feature
  work for a second ROS/Gazebo version.
- The AWS RoboMaker mesh world (`worlds/warehouse_harmonic.sdf`) is
  experimental. The default simulation uses the procedural warehouse because it
  is simpler and more stable across machines.

## Standard Commands

Default environment:

```bash
cd robotics
source /opt/ros/jazzy/setup.bash
colcon build --symlink-install
source install/setup.bash
ros2 launch bringup simulation.launch.py
```

Compatibility environment:

```bash
cd robotics
source /opt/ros/humble/setup.bash
colcon build --symlink-install
source install/setup.bash
ros2 launch bringup simulation.launch.py simulator_variant:=fortress
```
