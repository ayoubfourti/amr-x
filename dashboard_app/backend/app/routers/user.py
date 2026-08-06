# TODO: Add JWT authentication.
# All endpoints currently unprotected.
# Priority: implement auth before production.

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.controllers.user import get_all_users, create_user, update_user, delete_user, update_me
from app.schemas.user import UserCreate, UserUpdate, UserResponse, MeUpdate

router = APIRouter(prefix="/api/users", tags=["Users"])

@router.get("/", response_model=list[UserResponse])
def get_users(db: Session = Depends(get_db)):
    return get_all_users(db)

@router.post("/", response_model=UserResponse)
def add_user(data: UserCreate, db: Session = Depends(get_db)):
    return create_user(db, data)

# Place this BEFORE @router.get("/{user_id}")-style routes so FastAPI
# doesn't try to match "me" as an integer user_id.
@router.patch("/me")
def update_my_profile(
    user_id: int,
    data: MeUpdate,
    db: Session = Depends(get_db)
):
    # user_id passed as query param since no JWT yet
    # TODO: replace with JWT current_user dependency
    if not data.name:
        raise HTTPException(400, "Name is required")
    user = update_me(db, user_id, data.name)
    if not user:
        raise HTTPException(404, "User not found")
    return user

@router.put("/{user_id}", response_model=UserResponse)
def edit_user(user_id: int, data: UserUpdate, db: Session = Depends(get_db)):
    user = update_user(db, user_id, data)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.patch("/{user_id}", response_model=UserResponse)
def patch_user(
    user_id: int,
    data: UserUpdate,
    db: Session = Depends(get_db)
):
    user = update_user(db, user_id, data)
    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    return user

@router.delete("/{user_id}", status_code=200)
def remove_user(user_id: int, db: Session = Depends(get_db)):
    result = delete_user(db, user_id)
    if not result:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )
    return {"detail": "User deleted"}
