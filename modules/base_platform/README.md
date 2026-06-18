# Base Platform

## Scope

The base platform covers the shared AMR-X mobile robot body, drive system, power system, compute, safety hardware, and physical module mounting interface.

## Working Folders

- `design/` - Design notes and source files.
- `bom/` - Module-specific BOM notes before controlled CSV updates.
- `interfaces/` - Mechanical, electrical, data, and safety interface notes.
- `tests/` - Verification notes and test definitions.

## Controlled Sources

- `config/project_specs.json`
- `data/bom/bom_base_v1.csv`
- `data/components/component_candidates.csv`
- `data/modules/module_decision_matrix.csv`
- `data/requirements/requirements_matrix.csv`

## Rules

- Use `TBD` for undecided values.
- Record build, buy, modify, or custom-manufacture decisions in controlled CSV files.
- Refresh generated LaTeX tables after CSV changes.
