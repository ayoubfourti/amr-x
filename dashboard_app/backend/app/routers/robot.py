from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.controllers.robot import get_all_robots, get_robot_by_id, create_robot, update_robot_status
from app.schemas.robot import RobotCreate

router = APIRouter(prefix="/api/robots", tags=["Robots"])

@router.get("/")
def get_robots(db: Session = Depends(get_db)):
    return get_all_robots(db)

@router.get("/{robot_id}")
def get_robot(robot_id: int, db: Session = Depends(get_db)):
    return get_robot_by_id(db, robot_id)

@router.post("/")
def add_robot(data: RobotCreate, db: Session = Depends(get_db)):
    return create_robot(db, data.name, data.ip_address)

@router.put("/{robot_id}/status")
def update_status(robot_id: int, data: dict, db: Session = Depends(get_db)):
    return update_robot_status(db, robot_id, data)