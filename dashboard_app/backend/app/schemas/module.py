from pydantic import BaseModel
from typing import Optional

class ModuleCreate(BaseModel):
    robot_id: int
    name: str
    type: str
    status: Optional[str] = "disconnected"
    is_active: Optional[bool] = False
    temperature: Optional[float] = None
    firmware: Optional[str] = None

class ModuleResponse(BaseModel):
    id: int
    robot_id: int
    name: str
    type: str
    status: str
    is_active: bool
    temperature: Optional[float]
    firmware: Optional[str]

    class Config:
        from_attributes = True
