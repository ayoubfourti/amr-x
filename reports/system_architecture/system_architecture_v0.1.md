# AMR-X System Architecture v0.1

Maintained by: Manar Afli (Technical Project Manager / System Architect)
Status: Draft — early internship stage, many values still TBD

This document is the single reference for how the mechanical, electrical,
software, and module-interface decisions fit together. It should be updated
as teams confirm or change values. Detailed values live in
`data/system_architecture/interfaces.csv` — do not duplicate numbers here,
reference the table.

## 1. Overview

AMR-X is a modular autonomous mobile robot. One base robot chassis accepts
interchangeable functional modules (inspection, secure cargo, handling,
future arm module) through a shared docking interface. The base handles
movement, navigation, and power; the module handles the task-specific
function.

## 2. Mechanical Architecture

- Overall footprint: 800 mm x 600 mm x 420 mm (confirmed by Mechanical team)
- Drive: differential drive
- Wheels: 4 caster wheels (changed from 2 for stability and load
  distribution, relevant for heavier future modules)
- Module mounting zone: 500 mm x 400 mm, centered over the wheelbase

Open item: internal component layout (battery, controller, wiring) is
waiting on the Electrical team's final part list.

## 3. Electronics Architecture

- Battery: TBD
- Main computer / controller: TBD
- Motor drivers: TBD

Open item: none of these are selected yet. This is currently the biggest
blocker for Mechanical's internal layout.

## 4. Software Architecture

- ROS 2 Jazzy workspace already created
- URDF: placeholder/base-only model, to be replaced once Mechanical CAD is
  finalized
- Simulation: basic warehouse environment built in Gazebo ahead of the real
  robot model, used to test navigation and localization logic early

## 5. Module Interface

- Connector: HARTING Han-Modular, carrying 24V power, CAN bus, and Ethernet
- Docking alignment: guide pins plus quarter-turn M8 locks
- Docking detection: 2 inductive sensors, published to ROS topics
  `/module_docked` and `/module_id`
- Clearance zones defined so future modules cannot block the front LiDAR,
  emergency stop, or operator panel
- URDF integration point: `module_interface_link`, referenced consistently
  across mechanical, simulation, and CAD

## 6. Sensor Layout

- Proposed: dual LiDAR (front + rear) for 360-degree coverage and
  redundancy, proposed by Mechanical
- **Not yet confirmed by Navigation/ROS team** — flagged as an open
  conflict, see Section 9

## 7. Navigation

- Nav2 configured, but currently using a placeholder footprint
- SLAM and AMCL localization tested successfully, but only against the
  placeholder robot model, not final dimensions

## 8. Power Distribution

TBD — depends entirely on Electrical team's battery and controller
selection. No layout can be finalized until this is resolved.

## 9. Known Conflicts / Open Questions

This is the most important section of this document, keep it updated.

1. Mechanical proposes 2 LiDARs; Navigation/ROS has not confirmed this
   matches their sensor fusion plan. Needs a decision.
2. Navigation's footprint is still a placeholder and cannot be finalized
   until Mechanical's final dimensions and caster configuration are locked.
3. Electrical has not selected a battery or controller yet, which blocks
   Mechanical's internal layout.

## 10. Future Modules

Not yet scoped in detail. To be filled in once base platform decisions
above are stable.

---
*Change log: add an entry here each time a section is updated, with date
and what changed, so the team can track how the architecture evolved.*
