# Current Project Baseline

This page summarizes the current, role-neutral project direction. Controlled
engineering values remain in `config/` and `data/`; this page intentionally
does not reproduce provisional dimensions, performance targets, prices, or
component selections.

## Current direction

AMR-X is a modular autonomous mobile robot platform for indoor logistics,
inspection, and service applications. The current engineering focus is a
coherent mobile-base architecture that can be modeled, simulated, navigated,
monitored, and extended through a common module interface.

The base platform is responsible for mobility, navigation, base-level power
and safety coordination, robot state, and support for interchangeable
functional modules. Module-specific mechanisms and task behavior remain
separate from the reusable base.

<figure class="technical-figure">
  <img src="/docs/assets/images/amr-x-base-cad.png" alt="Current AMR-X mobile base CAD concept" loading="lazy">
  <figcaption><strong>Current base CAD concept.</strong> Progress visualization only; controlled geometry and dimensions remain in project data and CAD sources.</figcaption>
</figure>

## Active scope

| Area | Current objective |
|---|---|
| Mobile base | Resolve chassis, mobility, packaging, service access, stability, and maintainability |
| Common module interface | Define mechanical, communication, identification, state, and safety boundaries |
| Electrical and embedded | Define power, control, sensing, actuation, diagnostics, and safety architecture |
| ROS 2 and digital twin | Maintain configurable robot descriptions, controllers, sensors, simulation, and launch integration |
| Navigation and perception | Validate mapping, localization, planning, obstacle handling, recovery, and operating constraints |
| Operator interfaces | Provide web and local interfaces over one shared backend and state model |
| Mission management | Define deterministic task validation, decomposition, execution, feedback, cancellation, and recovery |

## Deferred detail

Detailed manufacturing release, procurement, production exterior design,
complete autonomous docking, and production fleet orchestration remain beyond
the current architecture-definition scope unless promoted through a reviewed
project decision.

## Operating scenarios

The reusable platform is evaluated against representative indoor scenarios:

- Warehouse material movement and station-to-station delivery.
- Cargo and luggage handling in structured indoor facilities.
- Clinical, inspection, and service environments used for simulation and
  future validation.

These scenarios guide interface and validation requirements; they are not
separate robot implementations.

## Architecture principles

1. Centralize shared values in controlled JSON and CSV sources.
2. Keep base, module, operator-interface, mission, navigation, and hardware
   responsibilities explicit.
3. Make ROS 2 models and simulation configuration reusable rather than
   hard-coded for one scenario.
4. Require deterministic validation and safety authorization before motion or
   module actuation.
5. Record unresolved values as `TBD` instead of inferring them.
6. Review cross-team interface changes before dependent work is finalized.

## Review gate

Detailed implementation should proceed only when affected subsystem owners can
review the relevant geometry, loads, interfaces, power and safety boundaries,
sensor placement, ROS 2 frames and APIs, simulation behavior, navigation
constraints, and operator/mission state consistency.

See the [workstream overview](workstreams.md) for responsibilities and expected
outputs.
