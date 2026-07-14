#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

needs_setup=false

if [[ ! -x .venv/bin/python ]]; then
  needs_setup=true
elif ! .venv/bin/python - <<'PY'
from importlib.metadata import PackageNotFoundError, version

required = {
    "mkdocs": "1.6.1",
    "mkdocs-material": "9.7.6",
    "mkdocs-static-i18n": "1.3.1",
}

try:
    mismatches = {
        package: (version(package), expected)
        for package, expected in required.items()
        if version(package) != expected
    }
except PackageNotFoundError:
    raise SystemExit(1)

raise SystemExit(bool(mismatches))
PY
then
  needs_setup=true
fi

if [[ "$needs_setup" == true ]]; then
  echo "Preparing the pinned AMR-X documentation toolchain..." >&2
  bash scripts/setup-docs.sh
fi

if ! .venv/bin/python -c 'import mkdocs_static_i18n' >/dev/null 2>&1; then
  echo "The MkDocs i18n plugin is unavailable after setup." >&2
  echo "Run 'npm run setup:docs' and check the installation output." >&2
  exit 1
fi
