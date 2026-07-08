# AMR-X Modular Architecture

Scaffold for expanding AMR-X from a mobile base into a modular mobile
manipulator. First module is a dual arm; the framework is general.

Status: skeleton that builds. Robot logic is TODO(team) stubs.

## Documentation map
- README.md       - base robot workspace (build/run the base)
- LAUNCHING.md    - run commands (sim, teleop, SLAM, Nav2)
- ARCHITECTURE.md - this file: the modular expansion (arm + modules)

## Packages

| Package | Build type | Role |
|---|---|---|
| amr_interfaces | ament_cmake | Shared msg/srv/action. BUILD FIRST. |
| arm_description | ament_cmake | Dual-arm module URDF/Xacro. |
| arm_control | ament_cmake | ros2_control controllers for arm joints. |
| arm_moveit_config | ament_cmake | MoveIt 2 planning (Setup Assistant output). |
| module_manager | ament_python | Runtime attach/detach + mode transitions. |
| task_coordinator | ament_python | Mission orchestration (mobile manipulation). |
| dashboard_bridge | ament_python | ROS 2 <-> dashboard telemetry/commands. |

Alongside existing base packages: robot_description, simulation, control,
navigation, bringup.

## Build

    cd ~/amr-x/robotics
    rosdep install --from-paths . --ignore-src -r -y
    colcon build --packages-select amr_interfaces
    source install/setup.bash
    colcon build
    source install/setup.bash

Human build order: amr_interfaces -> arm_description -> arm_control ->
arm_moveit_config -> module_manager / task_coordinator -> dashboard_bridge.

## Where to start (per package)

- amr_interfaces: refine and FREEZE the msg/srv/action definitions early.
- arm_description: fill config/arm_params.yaml, then single_arm.xacro (L+R),
  gripper.xacro, arm_gazebo.xacro. Goal: view the arm in RViz.
- arm_control: joint_trajectory_controller per arm + joint_state_broadcaster.
- arm_moveit_config: run MoveIt Setup Assistant on the arm URDF; commit output.
- module_manager: attach/detach (spawn controllers) + mode state machine.
- task_coordinator: pick-and-place behavior tree (navigate->grasp->place).
- dashboard_bridge: telemetry out / commands in, typed via amr_interfaces.

## Suggested ownership

- Interfaces + architecture: amr_interfaces, mount-frame convention.
- Description/sim: arm_description, simulation extensions.
- Control/motion: arm_control, arm_moveit_config.
- Coordination: module_manager, task_coordinator.
- Dashboard: dashboard_bridge, dashboard_app.

## Module mount interface (pending mechanical)

Guided by modules/common_interface/ (connector selection guides, not final spec).
- Base exposes one frame: module_mount_top; modules attach there.
- Per-module details in module_manager/config/modules.yaml.
- DUAL ARM: bolted-flange / kinematic mount (heavy, calibration-sensitive) ->
  NOT runtime hot-swappable; present at launch. Electrical: CAN + M8/M12.
- TODO(mechanical): confirm connector + which modules are hot-swappable.

## Simulator stack - MIXED (Fortress + Harmonic coexist)

Some members: ROS 2 Humble + Gazebo Fortress. Others: Jazzy + Harmonic. To cope:

| Thing | FORTRESS | Harmonic |
|---|---|---|
| DiffDrive plugin file | libignition-gazebo-diff-drive-system.so | gz-sim-diff-drive-system |
| Plugin namespace | ignition::gazebo::systems:: | gz::sim::systems:: |
| Sensor frame tag | <ignition_frame_id> | <gz_frame_id> |
| Bridge msg prefix | ignition.msgs.X | gz.msgs.X |
| Resource env var | IGN_GAZEBO_RESOURCE_PATH | GZ_SIM_RESOURCE_PATH |
| apt packages | ros-humble-* | ros-jazzy-* |

- Keep ALL simulator-specific strings in ONE file per package (*_gazebo.xacro,
  bridge YAML). State the target stack in each world/launch header.
- Prefer parameterizing plugin names via a xacro arg so one file targets either.
- Check a machine: echo $ROS_DISTRO (humble=Fortress, jazzy=Harmonic).

## Conventions

- Each package's params in a single config/*.yaml.
- Isolate simulator-specific tags in one xacro per package.
- build/ install/ log/ are git-ignored; never commit them.
