# Navigation, Localization, and Perception

## Responsibility

This workstream turns validated robot state and sensor data into localization,
planning, obstacle response, and safe progress toward mission goals.

<figure class="technical-figure">
  <img src="/docs/assets/images/reference-warehouse-aisle.png" alt="Warehouse aisle used as a navigation environment reference" loading="lazy">
  <figcaption><strong>Representative navigation environment.</strong> External environment placeholder used to communicate structured indoor aisle constraints.</figcaption>
</figure>

## Functional areas

| Area | Scope |
|---|---|
| Mapping | Map creation, storage, versioning, and readiness state |
| Localization | Initial pose, odometry, sensor fusion, confidence, and loss handling |
| Planning | Global route, local trajectory, footprint, inflation, and constraints |
| Obstacle handling | Detection, costmap updates, stopping, replanning, and recovery |
| Goal execution | Pose goals, waypoint sequences, cancellation, feedback, and results |
| Validation | Repeatable scenarios, metrics, blocked paths, localization loss, and recovery |

## Mission boundary

Nav2 determines how the robot reaches an approved goal. The Mission Manager
decides why and when that navigation action is required, validates its
prerequisites, observes feedback, and handles the result. Navigation must not
silently invent missing station or docking coordinates.

## Expected outputs

- Controlled maps and navigation configuration.
- Sensor-fusion and localization configuration.
- Robot footprint and costmap assumptions synchronized with mechanical data.
- Navigation action contract and failure mapping.
- Scenario-based validation evidence for nominal and recovery behavior.

See the runnable [mapping, localization, and Nav2 guide](../robotics/navigation.md)
for the implementation currently present in the repository.
