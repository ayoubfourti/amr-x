from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text
from sqlalchemy.sql import func

from app.db.database import Base


class Mission(Base):
    __tablename__ = "missions"
    id = Column(Integer, primary_key=True, index=True)
    robot_id = Column(Integer)
    name = Column(String(100))
    type = Column(String(30))
    status = Column(String(20), default="pending")
    start_point = Column(String(100))
    destination = Column(String(100))
    module_required = Column(String(30), default="none")
    priority = Column(String(10), default="normal")
    progress = Column(Integer, default=0)
    is_recurring = Column(Boolean, default=False)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    duration_seconds = Column(Integer)
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
