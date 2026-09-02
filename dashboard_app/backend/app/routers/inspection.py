from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.controllers.inspection import (
    get_all_inspections,
    get_latest_inspection,
    get_inspection_by_id,
    create_inspection,
)
from app.schemas.inspection import InspectionCreate, InspectionResponse

router = APIRouter(prefix="/api/inspections", tags=["Inspections"])

@router.post("/", response_model=InspectionResponse)
def add_inspection(data: InspectionCreate, db: Session = Depends(get_db)):
    return create_inspection(db, data)

@router.get("/", response_model=list[InspectionResponse])
def get_inspections(robot_id: int = None, db: Session = Depends(get_db)):
    return get_all_inspections(db, robot_id)

@router.get("/latest", response_model=InspectionResponse)
def get_latest(robot_id: int = None, db: Session = Depends(get_db)):
    inspection = get_latest_inspection(db, robot_id)
    if not inspection:
        raise HTTPException(404, "No inspection found")
    return inspection

@router.get("/{inspection_id}", response_model=InspectionResponse)
def get_inspection(inspection_id: int, db: Session = Depends(get_db)):
    inspection = get_inspection_by_id(db, inspection_id)
    if not inspection:
        raise HTTPException(404, "Inspection not found")
    return inspection
