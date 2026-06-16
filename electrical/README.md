# Electrical

Electrical systems, power distribution, sensors, compute, and bill of materials.

## Purpose

Design and document electrical architecture for autonomous mobile robot platform.

## Electrical CAD Tool

TBD - Tool selection pending.

## Current Status

No component selection finalized yet. Design phase only.

## Architecture Areas

- **Power Distribution** - Voltage regulation, protection, distribution
- **Battery System** - Energy storage and management
- **Sensors** - Power requirements and interfaces
- **Compute** - Processing platform and controllers
- **Wiring** - Harness design and connections
- **Safety Systems** - Emergency stop, protection, monitoring
- **BOM** - Component tracking and specifications

## Security and Safety Notes

- Emergency stop must be designed with safety-critical approach
- Power protection circuits required for component safety
- No remote control without authentication (enforced at software level)
- All operator actions logged for audit trail

## Subfolders

- `power_system/` - Power distribution design
- `battery/` - Battery system specifications
- `sensors/` - Sensor selection and power requirements
- `compute/` - Compute platform details
- `wiring/` - Harness and connection design
- `safety/` - Safety systems and interlocks
- `bom/` - Bill of materials
