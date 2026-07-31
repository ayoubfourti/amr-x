#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -x .venv/bin/python ]]; then
  echo "The shared root .venv is missing. Run: npm run setup:dashboard" >&2
  exit 1
fi

if [[ ! -f .env ]]; then
  echo "The root .env file is missing. Run: npm run setup:dashboard" >&2
  exit 1
fi

if ! .venv/bin/python -c 'import fastapi, psycopg2, roslibpy, sqlalchemy, uvicorn' >/dev/null 2>&1; then
  echo "Backend dependencies are missing. Run: npm run setup:dashboard" >&2
  exit 1
fi

cd dashboard_app/backend
../../.venv/bin/python -m alembic upgrade head
exec ../../.venv/bin/python -m uvicorn app.main:app --reload
