# AMR-X Backend API

FastAPI backend for the AMR-X monitoring and mission-control dashboard.
PostgreSQL runs locally in Docker; the API runs in a Python virtual
environment.

## Prerequisites

- Docker with Docker Compose
- Python 3.10 or newer
- The repository-root `.venv` created by `npm run setup:dashboard`

The backend and MkDocs share the repository-root `.venv`. Do not create a
second environment inside `dashboard_app/` or `dashboard_app/backend/`.

## First-time setup

Run this command from the repository root:

```bash
npm run setup:dashboard
```

It creates the root `.env` when needed, prepares the shared root `.venv`,
installs the backend requirements into it, and installs the dashboard frontend
packages. The script never creates an environment below `dashboard_app/`.

The repository-root `.env.example` contains local-development credentials and
works without editing. The resulting root `.env` is ignored by Git. Do not
reuse these credentials in a deployed environment.

Start PostgreSQL and wait until it is healthy:

```bash
npm run dashboard:db
```

## Start the backend

From the repository root:

```bash
npm run dashboard:backend
```

Open:

- API: <http://127.0.0.1:8000/>
- Swagger documentation: <http://127.0.0.1:8000/docs>

The backend runs versioned Alembic migrations before every API startup. The
initial migration creates all database tables on first startup, and later
migrations update existing databases without deleting their data. A
rosbridge connection error is expected if the ROS bridge is not running; it
does not prevent the REST API and dashboard database features from starting.

To inspect or apply migrations manually, run these commands from
`dashboard_app/backend/`:

```bash
../../.venv/bin/python -m alembic current
../../.venv/bin/python -m alembic upgrade head
../../.venv/bin/python -m alembic check
```

## Daily startup

Start the database, then start the API in another terminal:

```bash
npm run dashboard:db
```

```bash
npm run dashboard:backend
```

To run PostgreSQL, the API, and the React frontend together, use
`npm run dashboard`.

## Stop the database

Stop the container while preserving its data:

```bash
npm run dashboard:db:stop
```

To start it again:

```bash
npm run dashboard:db
```

Database data is stored in the Docker volume
`amrx-dashboard_postgres_data`. Deleting that volume permanently removes the
local dashboard database.

## Environment variables

The local file is the repository-root `.env`:

```dotenv
POSTGRES_DB=amr
POSTGRES_USER=amrx
POSTGRES_PASSWORD=amrx_local_dev_7f3c9b2e
DATABASE_URL=postgresql+psycopg2://amrx:amrx_local_dev_7f3c9b2e@localhost:5432/amr
DEBUG=True
```

If you change the PostgreSQL user, password, database, or port, update both
the matching `POSTGRES_*` value and `DATABASE_URL`. PostgreSQL initialization
variables only apply when Docker creates a new, empty data volume.

## Useful database commands

View logs:

```bash
npm run dashboard:db:logs
```

Open a PostgreSQL shell:

```bash
docker compose -f dashboard_app/compose.yaml exec postgres \
  psql -U amrx -d amr
```

## Frontend

In a second terminal, from the repository root:

```bash
npm run dashboard:frontend
```

Open <http://localhost:5173/>. Vite proxies frontend `/api` requests to this
backend on port 8000.

## API routes

- `GET /api/robots/`
- `POST /api/robots/`
- `PUT /api/robots/{robot_id}/status`
- `GET /api/missions/`
- `POST /api/missions/`
- `DELETE /api/missions/{mission_id}`
- `GET /api/modules/`
- `PUT /api/modules/{module_id}/toggle`
- `GET /api/alerts/`
- `PUT /api/alerts/{alert_id}/resolve`
- `GET /api/users/`
- `POST /api/users/`

## Troubleshooting

If port 5432 is already in use, stop the host PostgreSQL service before
starting the container:

```bash
sudo systemctl stop postgresql
npm run dashboard:db
```

If the credentials changed after the database volume was created, either
restore the old values or deliberately recreate the development database
volume. See the warning in “Stop the database” before deleting any volume.
