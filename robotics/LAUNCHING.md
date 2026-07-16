# AMR-X Launch Guide

Commands for ROS 2 Jazzy and Gazebo Harmonic. Run them from the repository
root. Source ROS and the workspace in every terminal.

## Build

```bash
source /opt/ros/jazzy/setup.bash
rosdep install --from-paths robotics --ignore-src -r -y
colcon build --symlink-install
source install/setup.bash
```

Rebuild after changing URDF, launch, world, RViz, or navigation files. Wait for
`Entity creation successful` before starting teleop or SLAM.

## Complete simulation

```bash
# Default warehouse, robot, sensors, bridge, Gazebo, and RViz
ros2 launch bringup simulation.launch.py

# Hospital
ros2 launch bringup simulation.launch.py environment:=hospital

# No simulation RViz; use this before SLAM or localization
ros2 launch bringup simulation.launch.py rviz:=false

# Headless Gazebo server
ros2 launch bringup simulation.launch.py gui:=false rviz:=false

# Custom SDF
ros2 launch bringup simulation.launch.py world:=/absolute/path/world.sdf

# Humble / Fortress compatibility
ros2 launch bringup simulation.launch.py simulator_variant:=fortress
```

Built-in environments are `warehouse` and `hospital`. The launch file
selects a safe spawn position for each.

## World only

These commands do not spawn the robot or ROS bridge.

| World | Command |
|---|---|
| Procedural warehouse | `ros2 launch simulation warehouse.launch.py` |
| Hospital | `ros2 launch simulation hospital_harmonic.launch.py` |
| Experimental AWS warehouse | `ros2 launch simulation warehouse_harmonic.launch.py` |
| Fortress warehouse | `ros2 launch simulation warehouse.launch.py simulator_variant:=fortress` |

The AWS mesh world is intended for visual testing and may be slower than the
procedural warehouse.

## RViz and teleoperation

View only the URDF:

```bash
ros2 launch robot_description display.launch.py
```

Drive from a sourced terminal:

```bash
ros2 run teleop_twist_keyboard teleop_twist_keyboard
```

Keys: `i` forward, `,` reverse, `j`/`l` rotate, and `k` stop.
Alternatively, `ros2 launch bringup teleop.launch.py` opens an `xterm`, and
`ros2 launch bringup teleop_joy.launch.py` starts gamepad control.

The front LiDAR publishes `/scan` in `lidar_link`. The rear CAD LiDAR is
currently visual-only.

## SLAM mapping

Use three sourced terminals:

```bash
# Terminal 1: simulation without duplicate RViz
ros2 launch bringup simulation.launch.py rviz:=false

# Terminal 2: SLAM Toolbox and configured mapping RViz
ros2 launch navigation slam.launch.py

# Terminal 3: drive
ros2 run teleop_twist_keyboard teleop_twist_keyboard
```

RViz displays the map, orange LiDAR points, robot, and TF with `map` as the
fixed frame. Black is occupied, white is free, and grey is unexplored. Drive
slowly and revisit mapped areas. Do not use `2D Pose Estimate` during SLAM.

Save the map while SLAM is running:

```bash
ros2 run nav2_map_server map_saver_cli -f \
  "$(pwd)/robotics/navigation/maps/amr_warehouse_map"
colcon build --packages-select navigation --symlink-install
source install/setup.bash
```

## Navigation

### On the live SLAM map

Keep SLAM running:

```bash
# T1
ros2 launch bringup simulation.launch.py rviz:=false

# T2
ros2 launch navigation slam.launch.py

# T3
ros2 launch navigation nav2.launch.py rviz:=false
```

Use `Nav2 Goal` in the SLAM RViz window. Do not start AMCL in this mode.

### On a saved map

Stop SLAM first:

```bash
# T1
ros2 launch bringup simulation.launch.py rviz:=false

# T2
ros2 launch navigation localization.launch.py
```

Use `2D Pose Estimate`, wait for AMCL to converge, then use `Nav2 Goal`.
Select another map with:

```bash
ros2 launch navigation localization.launch.py map:=/absolute/path/map.yaml
```

## Topics and checks

| Topic | Purpose |
|---|---|
| `/cmd_vel` | Velocity commands |
| `/odom` | Wheel odometry |
| `/scan` | Front 2D LiDAR |
| `/imu` | IMU |
| `/joint_states` | Wheel and caster joints |
| `/tf`, `/tf_static` | Frame transforms |
| `/map` | SLAM or saved occupancy map |
| `/clock` | Simulation time |

```bash
ros2 node list
ros2 topic hz /scan
ros2 topic echo /scan --once --field header
ros2 topic echo /odom --once
ros2 topic echo /map --once --field info
```

## Troubleshooting

- **Package not found:** build and source `install/setup.bash`.
- **RViz shows only a grid:** launch `navigation slam.launch.py` and verify
  `/scan` and `/map`.
- **No `map` frame:** start SLAM or `localization.launch.py`.
- **Two RViz windows:** start simulation with `rviz:=false`.
- **No robot in a world-only launch:** use `bringup simulation.launch.py`.
- **Changes are not visible:** stop Gazebo, rebuild, source, and relaunch.
- **No rear scan:** expected until `/scan_rear` and scan merging are added.
