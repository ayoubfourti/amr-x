# Robotics

Robot software, simulation, and navigation for AMR-X. Built simulation-first on
ROS 2 so behaviour is validated before deploying to real hardware.

## Default stack

| Component | Version |
|---|---|
| OS | Ubuntu 24.04 |
| ROS 2 | Jazzy |
| Simulator | Gazebo Harmonic, via ros_gz |
| Control | ros2_control + diff_drive_controller (DiffDrive plugin for sim) |
| Navigation | Nav2 + SLAM Toolbox |
| Teleop | teleop_twist_keyboard / teleop_twist_joy / joy |

## Compatibility path

Teams that still need `Ubuntu 22.04 + ROS 2 Humble + Gazebo Fortress` can keep
using it, but it is now the compatibility path rather than the default path.

Both the Ubuntu 24.04 team and the Ubuntu 22.04 team must report any crash,
launch failure, bridge mismatch, package conflict, or other environment-related
problem immediately so the project can be fixed before the issue spreads.

The compatibility path is not a second implementation track. New work targets
Jazzy/Harmonic first, and version differences must stay isolated to small
compatibility files.

See `ENVIRONMENT.md` for the full environment policy and standard commands.

## This folder is the colcon workspace

The five packages live directly here (original folder names kept):

| Package | Role |
|---|---|
| `robot_description/` | Configurable URDF/Xacro robot model. |
| `simulation/` | Gazebo Harmonic warehouse world + ROS-Gazebo bridge. |
| `control/` | ros2_control / diff_drive_controller config. |
| `navigation/` | Nav2 config (integration point for SLAM + Nav2). |
| `bringup/` | Top-level launch files. **Start here.** |

## Build

```bash
cd robotics
rosdep install --from-paths . --ignore-src -r -y
colcon build --symlink-install
source install/setup.bash
```

## Stack selection

The launch files default to the Harmonic/Jazzy path.

```bash
# Default path: Ubuntu 24.04 + ROS 2 Jazzy + Gazebo Harmonic
ros2 launch bringup simulation.launch.py

# Compatibility path: Ubuntu 22.04 + ROS 2 Humble + Gazebo Fortress
ros2 launch bringup simulation.launch.py simulator_variant:=fortress
```

## Run

```bash
# Full simulation: robot + warehouse + sensors + RViz
ros2 launch bringup simulation.launch.py

# Drive it (second terminal, after sourcing install/setup.bash)
ros2 run teleop_twist_keyboard teleop_twist_keyboard

# Model only, in RViz
ros2 launch robot_description display.launch.py

# Environment only
ros2 launch simulation warehouse.launch.py
```

## Topics

`/cmd_vel` (in), `/odom`, `/scan`, `/imu`, `/joint_states`, `/tf`, `/clock`.

See each package's README for details, and `COLCON_WORKSPACE.md` for build notes.
