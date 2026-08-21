from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class InspectionCreate(BaseModel):
    robot_id: int
    defect_type: str
    confidence: float
    sensor_source: str
    rgb_image_path: Optional[str] = None
    thermal_image_path: Optional[str] = None
    gas_concentration: Optional[float] = None
    inspection_type: str
    message: str

class InspectionResponse(BaseModel):
    id: int
    robot_id: int
    defect_type: str
    confidence: float
    sensor_source: str
    rgb_image_path: Optional[str] = None
    thermal_image_path: Optional[str] = None
    gas_concentration: Optional[float] = None
    inspection_type: str
    message: str
    created_at: datetime
    
    class Config:
        from_attributes = True
