from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.controllers.robot import (
    get_all_robots, get_robot_by_id,
    create_robot, update_robot_status,
    update_telemetry, get_telemetry_history
)
from app.schemas.robot import RobotCreate, RobotStatusUpdate, TelemetryUpdate

router = APIRouter(prefix="/api/robots", tags=["Robots"])

@router.get("/")
def get_robots(db: Session = Depends(get_db)):
    return get_all_robots(db)

@router.get("/{robot_id}")
def get_robot(robot_id: int, db: Session = Depends(get_db)):
    robot = get_robot_by_id(db, robot_id)
    if not robot:
        raise HTTPException(404, "Robot not found")
    return robot

@router.post("/")
def add_robot(data: RobotCreate, db: Session = Depends(get_db)):
    return create_robot(db, data.name, data.ip_address)

@router.put("/{robot_id}/status")
def update_status(
    robot_id: int,
    data: RobotStatusUpdate,
    db: Session = Depends(get_db),
):
    robot = update_robot_status(db, robot_id, data.model_dump(exclude_none=True))
    if not robot:
        raise HTTPException(404, "Robot not found")
    return robot

@router.post("/{robot_id}/telemetry")
def receive_telemetry(
    robot_id: int,
    data: TelemetryUpdate,
    db: Session = Depends(get_db)
):
    # No auth — called directly by robot hardware
    robot = update_telemetry(db, robot_id, data)
    if not robot:
        raise HTTPException(404, "Robot not found")
    return robot

@router.get("/{robot_id}/telemetry")
def get_telemetry(
    robot_id: int,
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    robot = get_robot_by_id(db, robot_id)
    if not robot:
        raise HTTPException(404, "Robot not found")
    return get_telemetry_history(db, robot_id, limit)
