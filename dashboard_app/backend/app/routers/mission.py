from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.controllers.mission import (
    get_all_missions, get_mission_by_id,
    create_mission, delete_mission,
    start_mission, pause_mission,
    resume_mission, stop_mission,
    update_mission_progress
)
from app.schemas.mission import MissionCreate

router = APIRouter(prefix="/api/missions", tags=["Missions"])

@router.get("/")
def get_missions(db: Session = Depends(get_db)):
    return get_all_missions(db)

@router.post("/")
def add_mission(data: MissionCreate, db: Session = Depends(get_db)):
    return create_mission(db, data)

# NOTE: these specific-suffix PATCH routes must be declared before the
# generic /{mission_id} GET route below, otherwise FastAPI would try to
# match "start"/"pause"/etc. as the mission_id path parameter.
@router.patch("/{mission_id}/start")
def start(mission_id: int, db: Session = Depends(get_db)):
    result = start_mission(db, mission_id)
    if result is None:
        raise HTTPException(404, "Mission not found")
    if isinstance(result, dict) and "error" in result:
        raise HTTPException(400, result["error"])
    return result

@router.patch("/{mission_id}/pause")
def pause(mission_id: int, db: Session = Depends(get_db)):
    result = pause_mission(db, mission_id)
    if result is None:
        raise HTTPException(404, "Mission not found")
    if isinstance(result, dict) and "error" in result:
        raise HTTPException(400, result["error"])
    return result

@router.patch("/{mission_id}/resume")
def resume(mission_id: int, db: Session = Depends(get_db)):
    result = resume_mission(db, mission_id)
    if result is None:
        raise HTTPException(404, "Mission not found")
    if isinstance(result, dict) and "error" in result:
        raise HTTPException(400, result["error"])
    return result

@router.patch("/{mission_id}/stop")
def stop(mission_id: int, db: Session = Depends(get_db)):
    result = stop_mission(db, mission_id)
    if result is None:
        raise HTTPException(404, "Mission not found")
    if isinstance(result, dict) and "error" in result:
        raise HTTPException(400, result["error"])
    return result

@router.patch("/{mission_id}/progress")
def set_progress(
    mission_id: int,
    progress: int = Body(..., ge=0, le=100, embed=True),
    db: Session = Depends(get_db)
):
    result = update_mission_progress(db, mission_id, progress)
    if result is None:
        raise HTTPException(404, "Mission not found")
    return result

@router.get("/{mission_id}")
def get_mission(mission_id: int, db: Session = Depends(get_db)):
    mission = get_mission_by_id(db, mission_id)
    if not mission:
        raise HTTPException(404, "Mission not found")
    return mission

@router.delete("/{mission_id}")
def remove_mission(mission_id: int, db: Session = Depends(get_db)):
    mission = delete_mission(db, mission_id)
    if not mission:
        raise HTTPException(404, "Mission not found")
    return {"detail": "Mission deleted"}
