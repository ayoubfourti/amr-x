import os
import secrets
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.controllers.user import hash_password, verify_password
from pydantic import BaseModel

router = APIRouter(prefix="/api/auth", tags=["Auth"])

ADMIN_SECRET_CODE = os.getenv("ADMIN_CODE")
# This is the secret code that grants
# instant admin approval.
# Stored in .env as ADMIN_CODE.

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = None
    admin_code: Optional[str] = None

@router.post("/login")
def login(data: LoginRequest,
          db: Session = Depends(get_db)):
    # Find user by email
    user = db.query(User).filter(
        User.email == data.email
    ).first()

    # User not found
    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    user_status = getattr(user, 'status', 'approved')

    if user_status == 'pending':
        raise HTTPException(
            status_code=403,
            detail="Account pending admin approval"
        )

    if user_status == 'rejected':
        raise HTTPException(
            status_code=403,
            detail="Account access denied"
        )

    # Return plain dict to avoid Pydantic
    # validation crash on null fields
    return {
        "id": user.id,
        "name": user.name or "",
        "email": user.email,
        "role": user.role or "operator",
        "status": user_status,
        "created_at": str(user.created_at)
                      if user.created_at else None,
    }

@router.post("/register")
def register(
    data: RegisterRequest,
    db: Session = Depends(get_db)
):
    # Check if email already exists
    existing = db.query(User).filter(
        User.email == data.email
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Determine role and status based on
    # admin code and existing users
    total_users = db.query(User).count()

    is_admin_code = bool(
        ADMIN_SECRET_CODE
        and data.admin_code
        and secrets.compare_digest(data.admin_code, ADMIN_SECRET_CODE)
    )
    is_first_user = total_users == 0

    if is_first_user or is_admin_code:
        role = 'admin'
        status = 'approved'
    else:
        role = 'operator'
        status = 'pending'

    user = User(
        name=data.name or data.email.split('@')[0],
        email=data.email,
        password_hash=hash_password(data.password),
        role=role,
        status=status,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "status": user.status,
        "created_at": str(user.created_at)
                      if user.created_at else None,
        "message": "Admin account created!"
                   if status == 'approved'
                   else "Account created! "
                        "Waiting for admin approval.",
        "auto_approved": status == 'approved',
    }
