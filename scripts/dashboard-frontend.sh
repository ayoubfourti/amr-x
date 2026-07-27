#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -d dashboard_app/frontend/node_modules ]]; then
  echo "Dashboard frontend dependencies are missing." >&2
  echo "Run: npm run setup:dashboard" >&2
  exit 1
fi

exec npm run dev --prefix dashboard_app/frontend
