# Safety Requirements

## Purpose

Define safety mechanisms and behaviors for AMR-X operation.

## Emergency Stop

- Physical emergency stop button on robot
- E-stop accessible from dashboard (immediate motor cutoff)
- E-stop disables all motion immediately
- Automatic e-stop on critical sensor failure

## Obstacle Avoidance

- LiDAR-based dynamic obstacle detection
- Autonomous collision avoidance behavior
- Reduced speed in congested areas
- Stop if unrecoverable collision risk detected

## Manual Override

- Operator can pause autonomous motion
- Operator can resume or cancel mission
- Manual control mode (TBD - joystick/keyboard)
- Override logs recorded for audit trail

## Speed Limits

- Maximum speed configurable per sector
- Reduced speed near humans or obstacles
- Speed profile based on environment mapping
- TBD specific speed values by sector

## Low Battery Behavior

- Battery monitoring continuous
- Warning at 20% charge
- Autonomous return-to-dock at 10% charge
- Mission pause if low battery during execution

## Mission Failure Behavior

- On navigation failure, robot stops and alerts
- On communication loss, autonomous return-to-dock
- On sensor failure, graceful degradation or stop
- Operator notified with reason code

## Restricted Zones

- Geofencing capability
- Mission rejects paths through restricted areas
- Manual override possible but logged
- Boundary enforcement via Nav2 costmap

## Human Safety

- Collision detection and response
- Reduced speed in mixed human-robot environments
- Visual indicators for robot state
- Audio warnings for autonomous operation

## Security Requirements

- **Authentication** - All dashboard access requires login
- **Authorization** - Role-based permissions (TBD roles)
- **No Public Endpoints** - No unauthenticated robot control
- **Audit Logging** - All operator actions logged with timestamp and user
- **Encryption** - Communication over HTTPS (TBD deployment)

## Open Questions

- Specific speed limits per sector
- Manual control interface design
- Geofencing precision requirements
- Multi-operator conflict resolution
- Certified safety standards (if required)
