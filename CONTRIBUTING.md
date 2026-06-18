# Contributing to AMR-X

## Required Workflow

AMR-X work follows this path:

Issue -> Branch -> CSV/TEX edit -> Generate tables -> Pull request -> Review -> Merge

## Branch Naming

- `docs/short-description` - Report or workflow documentation.
- `research/short-description` - Market, component, or supplier research.
- `module/short-description` - Module design documentation.
- `fix/short-description` - Corrections to existing files.

## Source Files

- Edit global specifications in `config/project_specs.json`.
- Edit BOMs in `data/bom/`.
- Edit component candidates in `data/components/component_candidates.csv`.
- Edit module decisions in `data/modules/module_decision_matrix.csv`.
- Edit module interface requirements in `data/modules/module_interface_requirements.csv`.
- Edit requirements in `data/requirements/requirements_matrix.csv`.
- Edit report prose in LaTeX files under `reports/`.

Do not manually edit generated files under `reports/**/tables/generated/`.

## Generation

Run these before opening a PR when `config/` or `data/` changes:

```bash
python3 tools/generate_specs.py
python3 tools/generate_latex_tables.py
```

Build reports with:

```bash
bash tools/build_reports.sh
```

Report PDFs and LaTeX build outputs must stay under `build/` and out of git.

## Pull Request Rules

- Link the related GitHub issue.
- Explain what changed and why.
- List changed CSV and LaTeX files.
- Confirm generated tables were refreshed.
- Request review before merge.
- Do not push directly to `main`.

## Documentation Rules

- Use `TBD` for undecided values.
- Do not invent market data, prices, suppliers, specifications, or citations.
- Every component decision must be build, buy, modify, or custom-manufacture.
- Keep global values in `config/project_specs.json`.
- Do not commit private PDFs.
- Keep legacy notes under `references/legacy_docs/`.
- End every text file with a newline.
