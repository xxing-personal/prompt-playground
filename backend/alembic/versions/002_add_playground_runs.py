"""Add playground_runs table

Revision ID: 002
Revises: 001_initial
Create Date: 2024-12-15

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'playground_runs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('prompt_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('version_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('config', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('results', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['prompt_id'], ['prompts.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['version_id'], ['prompt_versions.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_playground_runs_prompt_id', 'playground_runs', ['prompt_id'])
    op.create_index('idx_playground_runs_created_at', 'playground_runs', ['created_at'])


def downgrade() -> None:
    op.drop_index('idx_playground_runs_created_at', table_name='playground_runs')
    op.drop_index('idx_playground_runs_prompt_id', table_name='playground_runs')
    op.drop_table('playground_runs')
