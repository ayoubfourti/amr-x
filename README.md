# AMR-X

AMR-X is an Autonomous Modular Robot - Extended project for a modular mobile robot platform and interchangeable functional modules.

To see the common commands for the website, MkDocs, dashboard, robot,
Gazebo worlds, navigation, and reports, run:

```bash
npm run commands
```

Filter the guide by category with commands such as `npm run commands -- robot`
or `npm run commands -- worlds`. `make help` shows the complete guide too.

This repository is structured for internship team work through GitHub issues, controlled CSV tables, LaTeX reports, and pull request review.

## Final Reports

- `reports/market_study/` - Final Market Study Report in LaTeX.
- `reports/v1_product_definition/` - Final V1 Product Definition Dossier in LaTeX.
- `reports/system_requirements_v1/` - Submitted SRD documents migrated as a standalone LaTeX report.

## Robotics Environment

The default robotics environment for this repository is:

- `Ubuntu 24.04`
- `ROS 2 Jazzy`
- `Gazebo Harmonic`

`Ubuntu 22.04 + ROS 2 Humble + Gazebo Fortress` is still allowed as a
compatibility path for teams that need to continue on the older setup.

Both teams must report any crash, launch failure, bridge mismatch, dependency
issue, or environment-specific problem immediately so the code and
documentation can be corrected quickly.

The default stack is the only acceptance target for new robotics work. The
older stack is a compatibility path, not a second implementation track.

Generated PDFs belong under `build/<report_name>/` and are not committed.

## Robotics Quick Start

The supported robotics stack is Ubuntu 24.04, ROS 2 Jazzy, and Gazebo
Harmonic. Build from the repository root:

```bash
source /opt/ros/jazzy/setup.bash
rosdep install --from-paths robotics --ignore-src -r -y
colcon build --symlink-install
source install/setup.bash
```

Launch the default warehouse simulation:

```bash
ros2 launch bringup simulation.launch.py
```

Launch the hospital instead:

```bash
ros2 launch bringup simulation.launch.py environment:=hospital
```

For SLAM, use separate sourced terminals:

```bash
# Terminal 1
ros2 launch bringup simulation.launch.py rviz:=false

# Terminal 2
ros2 launch navigation slam.launch.py

# Terminal 3
ros2 run teleop_twist_keyboard teleop_twist_keyboard
```

See the [complete robotics launch guide](robotics/LAUNCHING.md) for all worlds,
RViz, teleoperation, SLAM, map saving, live navigation, saved-map localization,
Fortress compatibility, topic checks, and troubleshooting.

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

## Local Website and Documentation

The documentation can run by itself. The Next.js landing page is optional.
The supported minimum versions are Python 3.10, Node.js 20.9, and npm 10.
Ubuntu is the primary local development environment.

### Documentation only (no website packages)

This path creates the shared root `.venv` and installs only the Python
documentation dependencies. The versions are pinned in
`requirements-docs.txt`, including the multilingual `mkdocs-static-i18n`
plugin:

```bash
git clone git@github.com:cybermech-hub/amr-x.git
cd amr-x
npm run setup:docs
npm run docs
```

Open <http://127.0.0.1:8001/>. You do not need to install anything under
`website/`. The setup script creates or reuses the single root `.venv`; do not
create another environment for documentation or the dashboard.

Always use `npm run docs` or `.venv/bin/python -m mkdocs`; a globally installed
`mkdocs` command does not use the repository's plugins. The supported command
checks the pinned toolchain and repairs missing documentation dependencies
before starting.

### Website and documentation together

```bash
git clone git@github.com:cybermech-hub/amr-x.git
cd amr-x
npm run setup
npm run dev
```

- Website: <http://localhost:3000/>
- Documentation: <http://localhost:3000/docs/>

French, German, and Arabic are available from the language selector:

| Language | Website | Documentation |
|---|---|---|
| English | <http://localhost:3000/> | <http://localhost:3000/docs/> |
| Français | <http://localhost:3000/fr/> | <http://localhost:3000/docs/fr/> |
| Deutsch | <http://localhost:3000/de/> | <http://localhost:3000/docs/de/> |
| العربية | <http://localhost:3000/ar/> | <http://localhost:3000/docs/ar/> |

English is the canonical documentation source. Localized Markdown files use
the `.fr.md`, `.de.md`, and `.ar.md` suffixes, with English fallback for pages
that have not yet been translated.

### How documentation translation works

Translation happens from Markdown source during the MkDocs build. It is not
performed dynamically in the browser, and the site does not call a runtime
translation service.

Current coverage:

- Documentation navigation and the homepage are translated into French,
  German, and Arabic.
- Technical pages currently use the English fallback until a translated
  Markdown file is added.
- Next.js landing-page translations are maintained separately in
  `website/lib/i18n.js`.

Translation files are stored beside the canonical English source:

```text
docs/robotics/simulation.md       # English
docs/robotics/simulation.fr.md    # French
docs/robotics/simulation.de.md    # German
docs/robotics/simulation.ar.md    # Arabic
```

They generate these routes:

```text
/docs/robotics/simulation/
/docs/fr/robotics/simulation/
/docs/de/robotics/simulation/
/docs/ar/robotics/simulation/
```

Do not translate commands, code, filenames, ROS identifiers, API paths, or
configuration keys. Preserve the technical structure and update translations
when the English source changes. See the
[documentation localization guide](docs/reference/localization.md) for the
complete workflow and current coverage.

`npm run setup` is safe to repeat. It prepares `.venv`, installs the MkDocs
dependencies, and installs the website packages. Press `Ctrl+C` once to stop
both development servers; run `npm run dev` to restart them. The optional
website alone can be prepared with `npm run setup:website` and started with
`npm run website`.

Edit the landing page under `website/app/`. Edit documentation Markdown under
`docs/`, and control its navigation in `mkdocs.yml`. MkDocs watches those files
and automatically refreshes open documentation pages. To add a page, create a
Markdown file under `docs/`, add it to `nav` in `mkdocs.yml`, and follow the
[documentation contributor guide](docs/contributing.md).

Before opening a pull request for the landing page or documentation, run
`npm run check`, or `npm run check:docs` when changing documentation only.
For dashboard changes, run `npm run check:dashboard`. Generated `site/`,
`website/.next/`, and dashboard `dist/` output must not be committed.

If a server reports that its port is busy, stop the process using port 3000,
3001, or 8001 and retry. In combined mode, the local gateway owns port 3000,
Next.js runs internally on port 3001, and MkDocs runs internally on port 8001.
If a command reports missing dependencies, run the matching setup command
again. If virtual-environment creation is unavailable on Ubuntu, install the
OS package that provides `python3-venv` for your Python version.

No public deployment, hosting provider, or GitHub Pages workflow is configured.

## Dashboard Development

The operator dashboard consists of a React/Vite frontend, a FastAPI backend,
and PostgreSQL 16 in Docker. It uses the same repository-root `.venv` as the
documentation toolchain; do not create a virtual environment under
`dashboard_app/`.

First-time setup:

```bash
npm run setup:dashboard
```

Start the complete dashboard:

```bash
npm run dashboard
```

This starts PostgreSQL, FastAPI, and Vite:

- Dashboard: <http://localhost:5173/>
- API documentation: <http://localhost:8000/docs>

Press `Ctrl+C` to stop the frontend and backend. PostgreSQL remains running so
its data is available next time. Stop it separately with
`npm run dashboard:db:stop`.

Individual services can also be run from the repository root:

```bash
npm run dashboard:db          # Start PostgreSQL
npm run dashboard:backend     # Start FastAPI on port 8000
npm run dashboard:frontend    # Start Vite on port 5173
npm run dashboard:db:status   # Show PostgreSQL status
npm run dashboard:db:logs     # Follow PostgreSQL logs
npm run dashboard:db:stop     # Stop PostgreSQL without deleting its data
npm run check:dashboard       # Check the backend and lint/build the frontend
```

See the [dashboard guide](dashboard_app/README.md), the
[backend guide](dashboard_app/backend/README.md), and the
[full ROS-to-dashboard setup](dashboard_app/SETUP.md) for more detail.

## Rules

- Start every task from a GitHub issue.
- Use `TBD` for undecided values.
- Do not invent market data, prices, suppliers, specifications, or citations.
- Do not commit private PDFs.
- Do not commit generated LaTeX build files or report PDFs.
- Keep source PDFs and references only when they are allowed to be shared.

See `CONTRIBUTING.md`, `.agents.md`, and the
[documentation contributor guide](docs/contributing.md).
