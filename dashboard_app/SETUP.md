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

## A3. PostgreSQL

Install it:

``` bash
sudo apt update
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

Confirm it's running:

``` bash
pg_lsclusters
```

Status should say `online`.

Set a password for the `postgres` user (pick anything, just remember
it):

``` bash
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'YOUR_PASSWORD';"
```

Create the database:

``` bash
sudo -u postgres createdb amr
```

Confirm it exists:

``` bash
sudo -u postgres psql -c "\l" | grep amr
```

## A4. Backend `.env` file

Copy the provided template:

``` bash
cd ~/amr-x/dashboard_app/backend
cp .env.example .env
```

Edit `.env` and replace `YOUR_PASSWORD` with the PostgreSQL password you
set in A3:

``` bash
cat > .env << 'EOF'
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost/amr
DEBUG=True
EOF
```


## A5. Backend Python environment

``` bash
cd ~/amr-x/dashboard_app/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## A6. First server boot --- creates database tables automatically

``` bash
source venv/bin/activate
python3 -m uvicorn app.main:app --reload
```

This automatically creates all tables (`robots`, `missions`, `modules`,
`alerts`, `users`) on first run via `Base.metadata.create_all()`.

Confirm:

``` bash
sudo -u postgres psql -d amr -c "\dt"
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
sudo systemctl status postgresql
```

If needed:

``` bash
sudo systemctl start postgresql
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
cd ~/amr-x/dashboard_app/backend
source venv/bin/activate
python3 -m uvicorn app.main:app --reload
```

Look for:

``` text
[ros_bridge_client] Starting connection to rosbridge...
[ros_bridge_client] Connected to rosbridge.
```

## B6. (Optional) Teleop dashboard

Open `amr-x/robotics/dashboard_app/dashboard.html` in your browser.

## B7. Verify everything is connected

Drive the robot using the Teleop Dashboard or with publishing velocity directly to the topic:
``` bash
ros2 topic pub /cmd_vel geometry_msgs/msg/Twist "{linear: {x: 0.2}}"
```

Check that the Robot values changed:
``` bash
curl http://localhost:8000/api/robots/
```