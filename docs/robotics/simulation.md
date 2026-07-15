# Digital Twin and Simulation

The current digital twin combines the AMR-X Xacro model, Gazebo, ROS-Gazebo
bridges, simulated sensors, and RViz. The top-level entry point is
`robotics/bringup/launch/simulation.launch.py`.

## What the launch file starts

1. `robot_state_publisher` expands `amr_real.urdf.xacro` and publishes the
   robot description and transforms.
2. Gazebo loads the selected SDF world.
3. `ros_gz_sim create` spawns the robot as `amr_x` after the world initializes.
4. `ros_gz_bridge parameter_bridge` bridges motion, odometry, sensors,
   transforms, joint states, and simulation time.
5. RViz opens with the project simulation configuration unless disabled.

## Run the default warehouse simulation

```bash
cd /path/to/amr-x/robotics
source /opt/ros/jazzy/setup.bash
source install/setup.bash
ros2 launch bringup simulation.launch.py
```

The process intentionally delays the bridge and robot spawn while Gazebo loads.
Wait for the robot and sensor topics before starting another subsystem.

## Launch options

```bash
# Run without RViz
ros2 launch bringup simulation.launch.py rviz:=false

# Run the Gazebo server without its graphical client
ros2 launch bringup simulation.launch.py gui:=false

# Load the included hospital environment
ros2 launch bringup simulation.launch.py environment:=hospital

# Load an arbitrary world
ros2 launch bringup simulation.launch.py world:=/absolute/path/world.sdf

# WSL or renderer troubleshooting
ros2 launch bringup simulation.launch.py render_engine:=ogre

# Humble/Fortress compatibility mode
ros2 launch bringup simulation.launch.py simulator_variant:=fortress
```

Available arguments are `use_sim_time`, `rviz`, `gui`, `simulator_variant`,
`environment`, `world`, and `render_engine`.

## Drive the simulated base

In a second sourced terminal:

```bash
cd /path/to/amr-x/robotics
source /opt/ros/jazzy/setup.bash
source install/setup.bash
ros2 run teleop_twist_keyboard teleop_twist_keyboard
```

Or publish one bounded command for inspection:

```bash
ros2 topic pub --once /cmd_vel geometry_msgs/msg/Twist \
  "{linear: {x: 0.15}, angular: {z: 0.0}}"
```

Teleoperation does not provide autonomous collision avoidance. Use low speeds
and keep the robot within the world bounds.

## Verify the digital twin

```bash
ros2 node list
ros2 topic hz /scan
ros2 topic hz /odom
ros2 topic echo /imu --once
ros2 topic echo /joint_states --once
ros2 run tf2_tools view_frames
```

| Signal | Expected role |
|---|---|
| `/cmd_vel` | Motion command entering the simulated drive system |
| `/odom` | Simulated wheel/base odometry |
| `/scan` | Simulated 2D LiDAR data |
| `/imu` | Simulated inertial data |
| `/joint_states` | Wheel and robot joint state |
| `/tf`, `/tf_static` | Robot and odometry transforms |
| `/clock` | Gazebo simulation time used by ROS nodes |

## Run only an environment

```bash
ros2 launch simulation warehouse.launch.py
ros2 launch simulation warehouse.launch.py gui:=false
```

This does not spawn the robot, start the bridge, or open the configured RViz
view. It is intended for world inspection and editing.

## Source files to edit

| Change | Location |
|---|---|
| Base model and frames | `robotics/robot_description/urdf/` |
| Robot dimensions and model parameters | `robotics/robot_description/config/robot_params.yaml` |
| Gazebo-specific robot plugins | `robotics/robot_description/urdf/amr_gazebo.xacro` |
| Full launch composition | `robotics/bringup/launch/simulation.launch.py` |
| Bridge mappings | `robotics/simulation/config/bridge_harmonic.yaml` and `bridge_fortress.yaml` |
| Worlds | `robotics/simulation/worlds/` |
| Reusable environment models | `robotics/simulation/models/` and `fuel_models/` |
| RViz display configuration | `robotics/bringup/rviz/simulation.rviz` |

## Current limitations

- The digital twin validates software integration; it is not yet a calibrated
  physical twin with measured mass, inertia, friction, actuator, and sensor
  error models.
- The default drive uses a Gazebo DiffDrive plugin rather than a production
  hardware interface.
- Hospital assets are heavier than the procedural warehouse and can require
  more loading time and graphics resources.
- Physical safety circuits, embedded firmware, and real actuator feedback are
  not represented as production-ready implementations.
