# Inspection Module Architecture

## System Overview

The Inspection Module is a distributed system with four main layers:
## System Overview

The Inspection Module is a distributed system with four main layers:

┌─────────────────────────────────────────────────────────────┐
│ OPERATOR DASHBOARD │
│ (React Web Application) │
│ /inspection /inspection-history │
└────────────────────┬──────────────────────────────────────┘
│ HTTP REST API
┌────────────────────▼──────────────────────────────────────┐
│ FASTAPI BACKEND (Port 8000) │
│ POST /api/inspections/ │
│ GET /api/inspections/ │
│ GET /api/inspections/latest │
└────────────────────┬──────────────────────────────────────┘
│ SQLAlchemy ORM
┌────────────────────▼──────────────────────────────────────┐
│ POSTGRESQL DATABASE (Port 5432) │
│ inspections table (history storage) │
└─────────────────────────────────────────────────────────────┘


## Component Details

### 1. ROS2 Inspection Module
- Subscribe to sensor topics
- Run OpenCV analysis
- Multi-sensor fusion
- POST results to FastAPI

### 2. FastAPI Backend
- Receive inspection results
- Validate with Pydantic
- Store in PostgreSQL
- Provide REST endpoints

### 3. PostgreSQL Database
Stores all inspection results with history

### 4. React Dashboard
- Inspection.jsx for latest results
- InspectionHistory.jsx for past data
- Toast.jsx for alerts

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Robot OS | ROS2 Jazzy |
| Vision | OpenCV |
| Backend | FastAPI |
| Database | PostgreSQL |
| Frontend | React |

