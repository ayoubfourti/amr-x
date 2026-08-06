# ROS 2, Simulation, and Digital Twin

## Responsibility

This workstream maintains the reusable software representation of AMR-X,
including robot description, control, sensors, simulation environments, launch
integration, and interfaces consumed by navigation, modules, mission logic,
and operator tools.

<div class="visual-grid visual-grid--two">
  <figure><img src="/docs/assets/images/rviz-amr-x-base-model.png" alt="AMR-X base model and frames in RViz" loading="lazy"><figcaption><strong>Base model in RViz.</strong><span>Robot-description integration capture.</span></figcaption></figure>
  <figure><img src="/docs/assets/images/rviz-arm-urdf-model.png" alt="Arm model and joint states in RViz" loading="lazy"><figcaption><strong>Arm model in RViz.</strong><span>Module-description integration capture.</span></figcaption></figure>
</div>

## Design rules

- Keep robot dimensions, wheel positions, sensor poses, frame names, and limits
  in Xacro or configuration sources.
- Separate description, controllers, sensors, environments, navigation,
  hardware interfaces, mission APIs, and launch composition.
- Use consistent frame and topic contracts across simulation and hardware.
- Keep simulation-specific plugins out of hardware-independent logic.
- Provide launch paths that support focused subsystem tests and integrated
  demonstrations.

## Validation targets

- Differential-drive motion and teleoperation.
- LiDAR, IMU, encoder, odometry, and robot-state publication.
- RViz model and transform-tree verification.
- Representative indoor environments.
- Mapping, localization, waypoint navigation, replanning, and recovery.
- Mission and operator-interface integration using stable ROS 2 contracts.

## Implementation guides

- [ROS 2 workspace](../robotics/ros-workspace.md): packages, maturity, build,
  sourcing, common commands, and runtime inspection.
- [Digital twin and simulation](../robotics/simulation.md): launch composition,
  worlds, options, topics, verification, and limitations.
- [Dual-arm simulation](../robotics/dual-arm-simulation.md): module description,
  Gazebo controllers, synchronized trajectory validation, and MoveIt startup.
- [Mapping, localization, and Nav2](../robotics/navigation.md): SLAM, map
  saving, live-map navigation, AMCL, and troubleshooting.
