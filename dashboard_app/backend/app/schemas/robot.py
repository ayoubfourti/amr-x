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

class RobotStatusUpdate(BaseModel):
    status: Optional[str] = None
    battery: Optional[float] = None
    speed: Optional[float] = None
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    orientation: Optional[float] = None
    mode: Optional[str] = None
    ip_address: Optional[str] = None
    wifi_latency: Optional[int] = None

class TelemetryUpdate(BaseModel):
    battery: Optional[float] = None
    speed: Optional[float] = None
    position_x: Optional[float] = None
    position_y: Optional[float] = None
    orientation: Optional[float] = None
    mode: Optional[str] = None
    wifi_latency: Optional[int] = None
    mission_id: Optional[int] = None
