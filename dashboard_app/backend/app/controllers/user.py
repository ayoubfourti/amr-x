import bcrypt
import secrets
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate

def hash_password(plain: str) -> str:
    return bcrypt.hashpw(
        plain.encode('utf-8'),
        bcrypt.gensalt()
    ).decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    if not plain or not hashed:
        return False
    try:
        # bcrypt hash detection
        if hashed.startswith('$2b$') or \
           hashed.startswith('$2a$') or \
           hashed.startswith('$2y$'):
            return bcrypt.checkpw(
                plain.encode('utf-8'),
                hashed.encode('utf-8')
            )
        # Temporary compatibility for accounts not yet migrated.
        return secrets.compare_digest(plain, hashed)
    except (TypeError, ValueError):
        return False

def get_all_users(db: Session):
    return db.query(User).all()

def create_user(db: Session, data: UserCreate):
    user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        role=data.role or 'operator',
        status='pending'  # requires admin approval
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def update_user(db: Session, user_id: int, data: UserUpdate):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    if data.name is not None:
        user.name = data.name
    if data.email is not None:
        user.email = data.email
    if data.role is not None:
        user.role = data.role
    if data.status is not None:
        user.status = data.status
    db.commit()
    db.refresh(user)
    return user

def delete_user(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    db.delete(user)
    db.commit()
    return {"id": user_id, "deleted": True}

def update_me(db: Session, user_id: int, name: str):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None
    user.name = name
    db.commit()
    db.refresh(user)
    return user
