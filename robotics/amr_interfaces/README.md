# amr_interfaces

Shared ROS 2 interfaces for AMR-X. This is the **contract** every subsystem
speaks — freeze it early, because changing a definition later forces rebuilds
everywhere. **Build this package first.**

## Ownership

Each file has an `# OWNER:` header. Summary:

| Interface | Type | Owner | Purpose |
|---|---|---|---|
| ModuleStatus | msg | **Zeyneb** | State of one attached module |
| RobotState | msg | **Zeyneb** | High-level robot state + mode |
| DockingStatus | msg | **Zeyneb** | Live docking state + sensors |
| SetRobotMode | srv | **Zeyneb** | Request a mode change |
| ConfirmModuleState | srv | **Zeyneb** | Verify a module's state |
| DockModule | action | **Zeyneb** | Dock a module (feedback + cancel) |
| UndockModule | action | **Zeyneb** | Undock a module |
| MissionStep | msg | Iyed | One step of a mission |
| MissionState | msg | Iyed | Overall mission progress |
| ValidateMission | srv | Iyed | Pre-flight mission check |
| ExecuteMission | action | Iyed | Run a full mission |
| SetSpeedLimit | srv | Navigation | Cap robot speed |
| ReturnHome | action | Navigation | Drive to home/charging |
| SafetyState | msg | Safety (unassigned) | May the robot move? |
| ResetFault | srv | Safety (unassigned) | Clear a fault |
| MotorStatus | msg | Embedded (unassigned) | Per-actuator health |
| FaultCode | msg | Safety/embedded (unassigned) | A single fault report |

## Reused from standard ROS 2 packages (do NOT redefine here)

- **NavigateToPose, NavigateThroughPoses, FollowWaypoints** -> already in `nav2_msgs`.
- **Battery** -> `sensor_msgs/BatteryState`.
- **Diagnostics** -> `diagnostic_msgs/DiagnosticArray`.
- **Pause / Resume** -> `std_srvs/Trigger` (no custom fields needed).

## Build

    colcon build --packages-select amr_interfaces
    source install/setup.bash
    ros2 interface list | grep amr_interfaces

## Note for the team

These field sets are a **v0.1 proposal** — refine with the owner before their
package depends on it. The goal is one agreed vocabulary so the dashboard, Local
HMI, mission manager, and robot all use the same actions/services/topics rather
than inventing parallel ones.
