# Mission Management Architecture

| Document status | Value |
|---|---|
| Maturity | Conceptual architecture |
| Primary objective | Deterministic, observable, cancellable, and safe mission execution |
| Execution model | Behavior tree coordinated through ROS 2 interfaces |
| Fleet relationship | Fleet-facing assignment boundary; fleet orchestration remains a separate layer |

## Purpose

The Mission Manager converts a validated high-level task into ordered,
observable robot operations. It connects operator interfaces, fleet-facing
assignment, navigation, docking, modules, hardware feedback, diagnostics, and
safety authorization without duplicating their internal responsibilities.

The same Mission Manager serves the web dashboard, local HMI, API, and future
fleet layer. User interfaces submit intent and display state; they do not
implement separate execution logic.

## Responsibility boundaries

| Component | Decision responsibility |
|---|---|
| Fleet layer | Select an eligible robot using availability, state, capability, location, health, energy, and priority |
| Mission Manager | Validate the task, resolve required data, create executable steps, track lifecycle, and report results |
| Behavior tree | Run conditions and actions, select recovery paths, apply bounded retries, and terminate safely |
| Nav2 | Plan and execute movement to approved poses or waypoint sequences while handling obstacles |
| Module and docking managers | Execute attachment, release, identification, and module-specific actions |
| Safety manager | Authorize or inhibit motion and actuation based on the current safety state |
| Embedded control | Execute bounded hardware commands and report sensors, locks, drives, brakes, and faults |
| Operator interfaces | Submit commands and display mission, robot, module, navigation, safety, and diagnostic state |

## ROS 2 communication model

| Primitive | Use | Examples |
|---|---|---|
| Topics | Continuous asynchronous state and telemetry | Mission state, current step, battery, localization, module state, safety, diagnostics, faults |
| Services | Short request/response operations | Validate mission, request mode change, reset an eligible fault, confirm state, set a bounded parameter |
| Actions | Long-running, feedback-producing, cancellable work | Execute mission, navigate, follow waypoints, dock, undock, return home, run module operation |

Actions are the default abstraction for work that must expose progress,
cancellation, and a final result. Services must not be used to hide long-running
work.

## Mission intake and validation

A task may originate from an operator interface, an API, or a fleet layer. The
Mission Manager must reject or hold incomplete work rather than guessing
missing values.

Required information can include:

- Mission template and task priority.
- Navigation and semantic maps.
- Station and docking-point records.
- Module identity, capabilities, expected location, and lock requirements.
- Current robot mode, localization, energy, health, and safety state.
- Live sensor and embedded feedback.

Representative validation failures include an unknown target, unavailable
module or docking point, missing map, invalid localization, insufficient
energy, incompatible capability, unsafe robot state, blocked assignment, or
incomplete task parameters.

## Mission and step lifecycle

Every mission and executable step should expose one of the shared states below:

| State | Meaning |
|---|---|
| `PENDING` | Accepted but not started |
| `RUNNING` | Actively executing |
| `WAITING` | Waiting for an expected external condition or resource |
| `BLOCKED` | Cannot progress until a reported prerequisite is resolved |
| `COMPLETED` | Finished successfully with a validated result |
| `FAILED` | Terminated because a defined operation or recovery failed |
| `CANCELLED` | Stopped through the cancellation contract |

## Reference execution flow

<figure class="mission-flow-figure">
  <img src="/docs/assets/images/mission-management-execution-flow.jpeg" alt="Conceptual mission execution flow showing battery validation, navigation, module locking, connection verification, recovery, and dashboard reporting" loading="lazy">
  <figcaption><strong>Conceptual behavior-tree flow.</strong> The diagram communicates sequencing and fallback intent; node names and ordering must be reconciled with the final ROS 2 contracts before implementation.</figcaption>
</figure>

A representative module-delivery mission is decomposed into deterministic
steps:

1. Validate task fields, robot readiness, localization, energy, and safety.
2. Confirm that the requested module and docking data are known.
3. Navigate to the approved pickup or docking pose.
4. Execute docking or locking through a cancellable operation.
5. Verify mechanical, electrical, identification, and connection feedback.
6. Navigate to the destination using Nav2 feedback and result handling.
7. Execute release or the requested module operation.
8. Verify completion and publish a structured result to all clients.

Each condition and action requires an explicit success result, failure mapping,
timeout policy, cancellation response, and safe fallback. Retries must be
bounded and observable.

## Behavior-tree structure

Behavior trees provide an explicit orchestration layer for:

- Preconditions before navigation or actuation.
- Sequences of cancellable ROS 2 actions.
- Recovery branches for localization, path, docking, and connection failures.
- Bounded retry and timeout decorators.
- Safe fallback actions such as stop, hold, retreat, or return home when
  authorized and feasible.
- Final result and diagnostic reporting.

The behavior tree coordinates components; it does not replace Nav2 planning,
embedded interlocks, or safety authorization.

## Mission data contract

Mission definitions should be transportable, versioned, validated against a
schema, and independent of one physical module. For example:

```json
{
  "schema_version": "1.0",
  "mission_id": "example-mission-001",
  "priority": "normal",
  "steps": [
    {
      "id": "navigate-pickup",
      "type": "navigate",
      "target": "pickup-station"
    },
    {
      "id": "attach-module",
      "type": "module_action",
      "command": "attach",
      "module_id": "requested-module"
    },
    {
      "id": "navigate-destination",
      "type": "navigate",
      "target": "destination-station"
    }
  ]
}
```

Identifiers in this example are illustrative. Valid station, module, map, and
capability records must come from controlled runtime data.

## Perception and AI boundary

Perception can be invoked on demand for precise station or docking alignment,
or run continuously within navigation for obstacle and costmap updates. The
Mission Manager consumes defined perception results and faults; it does not
embed opaque perception decisions in safety-critical control flow.

AI may assist task interpretation, optimization, or natural-language input,
but deterministic validation, behavior-tree execution, Nav2, safety logic, and
embedded interlocks remain authoritative for robot actions.

## Open design work

- Final action, service, topic, message, and fault definitions.
- Mission-schema versioning and validation mechanism.
- Station, docking-point, module, and capability registries.
- Behavior-tree node library, timeout policy, and recovery ownership.
- Persistence, restart, replay, and audit behavior.
- Fleet assignment API and multi-robot coordination boundary.
- Integration tests spanning dashboard, local HMI, Nav2, modules, embedded
  feedback, cancellation, and safety faults.
