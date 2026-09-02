# Inspection Module Setup Guide

## Prerequisites

- ROS2 Jazzy installed
- Python 3.10+
- PostgreSQL 16+
- Node.js 20+
- Docker (optional)

## Installation

### 1. Clone Repository

```bash
git clone https://github.com/cybermech-hub/amr-x.git
cd amr-x
```

### 2. Build ROS2 Packages

```bash
cd robotics
colcon build --packages-select inspection_module
source install/setup.bash
```

### 3. Setup Backend Database

```bash
sudo -u postgres psql << EOF
CREATE USER amrx WITH PASSWORD 'amrx_local_dev_7f3c9b2e';
CREATE DATABASE amr OWNER amrx;
GRANT ALL PRIVILEGES ON DATABASE amr TO amrx;
EOF
```

### 4. Setup FastAPI Backend

```bash
cd dashboard_app/backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
```

### 5. Start Backend

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

## Running the System

### Terminal 1: Gazebo Simulation

```bash
source /opt/ros/jazzy/setup.bash
cd ~/amr-x/robotics
source install/setup.bash
ros2 launch bringup simulation.launch.py headless:=true
```

### Terminal 2: Inspection Module

```bash
source /opt/ros/jazzy/setup.bash
cd ~/amr-x/robotics
source install/setup.bash
ros2 launch inspection_module inspection.launch.py
```

### Terminal 3: Send Inspection Request

```bash
ros2 action send_goal /run_inspection amr_interfaces/action/RunInspection '{"inspection_type": "visual"}' --feedback
```

## API Endpoints

- `POST /api/inspections/` — Create inspection result
- `GET /api/inspections/` — Get all inspections
- `GET /api/inspections/latest` — Get latest inspection
- `GET /api/inspections/{id}` — Get specific inspection

## Dashboard

Access at: `http://localhost:5173/`

- `/inspection` — Latest inspection results
- `/inspection-history` — All past inspections

