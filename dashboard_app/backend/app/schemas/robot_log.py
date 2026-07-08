from pydantic import BaseModel
from datetime import datetime

class RobotLogResponse(BaseModel):
    id: int
    robot_id: int
    level: str
    message: str
    created_at: datetime

    class Config:
        from_attributes = True
