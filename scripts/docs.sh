#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

bash scripts/ensure-docs.sh

# AMR-X intentionally uses the stable MkDocs 1.x toolchain. Material exposes
# this variable to hide its informational MkDocs 2.0 migration banner.
export NO_MKDOCS_2_WARNING=true

exec .venv/bin/python -m mkdocs serve --dev-addr 127.0.0.1:8000
