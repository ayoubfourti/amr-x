from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class RobotCreate(BaseModel):
    name: str
    ip_address: Optional[str] = None

class RobotResponse(BaseModel):
    id: int
    name: str
    status: str
    battery: float
    speed: float
    position_x: float
    position_y: float
    orientation: float
    mode: str
    ip_address: Optional[str]
    wifi_latency: int

    class Config:
        from_attributes = True