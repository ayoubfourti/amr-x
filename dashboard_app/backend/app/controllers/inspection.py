from sqlalchemy.orm import Session
from app.models.inspection import Inspection
from app.schemas.inspection import InspectionCreate

def create_inspection(db: Session, data: InspectionCreate):
    inspection = Inspection(
        robot_id=data.robot_id,
        defect_type=data.defect_type,
        confidence=data.confidence,
        sensor_source=data.sensor_source,
        rgb_image_path=data.rgb_image_path,
        thermal_image_path=data.thermal_image_path,
        gas_concentration=data.gas_concentration,
        inspection_type=data.inspection_type,
        message=data.message,
    )
    db.add(inspection)
    db.commit()
    db.refresh(inspection)
    return inspection

def get_all_inspections(db: Session, robot_id: int = None):
    query = db.query(Inspection)
    if robot_id:
        query = query.filter(Inspection.robot_id == robot_id)
    return query.order_by(Inspection.created_at.desc()).all()

def get_latest_inspection(db: Session, robot_id: int = None):
    query = db.query(Inspection)
    if robot_id:
        query = query.filter(Inspection.robot_id == robot_id)
    return query.order_by(Inspection.created_at.desc()).first()

def get_inspection_by_id(db: Session, inspection_id: int):
    return db.query(Inspection).filter(Inspection.id == inspection_id).first()
