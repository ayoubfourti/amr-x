# Documentation Rules

## Source of Truth

- Global specifications live in `config/project_specs.json`.
- BOM and component data live in CSV files under `data/`.
- Final reports live in `reports/market_study/` and `reports/v1_product_definition/`.
- Legacy notes live in `references/legacy_docs/`.

## Content Rules

- Use `TBD` for undecided values.
- Do not invent market data, prices, suppliers, specifications, or citations.
- Do not store private PDFs in the repository.
- Use `references/` only for references that are allowed to be shared.
- Keep generated report PDFs under `build/`.
- Do not manually edit files under `reports/**/tables/generated/`.

## Table Rules

- Edit CSV source files first.
- Run `python3 tools/generate_latex_tables.py`.
- Commit both the CSV change and generated LaTeX table change.
