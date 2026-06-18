# AMR-X

AMR-X is an Autonomous Modular Robot - Extended project for a modular mobile robot platform and interchangeable functional modules.

This repository is structured for internship team work through GitHub issues, controlled CSV tables, LaTeX reports, and pull request review.

## Final Reports

- `reports/market_study/` - Final Market Study Report in LaTeX.
- `reports/v1_product_definition/` - Final V1 Product Definition Dossier in LaTeX.
- `reports/system_requirements_v1/` - Submitted SRD documents migrated as a standalone LaTeX report.

Generated PDFs belong under `build/<report_name>/` and are not committed.

## Source of Truth

- `config/project_specs.json` - Global project specifications.
- `data/bom/` - Controlled BOM source tables.
- `data/components/` - Component candidate source tables.
- `data/modules/` - Module decision and interface source tables.
- `data/requirements/` - Requirements matrix source tables.
- `reports/**/tables/generated/` - Generated LaTeX tables created from CSV and JSON sources.

Do not manually duplicate payload, dimensions, speed, endurance, or interface values in report prose. Use the global specs and generated tables.

## Module Scope

- `modules/base_platform/` - Base robot platform.
- `modules/arm_module/` - Robotic arm module.
- `modules/shelf_access_module/` - Shelf-access module.
- `modules/secure_compartment_module/` - Secure delivery compartment module.
- `modules/sensor_inspection_module/` - Sensor and inspection module.
- `modules/common_interface/` - Shared module mechanical, electrical, data, and safety interface.

Every major base component and every module must document a build, buy, modify, or custom-manufacture decision.

## Workflow

Issue -> Branch -> CSV/TEX edit -> Generate tables -> Pull request -> Review -> Merge

Run generators after changing `config/` or `data/`:

```bash
python3 tools/generate_specs.py
python3 tools/generate_latex_tables.py
```

Build reports into `build/<report_name>/`:

```bash
bash tools/build_reports.sh
```

Expected generated PDFs:

- `build/market_study/market_study.pdf`
- `build/v1_product_definition/v1_product_definition.pdf`
- `build/system_requirements_v1/system_requirements_v1.pdf`

## Rules

- Start every task from a GitHub issue.
- Use `TBD` for undecided values.
- Do not invent market data, prices, suppliers, specifications, or citations.
- Do not commit private PDFs.
- Do not commit generated LaTeX build files or report PDFs.
- Keep source PDFs and references only when they are allowed to be shared.

See `CONTRIBUTING.md`, `.agents.md`, and `docs/00_project_management/workflow/`.
