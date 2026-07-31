#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

bash scripts/ensure-docs.sh

exec .venv/bin/python -m mkdocs serve --dev-addr 127.0.0.1:8001
