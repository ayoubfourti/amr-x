# control launch

The default AMR-X simulation drives the robot with the Gazebo **DiffDrive system
plugin** (configured in `robot_description/urdf/amr_gazebo.xacro`), so no separate
controller spawning is needed for the standard demo.

This folder is reserved for a future `ros2_control` bring-up
(`controller_manager` + spawners) if/when the project switches to the
`diff_drive_controller` path defined in `../config/diff_drive_controller.yaml`.

That path needs version-specific Gazebo hardware integration:

- Jazzy/Harmonic default: use the current `gz_ros2_control` integration.
- Humble/Fortress compatibility: use the older Ignition/Fortress integration.

Do not duplicate the control behavior per version. Keep differences isolated to
the hardware plugin and launch/config layer.

Repository policy:

- Default environment: `Ubuntu 24.04 + ROS 2 Jazzy + Gazebo Harmonic`
- Allowed compatibility environment: `Ubuntu 22.04 + ROS 2 Humble + Gazebo Fortress`

Both teams should report any crash, controller issue, plugin mismatch, or other
environment-specific failure immediately.
