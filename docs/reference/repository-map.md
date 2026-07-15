# Technical Repository Map

The repository separates controlled engineering inputs, implementation files,
human-readable reports, and generated artifacts. Use the existing source of
truth instead of copying values into new prose.

## Controlled engineering inputs

| Path | Responsibility | Editing rule |
|---|---|---|
| `config/project_specs.json` | Global project specifications | Run `python3 tools/generate_specs.py` after changes |
| `data/requirements/requirements_matrix.csv` | System requirements | Edit the CSV, then regenerate report tables |
| `data/bom/` | Base and module bills of materials | Edit controlled CSV files only |
| `data/components/component_candidates.csv` | Candidate component evaluations | Do not invent suppliers, prices, or specifications |
| `data/modules/module_decision_matrix.csv` | Build, buy, modify, or manufacture decisions | Record each major component and module decision |
| `data/modules/module_interface_requirements.csv` | Shared module interface requirements | Coordinate cross-team interface changes |
| `data/system_architecture/interfaces.csv` | Current cross-team interface register | Synchronize the rendered interface page after editing |

## Implementation areas

| Path | Contents |
|---|---|
| `robotics/` | ROS 2 packages, launch files, URDF/Xacro, control, navigation, simulation, and dashboard bridge code |
| `mechanical/` | Mechanical concepts, dimensions, mounting interface, and approved exports |
| `electrical/` | Power, battery, compute, sensing, wiring, safety, and BOM documentation |
| `modules/` | Functional module definitions and module-specific design assets |
| `dashboard_app/` | Dashboard frontend and backend application work |
| `reports/` | LaTeX report sources and generated tables derived from controlled data |
| `docs/assets/images/` | Organized documentation images and the authoritative placeholder collection |
| `website/public/images/placeholders/` | Selected website-safe copies of AMR-X and module concept placeholders |

## Derived and local-only output

The following paths are generated or machine-local and must not be committed:

```text
.venv/
site/
website/.next/
website/node_modules/
node_modules/
build/
install/
log/
__pycache__/
```

Use the repository generators after editing controlled inputs:

```bash
python3 tools/generate_specs.py
python3 tools/generate_latex_tables.py
```

Build report output into `build/<report_name>/`; keep report source folders
free of generated LaTeX intermediates and PDFs.
