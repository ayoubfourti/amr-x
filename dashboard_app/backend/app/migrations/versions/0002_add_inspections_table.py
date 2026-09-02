"""add inspections table

Revision ID: 0002
Revises: 0001_initial_schema
Create Date: 2026-08-21 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0002'
down_revision = '0001_initial_schema'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'inspections',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('robot_id', sa.Integer(), nullable=True),
        sa.Column('defect_type', sa.String(length=20), nullable=True),
        sa.Column('confidence', sa.Float(), nullable=True),
        sa.Column('sensor_source', sa.String(length=20), nullable=True),
        sa.Column('rgb_image_path', sa.String(length=255), nullable=True),
        sa.Column('thermal_image_path', sa.String(length=255), nullable=True),
        sa.Column('gas_concentration', sa.Float(), nullable=True),
        sa.Column('inspection_type', sa.String(length=50), nullable=True),
        sa.Column('message', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_inspections_id'), 'inspections', ['id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_inspections_id'), table_name='inspections')
    op.drop_table('inspections')
