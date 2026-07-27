#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if ! command -v python3 >/dev/null 2>&1; then
  echo "Python 3.10 or newer is required." >&2
  exit 1
fi

if ! python3 -c 'import sys; raise SystemExit(sys.version_info < (3, 10))'; then
  echo "Python 3.10 or newer is required." >&2
  exit 1
fi

if [[ ! -x .venv/bin/python ]]; then
  echo "Creating the shared repository virtual environment at .venv..."
  python3 -m venv .venv
fi

.venv/bin/python -m pip install --upgrade pip
