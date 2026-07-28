from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class MissionCreate(BaseModel):
    robot_id: int
    name: str
    type: str
    destination: str
    priority: str
    module_required: Optional[str] = "none"

class MissionResponse(BaseModel):
    id: int
    name: str
    type: str
    status: str
    destination: str
    priority: str
    progress: int
    created_at: datetime

    class Config:
        from_attributes = True
