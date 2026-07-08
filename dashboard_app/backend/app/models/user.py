from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.db.database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50))
    email = Column(String(100), unique=True)
    password_hash = Column(String(255))
    role = Column(String(20), default="operator")
    created_at = Column(DateTime, server_default=func.now())
    last_login = Column(DateTime)
