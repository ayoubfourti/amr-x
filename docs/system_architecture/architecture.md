# AMR-X System Architecture v0.2

| Document control | Value |
|---|---|
| Owner | Technical Project Manager / System Architect |
| Status | Draft |
| Revision | `v0.2` |
| Controlled interface data | `data/system_architecture/interfaces.csv` |

!!! warning "Draft architecture"
    Proposed values and open conflicts are not approved requirements. Treat
    only entries explicitly marked **Confirmed** in the controlled interface
    data as confirmed decisions.

This document is the single reference for how the mechanical, electrical,
software, and module-interface decisions fit together. It should be updated
as teams confirm or change values. Detailed values live in
`data/system_architecture/interfaces.csv` — do not duplicate numbers here,
reference the table.

**Related implementation document:** `robotics/ARCHITECTURE.md`
covers the ROS 2 package-level implementation of the module software stack
in detail. This document stays at the system level and links out to it
rather than duplicating package contents — see Section 4.

## 1. Overview

AMR-X is a modular autonomous mobile robot. One base robot chassis accepts
interchangeable functional modules (inspection, secure cargo, handling,
robotic arm) through a shared docking interface. The base handles movement,
navigation, and power; the module handles the task-specific function. The
dual-arm module has been confirmed as the first module to be built (V1).

### Responsibility boundaries

| System element | Primary responsibility |
|---|---|
| Mobile base | Movement, navigation, base power, and module support |
| Functional module | Task-specific mechanical and software capability |
| Shared docking interface | Mechanical alignment and retention, power, data, and safety boundaries |
| Module manager | Module identification and software lifecycle coordination |

## 2. Mechanical Architecture

- Overall footprint: 800 mm x 600 mm x 420 mm (confirmed by Mechanical team)
- Drive: differential drive
- Wheels: 4 caster wheels (changed from 2 for stability and load
  distribution, relevant now that a heavier dual-arm module is planned)
- Module mounting zone: 500 mm x 400 mm, centered over the wheelbase
- A real CAD-exported URDF has been produced and integrated into
  simulation (see Section 4). Driving behavior and LiDAR output from the
  real model are still being validated.
- The dual-arm module is expected to require a center-of-gravity
  compensation of roughly 30-50 mm toward the rear (proposed, not yet
  validated in CAD)

Open item: internal component layout (battery, controller, wiring) is
still waiting on the Electrical team's final part list.

<div class="visual-grid">
  <figure>
    <img src="/docs/assets/images/amr-x-base-cad-side-view.png" alt="Current AMR-X mobile base CAD side-view capture" loading="lazy">
    <figcaption><strong>Current base CAD capture.</strong><span>Progress image only; controlled dimensions remain in project data.</span></figcaption>
  </figure>
  <figure>
    <img src="/docs/assets/images/reference-amr-base-hai-robotics.png" alt="Third-party AMR base used as a form-factor reference" loading="lazy">
    <figcaption><strong>Base form-factor reference.</strong><span>External reference placeholder, not AMR-X.</span></figcaption>
  </figure>
  <figure>
    <img src="/docs/assets/images/reference-conveyor-top-module-amr.png" alt="Third-party AMR with a conveyor top module" loading="lazy">
    <figcaption><strong>Top-module reference.</strong><span>External material-transfer example, not AMR-X.</span></figcaption>
  </figure>
</div>

## 3. Electronics Architecture

- Battery: TBD, active research in progress
- Main computer / controller: TBD
- Motor drivers: TBD

Open item: none of these are selected yet. This remains the biggest
blocker for Mechanical's internal layout.

## 4. Software Architecture

- ROS 2 stack locked: **Ubuntu 24.04 + ROS 2 Jazzy + Gazebo Harmonic** as
  the default, with **Ubuntu 22.04 + ROS 2 Humble + Gazebo Fortress** kept
  as a supported compatibility path
- Full simulation loop is working end-to-end: the robot drives in a
  warehouse world with working teleoperation and LiDAR/IMU/odometry
  publishing correctly
- The real CAD-exported URDF is integrated and spawns correctly in Gazebo,
  replacing the earlier placeholder model. Still to confirm: driving
  behavior and `/scan` output from the real sensor configuration
- **Module software scaffold merged into main (PR #8):** 7 ROS 2 packages
  — `amr_interfaces`, `arm_description`, `arm_control`, `arm_moveit_config`,
  `module_manager`, `task_coordinator`, `dashboard_bridge`. This is an
  empty-but-buildable skeleton with real logic left as TODOs per package
  owner. Full detail in `robotics/ARCHITECTURE.md`. **Merged on 8 Jul
  without the frame-naming conflict below being resolved first.**
- Arm control will use **MoveIt2**, not Nav2, since the dual-arm module's
  job is manipulation rather than mobile navigation
- Dashboard communicates with ROS 2 over `rosbridge_server` and
  `roslibjs` via WebSocket; confirmed working for `/cmd_vel`, with
  `/odom` and `/imu` subscriptions planned next

<div class="visual-grid visual-grid--two">
  <figure>
    <img src="/docs/assets/images/rviz-amr-x-base-model.png" alt="AMR-X base model and frames in RViz" loading="lazy">
    <figcaption><strong>AMR-X base in RViz.</strong><span>Robot-model integration capture.</span></figcaption>
  </figure>
  <figure>
    <img src="/docs/assets/images/rviz-arm-urdf-model.png" alt="Arm URDF and joint states in RViz" loading="lazy">
    <figcaption><strong>Arm URDF in RViz.</strong><span>Manipulation-model integration capture.</span></figcaption>
  </figure>
  <figure>
    <img src="/docs/assets/images/rviz-industrial-arm-model.png" alt="Alternative industrial arm model displayed in RViz" loading="lazy">
    <figcaption><strong>Alternative arm in RViz.</strong><span>Model visualization capture.</span></figcaption>
  </figure>
  <figure>
    <img src="/docs/assets/images/reference-industrial-robot-simulation.png" alt="Industrial robot simulation environment reference" loading="lazy">
    <figcaption><strong>Simulation presentation reference.</strong><span>External reference placeholder, not the AMR-X simulator.</span></figcaption>
  </figure>
</div>

## 5. Module Interface

- Connector: HARTING Han-Modular, carrying 24V power, CAN bus, and
  Ethernet
- Docking alignment: 12 mm diameter guide pins on a 450 x 350 mm pattern
- Docking locks: quarter-turn M8 locks, rated to 375 kg
- Docking detection: 2 inductive sensors, published to ROS topics
  `/module_docked` and `/module_id`
- Clearance zones defined so future modules cannot block the front LiDAR,
  emergency stop, or operator panel
- **Open conflict — module mount frame naming:** the mechanical/URDF side
  refers to the mount point as `module_interface_link`, while the new ROS
  package scaffold from PR #8 defines it as `module_mount_top`. These need
  to be reconciled to a single canonical name before more packages are
  built assuming either one. See Section 9.

## 6. Sensor Layout

- Proposed: dual LiDAR (front + rear) for 360-degree coverage and
  redundancy, proposed by Mechanical
- The currently integrated test URDF places a single LiDAR link at the
  front-top-centre position, matching CAD — this does not yet confirm
  whether the dual-LiDAR plan is still active or has been narrowed to one
- **Still not confirmed by Navigation/ROS team** — flagged as an open
  conflict, see Section 9

## 7. Navigation

- Nav2 configured, but currently using a placeholder footprint
- SLAM and AMCL localization tested successfully against the placeholder
  robot model; an EKF sensor-fusion config is currently being drafted
- Now that a real URDF is integrated, the footprint may be finalizable
  soon once the caster layout is locked

<div class="visual-grid">
  <figure>
    <img src="/docs/assets/images/reference-amr-fleet-warehouse.png" alt="Fleet of third-party AMRs operating in a warehouse" loading="lazy">
    <figcaption><strong>Fleet-operation reference.</strong><span>External multi-robot environment placeholder.</span></figcaption>
  </figure>
  <figure>
    <img src="/docs/assets/images/reference-warehouse-aisle.png" alt="Warehouse aisle used as an environment reference" loading="lazy">
    <figcaption><strong>Warehouse environment.</strong><span>Reference placeholder for navigation context.</span></figcaption>
  </figure>
  <figure>
    <img src="/docs/assets/images/reference-high-bay-warehouse-robot.png" alt="Third-party robot operating in a high-bay warehouse" loading="lazy">
    <figcaption><strong>High-bay operation reference.</strong><span>External storage use-case placeholder.</span></figcaption>
  </figure>
</div>

## 8. Power Distribution

TBD — depends entirely on Electrical team's battery and controller
selection, which is under active research. No layout can be finalized
until this is resolved.

## 9. Known Conflicts / Open Questions

!!! danger "Integration blockers"
    This section identifies unresolved decisions that can invalidate work in
    more than one subsystem. Keep it synchronized with the controlled
    interface data.

1. **[NEW, urgent — now live in main]** Module mount frame naming
   conflict: `module_interface_link` (mechanical/URDF) vs
   `module_mount_top` (merged via PR #8). This is no longer a
   before-it-happens risk — PR #8 was merged into `main` on 8 Jul without
   this being reconciled, so the mismatch is now sitting in the codebase.
   Needs an issue opened and a decision between the Module team and
   ROS/Sim team on which name is canonical, then a follow-up fix wherever
   the losing name was used.
2. Mechanical proposes 2 LiDARs; the currently integrated URDF only shows
   one LiDAR link. Needs explicit confirmation from Navigation/ROS on
   whether the dual-LiDAR plan is still active.
3. Navigation's footprint is still a placeholder; likely close to
   resolution now that the real URDF is integrated, pending final caster
   layout confirmation.
4. Electrical has not selected a battery or controller yet, which blocks
   Mechanical's internal layout.
5. **[NEW]** Two parallel architecture documents now exist — this
   document (system-level) and `robotics/ARCHITECTURE.md` (ROS
   package-level, from PR #8). Agreed approach: this document stays at
   the system/interface level and links to `ARCHITECTURE.md` for
   implementation detail, rather than the two documents duplicating each
   other. Confirm this approach across the affected workstreams.

## 10. Future Modules

**Confirmed V1 module: dual-arm robotic arm module.** Mechanical is
researching hardware options (GrabCAD models); software has scaffolded
the arm packages (`arm_description`, `arm_control`, `arm_moveit_config`).

Candidate module research (from the module research source, see
`Modules.pdf`):

- **Robotic arm:** Interbotix PincherX/WidowX (ROS-ready "arm + mobile
  base" kits, ~$2,000-6,500), Elephant Robotics myCobot 280/320
  (lightweight, ~$1,000-2,000, lower payload), uFactory xArm/Lite
  (higher payload up to 5kg, ~$3,300-10,000)
- **Shelf access:** Nord Modules Quick Mover/Pallet Lift (4-screw
  mounting, up to 1500kg), ROEQ Top Modules (MiR-compatible, built-in
  alignment/load sensors), Ocado Chuck (design reference only, not
  purchasable)
- **Inspection:** Clearpath Husky Observer (turnkey, ROS API, 10kg
  payload budget), or individually-assembled components (e-con Systems
  cameras, Orbbec depth sensors, thermal imaging modules) — likely the
  more realistic budget option

Not yet scoped: shelf-access and inspection modules remain future work
beyond the dual-arm V1.

!!! info "Concept imagery"
    The images below are communication placeholders, not approved production
    geometry. Third-party references do not represent AMR-X work and require
    provenance and licensing review before external use.

### Dual-arm and mobile-manipulation direction

<div class="visual-grid">
  <figure>
    <img src="/docs/assets/images/dual-arm-module-concept-render.png" alt="Dual-arm module concept placeholder" loading="lazy">
    <figcaption><strong>Dual-arm module direction.</strong><span>V1 concept placeholder.</span></figcaption>
  </figure>
  <figure>
    <img src="/docs/assets/images/reference-dual-arm-workcell.png" alt="Third-party dual-arm workcell reference" loading="lazy">
    <figcaption><strong>Dual-arm workcell reference.</strong><span>External workspace placeholder, not AMR-X.</span></figcaption>
  </figure>
  <figure>
    <img src="/docs/assets/images/reference-mobile-manipulator-render.png" alt="Third-party mobile manipulator render" loading="lazy">
    <figcaption><strong>Manipulator packaging reference.</strong><span>External reference placeholder, not AMR-X.</span></figcaption>
  </figure>
  <figure>
    <img src="/docs/assets/images/reference-mobile-manipulator-bin-picking.png" alt="Third-party mobile manipulator handling bins" loading="lazy">
    <figcaption><strong>Bin-handling reference.</strong><span>External use-case placeholder, not AMR-X.</span></figcaption>
  </figure>
  <figure>
    <img src="/docs/assets/images/reference-mobile-manipulator-warehouse.png" alt="Third-party mobile manipulator in a warehouse aisle" loading="lazy">
    <figcaption><strong>Aisle-manipulation reference.</strong><span>External use-case placeholder, not AMR-X.</span></figcaption>
  </figure>
</div>

### Secure-compartment direction

<div class="visual-grid visual-grid--two">
  <figure>
    <img src="/docs/assets/images/secure-compartment-module-cad.png" alt="Secure compartment module concept placeholder" loading="lazy">
    <figcaption><strong>Secure-compartment CAD.</strong><span>Future-module concept placeholder.</span></figcaption>
  </figure>
  <figure>
    <img src="/docs/assets/images/reference-secure-compartment-robot.png" alt="Third-party secure compartment robot reference" loading="lazy">
    <figcaption><strong>Compartment robot reference.</strong><span>External reference placeholder, not AMR-X.</span></figcaption>
  </figure>
</div>

### Shelf-access direction

<div class="visual-grid">
  <figure>
    <img src="/docs/assets/images/reference-shelf-climbing-robot-detail.png" alt="Detail of a third-party shelf-climbing robot" loading="lazy">
    <figcaption><strong>Rack-interface detail.</strong><span>External reference placeholder, not AMR-X.</span></figcaption>
  </figure>
  <figure>
    <img src="/docs/assets/images/reference-shelf-climbing-robot.png" alt="Third-party shelf-climbing warehouse robot" loading="lazy">
    <figcaption><strong>Vertical-access reference.</strong><span>External reference placeholder, not AMR-X.</span></figcaption>
  </figure>
  <figure>
    <img src="/docs/assets/images/reference-shelf-climbing-system.png" alt="Third-party shelf-climbing robots operating on racks" loading="lazy">
    <figcaption><strong>Rack-automation system.</strong><span>External reference placeholder, not AMR-X.</span></figcaption>
  </figure>
</div>

---
*Change log*
- v0.1 — initial draft
- v0.2 — added dual-arm module confirmation, real URDF integration status,
  locked ROS stack decision, PR #8 module scaffold cross-reference, module
  mount frame naming conflict, precise docking hardware specs from
  module research source, dashboard communication method
