from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.controllers.module import get_all_modules, toggle_module, create_module
from app.schemas.module import ModuleCreate

router = APIRouter(prefix="/api/modules", tags=["Modules"])

@router.get("/")
def get_modules(db: Session = Depends(get_db)):
    return get_all_modules(db)

@router.post("/")
def add_module(data: ModuleCreate, db: Session = Depends(get_db)):
    return create_module(db, data)

@router.put("/{module_id}/toggle")
def toggle(module_id: int, is_active: bool, db: Session = Depends(get_db)):
    module = toggle_module(db, module_id, is_active)
    if not module:
        raise HTTPException(404, "Module not found")
    return module
