#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

bash scripts/ensure-docs.sh

# MkDocs is constrained to 1.x in requirements-docs.txt. Suppress Material's
# informational warning about the unrelated MkDocs 2.0 rewrite.
export NO_MKDOCS_2_WARNING=true

exec .venv/bin/python -m mkdocs build --strict
