from datetime import datetime
from sqlalchemy.orm import Session
from app.models.mission import Mission
from app.schemas.mission import MissionCreate

def get_all_missions(db: Session):
    return db.query(Mission).all()

def get_mission_by_id(db: Session, mission_id: int):
    return db.query(Mission).filter(Mission.id == mission_id).first()

def create_mission(db: Session, data: MissionCreate):
    mission = Mission(**data.model_dump())
    db.add(mission)
    db.commit()
    db.refresh(mission)
    return mission

def delete_mission(db: Session, mission_id: int):
    mission = db.query(Mission).filter(Mission.id == mission_id).first()
    if not mission:
        return None
    db.delete(mission)
    db.commit()
    return mission

def start_mission(db: Session, mission_id: int):
    mission = db.query(Mission).filter(Mission.id == mission_id).first()
    if not mission:
        return None
    if mission.status not in ('pending', 'paused'):
        return {"error": f"Cannot start mission with status '{mission.status}'"}
    mission.status = 'running'
    mission.started_at = datetime.utcnow()
    db.commit()
    db.refresh(mission)
    return mission

def pause_mission(db: Session, mission_id: int):
    mission = db.query(Mission).filter(Mission.id == mission_id).first()
    if not mission:
        return None
    if mission.status != 'running':
        return {"error": "Can only pause a running mission"}
    mission.status = 'paused'
    db.commit()
    db.refresh(mission)
    return mission

def resume_mission(db: Session, mission_id: int):
    mission = db.query(Mission).filter(Mission.id == mission_id).first()
    if not mission:
        return None
    if mission.status != 'paused':
        return {"error": "Can only resume a paused mission"}
    mission.status = 'running'
    db.commit()
    db.refresh(mission)
    return mission

def stop_mission(db: Session, mission_id: int):
    mission = db.query(Mission).filter(Mission.id == mission_id).first()
    if not mission:
        return None
    if mission.status in ('completed', 'failed'):
        return {"error": "Mission already finished"}
    mission.status = 'failed'
    mission.completed_at = datetime.utcnow()
    if mission.started_at:
        delta = datetime.utcnow() - mission.started_at
        mission.duration_seconds = int(delta.total_seconds())
    db.commit()
    db.refresh(mission)
    return mission

def update_mission_progress(db: Session, mission_id: int, progress: int):
    mission = db.query(Mission).filter(Mission.id == mission_id).first()
    if not mission:
        return None
    mission.progress = progress
    if progress >= 100 and mission.status == 'running':
        mission.status = 'completed'
        mission.completed_at = datetime.utcnow()
        if mission.started_at:
            delta = datetime.utcnow() - mission.started_at
            mission.duration_seconds = int(delta.total_seconds())
    db.commit()
    db.refresh(mission)
    return mission
