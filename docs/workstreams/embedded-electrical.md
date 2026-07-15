# Embedded, Electrical, and Control Interface

## Responsibility

This workstream defines power delivery, motor and actuator control, sensing,
firmware, hardware protection, diagnostics, and the boundary between ROS 2 and
real-time hardware behavior.

## Functional boundaries

| Layer | Responsibility |
|---|---|
| Power system | Energy source, distribution, protection, isolation, monitoring, and charging |
| Motor and actuator control | Drivers, feedback, braking, limits, and low-level command execution |
| Embedded sensing | Encoders, voltage, current, temperature, presence, locks, and safety inputs |
| Firmware | Deterministic device control, state reporting, diagnostics, and fault handling |
| ROS 2 hardware interface | Convert defined commands and states without duplicating low-level safety logic |

## Safety rules

- Emergency-stop and critical interlocks must not depend on a web interface,
  mission behavior tree, or AI service.
- Hardware faults require explicit state reporting and defined recovery rules.
- Motion and module actuation require valid operating mode, safety state, and
  command bounds.
- Loss of communication must lead to a documented safe behavior.
- Electrical and connector decisions must remain synchronized with mechanical
  packaging and the module interface.

## Expected outputs

- Electrical and power architecture.
- Wiring, connector, protection, and safety definitions.
- Motor, driver, sensor, compute, and battery decision records.
- Firmware state and fault model.
- ROS 2 hardware-interface contract and simulation substitute.
- Bench and integration validation criteria.

See [embedded and electrical implementation status](../embedded/implementation.md)
for the exact repository state, simulation-versus-hardware boundary, missing
deliverables, and proposed physical bring-up order.
