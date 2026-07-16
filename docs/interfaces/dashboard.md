# Web Dashboard and ROS Bridge

<figure class="amrx-doc-figure amrx-doc-figure--wide">
  <img src="/docs/assets/images/web-dashboard-concept.png" alt="AMR-X web dashboard concept with warehouse map, mission progress, telemetry, module state, and safety status" loading="lazy">
  <figcaption><strong>Web dashboard concept.</strong> A visual target for the future operator experience; the implemented preliminary browser page does not yet provide this complete interface.</figcaption>
</figure>

The repository contains two dashboard layers with different maturity:

1. `robotics/dashboard_app/dashboard.html` is a working preliminary browser
   teleoperation and telemetry page using roslibjs.
2. `dashboard_app/backend/` is a FastAPI/PostgreSQL backend with robot,
   mission, module, alert, and user endpoints. The planned full frontend in
   `dashboard_app/frontend/` has not been implemented.

## Data path

```text
Gazebo / Nav2
    │  /odom, /imu, /cmd_vel
    ▼
dashboard_bridge ROS node
    │  /robot_state, /set_mode
    ▼
rosbridge_server :9090
    ├── browser dashboard (roslibjs)
    └── FastAPI background client (roslibpy)
            ▼
        PostgreSQL
```

## What is implemented

| Component | Current behavior | Status |
|---|---|---|
| Browser dashboard | Publishes `/cmd_vel`, subscribes to `/robot_state` and `/imu`, calls `/set_mode` | Preliminary working page |
| `dashboard_bridge` | Converts `/odom` into `amr_interfaces/RobotState` at 10 Hz and serves mode changes | Implemented preliminary node |
| rosbridge | WebSocket transport on port `9090` | External ROS dependency |
| FastAPI backend | CRUD-style API for robots, missions, modules, alerts, and users | Implemented backend |
| ROS database updater | Subscribes to `/robot_state` and updates a pre-registered robot | Implemented, currently one hard-coded robot identity |
| PostgreSQL | Persistent backend database | Required external service |
| Full dashboard frontend | Application pages, maps, mission UI, authentication, production telemetry | Not implemented |

## Run the browser teleoperation path

Build and source the workspace first. Then use separate terminals:

```bash
# Terminal 1: simulation
cd /path/to/amr-x/robotics
source /opt/ros/jazzy/setup.bash
source install/setup.bash
ros2 launch bringup simulation.launch.py
```

```bash
# Terminal 2: aggregate robot state and expose mode service
cd /path/to/amr-x/robotics
source /opt/ros/jazzy/setup.bash
source install/setup.bash
ros2 launch dashboard_bridge dashboard_bridge.launch.py
```

```bash
# Terminal 3: WebSocket bridge
source /opt/ros/jazzy/setup.bash
ros2 launch rosbridge_server rosbridge_websocket_launch.xml
```

Serve the HTML instead of relying on browser-local file permissions:

```bash
cd /path/to/amr-x/robotics/dashboard_app
python3 -m http.server 8080
```

Open <http://localhost:8080/dashboard.html>. The current page connects to
`ws://localhost:9090` and loads roslibjs from a CDN, so that browser requires
network access unless the library is vendored locally.

## Verify the bridge

```bash
ros2 topic hz /robot_state
ros2 topic echo /robot_state --once
ros2 service call /set_mode amr_interfaces/srv/SetMode "{mode: navigation}"
ros2 topic echo /cmd_vel
```

## Run the FastAPI and database path

### One-time setup

Install and start PostgreSQL, create a database named `amr`, then configure the
backend:

```bash
cd /path/to/amr-x/dashboard_app/backend
cp .env.example .env
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Set the actual database password in `.env`:

```dotenv
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost/amr
DEBUG=True
```

Do not commit `.env`; it contains local credentials and is ignored by Git.

### Start the API

Start simulation, `dashboard_bridge`, and rosbridge as shown above, then:

```bash
cd /path/to/amr-x/dashboard_app/backend
source venv/bin/activate
python3 -m uvicorn app.main:app --reload
```

The API currently uses port `8000`. Its OpenAPI interface is available at
<http://localhost:8000/docs> when the backend is running.

Register the expected robot once:

```bash
curl -X POST http://localhost:8000/api/robots/ \
  -H 'Content-Type: application/json' \
  -d '{"name":"amr_x","ip_address":null}'
```

Then verify database-backed state:

```bash
curl http://localhost:8000/api/robots/
```

## API surface

| Resource | Current operations |
|---|---|
| `/api/robots/` | List, retrieve, create, and update status |
| `/api/missions/` | List, retrieve, create, and delete |
| `/api/modules/` | List and toggle active state |
| `/api/alerts/` | List and resolve |
| `/api/users/` | List and create |

## Important limitations

- The full web frontend is absent; the standalone HTML is a development tool.
- The FastAPI service assumes rosbridge at `localhost:9090` and robot name
  `amr_x`; both are hard-coded in the current client.
- Teleoperation is not authenticated, rate-limited, or protected by a complete
  command-authority and safety design.
- `/set_mode` currently accepts the requested string without implementing the
  planned safety-gated state machine.
- Mission API records are not connected to the mission coordinator or Nav2.
- The backend and MkDocs both default to port `8000`; do not run the standalone
  documentation server and FastAPI on that port simultaneously. The combined
  website/docs command uses port `8000` internally for MkDocs as well.
