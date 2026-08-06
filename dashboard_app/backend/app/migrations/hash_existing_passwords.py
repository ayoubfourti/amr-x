from app.db.database import SessionLocal
from app.models.user import User
from app.controllers.user import hash_password

db = SessionLocal()
users = db.query(User).all()
updated = 0

for user in users:
    # Check if already hashed (bcrypt hashes
    # start with $2b$)
    if not user.password_hash.startswith('$2b$'):
        print(f"Hashing password for: {user.email}")
        user.password_hash = hash_password(user.password_hash)
        updated += 1

db.commit()
db.close()
print(f"Done! Updated {updated} passwords.")
