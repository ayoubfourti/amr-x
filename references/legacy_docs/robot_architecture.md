# Robot Architecture

## Purpose

Define the robot platform hardware and software structure.

## Robot Base

- Autonomous mobile platform suitable for indoor environments
- Modular design with standardized mounting interface
- Support for varied terrain and obstacle types

## Mobility

- Differential or holonomic motion (TBD)
- Adequate traction for target sectors

## Sensors

- LiDAR for navigation and obstacle detection
- IMU for localization
- Odometry from drive encoders
- Safety bumpers or proximity sensors (TBD)

## Compute

- Onboard computing for autonomous operation
- ROS 2 runtime environment
- Resource constraints (CPU, memory, power) TBD

## Control

- Motor controllers for drive actuation
- Real-time control loop (TBD frequency)
- Emergency stop circuit integration

## Battery

- Sufficient capacity for mission duration
- Safe discharge profile
- Charging interface (TBD)

## Safety

- Emergency stop button
- Geofencing capability
- Obstacle avoidance behavior
- Low battery shutdown
- Manual override capability

## Modular Add-ons

- Standardized mechanical mounting
- Electrical power interface
- Communication protocol (TBD)
- Examples: manipulation arm, sensor package, payload carrier

## Selected Robotics Stack

- Ubuntu 24.04
- ROS 2 Jazzy
- Nav2 for autonomous navigation
- Gazebo Harmonic for simulation
- SLAM Toolbox for mapping
- URDF / SDF for robot description
