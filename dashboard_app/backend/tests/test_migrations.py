import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

from sqlalchemy import create_engine, inspect, text


BACKEND_ROOT = Path(__file__).resolve().parents[1]


class DatabaseMigrationTests(unittest.TestCase):
    def test_fresh_database_gets_complete_schema(self):
        with tempfile.TemporaryDirectory() as temporary_directory:
            database_path = Path(temporary_directory) / "dashboard.db"
            database_url = f"sqlite:///{database_path}"
            environment = os.environ.copy()
            environment["DATABASE_URL"] = database_url

            command = [
                sys.executable,
                "-m",
                "alembic",
                "-c",
                "alembic.ini",
                "upgrade",
                "head",
            ]
            subprocess.run(
                command,
                cwd=BACKEND_ROOT,
                env=environment,
                check=True,
                capture_output=True,
                text=True,
            )

            engine = create_engine(database_url)
            inspector = inspect(engine)
            expected_tables = {
                "alembic_version",
                "alerts",
                "missions",
                "modules",
                "robot_logs",
                "robots",
                "telemetry_logs",
                "users",
            }
            self.assertEqual(set(inspector.get_table_names()), expected_tables)
            self.assertIn(
                "notes",
                {column["name"] for column in inspector.get_columns("missions")},
            )

            with engine.connect() as connection:
                revision = connection.execute(
                    text("SELECT version_num FROM alembic_version")
                ).scalar_one()
            self.assertEqual(revision, "0001_initial_schema")

            schema_check = subprocess.run(
                [*command[:-2], "check"],
                cwd=BACKEND_ROOT,
                env=environment,
                capture_output=True,
                text=True,
            )
            self.assertEqual(
                schema_check.returncode,
                0,
                msg=schema_check.stdout + schema_check.stderr,
            )

            # Starting the backend repeatedly must not recreate or damage tables.
            subprocess.run(
                command,
                cwd=BACKEND_ROOT,
                env=environment,
                check=True,
                capture_output=True,
                text=True,
            )


if __name__ == "__main__":
    unittest.main()
