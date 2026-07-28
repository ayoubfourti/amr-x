# Dashboard

Remote monitoring and mission control system for AMR-X.

## Purpose

Web-based dashboard for operators to monitor robots, create missions, and manage operations.

## Selected Stack

- **Frontend** - React and Vite
- **Backend** - FastAPI
- **Database** - PostgreSQL 16 in Docker

## Quick start

Docker, Docker Compose, Python 3.10+, Node.js 20.9+, and npm 10+ are
required. Run all supported commands from the repository root.

Install the backend and frontend dependencies:

```bash
npm run setup:dashboard
```

The setup command creates `.env` from `.env.example` when needed, prepares the
single repository-root `.venv`, installs the FastAPI dependencies into that
environment, and installs the frontend packages.

```bash
npm run dashboard
```

This starts PostgreSQL, FastAPI, and Vite. Open:

- Dashboard: <http://localhost:5173/>
- API documentation: <http://localhost:8000/docs>

Press `Ctrl+C` to stop FastAPI and Vite. PostgreSQL remains running and keeps
its data; stop it with `npm run dashboard:db:stop`.

## Run services separately

Use separate terminals when you want to control each service:

```bash
npm run dashboard:db
npm run dashboard:backend
npm run dashboard:frontend
```

The frontend proxies `/api` to the backend at <http://localhost:8000>.

Other useful root commands:

```bash
npm run dashboard:db:status
npm run dashboard:db:logs
npm run dashboard:db:stop
npm run build:dashboard
npm run check:dashboard
```

There must only be one Python environment: `.venv` in the repository root.
The scripts invoke `.venv/bin/python` directly, so manual activation is not
needed. Do not create `.venv` or `venv` inside `dashboard_app/`.

See the [backend README](backend/README.md) for database and API details, the
[frontend README](frontend/README.md) for frontend commands, and
[SETUP.md](SETUP.md) for the complete ROS 2-to-dashboard pipeline.

## Expected Features

- Live robot status and telemetry
- Map view with robot location
- Mission creation and planning
- Mission execution and control
- Battery status monitoring
- Alerts and warnings
- Operational logs
- Module status and control

## Current Status

The frontend and backend are under active development.

## Subfolders

- `frontend/` - React dashboard
- `backend/` - FastAPI service
