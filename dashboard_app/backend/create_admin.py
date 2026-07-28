from app.db.database import SessionLocal
from app.models.user import User

db = SessionLocal()

# Check if admin already exists
existing = db.query(User).filter(
    User.email == "admin@armx.com"
).first()

if existing:
    print(f"Admin already exists: {existing.email}")
    print(f"Status: {existing.status}")
    print(f"Role: {existing.role}")
else:
    admin = User(
        name="Admin",
        email="admin@armx.com",
        password_hash="admin123",
        role="admin",
        status="approved"
    )
    db.add(admin)
    db.commit()
    print("Admin created successfully!")
    print("Email: admin@armx.com")
    print("Password: admin123")

db.close()
