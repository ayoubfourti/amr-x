# robot_description

Configurable URDF/Xacro model of the AMR-X robot (the digital twin).

## Contents

- `config/robot_params.yaml` - single source of truth for all dimensions,
  aligned with `config/project_specs.json`. Edit this when mechanical approves
  new dimensions; everything else updates from it.
- `urdf/` - the Xacro model:
  - `amr.urdf.xacro` - top-level entry point (loads params, includes the rest)
  - `amr_base.xacro` - chassis, drive wheels, casters
  - `amr_sensors.xacro` - LiDAR + IMU links
  - `amr_gazebo.xacro` - Gazebo Fortress plugins + sensor definitions
  - `inertial_macros.xacro`, `materials.xacro` - helpers
- `launch/display.launch.py` - view the model in RViz (no physics)
- `rviz/display.rviz` - RViz layout for the model
- `meshes/` - optional STL/DAE meshes (model uses primitives by default)

## Run

```bash
ros2 launch robot_description display.launch.py
```

Implements the original `robot_description/` planning notes as working code.
