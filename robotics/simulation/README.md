# simulation

Gazebo Fortress (Ignition Gazebo 6) simulation assets for AMR-X.

## Contents

- `worlds/warehouse.sdf` - the indoor warehouse (walls, racks, aisles,
  obstacles, loading/delivery/docking zones). Auto-generated.
- `scripts/generate_warehouse.py` - parametric world generator
  (e.g. `python3 generate_warehouse.py --aisle 1.8`).
- `config/bridge.yaml` - ROS <-> Gazebo topic bridge configuration.
- `launch/warehouse.launch.py` - start Gazebo with the warehouse (no robot).
- `models/` - optional reusable SDF models.

## Run

```bash
ros2 launch simulation warehouse.launch.py
```

The full robot-in-world launch lives in the `bringup` package.
Implements the original `simulation/` planning notes as working code.
