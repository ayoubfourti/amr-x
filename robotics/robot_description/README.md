# robot_description

Robot model package for AMR-X.

## Environment

Default environment:

- Ubuntu 24.04
- ROS 2 Jazzy
- Gazebo Harmonic

Allowed compatibility environment:

- Ubuntu 22.04
- ROS 2 Humble
- Gazebo Fortress

See `../ENVIRONMENT.md` for the full environment policy. New work targets the
default environment first; compatibility fixes must stay isolated to small
version-specific files.

## Build

From the repository root:

```bash
cd robotics
source /opt/ros/jazzy/setup.bash
colcon build --symlink-install
source install/setup.bash
```

## View the Robot Model

```bash
ros2 launch robot_description display.launch.py
```

## Run the Full Simulation

The robot is spawned by the top-level bringup launch file:

```bash
ros2 launch bringup simulation.launch.py
```

Fortress compatibility path:

```bash
ros2 launch bringup simulation.launch.py simulator_variant:=fortress
```

## Package Contents

- `urdf/amr.urdf.xacro` - top-level Xacro model.
- `urdf/amr_base.xacro` - mobile base, wheels, and casters.
- `urdf/amr_sensors.xacro` - LiDAR and IMU links.
- `urdf/amr_gazebo.xacro` - Gazebo integration with Harmonic/Fortress variants.
- `config/robot_params.yaml` - robot model parameters.
- `launch/display.launch.py` - RViz-only model display.
- `meshes/` - optional mesh assets.

The legacy `urdf/amr0_urdf.urdf` is a SolidWorks export kept as a reference.
The active simulation uses `urdf/amr.urdf.xacro`.
