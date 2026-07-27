#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

action="${1:-start}"
compose=(docker compose -f dashboard_app/compose.yaml)

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker with Docker Compose is required." >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "The Docker Compose plugin is required." >&2
  exit 1
fi

if [[ ! -f .env ]]; then
  echo "The root .env file is missing. Run: npm run setup:dashboard" >&2
  exit 1
fi

case "$action" in
  start)
    "${compose[@]}" up -d --wait postgres
    ;;
  stop)
    "${compose[@]}" stop postgres
    ;;
  status)
    "${compose[@]}" ps
    ;;
  logs)
    exec "${compose[@]}" logs -f postgres
    ;;
  *)
    echo "Usage: $0 {start|stop|status|logs}" >&2
    exit 2
    ;;
esac
