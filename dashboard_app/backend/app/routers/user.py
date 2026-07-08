from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.controllers.user import get_all_users, create_user
from app.schemas.user import UserCreate

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.get("/")
def get_users(db: Session = Depends(get_db)):
    return get_all_users(db)

@router.post("/")
def add_user(data: UserCreate, db: Session = Depends(get_db)):
    return create_user(db, data)
