# AMR-X Dashboard Setup

This guide covers the current dashboard stack in this repository:

- PostgreSQL 16 in Docker
- FastAPI backend in the shared repository-root `.venv`
- React/Vite frontend
- Optional rosbridge_server if you want live robot telemetry from ROS 2

The supported dashboard commands are run from the repository root.

## First-Time Setup

1. Prepare the shared Python environment and frontend packages:

```bash
npm run setup:dashboard
```

This creates or reuses the root `.venv`, installs the backend dependencies into it, creates `.env` from `.env.example` when needed, and installs the frontend packages.

2. Start PostgreSQL and wait for it to become healthy:

```bash
npm run dashboard:db
npm run dashboard:db:status
```

3. Start the backend:

```bash
npm run dashboard:backend
```

Open <http://127.0.0.1:8000/docs> to verify the API.

4. Start the frontend:

```bash
npm run dashboard:frontend
```

Open <http://localhost:5173/>.

## Daily Startup

Start the services you need from the repository root:

```bash
npm run dashboard:db
npm run dashboard:backend
npm run dashboard:frontend
```

For ROS-connected testing, start rosbridge in a separate terminal after sourcing the ROS 2 workspace:

```bash
source /opt/ros/jazzy/setup.bash
ros2 launch rosbridge_server rosbridge_websocket_launch.xml
```

## Legacy Standalone Page

The old browser prototype is still available at [robotics/dashboard_app/dashboard.html](../robotics/dashboard_app/dashboard.html). It connects directly to rosbridge on `ws://localhost:9090` and is separate from the supported React/Vite dashboard.

## Useful Checks

```bash
npm run dashboard:db:status
npm run dashboard:db:logs
npm run dashboard:db:stop
npm run check:dashboard
```

If you need the full setup walkthrough, see the backend README at [backend/README.md](backend/README.md) and the frontend README at [frontend/README.md](frontend/README.md).
