# AMR-X Robot Simulation — Launch & Spawn Guide

## Prerequisites

Make sure you have ROS 2 Humble and Ignition Gazebo (Fortress) installed.

```bash
source /opt/ros/humble/setup.bash
```

---

## Build the Workspace

```bash
cd ~/amr-x
colcon build
source install/setup.bash
```

---

## Launch the Warehouse Simulation

Open a terminal and run:

```bash
source ~/amr-x/install/setup.bash
ros2 launch simulation warehouse.launch.py
```

Wait until Gazebo is fully open before proceeding.

---

## Spawn the Robot

Open a **new terminal** and run:

```bash
source ~/amr-x/install/setup.bash
ros2 run ros_gz_sim create \
  -string "$(cat ~/amr-x/robotics/robot_description/urdf/amr0_urdf.urdf)" \
  -name amr_robot \
  -x 0 -y 0 -z 0.1
```

The robot will appear in the Gazebo warehouse environment.

---

## Publish Robot State (Optional — for RViz)

Open a **new terminal** and run:

```bash
cat > /tmp/rsp.launch.py << 'EOF2'
from launch import LaunchDescription
from launch_ros.actions import Node
import os

def generate_launch_description():
    urdf_path = os.path.expanduser(
        '~/amr-x/robotics/robot_description/urdf/amr0_urdf.urdf'
    )
    with open(urdf_path, 'r') as f:
        robot_desc = f.read()

    return LaunchDescription([
        Node(
            package='robot_state_publisher',
            executable='robot_state_publisher',
            parameters=[{'robot_description': robot_desc}],
            output='screen'
        )
    ])
EOF2

source ~/amr-x/install/setup.bash
ros2 launch /tmp/rsp.launch.py
```

---

## Terminal Summary

| Terminal | Command | Role |
|----------|---------|------|
| 1 | `ros2 launch simulation warehouse.launch.py` | Launch Gazebo warehouse |
| 2 | `ros2 run ros_gz_sim create -string ...` | Spawn the robot |
| 3 | `ros2 launch /tmp/rsp.launch.py` | Publish robot state |

---

## Robot Description

The robot `amr0_urdf` was designed in **SolidWorks** and exported using the SolidWorks to URDF Exporter plugin. It includes:

- `base_link` — main robot body
- `left_wheel_Link` — left drive wheel
- `right_wheel_Link` — right drive wheel
- `caster_left_wheel_Link` — left caster wheel
- `caster_right_wheel_Link` — right caster wheel

### File Structure

```
robotics/
└── robot_description/
    ├── meshes/
    │   ├── base_link.STL
    │   ├── left_wheel_Link.STL
    │   ├── right_wheel_Link.STL
    │   ├── caster_left_wheel_Link.STL
    │   └── caster_right_wheel_Link.STL
    └── urdf/
        └── amr0_urdf.urdf
```

---

## Troubleshooting

**Package not found error:**
```bash
source ~/amr-x/install/setup.bash
```

**Robot not appearing in Gazebo:**
Make sure Gazebo is fully loaded before running the spawn command.

**Rebuild after URDF changes:**
```bash
cd ~/amr-x
colcon build
source install/setup.bash
```
