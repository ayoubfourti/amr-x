from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TelemetryLogResponse(BaseModel):
    id: int
    robot_id: Optional[int] = None
    battery: Optional[float] = None
    speed: Optional[float] = None
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    orientation: Optional[float] = None
    mode: Optional[str] = None
    mission_id: Optional[int] = None
    recorded_at: datetime

    class Config:
        from_attributes = True
