# GitHub Workflow

AMR-X work follows this path:

Issue -> Branch -> CSV/TEX edit -> Generate tables -> Pull request -> Review -> Merge

## Rules

- Every task starts with a GitHub issue.
- Every branch links to one issue.
- Source data changes go into CSV files under `data/`.
- Report text changes go into LaTeX files under `reports/`.
- Generated LaTeX tables must be refreshed before opening a PR.
- Pull requests must explain the issue, changed files, and verification.
- No direct pushes to `main`.

## Branch Names

- `docs/<short-topic>`
- `research/<short-topic>`
- `module/<short-topic>`
- `fix/<short-topic>`
