from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class MissionCreate(BaseModel):
    robot_id: int
    name: str
    type: str
    start_point: Optional[str] = None
    destination: str
    priority: str
    module_required: Optional[str] = "none"
    is_recurring: bool = False


class MissionResponse(BaseModel):
    id: int
    robot_id: int
    name: str
    type: str
    status: str
    start_point: Optional[str] = None
    destination: str
    module_required: Optional[str] = "none"
    priority: str
    progress: int
    is_recurring: bool = False
    created_at: datetime

    class Config:
        from_attributes = True
