"""Initial migration

Revision ID: 001
Revises:
Create Date: 2024-01-01

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Projects
    op.create_table('projects',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # Use Cases
    op.create_table('use_cases',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Prompts
    op.create_table('prompts',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('use_case_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('tags', postgresql.ARRAY(sa.String()), nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['use_case_id'], ['use_cases.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_prompts_tags', 'prompts', ['tags'], postgresql_using='gin')

    # Prompt Versions
    op.create_table('prompt_versions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('prompt_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('version_number', sa.Integer(), nullable=False),
        sa.Column('type', sa.String(10), nullable=False, server_default='text'),
        sa.Column('template_text', sa.Text(), nullable=True),
        sa.Column('template_messages', postgresql.JSONB(), nullable=True),
        sa.Column('model_defaults', postgresql.JSONB(), nullable=False, server_default='{}'),
        sa.Column('variables_schema', postgresql.JSONB(), nullable=True),
        sa.Column('commit_message', sa.Text(), nullable=True),
        sa.Column('created_by', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('labels', postgresql.ARRAY(sa.String()), nullable=False, server_default='{}'),
        sa.ForeignKeyConstraint(['prompt_id'], ['prompts.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('prompt_id', 'version_number', name='uq_prompt_version')
    )
    op.create_index('idx_prompt_versions_labels', 'prompt_versions', ['labels'], postgresql_using='gin')

    # Partial unique indexes for labels (only one prod/beta/alpha per prompt)
    op.execute("""
        CREATE UNIQUE INDEX idx_prompt_versions_prod
        ON prompt_versions (prompt_id)
        WHERE 'production' = ANY(labels)
    """)
    op.execute("""
        CREATE UNIQUE INDEX idx_prompt_versions_beta
        ON prompt_versions (prompt_id)
        WHERE 'beta' = ANY(labels)
    """)
    op.execute("""
        CREATE UNIQUE INDEX idx_prompt_versions_alpha
        ON prompt_versions (prompt_id)
        WHERE 'alpha' = ANY(labels)
    """)

    # Datasets
    op.create_table('datasets',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('use_case_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('input_schema', postgresql.JSONB(), nullable=True),
        sa.Column('expected_output_schema', postgresql.JSONB(), nullable=True),
        sa.Column('default_assertions', postgresql.JSONB(), nullable=False, server_default='[]'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['use_case_id'], ['use_cases.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Dataset Items
    op.create_table('dataset_items',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('dataset_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('input', postgresql.JSONB(), nullable=False),
        sa.Column('expected_output', postgresql.JSONB(), nullable=True),
        sa.Column('metadata', postgresql.JSONB(), nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['dataset_id'], ['datasets.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Eval Runs
    op.create_table('eval_runs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(255), nullable=True),
        sa.Column('prompt_version_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('dataset_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('models', postgresql.JSONB(), nullable=False),
        sa.Column('assertions', postgresql.JSONB(), nullable=False, server_default='[]'),
        sa.Column('status', sa.String(20), nullable=False, server_default='pending'),
        sa.Column('progress', postgresql.JSONB(), nullable=False, server_default='{}'),
        sa.Column('summary', postgresql.JSONB(), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_by', sa.String(255), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('share_token', sa.String(32), nullable=True),
        sa.Column('share_expires_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['prompt_version_id'], ['prompt_versions.id']),
        sa.ForeignKeyConstraint(['dataset_id'], ['datasets.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('share_token')
    )
    op.create_index('idx_eval_runs_status', 'eval_runs', ['status'],
                    postgresql_where=sa.text("status IN ('pending', 'running')"))

    # Eval Results
    op.create_table('eval_results',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('eval_run_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('dataset_item_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('model_id', sa.String(100), nullable=False),
        sa.Column('model_config', postgresql.JSONB(), nullable=False),
        sa.Column('request', postgresql.JSONB(), nullable=False),
        sa.Column('output', sa.Text(), nullable=True),
        sa.Column('output_json', postgresql.JSONB(), nullable=True),
        sa.Column('grading', postgresql.JSONB(), nullable=False),
        sa.Column('metrics', postgresql.JSONB(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['eval_run_id'], ['eval_runs.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['dataset_item_id'], ['dataset_items.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('eval_run_id', 'dataset_item_id', 'model_id', name='uq_eval_result')
    )
    op.create_index('idx_eval_results_run_item', 'eval_results', ['eval_run_id', 'dataset_item_id'])


def downgrade() -> None:
    op.drop_table('eval_results')
    op.drop_table('eval_runs')
    op.drop_table('dataset_items')
    op.drop_table('datasets')
    op.drop_index('idx_prompt_versions_alpha', 'prompt_versions')
    op.drop_index('idx_prompt_versions_beta', 'prompt_versions')
    op.drop_index('idx_prompt_versions_prod', 'prompt_versions')
    op.drop_table('prompt_versions')
    op.drop_table('prompts')
    op.drop_table('use_cases')
    op.drop_table('projects')
