from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: Optional[str] = "operator"
    status: Optional[str] = "pending"

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    status: str = "approved"
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class MeUpdate(BaseModel):
    name: Optional[str] = None
