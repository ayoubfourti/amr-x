# AMR-X Technical Documentation

<div class="docs-intro-layout">
  <div class="docs-intro-copy">
    <span class="docs-intro-status">Engineering-stage platform</span>
    <p>AMR-X is an autonomous modular robot platform in which a reusable indoor mobile base accepts interchangeable functional modules through a shared docking interface. This documentation connects the system architecture, implementation workstreams, interfaces, and validation evidence.</p>
    <strong class="docs-intro-summary-title">One platform, coordinated across disciplines</strong>
    <ul class="docs-intro-points">
      <li><strong>Mobile foundation</strong><span>Mobility, sensing, compute, base power, and safety coordination.</span></li>
      <li><strong>Common module boundary</strong><span>Defined mechanical, electrical, data, identification, and state interfaces.</span></li>
      <li><strong>ROS 2 and digital twin</strong><span>Descriptions, simulation, mapping, localization, Nav2, and repeatable tests.</span></li>
      <li><strong>Mission and operator tools</strong><span>Shared mission state across remote supervision and the local HMI.</span></li>
    </ul>
  </div>

<figure class="docs-intro-visual">
  <img src="/docs/assets/images/reference-amr-x-concept-illustration.png" alt="AMR-X platform concept illustration used to introduce the modular robot direction">
  <figcaption>
    <span class="docs-intro-visual__label">Concept introduction</span>
    <strong>Modular mobile platform direction</strong>
    <span>Visual placeholder for communicating the AMR-X concept; not finalized production geometry.</span>
  </figcaption>
</figure>
</div>

!!! note "Controlled engineering data"
    Numeric specifications, requirements, BOM entries, and module decisions
    remain in the repository's controlled JSON and CSV files. Documentation
    explains the system and links to those sources; it is not a second source
    of truth.

## Technical reference map

| Area | Purpose | Documentation |
|---|---|---|
| Current baseline | Consolidated scope, active objectives, and architecture principles | [Project baseline](project/baseline.md) |
| Engineering workstreams | Stable responsibility boundaries and expected outputs | [Workstream overview](project/workstreams.md) |
| ROS 2 workspace | Packages, maturity, build process, runtime commands, and inspection | [ROS 2 workspace guide](robotics/ros-workspace.md) |
| Digital twin | Gazebo launch composition, worlds, bridge topics, and verification | [Simulation guide](robotics/simulation.md) |
| Navigation | SLAM, map saving, live-map Nav2, saved-map AMCL, and troubleshooting | [Mapping and Nav2 guide](robotics/navigation.md) |
| Operator software | Browser teleoperation, ROS bridge, API/database pipeline, and Qt status | [Web dashboard](interfaces/dashboard.md) · [Qt/QML HMI](interfaces/qt-hmi.md) |
| Embedded implementation | Current hardware boundary, missing firmware, and bring-up requirements | [Embedded implementation status](embedded/implementation.md) |
| Mission management | Task validation, deterministic execution, feedback, cancellation, and recovery | [Mission architecture](mission-management/architecture.md) |
| System architecture | Mechanical, electrical, software, navigation, and module boundaries | [Architecture overview](system_architecture/architecture.md) |
| Cross-team interfaces | Confirmed, proposed, blocked, and conflicting interface decisions | [System interface table](system_architecture/interfaces.md) |
| Repository structure | Authoritative inputs, implementation areas, and generated outputs | [Technical repository map](reference/repository-map.md) |
| Documentation process | Local preview, navigation, formatting, and validation rules | [Contributor guide](contributing.md) |

## System model

<div class="system-flow" role="img" aria-label="Functional module connected through a shared interface to the AMR-X mobile base">
  <div class="system-flow__node">
    <strong>Functional module</strong>
    <span>Task-specific mechanics, sensing, and control</span>
  </div>
  <div class="system-flow__connector">
    <span>Shared mechanical · power · data · safety interface</span>
  </div>
  <div class="system-flow__node system-flow__node--base">
    <strong>AMR-X mobile base</strong>
    <span>Mobility, navigation, base power, and module management</span>
  </div>
</div>

The architecture documentation records the current integration state and open
cross-team conflicts. Undecided engineering values are explicitly marked
`TBD`; they must not be inferred from prose.

## Local preview

=== "Documentation only"

    ```bash
    npm run setup:docs
    npm run docs
    ```

    Open <http://127.0.0.1:8001/>.

=== "Website and documentation"

    ```bash
    npm run setup
    npm run dev
    ```

    Open <http://localhost:3000/docs/>.

Both modes retain MkDocs live reload while Markdown files are edited.
