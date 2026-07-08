from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from app.db.database import Base

class RobotLog(Base):
    __tablename__ = "robot_logs"
    id = Column(Integer, primary_key=True, index=True)
    robot_id = Column(Integer)
    level = Column(String(10))
    message = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
