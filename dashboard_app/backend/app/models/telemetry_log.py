from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from app.db.database import Base

class TelemetryLog(Base):
    __tablename__ = "telemetry_logs"
    id = Column(Integer, primary_key=True, index=True)
    robot_id = Column(Integer)
    battery = Column(Float)
    speed = Column(Float)
    position_x = Column(Float)
    position_y = Column(Float)
    orientation = Column(Float)
    mode = Column(String(20))
    mission_id = Column(Integer)
    recorded_at = Column(DateTime, server_default=func.now())
