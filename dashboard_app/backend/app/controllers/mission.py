from sqlalchemy.orm import Session
from app.models.mission import Mission
from app.schemas.mission import MissionCreate

def get_all_missions(db: Session):
    return db.query(Mission).all()

def get_mission_by_id(db: Session, mission_id: int):
    return db.query(Mission).filter(Mission.id == mission_id).first()

def create_mission(db: Session, data: MissionCreate):
    mission = Mission(**data.dict())
    db.add(mission)
    db.commit()
    db.refresh(mission)
    return mission

def delete_mission(db: Session, mission_id: int):
    mission = db.query(Mission).filter(Mission.id == mission_id).first()
    db.delete(mission)
    db.commit()
    return mission
