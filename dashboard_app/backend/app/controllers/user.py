from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate

def get_all_users(db: Session):
    return db.query(User).all()

def create_user(db: Session, data: UserCreate):
    user = User(
        name=data.name,
        email=data.email,
        password_hash=data.password,
        role=data.role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
