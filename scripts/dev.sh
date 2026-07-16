#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

bash scripts/ensure-docs.sh

if [[ ! -d website/node_modules ]]; then
  echo "Website dependencies are missing. Run: npm run setup" >&2
  exit 1
fi

docs_pid=""
website_pid=""
proxy_pid=""

cleanup() {
  trap - EXIT INT TERM

  for pid in "$docs_pid" "$website_pid" "$proxy_pid"; do
    if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
      kill -TERM -- "-$pid" 2>/dev/null || true
    fi
  done

  [[ -z "$docs_pid" ]] || wait "$docs_pid" 2>/dev/null || true
  [[ -z "$website_pid" ]] || wait "$website_pid" 2>/dev/null || true
  [[ -z "$proxy_pid" ]] || wait "$proxy_pid" 2>/dev/null || true
}

stop_on_signal() {
  exit 130
}

trap cleanup EXIT
trap stop_on_signal INT TERM

# Give each server its own process group so cleanup also reaches subprocesses
# created by npm, Next.js, and MkDocs.
setsid bash scripts/docs.sh &
docs_pid=$!
setsid npm run dev:combined --prefix website &
website_pid=$!
setsid node scripts/dev-proxy.mjs &
proxy_pid=$!

set +e
wait -n "$docs_pid" "$website_pid" "$proxy_pid"
status=$?
set -e

exit "$status"
