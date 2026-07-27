#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

bash scripts/dashboard-db.sh start

backend_pid=""
frontend_pid=""

cleanup() {
  trap - EXIT INT TERM

  for pid in "$backend_pid" "$frontend_pid"; do
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
      kill -TERM -- "-$pid" 2>/dev/null || true
    fi
  done

  [[ -z "$backend_pid" ]] || wait "$backend_pid" 2>/dev/null || true
  [[ -z "$frontend_pid" ]] || wait "$frontend_pid" 2>/dev/null || true
}

stop_on_signal() {
  exit 130
}

trap cleanup EXIT
trap stop_on_signal INT TERM

setsid bash scripts/dashboard-backend.sh &
backend_pid=$!
setsid bash scripts/dashboard-frontend.sh &
frontend_pid=$!

echo
echo "Dashboard frontend: http://localhost:5173/"
echo "Dashboard API docs: http://localhost:8000/docs"
echo "Press Ctrl+C to stop the frontend and backend."
echo "PostgreSQL remains available; stop it with 'npm run dashboard:db:stop'."
echo

set +e
wait -n "$backend_pid" "$frontend_pid"
status=$?
set -e

exit "$status"
