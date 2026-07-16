from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.sql import func
from app.db.database import Base

class Module(Base):
    __tablename__ = "modules"
    id = Column(Integer, primary_key=True, index=True)
    robot_id = Column(Integer)
    name = Column(String(50))
    type = Column(String(30))
    status = Column(String(20), default="disconnected")
    is_active = Column(Boolean, default=False)
    temperature = Column(Float)
    firmware = Column(String(20))
    last_update = Column(DateTime, server_default=func.now())
