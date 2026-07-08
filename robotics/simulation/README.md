# simulation

Gazebo Harmonic simulation assets for AMR-X.

Default environment:

- Ubuntu 24.04
- ROS 2 Jazzy
- Gazebo Harmonic

Allowed compatibility environment:

- Ubuntu 22.04
- ROS 2 Humble
- Gazebo Fortress

Both teams must report any crash, launch failure, bridge mismatch, or
environment-specific simulation issue immediately.

## Contents

- `worlds/warehouse.sdf` - the default Harmonic indoor warehouse (walls, racks, aisles,
  obstacles, loading/delivery/docking zones). Auto-generated.
- `worlds/warehouse_fortress.sdf` - the Fortress compatibility copy of the
  procedural warehouse.
- `worlds/warehouse_harmonic.sdf` - an AWS RoboMaker mesh world kept for visual
  experiments only. It is not the default because it currently triggers
  Gazebo Harmonic renderer/sensor errors.
- `scripts/generate_warehouse.py` - parametric world generator
  (e.g. `python3 generate_warehouse.py --aisle 1.8`).
- `config/bridge.yaml` - ROS <-> Gazebo topic bridge configuration.
- `launch/warehouse.launch.py` - start Gazebo with the warehouse (no robot).
- `models/` - optional reusable SDF models.

## Run

```bash
ros2 launch simulation warehouse.launch.py

# Compatibility path
ros2 launch simulation warehouse.launch.py simulator_variant:=fortress
```

The full robot-in-world launch lives in the `bringup` package.
Implements the original `simulation/` planning notes as working code.
