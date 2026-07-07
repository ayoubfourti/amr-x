# bringup

Top-level launch package for AMR-X. **Start here.**

Orchestrates the other packages into single commands.

## Contents

- `launch/simulation.launch.py` - the full digital twin: robot description +
  Gazebo + warehouse + spawn + ROS-Gazebo bridge + RViz, in one command.
- `launch/teleop.launch.py` - keyboard teleoperation.
- `launch/teleop_joy.launch.py` - gamepad teleoperation.
- `config/teleop_joy.yaml` - gamepad mapping.
- `rviz/simulation.rviz` - RViz layout (robot, LiDAR scan, odometry, TF).

## Run

```bash
ros2 launch bringup simulation.launch.py          # everything
ros2 launch bringup simulation.launch.py rviz:=false
ros2 launch bringup simulation.launch.py gui:=false
ros2 launch bringup simulation.launch.py simulator_variant:=fortress
```

This package has no predecessor in the original planning structure - it is the
new piece that ties the others together.
