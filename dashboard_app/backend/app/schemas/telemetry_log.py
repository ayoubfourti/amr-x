from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TelemetryLogResponse(BaseModel):
    id: int
    robot_id: int
    battery: float
    speed: float
    position_x: float
    position_y: float
    orientation: float
    mode: str
    recorded_at: datetime

    class Config:
        from_attributes = True
