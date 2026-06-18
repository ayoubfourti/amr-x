# Common Module Interface

## Scope

The common module interface defines shared mechanical mounting, electrical power, data communication, and safety requirements for AMR-X modules.

## Working Folders

- `mechanical/` - Mounting and physical envelope notes.
- `electrical/` - Power and connector notes.
- `data/` - Communication and protocol notes.
- `tests/` - Interface verification notes.

## Controlled Sources

- `config/project_specs.json`
- `data/modules/module_interface_requirements.csv`

## Rules

- Use `TBD` for undecided values.
- Do not duplicate global interface values outside `config/project_specs.json`.
- Refresh generated LaTeX tables after CSV changes.
