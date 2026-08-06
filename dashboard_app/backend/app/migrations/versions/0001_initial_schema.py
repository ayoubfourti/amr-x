"""Create the initial dashboard schema.

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-07-31

This migration is also safe for development databases created before Alembic
was introduced. In that case it keeps existing tables and adds the columns
that were previously handled by the legacy migration script.
"""

from collections.abc import Callable
from typing import Union

from alembic import op
import sqlalchemy as sa

revision: str = "0001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, tuple[str, ...], None] = None
depends_on: Union[str, tuple[str, ...], None] = None


def _existing_columns(table_name: str) -> set[str]:
    inspector = sa.inspect(op.get_bind())
    return {column["name"] for column in inspector.get_columns(table_name)}


def _add_column_if_missing(
    table_name: str,
    column_name: str,
    column_factory: Callable[[], sa.Column],
) -> None:
    if column_name not in _existing_columns(table_name):
        op.add_column(table_name, column_factory())


def _create_index_if_missing(table_name: str, index_name: str) -> None:
    inspector = sa.inspect(op.get_bind())
    existing_indexes = {index["name"] for index in inspector.get_indexes(table_name)}
    if index_name not in existing_indexes:
        op.create_index(index_name, table_name, ["id"])


def upgrade() -> None:
    inspector = sa.inspect(op.get_bind())
    existing_tables = set(inspector.get_table_names())

    if "users" not in existing_tables:
        op.create_table(
            "users",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("name", sa.String(length=50)),
            sa.Column("email", sa.String(length=100), unique=True),
            sa.Column("password_hash", sa.String(length=255)),
            sa.Column("role", sa.String(length=20)),
            sa.Column(
                "status",
                sa.String(length=20),
                nullable=False,
                server_default="approved",
            ),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
            sa.Column("last_login", sa.DateTime()),
        )
    else:
        _add_column_if_missing(
            "users",
            "status",
            lambda: sa.Column(
                "status",
                sa.String(length=20),
                nullable=False,
                server_default="approved",
            ),
        )
    _create_index_if_missing("users", "ix_users_id")

    if "robots" not in existing_tables:
        op.create_table(
            "robots",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("name", sa.String(length=50), nullable=False),
            sa.Column("status", sa.String(length=20)),
            sa.Column("battery", sa.Float()),
            sa.Column("speed", sa.Float()),
            sa.Column("position_x", sa.Float()),
            sa.Column("position_y", sa.Float()),
            sa.Column("orientation", sa.Float()),
            sa.Column("mode", sa.String(length=20)),
            sa.Column("ip_address", sa.String(length=20)),
            sa.Column("wifi_latency", sa.Integer()),
            sa.Column("last_seen", sa.DateTime(), server_default=sa.func.now()),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        )
    _create_index_if_missing("robots", "ix_robots_id")

    if "missions" not in existing_tables:
        op.create_table(
            "missions",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("robot_id", sa.Integer()),
            sa.Column("name", sa.String(length=100)),
            sa.Column("type", sa.String(length=30)),
            sa.Column("status", sa.String(length=20)),
            sa.Column("start_point", sa.String(length=100)),
            sa.Column("destination", sa.String(length=100)),
            sa.Column("module_required", sa.String(length=30)),
            sa.Column("priority", sa.String(length=10)),
            sa.Column("progress", sa.Integer()),
            sa.Column("is_recurring", sa.Boolean()),
            sa.Column("started_at", sa.DateTime()),
            sa.Column("completed_at", sa.DateTime()),
            sa.Column("duration_seconds", sa.Integer()),
            sa.Column("notes", sa.Text()),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        )
    else:
        _add_column_if_missing(
            "missions",
            "duration_seconds",
            lambda: sa.Column("duration_seconds", sa.Integer()),
        )
        _add_column_if_missing(
            "missions", "notes", lambda: sa.Column("notes", sa.Text())
        )
    _create_index_if_missing("missions", "ix_missions_id")

    if "modules" not in existing_tables:
        op.create_table(
            "modules",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("robot_id", sa.Integer()),
            sa.Column("name", sa.String(length=50)),
            sa.Column("type", sa.String(length=30)),
            sa.Column("status", sa.String(length=20)),
            sa.Column("is_active", sa.Boolean()),
            sa.Column("temperature", sa.Float()),
            sa.Column("firmware", sa.String(length=20)),
            sa.Column("last_update", sa.DateTime(), server_default=sa.func.now()),
        )
    _create_index_if_missing("modules", "ix_modules_id")

    if "alerts" not in existing_tables:
        op.create_table(
            "alerts",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("robot_id", sa.Integer()),
            sa.Column("module_id", sa.Integer()),
            sa.Column("type", sa.String(length=10)),
            sa.Column("message", sa.Text()),
            sa.Column("is_resolved", sa.Boolean()),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
            sa.Column("resolved_at", sa.DateTime()),
        )
    else:
        _add_column_if_missing(
            "alerts", "resolved_at", lambda: sa.Column("resolved_at", sa.DateTime())
        )
    _create_index_if_missing("alerts", "ix_alerts_id")

    if "robot_logs" not in existing_tables:
        op.create_table(
            "robot_logs",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("robot_id", sa.Integer()),
            sa.Column("level", sa.String(length=10)),
            sa.Column("message", sa.Text()),
            sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        )
    _create_index_if_missing("robot_logs", "ix_robot_logs_id")

    if "telemetry_logs" not in existing_tables:
        op.create_table(
            "telemetry_logs",
            sa.Column("id", sa.Integer(), primary_key=True),
            sa.Column("robot_id", sa.Integer()),
            sa.Column("battery", sa.Float()),
            sa.Column("speed", sa.Float()),
            sa.Column("position_x", sa.Float()),
            sa.Column("position_y", sa.Float()),
            sa.Column("orientation", sa.Float()),
            sa.Column("mode", sa.String(length=20)),
            sa.Column("mission_id", sa.Integer()),
            sa.Column("recorded_at", sa.DateTime(), server_default=sa.func.now()),
        )
    else:
        _add_column_if_missing(
            "telemetry_logs",
            "recorded_at",
            lambda: sa.Column(
                "recorded_at", sa.DateTime(), server_default=sa.func.now()
            ),
        )
    _create_index_if_missing("telemetry_logs", "ix_telemetry_logs_id")


def downgrade() -> None:
    op.drop_table("telemetry_logs")
    op.drop_table("robot_logs")
    op.drop_table("alerts")
    op.drop_table("modules")
    op.drop_table("missions")
    op.drop_table("robots")
    op.drop_table("users")
