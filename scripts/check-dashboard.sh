#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -x .venv/bin/python ]] || \
  ! .venv/bin/python -c 'import fastapi, psycopg2, roslibpy, sqlalchemy, uvicorn' >/dev/null 2>&1; then
  echo "Dashboard backend dependencies are missing. Run: npm run setup:dashboard" >&2
  exit 1
fi

if [[ ! -d dashboard_app/frontend/node_modules ]]; then
  echo "Dashboard frontend dependencies are missing. Run: npm run setup:dashboard" >&2
  exit 1
fi

.venv/bin/python -m compileall -q dashboard_app/backend/app
PYTHONPATH=dashboard_app/backend \
  .venv/bin/python -m unittest discover -s dashboard_app/backend/tests -p 'test_*.py'
npm run worlds:check --prefix dashboard_app/frontend
npm run lint --prefix dashboard_app/frontend
npm run build --prefix dashboard_app/frontend
