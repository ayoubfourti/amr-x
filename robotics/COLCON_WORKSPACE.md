# This folder (`robotics/`) is the colcon workspace root

The five ROS 2 packages live directly here (keeping the original folder names):

- `robot_description/` - the robot model (URDF/Xacro)
- `simulation/`        - Gazebo world + bridge (Harmonic default, Fortress compatibility)
- `control/`           - ros2_control / diff_drive config
- `navigation/`        - Nav2 config (integration point)
- `bringup/`           - top-level launch files (start here)

Build from THIS directory:

```bash
cd robotics
colcon build --symlink-install
source install/setup.bash
```

`build/`, `install/`, and `log/` are generated here and are git-ignored.
If `colcon` ever warns about discovering packages inside `install/`, run once:
`touch build/COLCON_IGNORE install/COLCON_IGNORE log/COLCON_IGNORE`
