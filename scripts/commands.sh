#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

usage() {
  cat <<'EOF'
AMR-X command guide

Usage:
  npm run commands
  npm run commands -- <category>
  make help
  bash scripts/commands.sh [category|--help]

Categories:
  setup       Install project dependencies
  web         Run the website and MkDocs documentation
  dashboard   Run and manage the operator dashboard
  robot       Build and launch the robot simulation
  worlds      Launch Gazebo environments without the robot
  navigation  Teleoperation, SLAM, and navigation
  reports     Generate project data and PDF reports
  checks      Validate builds and clean generated web output

Examples:
  npm run commands -- robot
  npm run commands -- worlds
EOF
}

section_setup() {
  cat <<'EOF'

SETUP
  npm run setup                 Install MkDocs + website dependencies
  npm run setup:docs            Install MkDocs dependencies only
  npm run setup:website         Install website dependencies only
  npm run setup:dashboard       Install dashboard dependencies and create .env
EOF
}

section_web() {
  cat <<'EOF'

WEBSITE + MKDOCS
  npm run dev                   Website + docs at http://localhost:3000
  npm run website               Website only at http://localhost:3000
  npm run docs                  MkDocs only at http://127.0.0.1:8001
  npm run build                 Build the website and documentation
  npm run build:docs            Build MkDocs documentation only
EOF
}

section_dashboard() {
  cat <<'EOF'

DASHBOARD
  npm run dashboard             Start database, API, and dashboard frontend
  npm run dashboard:backend     Start FastAPI only
  npm run dashboard:frontend    Start Vite only
  npm run dashboard:db          Start PostgreSQL
  npm run dashboard:db:status   Show PostgreSQL status
  npm run dashboard:db:logs     Follow PostgreSQL logs
  npm run dashboard:db:stop     Stop PostgreSQL (data is preserved)
  npm run build:dashboard       Build the dashboard frontend
EOF
}

robot_header() {
  cat <<'EOF'

ROBOT WORKSPACE (run these from robotics/)
  cd robotics
  source /opt/ros/jazzy/setup.bash
  rosdep install --from-paths . --ignore-src -r -y
  colcon build --symlink-install
  source install/setup.bash

Run the source commands again in every new terminal.
EOF
}

section_robot() {
  robot_header
  cat <<'EOF'

ROBOT SIMULATION
  ros2 launch bringup simulation.launch.py
      Default warehouse + robot + sensors + bridge + RViz
  ros2 launch bringup simulation.launch.py environment:=hospital
      Hospital + robot + sensors + bridge + RViz
  ros2 launch bringup simulation.launch.py rviz:=false
      Simulation without RViz (useful for SLAM/navigation)
  ros2 launch bringup simulation.launch.py gui:=false rviz:=false
      Headless simulation
  ros2 launch bringup simulation.launch.py simulator_variant:=fortress
      ROS 2 Humble / Gazebo Fortress compatibility mode
  ros2 launch robot_description display.launch.py
      Display only the robot model in RViz
EOF
}

section_worlds() {
  robot_header
  cat <<'EOF'

WORLDS ONLY (no robot and no ROS bridge)
  ros2 launch simulation warehouse.launch.py
      Procedural warehouse (default)
  ros2 launch simulation hospital_harmonic.launch.py
      Hospital for Gazebo Harmonic
  ros2 launch simulation warehouse_harmonic.launch.py
      Experimental AWS warehouse for Gazebo Harmonic
  ros2 launch simulation warehouse.launch.py simulator_variant:=fortress
      Warehouse for Gazebo Fortress

CUSTOM WORLD WITH THE ROBOT
  ros2 launch bringup simulation.launch.py world:=/absolute/path/world.sdf
EOF
}

section_navigation() {
  robot_header
  cat <<'EOF'

TELEOPERATION
  ros2 run teleop_twist_keyboard teleop_twist_keyboard
  ros2 launch bringup teleop.launch.py
  ros2 launch bringup teleop_joy.launch.py

SLAM (use separate sourced terminals)
  Terminal 1: ros2 launch bringup simulation.launch.py rviz:=false
  Terminal 2: ros2 launch navigation slam.launch.py
  Terminal 3: ros2 run teleop_twist_keyboard teleop_twist_keyboard

NAVIGATION ON LIVE SLAM MAP (additional sourced terminal)
  ros2 launch navigation nav2.launch.py rviz:=false

SAVE A MAP
  ros2 run nav2_map_server map_saver_cli -f "$(pwd)/navigation/maps/amr_warehouse_map"

More options: robotics/LAUNCHING.md
EOF
}

section_reports() {
  cat <<'EOF'

PROJECT DATA + REPORTS (run from the repository root)
  python3 tools/generate_specs.py          Generate specification outputs
  python3 tools/generate_latex_tables.py   Generate LaTeX tables from source data
  bash tools/build_reports.sh              Build all PDF reports under build/
EOF
}

section_checks() {
  cat <<'EOF'

CHECKS + CLEANUP
  npm run check                 Check website and documentation
  npm run check:docs            Strict MkDocs build
  npm run check:dashboard       Check dashboard backend and frontend
  npm run clean                 Remove generated website and MkDocs output
EOF
}

category="${1:-all}"

case "$category" in
  all)
    usage
    section_setup
    section_web
    section_dashboard
    section_robot
    section_worlds
    section_navigation
    section_reports
    section_checks
    ;;
  setup) section_setup ;;
  web|website|docs|mkdocs) section_web ;;
  dashboard) section_dashboard ;;
  robot|robotics|simulation) section_robot ;;
  world|worlds) section_worlds ;;
  nav|navigation|slam|teleop) section_navigation ;;
  report|reports) section_reports ;;
  check|checks|clean) section_checks ;;
  -h|--help|help) usage ;;
  *)
    echo "Unknown command category: $category" >&2
    echo >&2
    usage >&2
    exit 2
    ;;
esac
