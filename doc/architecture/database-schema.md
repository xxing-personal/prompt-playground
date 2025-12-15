# Database Schema

This document provides a comprehensive overview of the Prompt Playground database schema, including all tables, relationships, and data types.

## Overview

The database uses PostgreSQL with the following key features:

- **UUID primary keys** for distributed-system compatibility
- **Timestamp tracking** on all entities
- **JSONB columns** for flexible data storage
- **Array columns** for tags and labels
- **GIN indexes** for efficient array queries
- **Cascade deletes** for referential integrity

## Entity Relationship Diagram

```
┌─────────────────┐      ┌─────────────────┐
│    Projects     │      │   Use Cases     │
├─────────────────┤      ├─────────────────┤
│ id (PK)         │◄────┐│ id (PK)         │
│ name            │     ││ project_id (FK) │────►
│ description     │     ││ name            │
│ created_at      │     ││ description     │
│ updated_at      │     ││ created_at      │
└─────────────────┘     ││ updated_at      │
                        │└─────────────────┘
                        │         │
                        │         │ 1:N
                        │         ▼
                        │┌─────────────────┐      ┌─────────────────┐
                        ││    Prompts      │      │    Datasets     │
                        │├─────────────────┤      ├─────────────────┤
                        ││ id (PK)         │◄────┐│ id (PK)         │
                        └│ use_case_id (FK)│     ││ use_case_id (FK)│
                         │ name            │     ││ name            │
                         │ description     │     ││ description     │
                         │ tags[]          │     ││ input_schema    │
                         │ created_at      │     ││ expected_schema │
                         │ updated_at      │     ││ default_assert  │
                         └─────────────────┘     ││ created_at      │
                                  │              ││ updated_at      │
                                  │ 1:N          │└─────────────────┘
                                  ▼              │         │
                         ┌─────────────────┐     │         │ 1:N
                         │ Prompt Versions │     │         ▼
                         ├─────────────────┤     │┌─────────────────┐
                         │ id (PK)         │◄───┐││  Dataset Items  │
                         │ prompt_id (FK)  │    │││ ├─────────────────┤
                         │ version_number  │    │││ │ id (PK)         │
                         │ type            │    │││ │ dataset_id (FK) │
                         │ template_text   │    │└┼─│ input           │
                         │ template_msgs   │    │ │ │ expected_output │
                         │ model_defaults  │    │ │ │ metadata        │
                         │ variables_schema│    │ │ │ created_at      │
                         │ labels[]        │    │ │ │ updated_at      │
                         │ created_at      │    │ │ └─────────────────┘
                         │ created_by      │    │ │          │
                         │ commit_message  │    │ │          │
                         └─────────────────┘    │ │          │
                                  │             │ │          │
                                  │ N:1         │ │          │
                                  ▼             │ │          │ N:1
                         ┌─────────────────┐    │ │          │
                         │   Eval Runs     │────┼─┘          │
                         ├─────────────────┤    │            │
                         │ id (PK)         │◄───┼────────────┘
                         │ prompt_ver_id   │────┘
                         │ dataset_id (FK) │
                         │ name            │
                         │ models          │
                         │ assertions      │
                         │ status          │
                         │ progress        │
                         │ summary         │
                         │ created_at      │
                         │ started_at      │
                         │ completed_at    │
                         │ share_token     │
                         │ share_expires   │
                         └─────────────────┘
                                  │
                                  │ 1:N
                                  ▼
                         ┌─────────────────┐
                         │  Eval Results   │
                         ├─────────────────┤
                         │ id (PK)         │
                         │ eval_run_id (FK)│
                         │ dataset_item_id │
                         │ model_id        │
                         │ model_config    │
                         │ request         │
                         │ output          │
                         │ output_json     │
                         │ grading         │
                         │ metrics         │
                         │ created_at      │
                         └─────────────────┘
```

## Table Definitions

### Projects

Top-level organizational container.

```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_projects_name ON projects(name);
CREATE INDEX idx_projects_created_at ON projects(created_at DESC);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique identifier |
| name | VARCHAR(255) | NOT NULL | Project name |
| description | TEXT | | Optional description |
| created_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL, DEFAULT NOW() | Last update timestamp |

### Use Cases

Groups related prompts within a project.

```sql
CREATE TABLE use_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_use_cases_project_id ON use_cases(project_id);
CREATE INDEX idx_use_cases_name ON use_cases(name);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| project_id | UUID | FK → projects(id), CASCADE | Parent project |
| name | VARCHAR(255) | NOT NULL | Use case name |
| description | TEXT | | Optional description |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

### Prompts

Container for prompt versions.

```sql
CREATE TABLE prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    use_case_id UUID NOT NULL REFERENCES use_cases(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    tags VARCHAR[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_prompts_use_case_id ON prompts(use_case_id);
CREATE INDEX idx_prompts_tags ON prompts USING GIN(tags);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| use_case_id | UUID | FK → use_cases(id), CASCADE | Parent use case |
| name | VARCHAR(255) | NOT NULL | Prompt name |
| description | TEXT | | Optional description |
| tags | VARCHAR[] | DEFAULT '{}' | Tag array for filtering |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

### Prompt Versions

Versioned prompt templates.

```sql
CREATE TABLE prompt_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_id UUID NOT NULL REFERENCES prompts(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('text', 'chat')),
    template_text TEXT,
    template_messages JSONB,
    model_defaults JSONB,
    variables_schema JSONB,
    labels VARCHAR[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_by VARCHAR(255),
    commit_message TEXT,

    CONSTRAINT unique_prompt_version UNIQUE (prompt_id, version_number)
);

CREATE INDEX idx_prompt_versions_prompt_id ON prompt_versions(prompt_id);
CREATE INDEX idx_prompt_versions_labels ON prompt_versions USING GIN(labels);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| prompt_id | UUID | FK → prompts(id), CASCADE | Parent prompt |
| version_number | INTEGER | NOT NULL, UNIQUE with prompt_id | Sequential version number |
| type | VARCHAR(10) | NOT NULL, CHECK ('text', 'chat') | Template type |
| template_text | TEXT | | Text template (for type='text') |
| template_messages | JSONB | | Chat messages (for type='chat') |
| model_defaults | JSONB | | Default model configuration |
| variables_schema | JSONB | | JSON Schema for variables |
| labels | VARCHAR[] | DEFAULT '{}' | Labels (production, beta, alpha) |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| created_by | VARCHAR(255) | | Creator identifier |
| commit_message | TEXT | | Version description |

**template_messages JSONB structure:**
```json
[
  { "role": "system", "content": "You are a helpful assistant." },
  { "role": "user", "content": "{{user_input}}" }
]
```

**model_defaults JSONB structure:**
```json
{
  "model": "gpt-4o",
  "temperature": 0.7,
  "max_tokens": 1000,
  "top_p": 1.0
}
```

### Datasets

Test dataset containers.

```sql
CREATE TABLE datasets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    use_case_id UUID NOT NULL REFERENCES use_cases(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    input_schema JSONB,
    expected_output_schema JSONB,
    default_assertions JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_datasets_use_case_id ON datasets(use_case_id);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| use_case_id | UUID | FK → use_cases(id), CASCADE | Parent use case |
| name | VARCHAR(255) | NOT NULL | Dataset name |
| description | TEXT | | Optional description |
| input_schema | JSONB | | JSON Schema for input validation |
| expected_output_schema | JSONB | | JSON Schema for expected output |
| default_assertions | JSONB | | Default assertions for evaluation |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**default_assertions JSONB structure:**
```json
[
  { "type": "contains", "value": "success" },
  { "type": "not_contains", "value": "error" },
  { "type": "json_match", "path": "$.status", "value": "ok" }
]
```

### Dataset Items

Individual test cases within a dataset.

```sql
CREATE TABLE dataset_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    input JSONB NOT NULL,
    expected_output JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_dataset_items_dataset_id ON dataset_items(dataset_id);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| dataset_id | UUID | FK → datasets(id), CASCADE | Parent dataset |
| input | JSONB | NOT NULL | Input variables for template |
| expected_output | JSONB | | Expected LLM output |
| metadata | JSONB | | Additional metadata |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

**input JSONB structure:**
```json
{
  "company_name": "Acme Inc",
  "question": "What are your hours?"
}
```

### Eval Runs

Evaluation run configuration and status.

```sql
CREATE TABLE eval_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_version_id UUID NOT NULL REFERENCES prompt_versions(id) ON DELETE CASCADE,
    dataset_id UUID NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
    name VARCHAR(255),
    models JSONB NOT NULL,
    assertions JSONB DEFAULT '[]',
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'running', 'completed', 'failed', 'canceled')),
    progress JSONB DEFAULT '{"total": 0, "completed": 0, "failed": 0, "percent": 0}',
    summary JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(255),
    share_token VARCHAR(64),
    share_expires_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_eval_runs_prompt_version_id ON eval_runs(prompt_version_id);
CREATE INDEX idx_eval_runs_dataset_id ON eval_runs(dataset_id);
CREATE INDEX idx_eval_runs_status ON eval_runs(status);
CREATE INDEX idx_eval_runs_created_at ON eval_runs(created_at DESC);
CREATE INDEX idx_eval_runs_share_token ON eval_runs(share_token) WHERE share_token IS NOT NULL;
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| prompt_version_id | UUID | FK → prompt_versions(id), CASCADE | Prompt version to evaluate |
| dataset_id | UUID | FK → datasets(id), CASCADE | Dataset for evaluation |
| name | VARCHAR(255) | | Optional run name |
| models | JSONB | NOT NULL | Model configurations to test |
| assertions | JSONB | DEFAULT '[]' | Grading assertions |
| status | VARCHAR(20) | NOT NULL, CHECK | Run status |
| progress | JSONB | | Progress tracking |
| summary | JSONB | | Aggregated results |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| started_at | TIMESTAMP | | Run start timestamp |
| completed_at | TIMESTAMP | | Run completion timestamp |
| created_by | VARCHAR(255) | | Creator identifier |
| share_token | VARCHAR(64) | | Token for public sharing |
| share_expires_at | TIMESTAMP | | Share link expiration |

**models JSONB structure:**
```json
[
  {
    "id": "gpt4o-1",
    "label": "GPT-4o",
    "provider": "openai",
    "model": "gpt-4o",
    "temperature": 0.7,
    "max_tokens": 1000
  },
  {
    "id": "claude-1",
    "label": "Claude Sonnet",
    "provider": "anthropic",
    "model": "claude-3-5-sonnet-20241022",
    "temperature": 0.7
  }
]
```

**progress JSONB structure:**
```json
{
  "total": 100,
  "completed": 75,
  "failed": 2,
  "percent": 77
}
```

**summary JSONB structure:**
```json
{
  "total_results": 200,
  "pass_count": 185,
  "fail_count": 15,
  "pass_rate": 0.925,
  "avg_latency_ms": 450,
  "total_tokens": 50000,
  "total_cost_usd": 2.50,
  "by_model": {
    "gpt4o-1": {
      "pass_count": 95,
      "fail_count": 5,
      "pass_rate": 0.95,
      "avg_latency_ms": 400,
      "total_tokens": 25000,
      "cost_usd": 1.50
    }
  }
}
```

### Eval Results

Individual evaluation results.

```sql
CREATE TABLE eval_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    eval_run_id UUID NOT NULL REFERENCES eval_runs(id) ON DELETE CASCADE,
    dataset_item_id UUID NOT NULL REFERENCES dataset_items(id) ON DELETE CASCADE,
    model_id VARCHAR(255) NOT NULL,
    model_config JSONB NOT NULL,
    request JSONB,
    output TEXT,
    output_json JSONB,
    grading JSONB,
    metrics JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    CONSTRAINT unique_eval_result UNIQUE (eval_run_id, dataset_item_id, model_id)
);

CREATE INDEX idx_eval_results_eval_run_id ON eval_results(eval_run_id);
CREATE INDEX idx_eval_results_dataset_item_id ON eval_results(dataset_item_id);
CREATE INDEX idx_eval_results_model_id ON eval_results(model_id);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| eval_run_id | UUID | FK → eval_runs(id), CASCADE | Parent evaluation run |
| dataset_item_id | UUID | FK → dataset_items(id), CASCADE | Dataset item tested |
| model_id | VARCHAR(255) | NOT NULL | Model identifier from run config |
| model_config | JSONB | NOT NULL | Model configuration used |
| request | JSONB | | Full API request |
| output | TEXT | | Raw LLM output |
| output_json | JSONB | | Parsed JSON output (if applicable) |
| grading | JSONB | | Grading results |
| metrics | JSONB | | Performance metrics |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |

**grading JSONB structure:**
```json
{
  "pass": true,
  "score": 0.85,
  "reason": "All assertions passed",
  "assertions": [
    {
      "type": "contains",
      "pass": true,
      "expected": "success",
      "actual": "Operation completed successfully"
    }
  ]
}
```

**metrics JSONB structure:**
```json
{
  "latency_ms": 425,
  "prompt_tokens": 150,
  "completion_tokens": 200,
  "total_tokens": 350,
  "cost_usd": 0.0125,
  "retries": 0,
  "error": null
}
```

## Migrations

### Initial Migration

The initial migration creates all tables:

```python
# alembic/versions/001_initial.py

def upgrade():
    # Create tables in dependency order
    op.create_table('projects', ...)
    op.create_table('use_cases', ...)
    op.create_table('prompts', ...)
    op.create_table('prompt_versions', ...)
    op.create_table('datasets', ...)
    op.create_table('dataset_items', ...)
    op.create_table('eval_runs', ...)
    op.create_table('eval_results', ...)

    # Create indexes
    op.create_index(...)

def downgrade():
    # Drop in reverse order
    op.drop_table('eval_results')
    op.drop_table('eval_runs')
    ...
```

### Running Migrations

```bash
# Apply all migrations
alembic upgrade head

# Create a new migration
alembic revision --autogenerate -m "description"

# Rollback last migration
alembic downgrade -1

# Show current revision
alembic current

# Show migration history
alembic history
```

## Query Patterns

### Efficient Queries

**List prompts with version count:**
```sql
SELECT
    p.*,
    COUNT(pv.id) as version_count,
    MAX(pv.version_number) as latest_version
FROM prompts p
LEFT JOIN prompt_versions pv ON p.id = pv.prompt_id
WHERE p.use_case_id = :use_case_id
GROUP BY p.id
ORDER BY p.created_at DESC;
```

**Filter prompts by tags:**
```sql
SELECT * FROM prompts
WHERE use_case_id = :use_case_id
AND tags @> ARRAY['tag1', 'tag2']  -- Contains all
ORDER BY created_at DESC;
```

**Get evaluation results with aggregation:**
```sql
SELECT
    er.model_id,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE (er.grading->>'pass')::boolean) as passed,
    AVG((er.metrics->>'latency_ms')::int) as avg_latency
FROM eval_results er
WHERE er.eval_run_id = :run_id
GROUP BY er.model_id;
```

### Connection Pooling

The application uses asyncpg with connection pooling:

```python
engine = create_async_engine(
    DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=3600
)
```

## Data Integrity

### Cascade Deletes

All foreign keys use `ON DELETE CASCADE`:

- Deleting a **project** deletes all use cases, prompts, datasets
- Deleting a **use case** deletes all prompts and datasets
- Deleting a **prompt** deletes all versions
- Deleting a **dataset** deletes all items
- Deleting an **eval run** deletes all results

### Unique Constraints

- `prompt_versions(prompt_id, version_number)` - One version number per prompt
- `eval_results(eval_run_id, dataset_item_id, model_id)` - One result per item per model

### Check Constraints

- `prompt_versions.type IN ('text', 'chat')`
- `eval_runs.status IN ('pending', 'running', 'completed', 'failed', 'canceled')`

## Backup and Recovery

### Backup Commands

```bash
# Full backup
pg_dump -h localhost -U postgres prompt_playground > backup.sql

# Schema only
pg_dump -h localhost -U postgres --schema-only prompt_playground > schema.sql

# Data only
pg_dump -h localhost -U postgres --data-only prompt_playground > data.sql
```

### Restore Commands

```bash
# Restore full backup
psql -h localhost -U postgres prompt_playground < backup.sql

# Restore to new database
createdb -h localhost -U postgres new_database
psql -h localhost -U postgres new_database < backup.sql
```

## Next Steps

- [Backend Architecture](./backend-architecture.md) - ORM models and services
- [API Reference](../api/overview.md) - CRUD operations
- [Deployment Guide](../deployment/docker.md) - Database setup

---

*Database schema documentation generated December 2024*
