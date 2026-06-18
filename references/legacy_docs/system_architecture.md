# System Architecture

## Purpose

Define the high-level system structure and how AMR-X components interact.

## System Overview

AMR-X is a distributed system with autonomous robot, remote dashboard, simulation environment, and central backend managing missions, telemetry, and user operations.

## Main Subsystems

- **Robot Platform** - Autonomous mobile base with sensors, compute, battery
- **Dashboard Frontend** - Web UI for monitoring and mission control
- **Dashboard Backend** - REST API and data management
- **Simulation** - Gazebo environment for algorithm development and testing
- **Mechanical Structure** - Chassis, modular interface, payload support
- **Electrical System** - Power distribution, battery, sensors, compute
- **Modular Add-ons** - Standardized interface for task-specific equipment

## Data Flow

- **Mission Command** - Dashboard → Backend → Robot via REST/WebSocket
- **Robot Status** - Robot → Backend → Dashboard (telemetry stream)
- **Alerts** - Robot or system → Backend → Dashboard (priority notifications)
- **Logs** - All subsystems → Backend (diagnostic records)
- **Module Status** - Module → Robot → Backend → Dashboard (add-on telemetry)

## Open Questions

- Exact telemetry bandwidth requirements
- Multi-robot coordination protocol
- Fleet-level mission optimization
- Advanced autonomy capabilities
