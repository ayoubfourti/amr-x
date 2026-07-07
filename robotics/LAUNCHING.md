# AMR-X - Launch & Run Guide

Quick reference for running the AMR-X robot model, simulation, teleop, mapping,
and navigation.

Default stack:

- Ubuntu 24.04
- ROS 2 Jazzy
- Gazebo Harmonic

Compatibility stack:

- Ubuntu 22.04
- ROS 2 Humble
- Gazebo Fortress

Use the default Jazzy/Harmonic path unless you explicitly need compatibility.

## 0. Build once, source every terminal

The colcon workspace root is `robotics/`.

Ubuntu 24.04 / Jazzy:

```bash
cd ~/amr-x/robotics
source /opt/ros/jazzy/setup.bash
colcon build --symlink-install
source install/setup.bash
```

Ubuntu 22.04 / Humble compatibility:

```bash
cd ~/amr-x/robotics
source /opt/ros/humble/setup.bash
colcon build --symlink-install
source install/setup.bash
```

Rules:

- Source exactly one ROS distribution in a shell.
- Re-run `source install/setup.bash` in every new terminal.
- Rebuild after changing launch files, URDF/Xacro, worlds, models, or configs.

## 1. View the robot model only

```bash
ros2 launch robot_description display.launch.py
```

Use this for URDF and joint sanity checks without starting Gazebo.

## 2. Full simulation

Default Jazzy/Harmonic launch:

```bash
ros2 launch bringup simulation.launch.py
```

Useful options:

```bash
ros2 launch bringup simulation.launch.py rviz:=false
ros2 launch bringup simulation.launch.py gui:=false
ros2 launch bringup simulation.launch.py world:=/abs/path/to/world.sdf
```

Compatibility launch:

```bash
ros2 launch bringup simulation.launch.py simulator_variant:=fortress
```

The full simulation publishes `/scan`, `/imu`, `/odom`, `/joint_states`,
`/tf`, `/tf_static`, and `/clock`.

## 3. Drive the robot

Start teleop in a separate terminal after the simulation is up.

Keyboard:

```bash
ros2 run teleop_twist_keyboard teleop_twist_keyboard
```

Gamepad:

```bash
ros2 launch bringup teleop_joy.launch.py
```

Drive gently and keep the robot inside the warehouse bounds. Teleop and SLAM do
not provide collision avoidance.

## 4. Build a map with SLAM

Use three terminals:

```bash
# T1
ros2 launch bringup simulation.launch.py

# T2
ros2 launch navigation slam.launch.py

# T3
ros2 run teleop_twist_keyboard teleop_twist_keyboard
```

Save the map while SLAM is still running:

```bash
ros2 run nav2_map_server map_saver_cli -f \
    ~/amr-x/robotics/navigation/maps/amr_warehouse_map
```

If you changed navigation assets, rebuild before launching Nav2:

```bash
cd ~/amr-x/robotics
colcon build --packages-select navigation
source install/setup.bash
```

Stop SLAM before starting Nav2 so only one system owns the `map` frame.

## 5. Autonomous navigation

Run Nav2 after the simulation is up and SLAM is stopped:

```bash
# T1
ros2 launch bringup simulation.launch.py

# T2
ros2 launch navigation nav2.launch.py
```

Useful options:

```bash
ros2 launch navigation nav2.launch.py map:=/abs/path/to/other_map.yaml
ros2 launch navigation nav2.launch.py params_file:=/abs/path/to/nav2_params.yaml
ros2 launch navigation nav2.launch.py rviz:=false
```

In RViz:

1. Use `2D Pose Estimate` to localize the robot.
2. Use `Nav2 Goal` to send a target pose.

## 6. Launch only the warehouse

Default:

```bash
ros2 launch simulation warehouse.launch.py
```

Compatibility:

```bash
ros2 launch simulation warehouse.launch.py simulator_variant:=fortress
```

## Topics

| Topic | Type | Source |
|---|---|---|
| `/cmd_vel` | `geometry_msgs/Twist` | teleop or Nav2 to robot |
| `/odom` | `nav_msgs/Odometry` | wheel odometry |
| `/scan` | `sensor_msgs/LaserScan` | 2D LiDAR |
| `/imu` | `sensor_msgs/Imu` | IMU |
| `/joint_states` | `sensor_msgs/JointState` | wheel joints |
| `/tf`, `/tf_static` | `tf2_msgs/TFMessage` | robot and odom transforms |
| `/clock` | `rosgraph_msgs/Clock` | Gazebo simulation clock |

## Troubleshooting

**`package not found` on launch**
You did not build or source this terminal. Go to `robotics/`, source the right
ROS distro, rebuild if needed, then run `source install/setup.bash`.

**Wrong ROS distro in the shell**
Do not mix Jazzy and Humble in one terminal. Start a clean shell and source
only one of `/opt/ros/jazzy/setup.bash` or `/opt/ros/humble/setup.bash`.

**Launch file or config file not found**
The package may not have installed its resources. Rebuild with
`colcon build --symlink-install` and confirm the package installs its `launch`,
`config`, and `maps` directories.

**RViz map is blank**
Set the RViz Map display topic to `/map`. If QoS is wrong, remove the display
and re-add `/map` by topic so RViz picks the right settings.

**`Frame [map] does not exist`**
During mapping, SLAM must be running. During navigation, Nav2 must be active and
its map server must have started successfully.

**Gazebo bridge or simulator mismatch**
The default is Harmonic. Use `simulator_variant:=fortress` only on the Humble /
Fortress compatibility path. If bridge topics fail, verify the shell and launch
variant match the intended environment.

**Robot physics or odometry explodes**
Stop everything and relaunch cleanly:

```bash
pkill -9 -f 'gz sim'
pkill -9 -f 'ign gazebo'
pkill -9 -f parameter_bridge
pkill -9 -f rviz2
pkill -9 -f slam_toolbox
```

**Check what is running**

```bash
ros2 node list
ros2 topic hz /scan
ros2 topic echo /map --field info.width --once
ros2 run tf2_tools view_frames
```
