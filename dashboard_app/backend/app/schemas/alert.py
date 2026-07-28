from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AlertResponse(BaseModel):
    id: int
    robot_id: Optional[int] = None
    type: str
    message: str
    is_resolved: bool
    created_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True
