# Engineering Workstream Overview

The workstreams below describe stable engineering responsibilities rather than
temporary assignments. Each workstream owns its internal design while sharing
controlled interfaces with the rest of the system.

| Workstream | Core responsibility | Details |
|---|---|---|
| Mechanical platform | Chassis, mobility, packaging, payload support, stability, and maintenance | [Mechanical platform](../workstreams/mechanical-platform.md) |
| Modules and common interface | Module compatibility, mounting, docking, identification, and shared boundaries | [Modules and common interface](../workstreams/modules-interface.md) |
| ROS 2 and digital twin | Robot model, controllers, sensors, simulation, launch, and integration structure | [ROS 2 and digital twin](../workstreams/ros2-digital-twin.md) |
| Navigation and perception | Mapping, localization, planning, costmaps, obstacle response, and validation | [Navigation and perception](../workstreams/navigation-perception.md) |
| Operator interfaces | Dashboard, local HMI, telemetry, commands, maps, and diagnostics | [Operator interfaces](../workstreams/operator-interfaces.md) |
| Embedded and electrical | Power, motors, drivers, sensors, firmware, safety circuits, and hardware communication | [Embedded and electrical](../workstreams/embedded-electrical.md) |
| Mission management | Task validation, mission steps, deterministic execution, feedback, recovery, and fleet-facing APIs | [Mission management](../mission-management/architecture.md) |

## Shared delivery rules

- Use controlled data sources for shared values and decisions.
- Define inputs, outputs, failure states, and ownership at every interface.
- Keep mock interfaces compatible with the planned ROS 2 contract.
- Report blockers and contradictory assumptions through the interface register.
- Validate changes in the relevant simulation or analysis environment.
- Do not create duplicate mission, state, or command models for different user
  interfaces.
