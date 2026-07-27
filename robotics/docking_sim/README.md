# AMR-X Autonomous Docking Demo

Simulates an AMR robot docking with a mycobot_280 robotic arm in Gazebo Fortress.

## What you will see

1. Warehouse opens with the real mycobot_280 arm standing at the dock station
2. AMR robot spawns at the far end of the warehouse
3. Robot drives autonomously to the arm
4. Arm disappears from dock station and appears on top of the robot
5. Robot is now carrying the arm (docked)

## Requirements

- Ubuntu 22.04
- ROS2 Humble
- Gazebo Fortress 6.x
- AMR-X repo cloned and built: `github.com/cybermech-hub/amr-x`
- Branch: `feature/arm-simulation`

## Setup

```bash
cd ~/amr-x
git checkout feature/arm-simulation
colcon build
source install/setup.bash
```

## Run the demo

Open **4 terminals**, all sourced with:
```bash
cd ~/amr-x && source install/setup.bash
```

### Terminal 1 — Launch Gazebo + spawn models
```bash
bash ~/amr-x/robotics/docking_sim/scripts/launch_demo.sh
```

### Terminal 2 — ROS-Gazebo Bridge
```bash
bash ~/amr-x/robotics/docking_sim/scripts/launch_bridge.sh
```

### Terminal 3 — Docking node
```bash
ros2 run docking_sim docking_sim_node
```

### Terminal 4 — Run docking mission
```bash
python3 ~/amr-x/robotics/docking_sim/scripts/docking_mission.py
```

Watch Gazebo — the robot will drive to the arm and dock automatically.

## Undock

Press **Ctrl+C** in Terminal 4, then:
```bash
ros2 topic pub --once /sim/dock/detach std_msgs/msg/Bool '{data: true}'
```

## Monitor docking state

```bash
ros2 topic echo /sim/docking/state
ros2 topic echo /sim/docking/mechanical_lock
ros2 topic echo /sim/docking/module_detected
```

## Known limitations

- Gazebo Fortress does not support DetachableJoint re-attach via topics
- Model swap (despawn arm station + spawn armed robot) is used instead
- Arm joints are fixed in the visual model (no arm control after docking)
- Nav2 autonomous navigation requires additional setup (see NAVIGATION.md)

## Architecture

```
warehouse_fortress.sdf
  └── arm_station (static mycobot_280 at dock x=10, y=-5.4)

amr.urdf.xacro          → bare robot (diff drive, lidar, IMU)
amr_with_arm.xacro      → robot + mycobot_280 arm (used after docking)

docking_sim_node        → manages dock state, publishes 4 topics
docking_mission.py      → drives robot to arm, triggers dock sequence

Topics:
  /sim/dock/attach              → trigger attach
  /sim/dock/detach              → trigger detach
  /sim/docking/mechanical_lock  → current lock state
  /sim/docking/module_detected  → arm in range
  /sim/docking/state            → DETACHED | ATTACHED
```
