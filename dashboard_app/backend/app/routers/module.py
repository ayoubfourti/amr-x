from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.controllers.module import get_all_modules, toggle_module

router = APIRouter(prefix="/api/modules", tags=["Modules"])

@router.get("/")
def get_modules(db: Session = Depends(get_db)):
    return get_all_modules(db)

@router.put("/{module_id}/toggle")
def toggle(module_id: int, is_active: bool, db: Session = Depends(get_db)):
    return toggle_module(db, module_id, is_active)
