from app.db.database import SessionLocal
from app.models.user import User
from sqlalchemy import text

db = SessionLocal()

# Show all users and their status
users = db.query(User).all()
print("All users:")
for u in users:
    status = getattr(u, 'status', 'NO STATUS COLUMN')
    print(f"  {u.email} | role={u.role} | status={status}")

# Approve all existing users
try:
    db.execute(text(
        "UPDATE users SET status='approved' "
        "WHERE status IS NULL OR status='pending'"
    ))
    db.commit()
    print("All users approved!")
except Exception as e:
    print(f"Error: {e}")
    # Column might not exist yet
    print("Run the migration first:")
    print("ALTER TABLE users ADD COLUMN IF NOT EXISTS")
    print("status VARCHAR(20) NOT NULL DEFAULT 'approved'")

db.close()
