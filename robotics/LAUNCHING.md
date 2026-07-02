# AMR-X — Launch & Run Guide

Quick reference for running the AMR-X simulation, teleop, mapping, and navigation.
Target stack: **ROS 2 Humble + Gazebo Fortress** (Ignition Gazebo 6).

---

## 0. Every terminal: build once, source always

The workspace root is `~/amr-x/robotics` (packages live directly under it).

```bash
cd ~/amr-x/robotics
colcon build --symlink-install     # first time, or after changing code
source install/setup.bash          # in EVERY new terminal before running ros2
```

Tip: add the source line to `~/.bashrc` so new terminals are ready automatically:
```bash
echo "source ~/amr-x/robotics/install/setup.bash" >> ~/.bashrc
```

---

## 1. View the robot model only (RViz, no physics)

```bash
ros2 launch robot_description display.launch.py
```
Sliders let you spin the wheels. Good for checking the URDF after dimension changes.

---

## 2. Full simulation (robot + warehouse + sensors)

```bash
ros2 launch bringup simulation.launch.py
```
Spawns AMR-X in the warehouse. Publishes `/scan`, `/imu`, `/odom`, `/joint_states`,
`/tf`, `/clock`. Options:
```bash
ros2 launch bringup simulation.launch.py rviz:=false     # no RViz
ros2 launch bringup simulation.launch.py gui:=false      # headless Gazebo
```

---

## 3. Drive it (teleoperation)

Run in its OWN terminal (needs keyboard focus). Simulation must be running.

```bash
# Keyboard
ros2 run teleop_twist_keyboard teleop_twist_keyboard
```
Controls: `i` forward, `,` back, `j`/`l` turn, `k` STOP.
**Tap keys once and press `k` to stop — do not hold keys.** Keep the robot inside
the walls; there is no collision avoidance during teleop/mapping.

```bash
# Gamepad
ros2 launch bringup teleop_joy.launch.py
```

---

## 4. Build a map (SLAM) — do this before navigation

Three terminals (source install/setup.bash in each):

```bash
# T1
ros2 launch bringup simulation.launch.py
# T2
ros2 launch navigation slam.launch.py
# T3
ros2 run teleop_twist_keyboard teleop_twist_keyboard
```

Drive slowly down every aisle and along all four walls, staying inside the hall.
Watch the map fill in RViz (grey = free space, black = walls).

### Save the map (while SLAM is still running!)
```bash
ros2 run nav2_map_server map_saver_cli -f \
    ~/amr-x/robotics/navigation/maps/amr_warehouse_map
```
Creates `amr_warehouse_map.pgm` + `.yaml`. Then rebuild so Nav2 finds it:
```bash
cd ~/amr-x/robotics && colcon build --packages-select navigation && source install/setup.bash
```
**Stop SLAM (Ctrl+C) before launching Nav2** — both fight over the `map` frame.

---

## 5. Autonomous navigation (Nav2)

Simulation running, SLAM stopped.

```bash
# T1: simulation (if not running)
ros2 launch bringup simulation.launch.py
# T2: Nav2 + RViz
ros2 launch navigation nav2.launch.py
```
Options:
```bash
ros2 launch navigation nav2.launch.py map:=/abs/path/to/other_map.yaml
ros2 launch navigation nav2.launch.py rviz:=false
```

In RViz:
1. **2D Pose Estimate** → click the robot's real location, drag toward its heading.
2. **Nav2 Goal** → click a destination, drag toward desired final heading.

The robot plans a path and drives itself there.

---

## Just the environment (no robot)

```bash
ros2 launch simulation warehouse.launch.py
```

---

## Topics (from the running simulation)

| Topic | Type | Source |
|---|---|---|
| `/cmd_vel` | geometry_msgs/Twist | teleop / Nav2 -> robot |
| `/odom` | nav_msgs/Odometry | wheel-encoder odometry |
| `/scan` | sensor_msgs/LaserScan | 2D LiDAR (~15 Hz) |
| `/imu` | sensor_msgs/Imu | IMU |
| `/joint_states` | sensor_msgs/JointState | wheel joints |
| `/tf`, `/tf_static` | tf2_msgs/TFMessage | odom->base + model TF |
| `/clock` | rosgraph_msgs/Clock | Gazebo sim time |

---

## Troubleshooting (things we actually hit)

**"package not found" on launch**
You didn't build/source in this terminal. Run from `~/amr-x/robotics`:
`colcon build --symlink-install && source install/setup.bash`. Check with `colcon list`.

**"file 'X.launch.py' was not found in the share directory"**
The launch file isn't installed. Ensure the package `CMakeLists.txt` installs the
folder, e.g. `install(DIRECTORY config launch maps DESTINATION share/${PROJECT_NAME})`,
then rebuild.

**RViz Map is blank / "No map received" / Width:0 Height:0**
The Map display's **Topic** is empty or QoS is wrong. Set Topic = `/map`,
Reliability = Reliable, Durability = **Transient Local**. If still blank,
Remove the Map display and re-Add it via **By topic -> /map**.

**RViz "Frame [map] does not exist"**
Nothing is publishing the `map` frame yet. During mapping, SLAM must be running.
During navigation, Nav2's map_server must be **active** (see below).

**Odometry runs away / robot drives to huge coordinates (x=200+)**
You drove out of the warehouse into empty space, or held a teleop key and the
robot got stuck. Fully restart the sim:
`pkill -9 -f 'gz sim'; pkill -9 -f 'ign gazebo'; pkill -9 -f parameter_bridge`
then relaunch. Drive gently, inside the walls, tapping keys.

**Check what's actually running / frames / topics**
```bash
ros2 node list
ros2 topic hz /scan            # should be ~15 Hz
ros2 run tf2_tools view_frames # generates frames.pdf of the TF tree
ros2 topic echo /map --field info.width --once
```

**Nav2 nodes alive but "inactive" (navigation won't start)**
Lifecycle nodes didn't activate. Check and force startup:
```bash
ros2 lifecycle get /map_server
ros2 service call /lifecycle_manager_navigation/manage_nodes \
    nav2_msgs/srv/ManageLifecycleNodes "{command: 0}"
ros2 service call /lifecycle_manager_localization/manage_nodes \
    nav2_msgs/srv/ManageLifecycleNodes "{command: 0}"
```
(NOTE: still being debugged — see standup thread.)

**Kill everything cleanly**
```bash
pkill -9 -f 'gz sim'; pkill -9 -f 'ign gazebo'; pkill -9 -f 'ruby'
pkill -9 -f parameter_bridge; pkill -9 -f slam_toolbox; pkill -9 -f rviz2
```
