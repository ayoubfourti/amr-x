# Hospital simulation (Fortress + Harmonic)

Run the AWS RoboMaker hospital world with the AMR-X robot, on either Gazebo stack.

## Files

| File | What it is |
|---|---|
| `worlds/hospital_fortress.sdf` | Hospital world for **Gazebo Fortress** (ROS 2 Humble). Ported from the Harmonic version by converting the system plugins (`gz-sim-*` -> `libignition-gazebo-*.so`, `gz::sim::` -> `ignition::gazebo::`). |
| `worlds/hospital_harmonic.sdf` | Original hospital world for **Gazebo Harmonic** (ROS 2 Jazzy). |
| `launch/hospital.launch.py` | Starts the hospital world. Picks the stack with `simulator_variant:=`. |
| `launch/spawn_robot.launch.py` | Spawns the AMR robot into a running world + starts robot_state_publisher and the gz bridge (with TF). |

## Quick start

Two terminals, both sourced (`cd ~/amr-x/robotics && source install/setup.bash`).

**1. Launch the world** (pick your stack):

    # Fortress (Humble):
    ros2 launch simulation hospital.launch.py simulator_variant:=fortress

    # Harmonic (Jazzy):
    ros2 launch simulation hospital.launch.py simulator_variant:=harmonic

    # headless (no Gazebo GUI - lighter, watch in RViz instead):
    ros2 launch simulation hospital.launch.py simulator_variant:=fortress gui:=false

**2. Spawn the robot** into it:

    ros2 launch simulation spawn_robot.launch.py world:=hospital x:=3.0 y:=0.0

`spawn_robot.launch.py` brings up three things together so the robot is
navigation-ready:
- the model spawn,
- `robot_state_publisher` (publishes the robot TF tree: base_link -> lidar_link ...),
- the `ros_gz_bridge` (clock, cmd_vel, odom, scan, **tf**).

## Then drive / navigate

    # teleop:
    ros2 run teleop_twist_keyboard teleop_twist_keyboard

    # or SLAM + Nav2:
    ros2 launch slam_toolbox online_async_launch.py use_sim_time:=true
    ros2 launch navigation nav2.launch.py use_sim_time:=true

## Notes

- The hospital is heavy (many AWS models). On lower-spec machines, running the
  full nav stack (SLAM + Nav2 + RViz) alongside it can overload Gazebo. Use
  `gui:=false`, close other apps, or test navigation in the lighter warehouse
  world first.
- Hospital furniture models live in `simulation/models/`. `hospital.launch.py`
  adds that to the Gazebo resource path automatically.
- `simulator_variant` defaults to `harmonic`; pass `:=fortress` on Humble.
