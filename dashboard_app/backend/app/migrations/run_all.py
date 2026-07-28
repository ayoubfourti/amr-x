from app.db.database import engine
from sqlalchemy import text

migrations = [
  # Add status to users
  """ALTER TABLE users
     ADD COLUMN IF NOT EXISTS status
     VARCHAR(20) NOT NULL DEFAULT 'approved'""",

  # Set all existing users to approved
  """UPDATE users
     SET status = 'approved'
     WHERE status IS NULL""",

  # Add resolved_at to alerts
  """ALTER TABLE alerts
     ADD COLUMN IF NOT EXISTS resolved_at
     TIMESTAMP""",

  # Add duration_seconds to missions
  """ALTER TABLE missions
     ADD COLUMN IF NOT EXISTS duration_seconds
     INTEGER""",

  # Add notes to missions
  """ALTER TABLE missions
     ADD COLUMN IF NOT EXISTS notes TEXT""",

  # Add recorded_at to telemetry_logs if missing
  """ALTER TABLE telemetry_logs
     ADD COLUMN IF NOT EXISTS recorded_at
     TIMESTAMP DEFAULT NOW()""",
]

print("Running migrations...")
with engine.connect() as conn:
  for sql in migrations:
    try:
      conn.execute(text(sql))
      conn.commit()
      print(f"OK: {sql[:50]}...")
    except Exception as e:
      print(f"SKIP (already exists): {e}")
      conn.rollback()

print("All migrations complete!")
