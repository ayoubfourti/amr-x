# Qt/QML Local HMI

<figure class="amrx-doc-figure amrx-doc-figure--wide">
  <img src="/docs/assets/images/qt-qml-hmi.webp" alt="AMR-X Qt/QML local HMI concept showing robot status and operator controls" loading="lazy">
  <figcaption><strong>Qt/QML HMI concept.</strong> Visual direction for the planned on-robot operator interface; it is not evidence of a committed application.</figcaption>
</figure>

## Current status

There is currently no Qt or QML application in this repository. No `.qml`
files, Qt project, PySide/PyQt dependency, C++ Qt target, or launch command is
present. The local HMI is therefore a planned client, not something that can be
run today.

This distinction matters: the preliminary browser dashboard must not be
presented as an implemented robot-mounted Qt display.

## Intended responsibility

The local HMI should provide an on-robot interface for status, mission control,
module state, diagnostics, and bounded operator commands. It should consume the
same backend and ROS contracts as the web dashboard rather than creating a
second mission engine.

| HMI responsibility | Authoritative provider |
|---|---|
| Robot pose and velocity | Localization/odometry through the shared state contract |
| Mission state and current step | Mission Manager |
| Navigation feedback | Nav2 and Mission Manager |
| Module identity and state | Module Manager |
| Energy, safety, and hardware faults | Embedded and safety layers |
| Mission commands | Shared mission API/action contract |
| Mode request | Safety-gated mode-management contract |

## Recommended integration boundary

```text
Qt/QML presentation
        │
        ▼
Qt application model / transport adapter
        │
        ├── shared backend API and event stream
        └── ROS 2 adapter where local ROS access is required
                ▼
Mission, robot, module, navigation, diagnostics, and safety contracts
```

The QML layer should render state and emit user intent. Transport, retries,
reconnection, type conversion, and command authorization belong in a separate
application layer.

## Minimum first implementation

1. Create a dedicated `hmi/` application with a reproducible dependency and
   build definition.
2. Implement connection state and a read-only robot status screen first.
3. Consume the same `RobotState`, mission lifecycle, module status, diagnostic,
   and fault definitions used by the web interface.
4. Add bounded commands only after command ownership and safety authorization
   are defined.
5. Add reconnect behavior, stale-data indicators, and an explicit offline
   state.
6. Provide a launch command and automated model/transport tests.

## Required screens

| Screen | Minimum information |
|---|---|
| Overview | Connection, robot mode, mission, energy, safety, module, and active faults |
| Mission | Queue, current step, progress, pause/cancel availability, and result |
| Navigation | Map, pose, path, goal, localization quality, and blocked state |
| Module | Identity, capability, attachment/lock state, operation, and faults |
| Diagnostics | Component health, timestamps, warnings, faults, and recovery guidance |
| Service mode | Restricted maintenance functions with explicit authorization |

## Contracts that are not ready yet

- `RobotState.msg` is preliminary and does not yet carry complete energy,
  safety, mission, fault, or timestamp data.
- Mission actions and lifecycle messages are not implemented in the current
  coordinator.
- The module manager is a stub, so attachment and capability state are not
  authoritative.
- Authentication, roles, command arbitration, and local-versus-remote command
  ownership are unresolved.

Until these contracts are reviewed, a Qt prototype should remain read-only or
use clearly labeled mock data. It must not bypass hardware interlocks or become
the source of safety-critical decisions.

## Run command

No valid Qt/QML run command exists yet. Add one to this page only when an
application target and its dependencies are committed and verified.
