from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AlertResponse(BaseModel):
    id: int
    robot_id: int
    type: str
    message: str
    is_resolved: bool
    created_at: datetime

    class Config:
        from_attributes = True
