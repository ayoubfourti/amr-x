# AMR-X Autonomous Docking Simulation

Simulates an autonomous mobile robot docking with a real mycobot_280 robotic arm in Gazebo Fortress 6.17.1 on ROS2 Humble.

---

## What Was Built

### The Problem
The AMR-X robot needs to pick up a modular robotic arm (mycobot_280) from a dock station and carry it to a delivery location. This required simulating the physical docking and undocking of the arm onto the robot inside Gazebo.

### The Challenge
Gazebo Fortress 6.17.1 does not support DetachableJoint re-attachment via topics. This means two separate Gazebo models cannot be physically joined at runtime. We needed a creative solution to simulate this behavior.

### The Solution — Visual Model Swap
Instead of trying to attach two models together, we use a **visual swap technique**:

- The warehouse world contains the arm as a static model (`arm_station`) at the dock station
- The robot (`robot`) spawns at the far end of the warehouse as a separate model
- When docking happens, `arm_station` is hidden underground using `set_pose z=-100`
- A new combined model (`robot_armed`) is spawned at the robot's exact position — this model has the arm already fixed on top of the robot as one rigid body
- When undocking, `robot_armed` is hidden underground and `arm_station` is raised back to `z=0`
- The bare `robot` model stays active throughout for continuous diff drive control

This approach avoids any model deletion (which crashes Gazebo Fortress) and produces a clean visual result.

---

## What You Will See

1. Warehouse opens with the **real mycobot_280 arm** standing upright at the dock station (`x=10, y=-5.4`)
2. **Robot spawns** at the far end of the warehouse (`x=2, y=-5.4`)
3. Robot **drives autonomously** straight toward the arm (7.5 meters at 0.3 m/s)
4. Robot **stops** in front of the arm
5. **DOCKING**: arm disappears from dock station and appears on top of the robot
6. Press **ENTER** to undock
7. **UNDOCKING**: arm returns to dock station, robot stays in place

---

## Requirements

- Ubuntu 22.04
- ROS2 Humble
- Gazebo Fortress 6.x
- AMR-X repo: `github.com/cybermech-hub/amr-x`
- Branch: `feature/arm-simulation`

---

## Setup

```bash
cd ~/amr-x
git checkout feature/arm-simulation
colcon build
source install/setup.bash
```

---

## Run the Demo — 4 Terminals

### Terminal 1 — Gazebo + Models
```bash
bash ~/amr-x/robotics/docking_sim/scripts/launch_demo.sh
```
This script:
- Generates `/tmp/amr_bare.urdf` (bare robot)
- Generates `/tmp/amr_armed_visual.urdf` (robot + arm, no plugins, fixed joints)
- Opens Gazebo with the warehouse world (arm already at dock station)
- Spawns the bare robot at `x=2, y=-5.4`

### Terminal 2 — ROS-Gazebo Bridge
```bash
bash ~/amr-x/robotics/docking_sim/scripts/launch_bridge.sh
```
Bridges these topics between ROS2 and Gazebo:
- `/clock`, `/cmd_vel`, `/odom`, `/tf`, `/scan`, `/imu`

### Terminal 3 — Docking State Node
```bash
cd ~/amr-x && source install/setup.bash
ros2 run docking_sim docking_sim_node
```
Manages the docking state machine and publishes 4 topics.

### Terminal 4 — Mission Script
```bash
cd ~/amr-x && source install/setup.bash
python3 ~/amr-x/robotics/docking_sim/scripts/docking_mission.py
```
Drives the robot autonomously to the arm and executes the full dock + undock sequence.

---

## How It Works — Step by Step

### Robot Navigation
The robot drives using pure odometry — no camera, no lidar-based navigation:
```
start_x = odom.x
while (odom.x - start_x) < 7.5 meters:
    publish cmd_vel.linear.x = 0.3 m/s
stop → publish cmd_vel = 0
```
The `/odom` topic comes from the differential drive plugin inside Gazebo.
The `/cmd_vel` topic is forwarded to Gazebo via the ROS-Gazebo bridge.

### Docking Sequence
```
Step 1: Robot travels 7.5m → stops at arm station
Step 2: Publish /sim/dock/attach = True → state = ATTACHED
Step 3: set_pose("arm_station", z=-100) → arm disappears from dock
Step 4: Spawn "robot_armed" at robot position → arm appears on robot
```

### Undocking Sequence
```
Step 5: User presses ENTER
Step 6: Publish /sim/dock/detach = True → state = DETACHED
Step 7: set_pose("robot_armed", z=-100) → armed robot disappears
Step 8: set_pose("arm_station", z=0) → arm reappears at dock station
```

### Model Names in Gazebo
| Model | Description |
|---|---|
| `robot` | Bare AMR robot — always active, drives throughout |
| `arm_station` | Real mycobot_280 arm at dock station |
| `robot_armed` | Combined robot + arm — spawned only when docked |

---

## Monitor Docking State

```bash
ros2 topic echo /sim/docking/state
ros2 topic echo /sim/docking/mechanical_lock
ros2 topic echo /sim/docking/module_detected
```

---

## ROS2 Topics

| Topic | Type | Direction | Description |
|---|---|---|---|
| `/sim/dock/attach` | std_msgs/Bool | IN | Trigger arm attachment |
| `/sim/dock/detach` | std_msgs/Bool | IN | Trigger arm detachment |
| `/sim/docking/mechanical_lock` | std_msgs/Bool | OUT | Current lock state |
| `/sim/docking/module_detected` | std_msgs/Bool | OUT | Arm within 0.8m range |
| `/sim/docking/state` | std_msgs/String | OUT | ATTACHED or DETACHED |

---

## File Structure

```
robotics/docking_sim/
├── scripts/
│   ├── launch_demo.sh          # Terminal 1 — Gazebo + models
│   ├── launch_bridge.sh        # Terminal 2 — ROS-Gazebo bridge
│   ├── fix_armed_urdf.py       # Strips plugins, fixes arm joints
│   └── docking_mission.py      # Terminal 4 — full dock + undock mission
├── docking_sim/
│   └── docking_sim_node.py     # Docking state machine node
├── package.xml
└── setup.py

robotics/robot_description/urdf/
├── amr.urdf.xacro              # Bare robot
└── amr_with_arm.xacro          # Combined robot + mycobot_280 arm

robotics/simulation/worlds/
└── warehouse_fortress.sdf      # Warehouse + embedded arm station model

robotics/arm_description/       # mycobot_280 arm package (teammate)
```

---

## Known Limitations

- Gazebo Fortress does not support DetachableJoint re-attachment — model swap is used instead
- Arm joints are fixed in the visual model — no arm control after docking
- Two robot models exist simultaneously during docked state (`robot` underneath `robot_armed`)
- Model deletion crashes Gazebo Fortress — `set_pose z=-100` is used to hide models
- Nav2 autonomous navigation requires additional setup (AMCL + map + costmaps)

---

## Next Steps

- **Nav2**: Merge `navigation-slam-dual-lidar` branch for real autonomous navigation to the dock
- **MoveIt**: Use `arm_moveit_config` to control the arm after docking
- **Module Manager**: Wire up `DockModule.action` server from `feature/ros2-simulation`
- **Hardware**: Test on real mycobot_280 hardware using `arm_control` package
- **Gazebo Garden**: Upgrade simulator for native DetachableJoint re-attach support
