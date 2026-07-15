# Operator Interfaces

## Responsibility

The web dashboard and local HMI present robot state and accept operator intent.
They are separate clients of one shared backend; neither interface owns an
independent mission engine.

## Shared interface model

| Information from robot | Commands from operator |
|---|---|
| Robot mode and availability | Select and start a mission |
| Mission and current-step state | Pause, resume, cancel, or abort |
| Pose, path, map, and navigation status | Send an approved manual-control command |
| Battery, module, docking, and safety state | Return home or change operating mode |
| Diagnostics, warnings, and faults | Acknowledge or request a defined fault reset |

## Architecture rules

- Use the same mission states, command definitions, fault model, topics,
  services, and actions from every interface.
- Keep UI presentation separate from ROS 2 transport and backend logic.
- Make mock data conform to the planned production message structure.
- Expose progress, cancellation, waiting, blocked, and failure states clearly.
- Never move safety-critical or real-time hardware decisions into the UI.
- Keep a robot-mounted display optional and compatible with sensor, module,
  maintenance, emergency-stop, cable, and stability constraints.

## Expected outputs

- Shared data and command contract.
- Responsive dashboard and preliminary local-HMI structure.
- Telemetry, map, mission, module, safety, and diagnostic views.
- Backend separation and ROS 2 bridge plan.
- Operator workflows for nominal operation and fault recovery.

## Implementation guides

- [Web dashboard and ROS bridge](../interfaces/dashboard.md) documents the
  preliminary browser client, ROS bridge node, FastAPI backend, PostgreSQL
  pipeline, run commands, and limitations.
- [Qt/QML local HMI](../interfaces/qt-hmi.md) records its current unimplemented
  status and the contracts required before a runnable client exists.
