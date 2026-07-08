from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from app.db.database import Base

class Robot(Base):
    __tablename__ = "robots"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    status = Column(String(20), default="offline")
    battery = Column(Float, default=0)
    speed = Column(Float, default=0)
    position_x = Column(Float, default=0)
    position_y = Column(Float, default=0)
    orientation = Column(Float, default=0)
    mode = Column(String(20), default="idle")
    ip_address = Column(String(20))
    wifi_latency = Column(Integer, default=0)
    last_seen = Column(DateTime, server_default=func.now())
    created_at = Column(DateTime, server_default=func.now())
