from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.controllers.mission import get_all_missions, get_mission_by_id, create_mission, delete_mission
from app.schemas.mission import MissionCreate

router = APIRouter(prefix="/api/missions", tags=["Missions"])

@router.get("/")
def get_missions(db: Session = Depends(get_db)):
    return get_all_missions(db)

@router.get("/{mission_id}")
def get_mission(mission_id: int, db: Session = Depends(get_db)):
    return get_mission_by_id(db, mission_id)

@router.post("/")
def add_mission(data: MissionCreate, db: Session = Depends(get_db)):
    return create_mission(db, data)

@router.delete("/{mission_id}")
def remove_mission(mission_id: int, db: Session = Depends(get_db)):
    return delete_mission(db, mission_id)
