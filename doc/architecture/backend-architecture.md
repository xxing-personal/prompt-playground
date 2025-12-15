# Backend Architecture

This document provides a detailed overview of the Prompt Playground backend architecture, built with FastAPI and Python 3.11+.

## Overview

The backend follows a layered architecture pattern with clear separation of concerns:

```
┌────────────────────────────────────────────────────────────────┐
│                       API Layer (FastAPI)                       │
│  • Route handlers                                               │
│  • Request/Response handling                                    │
│  • Authentication (future)                                      │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                      Schema Layer (Pydantic)                    │
│  • Request validation                                           │
│  • Response serialization                                       │
│  • Type definitions                                             │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                     Service Layer (Business)                    │
│  • Business logic                                               │
│  • Template compilation                                         │
│  • LLM integration                                              │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                     Model Layer (SQLAlchemy)                    │
│  • ORM models                                                   │
│  • Database relationships                                       │
│  • Query building                                               │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                      Data Layer (PostgreSQL)                    │
│  • Data persistence                                             │
│  • Indexing                                                     │
│  • Transactions                                                 │
└────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # Application entry point
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── reports.py             # Public reporting endpoints
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── router.py          # Main API router
│   │       ├── projects.py        # Project CRUD
│   │       ├── use_cases.py       # Use case CRUD
│   │       ├── prompts.py         # Prompt & version management
│   │       ├── playground.py      # Template testing
│   │       ├── datasets.py        # Dataset management
│   │       ├── evaluations.py     # Evaluation runs
│   │       └── exports.py         # Export functionality
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py              # Settings configuration
│   │   └── database.py            # Database setup
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── base.py                # Base mixins
│   │   ├── project.py
│   │   ├── use_case.py
│   │   ├── prompt.py
│   │   ├── prompt_version.py
│   │   ├── dataset.py
│   │   └── eval.py
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── base.py                # Base schemas
│   │   ├── project.py
│   │   ├── use_case.py
│   │   ├── prompt.py
│   │   └── dataset.py
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── template_service.py    # Template compilation
│   │   ├── llm_service.py         # LLM API calls
│   │   ├── eval_worker.py         # Background evaluation
│   │   └── evaluators.py          # Assertion logic
│   │
│   └── utils/
│       └── __init__.py
│
├── alembic/
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
│       └── 001_initial.py
│
├── tests/
│   └── __init__.py
│
├── pyproject.toml
├── requirements.txt
└── Dockerfile
```

## Core Components

### Application Entry (`main.py`)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router

app = FastAPI(
    title="Prompt Playground API",
    description="API for managing and testing LLM prompts",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

### Configuration (`core/config.py`)

Uses Pydantic Settings for type-safe configuration:

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://..."

    # LLM API Keys
    openai_api_key: str | None = None
    anthropic_api_key: str | None = None

    # Application
    debug: bool = False
    default_model: str = "gpt-4o-mini"

    # Evaluation settings
    eval_concurrency: int = 5
    eval_retries: int = 3
    eval_timeout: int = 60

    class Config:
        env_file = ".env"

settings = Settings()
```

### Database Setup (`core/database.py`)

Async SQLAlchemy configuration:

```python
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    async_sessionmaker,
    AsyncSession
)
from sqlalchemy.orm import DeclarativeBase

# Create async engine
engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    pool_pre_ping=True
)

# Session factory
async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

class Base(DeclarativeBase):
    pass

# Dependency for routes
async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()
```

## API Layer

### Router Organization

All API v1 routes are organized under `/api/v1`:

```python
# api/v1/router.py
from fastapi import APIRouter
from . import projects, use_cases, prompts, playground, datasets, evaluations, exports

api_router = APIRouter()

api_router.include_router(projects.router, prefix="/projects", tags=["Projects"])
api_router.include_router(use_cases.router, tags=["Use Cases"])
api_router.include_router(prompts.router, tags=["Prompts"])
api_router.include_router(playground.router, prefix="/playground", tags=["Playground"])
api_router.include_router(datasets.router, tags=["Datasets"])
api_router.include_router(evaluations.router, prefix="/eval-runs", tags=["Evaluations"])
api_router.include_router(exports.router, tags=["Exports"])
```

### Route Handler Pattern

Standard CRUD pattern example:

```python
# api/v1/projects.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectResponse

router = APIRouter()

@router.get("/", response_model=list[ProjectResponse])
async def list_projects(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """List all projects with pagination."""
    result = await db.execute(
        select(Project)
        .offset(skip)
        .limit(limit)
        .order_by(Project.created_at.desc())
    )
    return result.scalars().all()

@router.post("/", response_model=ProjectResponse, status_code=201)
async def create_project(
    data: ProjectCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new project."""
    project = Project(**data.model_dump())
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return project

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get a project by ID."""
    result = await db.execute(
        select(Project).where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project
```

## Service Layer

### Template Service

Handles prompt template compilation:

```python
# services/template_service.py
import re
from typing import Any

class TemplateService:
    VARIABLE_PATTERN = re.compile(r'\{\{(\w+)\}\}')

    @staticmethod
    def extract_variables(template: str) -> list[str]:
        """Extract variable names from template."""
        return list(set(TemplateService.VARIABLE_PATTERN.findall(template)))

    @staticmethod
    def extract_variables_from_messages(messages: list[dict]) -> list[str]:
        """Extract variables from chat messages."""
        variables = set()
        for msg in messages:
            content = msg.get("content", "")
            variables.update(TemplateService.VARIABLE_PATTERN.findall(content))
        return list(variables)

    @staticmethod
    def compile_template(template: str, variables: dict[str, Any]) -> str:
        """Substitute variables in template."""
        result = template
        for key, value in variables.items():
            result = result.replace(f"{{{{{key}}}}}", str(value))
        return result

    @staticmethod
    def compile_messages(
        messages: list[dict],
        variables: dict[str, Any]
    ) -> list[dict]:
        """Compile all messages with variables."""
        compiled = []
        for msg in messages:
            compiled_msg = msg.copy()
            compiled_msg["content"] = TemplateService.compile_template(
                msg.get("content", ""),
                variables
            )
            compiled.append(compiled_msg)
        return compiled

    @staticmethod
    def validate_variables(
        template: str,
        variables: dict[str, Any]
    ) -> tuple[bool, list[str]]:
        """Check if all required variables are provided."""
        required = set(TemplateService.extract_variables(template))
        provided = set(variables.keys())
        missing = required - provided
        return len(missing) == 0, list(missing)
```

### LLM Service

Handles LLM API calls via LiteLLM:

```python
# services/llm_service.py
import time
from dataclasses import dataclass
import litellm
from app.core.config import settings

@dataclass
class LLMResponse:
    output: str
    latency_ms: int
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    cost_usd: float | None

class LLMService:
    # Provider mapping
    PROVIDER_MAP = {
        "gpt-4o": "openai",
        "gpt-4o-mini": "openai",
        "gpt-4-turbo": "openai",
        "gpt-3.5-turbo": "openai",
        "claude-3-5-sonnet": "anthropic",
        "claude-3-opus": "anthropic",
        "claude-3-sonnet": "anthropic",
        "claude-3-haiku": "anthropic",
    }

    @staticmethod
    def get_provider(model: str) -> str:
        """Determine provider from model name."""
        # Check prefix
        if model.startswith("openai/"):
            return "openai"
        if model.startswith("anthropic/"):
            return "anthropic"
        if model.startswith("gemini/"):
            return "google"

        # Check mapping
        for key, provider in LLMService.PROVIDER_MAP.items():
            if key in model:
                return provider

        return "openai"  # Default

    @staticmethod
    async def generate_completion(
        messages: list[dict],
        model: str = "gpt-4o-mini",
        temperature: float = 0.7,
        max_tokens: int | None = None,
        top_p: float | None = None,
        **kwargs
    ) -> LLMResponse:
        """Call LLM API and return response with metrics."""
        start_time = time.time()

        # Configure API keys
        litellm.openai_key = settings.openai_api_key
        litellm.anthropic_key = settings.anthropic_api_key

        # Build request
        request_params = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
        }

        if max_tokens:
            request_params["max_tokens"] = max_tokens
        if top_p:
            request_params["top_p"] = top_p

        # Make API call
        response = await litellm.acompletion(**request_params)

        # Calculate metrics
        latency_ms = int((time.time() - start_time) * 1000)

        return LLMResponse(
            output=response.choices[0].message.content,
            latency_ms=latency_ms,
            prompt_tokens=response.usage.prompt_tokens,
            completion_tokens=response.usage.completion_tokens,
            total_tokens=response.usage.total_tokens,
            cost_usd=response._hidden_params.get("response_cost")
        )
```

### Evaluation Worker

Background evaluation processing:

```python
# services/eval_worker.py
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.eval import EvalRun, EvalResult
from app.services.template_service import TemplateService
from app.services.llm_service import LLMService
from app.services.evaluators import run_assertions

async def process_evaluation(
    run_id: str,
    db: AsyncSession
):
    """Process all items in an evaluation run."""
    # Load run with related data
    run = await db.get(EvalRun, run_id)
    run.status = "running"
    await db.commit()

    try:
        # Get dataset items
        items = await load_dataset_items(run.dataset_id, db)
        prompt_version = await db.get(PromptVersion, run.prompt_version_id)

        total = len(items) * len(run.models)
        completed = 0
        failed = 0

        # Process each item x model combination
        for item in items:
            for model_config in run.models:
                try:
                    result = await process_single_item(
                        prompt_version,
                        item,
                        model_config,
                        run.assertions
                    )

                    # Save result
                    eval_result = EvalResult(
                        eval_run_id=run_id,
                        dataset_item_id=item.id,
                        model_id=model_config["id"],
                        model_config=model_config,
                        output=result.output,
                        grading=result.grading,
                        metrics=result.metrics
                    )
                    db.add(eval_result)
                    completed += 1

                except Exception as e:
                    failed += 1

                # Update progress
                run.progress = {
                    "total": total,
                    "completed": completed,
                    "failed": failed,
                    "percent": int((completed + failed) / total * 100)
                }
                await db.commit()

        # Generate summary
        run.status = "completed"
        run.summary = await generate_summary(run_id, db)

    except Exception as e:
        run.status = "failed"

    await db.commit()
```

## Model Layer

### Base Mixins

Common functionality for all models:

```python
# models/base.py
import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime
from sqlalchemy.dialects.postgresql import UUID

class UUIDMixin:
    """Adds UUID primary key."""
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

class TimestampMixin:
    """Adds created_at and updated_at timestamps."""
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

### Model Relationships

Example model with relationships:

```python
# models/prompt.py
from sqlalchemy import Column, String, Text, ForeignKey, ARRAY
from sqlalchemy.orm import relationship
from app.core.database import Base
from app.models.base import UUIDMixin, TimestampMixin

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
```

## Schema Layer

### Request/Response Schemas

```python
# schemas/prompt.py
from pydantic import BaseModel, Field
from datetime import datetime

class PromptBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    tags: list[str] = Field(default_factory=list)

class PromptCreate(PromptBase):
    pass

class PromptUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=255)
    description: str | None = None
    tags: list[str] | None = None

class PromptResponse(PromptBase):
    id: str
    use_case_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class PromptWithStats(PromptResponse):
    version_count: int
    latest_version: int | None
```

## Error Handling

### Custom Exceptions

```python
# core/exceptions.py
from fastapi import HTTPException

class NotFoundError(HTTPException):
    def __init__(self, resource: str, id: str):
        super().__init__(
            status_code=404,
            detail=f"{resource} with id '{id}' not found"
        )

class ValidationError(HTTPException):
    def __init__(self, message: str):
        super().__init__(
            status_code=422,
            detail=message
        )

class LLMError(HTTPException):
    def __init__(self, message: str):
        super().__init__(
            status_code=502,
            detail=f"LLM API error: {message}"
        )
```

### Global Error Handler

```python
# main.py
from fastapi import Request
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "type": type(exc).__name__
        }
    )
```

## Database Migrations

### Alembic Configuration

```python
# alembic/env.py
from app.core.database import Base
from app.models import *  # Import all models

target_metadata = Base.metadata

def run_migrations_online():
    connectable = engine
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata
        )
        with context.begin_transaction():
            context.run_migrations()
```

### Creating Migrations

```bash
# Generate migration from model changes
alembic revision --autogenerate -m "add_new_field"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1
```

## Testing

### Test Setup

```python
# tests/conftest.py
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from app.main import app
from app.core.database import get_db, Base

# Test database
TEST_DATABASE_URL = "postgresql+asyncpg://test:test@localhost/test_db"

@pytest.fixture
async def db_session():
    engine = create_async_engine(TEST_DATABASE_URL)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSession(engine) as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.fixture
async def client(db_session):
    app.dependency_overrides[get_db] = lambda: db_session
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac
```

### Example Test

```python
# tests/test_projects.py
import pytest

@pytest.mark.asyncio
async def test_create_project(client):
    response = await client.post(
        "/api/v1/projects",
        json={"name": "Test Project"}
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Test Project"
    assert "id" in data
```

## Performance Considerations

### Database Optimization

1. **Indexing**: GIN index on prompt tags
2. **Connection Pooling**: Configured via asyncpg
3. **Eager Loading**: Use `selectinload` for relationships

### Async Best Practices

1. **Avoid blocking calls**: Use async versions
2. **Concurrent execution**: `asyncio.gather()` for parallel ops
3. **Session management**: One session per request

### API Optimization

1. **Pagination**: All list endpoints paginated
2. **Projection**: Select only needed columns
3. **Caching**: Response caching headers

## Next Steps

- [Database Schema](./database-schema.md) - Complete data model
- [API Reference](../api/overview.md) - API documentation
- [Services Guide](../backend/services.md) - Service details

---

*Backend architecture documentation generated December 2024*
