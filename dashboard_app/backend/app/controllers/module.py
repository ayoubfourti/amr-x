from sqlalchemy.orm import Session
from app.models.module import Module
from app.schemas.module import ModuleCreate

def get_all_modules(db: Session):
    return db.query(Module).all()

def create_module(db: Session, data: ModuleCreate):
    module = Module(
        robot_id=data.robot_id,
        name=data.name,
        type=data.type,
        status=data.status,
        is_active=data.is_active,
        temperature=data.temperature,
        firmware=data.firmware,
    )
    db.add(module)
    db.commit()
    db.refresh(module)
    return module

def toggle_module(db: Session, module_id: int, is_active: bool):
    module = db.query(Module).filter(Module.id == module_id).first()
    if not module:
        return None
    module.is_active = is_active
    db.commit()
    db.refresh(module)
    return module
