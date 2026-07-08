from sqlalchemy.orm import Session
from app.models.module import Module

def get_all_modules(db: Session):
    return db.query(Module).all()

def toggle_module(db: Session, module_id: int, is_active: bool):
    module = db.query(Module).filter(Module.id == module_id).first()
    module.is_active = is_active
    db.commit()
    db.refresh(module)
    return module
