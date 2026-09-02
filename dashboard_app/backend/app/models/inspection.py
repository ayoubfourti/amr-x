from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from app.db.database import Base
import enum

class DefectType(str, enum.Enum):
    NONE = "none"
    CRACK = "crack"
    OVERHEATING = "overheating"
    GAS_LEAK = "gas_leak"

class Inspection(Base):
    __tablename__ = "inspections"
    
    id = Column(Integer, primary_key=True, index=True)
    robot_id = Column(Integer)
    
    # Defect detection results
    defect_type = Column(String(20), default=DefectType.NONE.value)
    confidence = Column(Float)
    sensor_source = Column(String(20))
    
    # Sensor readings
    rgb_image_path = Column(String(255))
    thermal_image_path = Column(String(255))
    gas_concentration = Column(Float)
    
    # Metadata
    inspection_type = Column(String(50))
    message = Column(String(255))
    created_at = Column(DateTime, server_default=func.now())
