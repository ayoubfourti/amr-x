# Mechanical Platform

## Responsibility

The mechanical platform workstream defines the reusable mobile base: chassis,
mobility, internal packaging, structural support, service access, and the
physical boundary presented to functional modules.

<figure class="technical-figure">
  <img src="/docs/assets/images/amr-x-base-cad.png" alt="AMR-X mobile base three-quarter CAD concept" loading="lazy">
  <figcaption><strong>Base-platform CAD concept.</strong> Use this image to communicate layout progress, not released manufacturing geometry.</figcaption>
</figure>

## Engineering activities

- Compare mobility and chassis concepts against controlled requirements.
- Maintain mass, payload, structural-load, stability, and center-of-gravity
  reasoning.
- Package the battery, compute, drivers, wiring, sensors, brakes, and service
  access without blocking safety devices or module clearance.
- Define mounting, alignment, retention, and docking geometry with the common
  interface workstream.
- Maintain CAD assemblies and approved exports with traceable revisions.

## Required interfaces

| Interface | Mechanical concern |
|---|---|
| Electrical and embedded | Component envelopes, cooling, wiring paths, connectors, access, and isolation |
| Navigation and perception | Sensor position, field of view, occlusion, footprint, and ground clearance |
| Modules | Mounting zone, loads, center of gravity, alignment, locking, and clearance |
| ROS 2 and simulation | Link geometry, joint definitions, frame locations, collision geometry, and inertial data |
| Safety | Emergency-stop access, braking provisions, guarding, maintenance, and safe handling |

## Expected outputs

- Selected base concept and conceptual CAD assembly.
- Mobility, load, stability, and packaging rationale.
- Internal layout and maintenance-access plan.
- Module-interface geometry and clearance definition.
- Simulation-ready geometry and verified frame reference points.
- Decision, risk, and validation records for unresolved mechanical choices.
