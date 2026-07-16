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
  python3 -m venv .venv
fi

.venv/bin/python -m pip install --upgrade pip
.venv/bin/python -m pip install --upgrade -r requirements-docs.txt
.venv/bin/python -m pip check

if ! .venv/bin/python -c 'import mkdocs_static_i18n' >/dev/null 2>&1; then
  echo "The MkDocs i18n plugin was not importable after installation." >&2
  exit 1
fi

echo "Documentation dependencies are ready."
