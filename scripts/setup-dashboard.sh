#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

bash scripts/setup-python.sh
.venv/bin/python -m pip install --upgrade -r dashboard_app/backend/requirements.txt
.venv/bin/python -m pip check

if [[ ! -f .env ]]; then
  cp .env.example .env
  echo "Created .env from .env.example."
fi

npm ci --prefix dashboard_app/frontend

echo
echo "Dashboard dependencies are ready."
echo "Run 'npm run dashboard' to start PostgreSQL, FastAPI, and Vite."
