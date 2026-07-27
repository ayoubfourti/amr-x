#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

bash scripts/setup-python.sh
.venv/bin/python -m pip install --upgrade -r requirements-docs.txt
.venv/bin/python -m pip check

if ! .venv/bin/python -c 'import mkdocs_static_i18n' >/dev/null 2>&1; then
  echo "The MkDocs i18n plugin was not importable after installation." >&2
  exit 1
fi

echo "Documentation dependencies are ready."
