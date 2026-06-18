# Robotic Arm Module

## Scope

The robotic arm module covers the arm structure, actuation, end effector, control electronics, safety constraints, and integration with the common AMR-X module interface.

## Working Folders

- `design/` - Design notes and source files.
- `bom/` - Module-specific BOM notes before controlled CSV updates.
- `interfaces/` - Mechanical, electrical, data, and safety interface notes.
- `tests/` - Verification notes and test definitions.

## Controlled Sources

- `data/bom/bom_arm_module.csv`
- `data/components/component_candidates.csv`
- `data/modules/module_decision_matrix.csv`
- `data/modules/module_interface_requirements.csv`

## Rules

- Use `TBD` for undecided values.
- Record build, buy, modify, or custom-manufacture decisions in controlled CSV files.
- Refresh generated LaTeX tables after CSV changes.
