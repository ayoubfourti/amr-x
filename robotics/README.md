# Robotics

Robot software, simulation, and navigation for AMR-X. Built simulation-first on
ROS 2 so behaviour is validated before deploying to real hardware.

## Stack (as installed on the team machine)

| Component | Version |
|---|---|
| OS | Ubuntu 22.04 |
| ROS 2 | Humble |
| Simulator | Gazebo Fortress (Ignition Gazebo 6), via ros_gz |
| Control | ros2_control + diff_drive_controller (DiffDrive plugin for sim) |
| Navigation | Nav2 + SLAM Toolbox |
| Teleop | teleop_twist_keyboard / teleop_twist_joy / joy |

> An earlier draft of this file listed ROS 2 Jazzy + Gazebo Harmonic. The code
> targets the installed Humble + Fortress stack. The only Fortress-specific bits
> live in `robot_description/urdf/amr_gazebo.xacro` and
> `simulation/config/bridge.yaml`.

## This folder is the colcon workspace

The five packages live directly here (original folder names kept):

| Package | Role |
|---|---|
| `robot_description/` | Configurable URDF/Xacro robot model. |
| `simulation/` | Gazebo Fortress warehouse world + ROS-Gazebo bridge. |
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
