# Web Dashboard and ROS Bridge

<figure class="amrx-doc-figure amrx-doc-figure--wide">
  <img src="/docs/assets/images/web-dashboard-concept.png" alt="AMR-X web dashboard concept with warehouse map, mission progress, telemetry, module state, and safety status" loading="lazy">
  <figcaption><strong>Web dashboard concept.</strong> The React operator application now implements this mission-first direction with live fleet data, mission control, teleoperation, and synchronized digital-twin views.</figcaption>
</figure>

The repository contains three dashboard components with different roles:

1. `robotics/dashboard_app/dashboard.html` is a working preliminary browser
   teleoperation and telemetry page using roslibjs.
2. `dashboard_app/backend/` is a FastAPI/PostgreSQL backend with robot,
   mission, module, alert, and user endpoints.
3. `dashboard_app/frontend/` is an implemented React/Vite operator application
   with authentication, dashboard, robot, mission, alert, module,
   teleoperation, digital-twin map, settings, and user-management pages.

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

React/Vite frontend :5173
    │  HTTP /api
    ▼
FastAPI backend :8000
```

## What is implemented

| Component | Current behavior | Status |
|---|---|---|
| Browser dashboard | Publishes `/cmd_vel`, subscribes to `/robot_state` and `/imu`, calls `/set_mode` | Preliminary working page |
| `dashboard_bridge` | Converts `/odom` into `amr_interfaces/RobotState` at 10 Hz and serves mode changes | Implemented preliminary node |
| rosbridge | WebSocket transport on port `9090` | External ROS dependency |
| FastAPI backend | CRUD-style API for robots, missions, modules, alerts, and users | Implemented backend |
| ROS database updater | Optionally subscribes to `/robot_state` and updates a pre-registered robot | Implemented as an opt-in FastAPI lifespan service |
| PostgreSQL | Persistent backend database in Docker | Implemented local service |
| React/Vite frontend | Authentication plus dashboard, robot, mission, alert, module, teleoperation, digital-twin map, settings, and user pages | Implemented operator application |

## Current operator experience

The public login route uses the same blue-black, cyan, and teal command-center
language as the authenticated application. Its desktop fleet illustration is
decorative—not live telemetry—and collapses to a focused single-column access
form on smaller screens. Login keeps the existing API/session behavior while
providing labeled fields, autocomplete metadata, keyboard-visible focus,
announced errors, and an accessible password-visibility control.

The Overview provides fleet and mission KPIs, a synchronized 2D/3D SDF world
panel, selected-robot health, live camera context, recent activity, and a latest
notifications menu. Selecting a notification opens an in-application detail
dialog with severity, time, robot/event identifiers, and a recommended action.

Selecting the Overview camera opens teleoperation as a full-screen
in-application control overlay for the selected robot. Closing the overlay
unmounts teleoperation and publishes the existing zero-velocity cleanup command.
Front, rear, and deck camera channels use compressed ROS images when available
and clearly marked optimized reference previews otherwise.

Mission Control provides status tabs, full-text search, priority/workflow/unit
filters, sorting, mission details, and lifecycle actions. All selection controls
use the shared accessible dropdown with keyboard navigation, selected-state
feedback, and viewport-aware portal positioning.

The dedicated Live Map page exposes every generated SDF world, synchronized 2D
and 3D views, fleet focus controls, and locally persistent metric-coordinate
labels. Labels also appear in the Overview digital twin for the selected world
and can be reset independently per world.
See [Digital Twin Maps](digital-twin-maps.md) for the generator, schema,
renderers, and label-editing workflow.

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

From the repository root, prepare all dashboard dependencies:

```bash
cd /path/to/amr-x
npm run setup:dashboard
```

The command creates `.env` from `.env.example` if it is missing, prepares the
single root `.venv`, installs the backend requirements there, and installs the
frontend packages. Start PostgreSQL with `npm run dashboard:db`.

The template already contains working local credentials:

```dotenv
POSTGRES_DB=amr
POSTGRES_USER=amrx
POSTGRES_PASSWORD=amrx_local_dev_7f3c9b2e
DATABASE_URL=postgresql+psycopg2://amrx:amrx_local_dev_7f3c9b2e@localhost:5432/amr
DEBUG=True
CORS_ORIGINS=http://localhost:5173
ROSBRIDGE_HOST=localhost
ROSBRIDGE_PORT=9090
ROSBRIDGE_ROBOT_NAME=amr_x
ROSBRIDGE_SYNC_ENABLED=false
```

Do not commit `.env`; it is ignored by Git. These credentials are for local
development only.

The dashboard and MkDocs share the repository-root `.venv`. Do not create
another environment inside `dashboard_app/`. The supported scripts call the
root environment directly, so manual activation is unnecessary.

### Start the API

Start simulation, `dashboard_bridge`, and rosbridge as shown above, then:

```bash
cd /path/to/amr-x
npm run dashboard:backend
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

### Start the React frontend

In another terminal, from the repository root:

```bash
npm run dashboard:frontend
```

Open <http://localhost:5173/>. The Vite development server proxies `/api`
requests to FastAPI at `http://localhost:8000`.

For dashboard-only work, `npm run dashboard` starts PostgreSQL, FastAPI, and
Vite together. Press `Ctrl+C` to stop the two development servers, then use
`npm run dashboard:db:stop` when PostgreSQL is no longer needed.

## API surface

| Resource | Current operations |
|---|---|
| `/api/auth/` | Register and log in |
| `/api/robots/` | List, retrieve, create, update validated status fields, submit telemetry, and read telemetry history |
| `/api/missions/` | List, retrieve, create, delete, start, pause, resume, stop, and update progress |
| `/api/modules/` | List, create, and toggle active state |
| `/api/alerts/` | List and resolve through `PUT` or `PATCH` |
| `/api/users/` | List, create, update, patch, delete, and update the current profile name |

## Runtime configuration

The root `.env` controls backend and rosbridge integration:

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | none | Required SQLAlchemy/PostgreSQL connection |
| `CORS_ORIGINS` | `http://localhost:5173` | Comma-separated browser origins allowed to call the API |
| `ROSBRIDGE_HOST` | `localhost` | rosbridge host used by the database synchronization client |
| `ROSBRIDGE_PORT` | `9090` | rosbridge port |
| `ROSBRIDGE_ROBOT_NAME` | `amr_x` | Registered robot identity updated from `/robot_state` |
| `ROSBRIDGE_SYNC_ENABLED` | `false` | Start the FastAPI lifespan synchronizer that copies `/robot_state` into PostgreSQL |

The frontend WebSocket endpoint is configurable from **Settings → Robot
connection** and is stored in the current browser profile.

Set `ROSBRIDGE_SYNC_ENABLED=true` only when rosbridge is running and the named
robot has already been registered through `/api/robots/`. API-only installations
can leave it disabled.

## Important limitations

- The React frontend is under active development, and the standalone ROS HTML
  page remains a development tool.
- Live Map labels are stored in the current browser profile and are not yet
  synchronized through the backend or written into SDF.
- rosbridge and robot identity default to `localhost:9090` and `amr_x`; set the
  environment variables above for another deployment.
- Teleoperation is not authenticated, rate-limited, or protected by a complete
  command-authority and safety design.
- `/set_mode` currently accepts the requested string without implementing the
  planned safety-gated state machine.
- Mission API records are not connected to the mission coordinator or Nav2.
- The backend and MkDocs both default to port `8000`; do not run the standalone
  documentation server and FastAPI on that port simultaneously. The combined
  website/docs command uses port `8000` internally for MkDocs as well.
