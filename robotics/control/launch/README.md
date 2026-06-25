# control launch

The default AMR-X simulation drives the robot with the Gazebo **DiffDrive system
plugin** (configured in `robot_description/urdf/amr_gazebo.xacro`), so no separate
controller spawning is needed for the standard demo.

This folder is reserved for a `ros2_control` bring-up (controller_manager +
spawners) if/when you switch to the `diff_drive_controller` path defined in
`../config/diff_drive_controller.yaml`. That path additionally requires:

- a `<ros2_control>` block in the URDF with the `ign_ros2_control/IgnitionSystem`
  hardware plugin (Fortress), and
- the `ign_ros2_control` Gazebo system plugin loaded in the `<gazebo>` tag.

See https://control.ros.org/humble/doc/gz_ros2_control/doc/index.html
