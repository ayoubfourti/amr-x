# AMR-X Dashboard Stack --- Setup & Startup Guide

Covers everything needed to run and test the full pipeline: **ROS2
simulation → dashboard_bridge → rosbridge → FastAPI backend →
PostgreSQL**, plus the browser-based teleop dashboard.

Two sections:

-   **Part A --- First-Time Setup** (do this once per machine)
-   **Part B --- Daily Startup** (do this every time you want to
    run/test)

------------------------------------------------------------------------

# Part A --- First-Time Setup

Skip any step you've already done. Everything here only needs to happen
once per machine.

## A1. ROS2 workspace

``` bash
cd ~/amr-x
git pull origin main   # or the branch you're testing
cd robotics
rosdep install --from-paths . --ignore-src -r -y
colcon build --symlink-install
source install/setup.bash
```

## A2. rosbridge_suite

``` bash
sudo apt install ros-jazzy-rosbridge-suite
```

## A3. Backend `.env` file

Prepare all dashboard dependencies from the repository root:

``` bash
cd ~/amr-x
npm run setup:dashboard
```

This creates `.env` from `.env.example` if needed, prepares the only Python
environment at `~/amr-x/.venv`, installs the backend requirements there, and
installs the React frontend packages. The template credentials are intended
only for local development, and `.env` is ignored by Git.

## A4. PostgreSQL in Docker

Start the database from the repository root:

``` bash
npm run dashboard:db
npm run dashboard:db:status
```

Wait until its status is `healthy`. PostgreSQL is exposed only on
`127.0.0.1:5432`, and its data persists in a Docker volume.

## A5. Backend Python environment

The setup command in A3 installs the backend into the shared repository-root
`.venv`. Do not create or activate another environment in `dashboard_app/`;
the run scripts invoke the root environment directly.

## A6. First server boot --- creates database tables automatically

``` bash
cd ~/amr-x
npm run dashboard:backend
```

This automatically creates all tables (`robots`, `missions`, `modules`,
`alerts`, `users`) on first run via `Base.metadata.create_all()`.

Confirm the database tables:

``` bash
cd ~/amr-x
docker compose -f dashboard_app/compose.yaml exec postgres psql -U amrx -d amr -c "\dt"
```

You should see all five tables.

## A7. Register the robot (one-time, unless the database is wiped)

The `roslibpy` background service only **updates** robots that already
exist---it does not create them.

Register `amr_x` once:

``` bash
curl -X POST http://localhost:8000/api/robots/ \
  -H "Content-Type: application/json" \
  -d '{"name":"amr_x","ip_address":null}'
```

Or use Swagger at `http://localhost:8000/docs`.

------------------------------------------------------------------------

# Part B --- Daily Startup

## B1. PostgreSQL

``` bash
cd ~/amr-x
npm run dashboard:db
```

## B2. Simulation

``` bash
cd ~/amr-x/robotics
source /opt/ros/jazzy/setup.bash
source install/setup.bash
killsim
ros2 launch bringup simulation.launch.py
```

## B3. dashboard_bridge

``` bash
cd ~/amr-x/robotics
source /opt/ros/jazzy/setup.bash
source install/setup.bash
ros2 launch dashboard_bridge dashboard_bridge.launch.py
```

## B4. rosbridge_server

``` bash
source /opt/ros/jazzy/setup.bash
ros2 launch rosbridge_server rosbridge_websocket_launch.xml
```

## B5. FastAPI backend

``` bash
cd ~/amr-x
npm run dashboard:backend
```

Look for:

``` text
[ros_bridge_client] Starting connection to rosbridge...
[ros_bridge_client] Connected to rosbridge.
```

## B6. React dashboard

In another terminal:

``` bash
cd ~/amr-x
npm run dashboard:frontend
```

Open <http://localhost:5173/>. The preliminary standalone ROS page at
`robotics/dashboard_app/dashboard.html` remains available for direct
roslibjs-based testing.

## B7. Verify everything is connected

Drive the robot using the Teleop Dashboard or with publishing velocity directly to the topic:
``` bash
ros2 topic pub /cmd_vel geometry_msgs/msg/Twist "{linear: {x: 0.2}}"
```

Check that the Robot values changed:
``` bash
curl http://localhost:8000/api/robots/
```
