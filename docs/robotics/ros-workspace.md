# ROS 2 Workspace

This page describes the software that is actually present in `robotics/`. The
directory is a colcon workspace; run ROS commands from there, not from the
repository root.

## Supported environment

| Role | Default | Compatibility path |
|---|---|---|
| Operating system | Ubuntu 24.04 | Ubuntu 22.04 |
| ROS 2 | Jazzy | Humble |
| Gazebo | Harmonic | Fortress |

New development targets Jazzy and Harmonic. Do not source Jazzy and Humble in
the same shell.

## First build

```bash
cd /path/to/amr-x/robotics
source /opt/ros/jazzy/setup.bash
rosdep install --from-paths . --ignore-src -r -y
colcon build --symlink-install
source install/setup.bash
```

The `build/`, `install/`, and `log/` directories are generated outputs. Source
`install/setup.bash` in every new terminal that will use this workspace.

For the Humble compatibility path, replace `jazzy` with `humble` and pass
`simulator_variant:=fortress` when launching the simulation.

## Package inventory and current state

| Package | Implemented now | Maturity |
|---|---|---|
| `robot_description` | Xacro/URDF base model, meshes, parameters, RViz display launch | Implemented; geometry and sensor placement still evolve |
| `simulation` | Warehouse and hospital worlds, model resources, Gazebo bridge configuration | Implemented for simulation use |
| `bringup` | Full simulation, keyboard/gamepad teleoperation, and RViz composition | Implemented |
| `navigation` | SLAM Toolbox, saved-map localization, Nav2 configuration, maps, and launch files | Implemented integration; requires scenario validation |
| `control` | `diff_drive_controller` parameters | Configuration only; not the default simulation control path |
| `amr_interfaces` | Draft robot/module messages, mode service, attach service, and pick/place action | Builds, but contracts are not frozen |
| `dashboard_bridge` | `/odom` to `/robot_state` aggregation and `/set_mode` service | Working preliminary bridge |
| `arm_description` | Arm Xacro and RViz resources | Scaffold/integration work |
| `arm_control` | Controller configuration and launch structure | Scaffold; hardware behavior is not complete |
| `arm_moveit_config` | MoveIt configuration and launch structure | Scaffold requiring robot-specific validation |
| `module_manager` | Launchable node and configuration | Stub; attach/detach behavior is not implemented |
| `task_coordinator` | Launchable coordinator and example behavior-tree asset | Stub; mission execution is not implemented |

## Main source locations

```text
robotics/
├── robot_description/   # base URDF/Xacro, meshes, RViz
├── simulation/          # Gazebo worlds, models, bridge YAML
├── bringup/             # top-level launch and teleoperation
├── navigation/          # SLAM, AMCL, Nav2, maps
├── control/             # alternative ros2_control configuration
├── amr_interfaces/      # custom msg/srv/action definitions
├── dashboard_bridge/    # preliminary ROS-to-dashboard bridge
├── arm_description/     # arm model scaffold
├── arm_control/         # arm controller scaffold
├── arm_moveit_config/   # arm motion-planning scaffold
├── module_manager/      # module lifecycle stub
└── task_coordinator/    # mission coordinator stub
```

## Common commands

```bash
# Full digital twin
ros2 launch bringup simulation.launch.py

# Robot model in RViz without Gazebo
ros2 launch robot_description display.launch.py

# Keyboard teleoperation after simulation starts
ros2 run teleop_twist_keyboard teleop_twist_keyboard

# Gamepad teleoperation
ros2 launch bringup teleop_joy.launch.py
```

## Runtime inspection

```bash
ros2 pkg list | grep -E 'bringup|navigation|simulation|robot_description'
ros2 node list
ros2 topic list
ros2 topic hz /scan
ros2 topic echo /odom --once
ros2 run tf2_tools view_frames
```

Expected base topics include `/cmd_vel`, `/odom`, `/scan`, `/imu`,
`/joint_states`, `/tf`, `/tf_static`, and `/clock`.

## Rebuild after changes

```bash
cd /path/to/amr-x/robotics
source /opt/ros/jazzy/setup.bash
colcon build --symlink-install --packages-select \
  robot_description simulation bringup navigation
source install/setup.bash
```

Rebuild after editing installed launch files, Xacro, worlds, maps, or package
configuration. Python packages built with `--symlink-install` normally reflect
source edits directly, but their package metadata still requires a successful
build.

## Known boundaries

- Gazebo currently uses its DiffDrive system plugin for the default simulated
  base. The `control` package documents an alternative `ros2_control` path.
- There is no real-hardware `ros2_control` system interface in this repository.
- Custom interfaces remain draft and may change before physical integration.
- The module manager and mission coordinator start as nodes but contain no
  production task logic.
