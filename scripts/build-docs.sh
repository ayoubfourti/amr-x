#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

bash scripts/ensure-docs.sh

exec .venv/bin/python -m mkdocs build --strict
