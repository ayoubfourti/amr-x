# dashboard_app

Legacy browser-based teleop and telemetry prototype for AMR-X. The supported
operator dashboard now lives under [dashboard_app/](../../dashboard_app/).

## Usage

This page talks directly to rosbridge on `ws://localhost:9090` and expects the
ROS topics and services used by the prototype to be available.

1. Start the simulation: `ros2 launch bringup simulation.launch.py`
2. Start rosbridge: `ros2 launch rosbridge_server rosbridge_websocket_launch.xml`
3. Open `dashboard.html` in a browser

## Features
- Joystick-style teleop controls, publishing to /cmd_vel
- Live telemetry (position, velocity, mode) via /robot_state
- Live IMU feedback via /imu
- Mode selector, calling the /set_mode service
