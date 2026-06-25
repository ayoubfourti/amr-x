# control

Differential-drive control configuration for AMR-X.

## Contents

- `config/diff_drive_controller.yaml` - `ros2_control` / `diff_drive_controller`
  parameters (the alternative, hardware-faithful control path).

## Note on the default path

The default simulation drives the robot with the Gazebo DiffDrive **system
plugin** (configured in `robot_description/urdf/amr_gazebo.xacro`), which is the
most stable option for demonstrations. This package holds the `ros2_control`
configuration for when the project moves toward real hardware - the same
controller the physical robot would use. See `launch/README.md`.

Implements the original `control/` planning notes as working code.
