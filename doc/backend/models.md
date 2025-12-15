# Backend Models Reference

This document describes all SQLAlchemy ORM models in Prompt Playground.

## Overview

Models are located in `app/models/` and define the database schema:

```
app/models/
├── __init__.py          # Exports all models
├── base.py              # Base mixins
├── project.py           # Project model
├── use_case.py          # UseCase model
├── prompt.py            # Prompt model
├── prompt_version.py    # PromptVersion model
├── dataset.py           # Dataset and DatasetItem models
└── eval.py              # EvalRun and EvalResult models
```

---

## Base Mixins

### Location

`app/models/base.py`

### UUIDMixin

Adds UUID primary key:

```python
import uuid
from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import UUID

class UUIDMixin:
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
```

### TimestampMixin

Adds created_at and updated_at:

```python
from datetime import datetime
from sqlalchemy import Column, DateTime

class TimestampMixin:
    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )
```

---

## Project

### Location

`app/models/project.py`

### Definition

```python
from sqlalchemy import Column, String, Text
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import UUIDMixin, TimestampMixin

class Project(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "projects"

    name = Column(String(255), nullable=False)
    description = Column(Text)

    # Relationships
    use_cases = relationship(
        "UseCase",
        back_populates="project",
        cascade="all, delete-orphan"
    )
```

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| name | String(255) | NOT NULL | Project name |
| description | Text | | Optional description |
| created_at | DateTime | NOT NULL | Creation timestamp |
| updated_at | DateTime | NOT NULL | Last update |

### Usage

```python
# Create project
project = Project(name="My Project", description="Description")
db.add(project)
await db.commit()

# Query with use cases
result = await db.execute(
    select(Project)
    .options(selectinload(Project.use_cases))
    .where(Project.id == project_id)
)
project = result.scalar_one()
```

---

## UseCase

### Location

`app/models/use_case.py`

### Definition

```python
from sqlalchemy import Column, String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

class UseCase(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "use_cases"

    project_id = Column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False
    )
    name = Column(String(255), nullable=False)
    description = Column(Text)

    # Relationships
    project = relationship("Project", back_populates="use_cases")
    prompts = relationship(
        "Prompt",
        back_populates="use_case",
        cascade="all, delete-orphan"
    )
    datasets = relationship(
        "Dataset",
        back_populates="use_case",
        cascade="all, delete-orphan"
    )
```

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| project_id | UUID | FK, NOT NULL | Parent project |
| name | String(255) | NOT NULL | Use case name |
| description | Text | | Optional description |
| created_at | DateTime | NOT NULL | Creation timestamp |
| updated_at | DateTime | NOT NULL | Last update |

---

## Prompt

### Location

`app/models/prompt.py`

### Definition

```python
from sqlalchemy import Column, String, Text, ForeignKey, ARRAY, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

class Prompt(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "prompts"

    use_case_id = Column(
        UUID(as_uuid=True),
        ForeignKey("use_cases.id", ondelete="CASCADE"),
        nullable=False
    )
    name = Column(String(255), nullable=False)
    description = Column(Text)
    tags = Column(ARRAY(String), default=list)

    # Relationships
    use_case = relationship("UseCase", back_populates="prompts")
    versions = relationship(
        "PromptVersion",
        back_populates="prompt",
        cascade="all, delete-orphan",
        order_by="desc(PromptVersion.version_number)"
    )

    # Indexes
    __table_args__ = (
        Index("idx_prompts_tags", tags, postgresql_using="gin"),
    )
```

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| use_case_id | UUID | FK, NOT NULL | Parent use case |
| name | String(255) | NOT NULL | Prompt name |
| description | Text | | Optional description |
| tags | ARRAY(String) | DEFAULT [] | Tags for filtering |
| created_at | DateTime | NOT NULL | Creation timestamp |
| updated_at | DateTime | NOT NULL | Last update |

### Tag Querying

```python
# Filter by tags (contains all)
result = await db.execute(
    select(Prompt)
    .where(Prompt.tags.contains(["faq", "support"]))
)

# Filter by tags (contains any)
from sqlalchemy import or_
result = await db.execute(
    select(Prompt)
    .where(or_(
        Prompt.tags.contains(["faq"]),
        Prompt.tags.contains(["support"])
    ))
)
```

---

## PromptVersion

### Location

`app/models/prompt_version.py`

### Definition

```python
from sqlalchemy import Column, String, Text, Integer, ForeignKey, ARRAY, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

class PromptVersion(Base, UUIDMixin):
    __tablename__ = "prompt_versions"

    prompt_id = Column(
        UUID(as_uuid=True),
        ForeignKey("prompts.id", ondelete="CASCADE"),
        nullable=False
    )
    version_number = Column(Integer, nullable=False)
    type = Column(String(10), nullable=False)  # 'text' or 'chat'
    template_text = Column(Text)
    template_messages = Column(JSONB)
    model_defaults = Column(JSONB)
    variables_schema = Column(JSONB)
    labels = Column(ARRAY(String), default=list)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_by = Column(String(255))
    commit_message = Column(Text)

    # Relationships
    prompt = relationship("Prompt", back_populates="versions")
    eval_runs = relationship(
        "EvalRun",
        back_populates="prompt_version",
        cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("prompt_id", "version_number", name="unique_prompt_version"),
    )
```

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| prompt_id | UUID | FK, NOT NULL | Parent prompt |
| version_number | Integer | NOT NULL, UNIQUE | Version number |
| type | String(10) | NOT NULL | "text" or "chat" |
| template_text | Text | | Text template |
| template_messages | JSONB | | Chat messages |
| model_defaults | JSONB | | Default model config |
| variables_schema | JSONB | | JSON Schema |
| labels | ARRAY(String) | DEFAULT [] | Labels |
| created_at | DateTime | NOT NULL | Creation timestamp |
| created_by | String(255) | | Creator |
| commit_message | Text | | Description |

### Version Number Generation

```python
async def get_next_version_number(prompt_id: UUID, db: AsyncSession) -> int:
    result = await db.execute(
        select(func.max(PromptVersion.version_number))
        .where(PromptVersion.prompt_id == prompt_id)
    )
    max_version = result.scalar() or 0
    return max_version + 1
```

---

## Dataset

### Location

`app/models/dataset.py`

### Definition

```python
class Dataset(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "datasets"

    use_case_id = Column(
        UUID(as_uuid=True),
        ForeignKey("use_cases.id", ondelete="CASCADE"),
        nullable=False
    )
    name = Column(String(255), nullable=False)
    description = Column(Text)
    input_schema = Column(JSONB)
    expected_output_schema = Column(JSONB)
    default_assertions = Column(JSONB)

    # Relationships
    use_case = relationship("UseCase", back_populates="datasets")
    items = relationship(
        "DatasetItem",
        back_populates="dataset",
        cascade="all, delete-orphan"
    )
    eval_runs = relationship(
        "EvalRun",
        back_populates="dataset",
        cascade="all, delete-orphan"
    )
```

---

## DatasetItem

### Location

`app/models/dataset.py`

### Definition

```python
class DatasetItem(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "dataset_items"

    dataset_id = Column(
        UUID(as_uuid=True),
        ForeignKey("datasets.id", ondelete="CASCADE"),
        nullable=False
    )
    input = Column(JSONB, nullable=False)
    expected_output = Column(JSONB)
    metadata = Column(JSONB)

    # Relationships
    dataset = relationship("Dataset", back_populates="items")
    eval_results = relationship(
        "EvalResult",
        back_populates="dataset_item",
        cascade="all, delete-orphan"
    )
```

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| dataset_id | UUID | FK, NOT NULL | Parent dataset |
| input | JSONB | NOT NULL | Input variables |
| expected_output | JSONB | | Expected output |
| metadata | JSONB | | Additional metadata |
| created_at | DateTime | NOT NULL | Creation timestamp |
| updated_at | DateTime | NOT NULL | Last update |

---

## EvalRun

### Location

`app/models/eval.py`

### Definition

```python
class EvalRun(Base, UUIDMixin):
    __tablename__ = "eval_runs"

    prompt_version_id = Column(
        UUID(as_uuid=True),
        ForeignKey("prompt_versions.id", ondelete="CASCADE"),
        nullable=False
    )
    dataset_id = Column(
        UUID(as_uuid=True),
        ForeignKey("datasets.id", ondelete="CASCADE"),
        nullable=False
    )
    name = Column(String(255))
    models = Column(JSONB, nullable=False)
    assertions = Column(JSONB, default=list)
    status = Column(
        String(20),
        nullable=False,
        default="pending"
    )
    progress = Column(
        JSONB,
        default={"total": 0, "completed": 0, "failed": 0, "percent": 0}
    )
    summary = Column(JSONB)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    created_by = Column(String(255))
    share_token = Column(String(64))
    share_expires_at = Column(DateTime)

    # Relationships
    prompt_version = relationship("PromptVersion", back_populates="eval_runs")
    dataset = relationship("Dataset", back_populates="eval_runs")
    results = relationship(
        "EvalResult",
        back_populates="eval_run",
        cascade="all, delete-orphan"
    )
```

### Status Values

```python
class EvalStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELED = "canceled"
```

---

## EvalResult

### Location

`app/models/eval.py`

### Definition

```python
class EvalResult(Base, UUIDMixin):
    __tablename__ = "eval_results"

    eval_run_id = Column(
        UUID(as_uuid=True),
        ForeignKey("eval_runs.id", ondelete="CASCADE"),
        nullable=False
    )
    dataset_item_id = Column(
        UUID(as_uuid=True),
        ForeignKey("dataset_items.id", ondelete="CASCADE"),
        nullable=False
    )
    model_id = Column(String(255), nullable=False)
    model_config = Column(JSONB, nullable=False)
    request = Column(JSONB)
    output = Column(Text)
    output_json = Column(JSONB)
    grading = Column(JSONB)
    metrics = Column(JSONB)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    eval_run = relationship("EvalRun", back_populates="results")
    dataset_item = relationship("DatasetItem", back_populates="eval_results")

    __table_args__ = (
        UniqueConstraint(
            "eval_run_id", "dataset_item_id", "model_id",
            name="unique_eval_result"
        ),
    )
```

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | UUID | PK | Unique identifier |
| eval_run_id | UUID | FK, NOT NULL | Parent run |
| dataset_item_id | UUID | FK, NOT NULL | Source item |
| model_id | String(255) | NOT NULL | Model identifier |
| model_config | JSONB | NOT NULL | Model configuration |
| request | JSONB | | Full API request |
| output | Text | | Raw LLM output |
| output_json | JSONB | | Parsed JSON output |
| grading | JSONB | | Grading results |
| metrics | JSONB | | Performance metrics |
| created_at | DateTime | NOT NULL | Creation timestamp |

---

## Model Relationships Diagram

```
Project (1) ──────< UseCase (N)
                      │
                      ├──< Prompt (N) ──────< PromptVersion (N)
                      │                              │
                      └──< Dataset (N) ──────< DatasetItem (N)
                                │                    │
                                │                    │
                                └────> EvalRun <─────┘
                                          │
                                          └──< EvalResult (N)
```

---

## Querying Patterns

### Load with Relationships

```python
# Eager loading
result = await db.execute(
    select(Project)
    .options(
        selectinload(Project.use_cases)
        .selectinload(UseCase.prompts)
    )
    .where(Project.id == project_id)
)

# Joined loading
result = await db.execute(
    select(Prompt)
    .join(Prompt.use_case)
    .join(UseCase.project)
    .where(Project.id == project_id)
)
```

### Aggregations

```python
from sqlalchemy import func

# Count prompts per use case
result = await db.execute(
    select(
        UseCase.id,
        UseCase.name,
        func.count(Prompt.id).label("prompt_count")
    )
    .outerjoin(Prompt)
    .group_by(UseCase.id)
)
```

### Pagination

```python
# Paginated query
result = await db.execute(
    select(Prompt)
    .where(Prompt.use_case_id == use_case_id)
    .order_by(Prompt.created_at.desc())
    .offset(skip)
    .limit(limit)
)
```

---

## Related Documentation

- [Database Schema](../architecture/database-schema.md)
- [Backend Architecture](../architecture/backend-architecture.md)
- [API Reference](../api/overview.md)

---

*Models reference generated December 2024*
