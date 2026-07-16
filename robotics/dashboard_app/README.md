# dashboard_app

Browser-based teleop and telemetry dashboard for AMR-X.

## Usage
1. Start the simulation: `ros2 launch bringup simulation.launch.py`
2. Start the dashboard bridge: `ros2 launch dashboard_bridge dashboard_bridge.launch.py`
3. Start rosbridge: `ros2 launch rosbridge_server rosbridge_websocket_launch.xml`
4. Open `dashboard.html` in a browser

## Features
- Joystick-style teleop controls, publishing to /cmd_vel
- Live telemetry (position, velocity, mode) via /robot_state
- Live IMU feedback via /imu
- Mode selector, calling the /set_mode service
