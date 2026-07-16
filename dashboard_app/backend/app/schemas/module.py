from pydantic import BaseModel
from typing import Optional

class ModuleResponse(BaseModel):
    id: int
    robot_id: int
    name: str
    type: str
    status: str
    is_active: bool
    temperature: Optional[float]
    firmware: Optional[str]

    class Config:
        from_attributes = True
