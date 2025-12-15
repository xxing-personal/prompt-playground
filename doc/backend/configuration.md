# Backend Configuration Guide

This document covers the configuration system for the Prompt Playground backend.

## Overview

The backend uses Pydantic Settings for configuration management, providing:

- Type-safe configuration
- Environment variable loading
- Default values
- Validation

## Configuration File

### Location

`app/core/config.py`

### Settings Class

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    database_url: str

    # LLM API Keys
    openai_api_key: str | None = None
    anthropic_api_key: str | None = None
    google_api_key: str | None = None

    # Application
    debug: bool = False
    log_level: str = "INFO"
    default_model: str = "gpt-4o-mini"

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # Evaluation
    eval_concurrency: int = 5
    eval_retries: int = 3
    eval_timeout: int = 60

    # CORS
    cors_origins: list[str] = ["http://localhost:3000"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False

settings = Settings()
```

## Configuration Categories

### Database Configuration

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `database_url` | str | Required | PostgreSQL connection URL |

**Format:**
```
postgresql+asyncpg://user:password@host:port/database
```

**Example:**
```python
database_url = "postgresql+asyncpg://postgres:postgres@localhost:5432/prompt_playground"
```

### LLM API Keys

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `openai_api_key` | str | None | OpenAI API key |
| `anthropic_api_key` | str | None | Anthropic API key |
| `google_api_key` | str | None | Google AI API key |

**Note:** At least one API key is required for LLM features.

### Application Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `debug` | bool | False | Enable debug mode |
| `log_level` | str | "INFO" | Logging level |
| `default_model` | str | "gpt-4o-mini" | Default LLM model |

### Server Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `host` | str | "0.0.0.0" | Server bind host |
| `port` | int | 8000 | Server bind port |

### Evaluation Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `eval_concurrency` | int | 5 | Concurrent LLM calls |
| `eval_retries` | int | 3 | Retry attempts |
| `eval_timeout` | int | 60 | Call timeout (seconds) |

### CORS Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `cors_origins` | list[str] | ["http://localhost:3000"] | Allowed origins |

## Loading Configuration

### From Environment Variables

```bash
export DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/prompt_playground
export OPENAI_API_KEY=sk-...
export DEBUG=true
```

### From .env File

```env
# .env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/prompt_playground
OPENAI_API_KEY=sk-...
DEBUG=true
```

### Priority Order

1. Environment variables (highest)
2. .env file
3. Default values (lowest)

## Using Configuration

### In Application Code

```python
from app.core.config import settings

# Access settings
database_url = settings.database_url
debug_mode = settings.debug

# Check API key availability
if settings.openai_api_key:
    # OpenAI is available
    pass
```

### In Dependencies

```python
from fastapi import Depends
from app.core.config import settings

def get_llm_service():
    if not settings.openai_api_key and not settings.anthropic_api_key:
        raise ValueError("No LLM API keys configured")
    return LLMService()
```

## Database Configuration

### Connection URL Components

```python
# Parse URL components
from urllib.parse import urlparse

url = urlparse(settings.database_url)
print(f"Driver: {url.scheme}")
print(f"User: {url.username}")
print(f"Host: {url.hostname}")
print(f"Port: {url.port}")
print(f"Database: {url.path[1:]}")
```

### Async Engine Setup

```python
# app/core/database.py
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker

engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=3600
)

async_session = async_sessionmaker(
    engine,
    expire_on_commit=False
)
```

## Logging Configuration

### Setup

```python
import logging

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)
```

### Log Levels

| Level | Value | Description |
|-------|-------|-------------|
| DEBUG | 10 | Detailed debugging |
| INFO | 20 | General information |
| WARNING | 30 | Warning messages |
| ERROR | 40 | Error messages |
| CRITICAL | 50 | Critical failures |

## CORS Configuration

### Setup in FastAPI

```python
# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Multiple Origins

```env
CORS_ORIGINS=["http://localhost:3000","https://app.example.com"]
```

## Environment-Specific Configuration

### Development

```env
# .env.development
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/prompt_playground
DEBUG=true
LOG_LEVEL=DEBUG
CORS_ORIGINS=["http://localhost:3000"]
```

### Production

```env
# .env.production
DATABASE_URL=postgresql+asyncpg://user:strongpassword@db.internal:5432/prompt_playground
DEBUG=false
LOG_LEVEL=INFO
CORS_ORIGINS=["https://app.yourdomain.com"]
```

### Testing

```env
# .env.test
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/test_prompt_playground
DEBUG=true
LOG_LEVEL=DEBUG
```

## Validation

### Required Fields

Fields without defaults are required:

```python
class Settings(BaseSettings):
    database_url: str  # Required - no default
    debug: bool = False  # Optional - has default
```

### Custom Validators

```python
from pydantic import validator

class Settings(BaseSettings):
    database_url: str

    @validator("database_url")
    def validate_database_url(cls, v):
        if not v.startswith("postgresql+asyncpg://"):
            raise ValueError("Must use postgresql+asyncpg driver")
        return v
```

### API Key Validation

```python
class Settings(BaseSettings):
    openai_api_key: str | None = None
    anthropic_api_key: str | None = None

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.openai_api_key and not self.anthropic_api_key:
            raise ValueError("At least one API key is required")
```

## Testing Configuration

### Override in Tests

```python
import pytest
from app.core.config import Settings

@pytest.fixture
def test_settings():
    return Settings(
        database_url="postgresql+asyncpg://test:test@localhost/test_db",
        openai_api_key="test-key",
        debug=True
    )
```

### Mock Settings

```python
from unittest.mock import patch

def test_with_mock_settings():
    with patch("app.core.config.settings") as mock_settings:
        mock_settings.debug = True
        mock_settings.default_model = "gpt-3.5-turbo"
        # Test code here
```

## Security Best Practices

### 1. Never Commit Secrets

```gitignore
# .gitignore
.env
.env.*
!.env.example
```

### 2. Use Environment Variables in Production

```bash
# Don't use .env files in production
export DATABASE_URL=...
export OPENAI_API_KEY=...
```

### 3. Validate on Startup

```python
# app/main.py
from app.core.config import settings

@app.on_event("startup")
async def validate_config():
    if not settings.database_url:
        raise RuntimeError("DATABASE_URL is required")

    # Test database connection
    async with engine.begin() as conn:
        await conn.execute(text("SELECT 1"))
```

### 4. Mask Sensitive Values in Logs

```python
logger.info(f"Using database: {settings.database_url.split('@')[1]}")
logger.info(f"OpenAI key configured: {bool(settings.openai_api_key)}")
```

## Related Documentation

- [Environment Variables](../deployment/environment-variables.md)
- [Backend Architecture](../architecture/backend-architecture.md)
- [Docker Deployment](../deployment/docker.md)

---

*Configuration guide generated December 2024*
