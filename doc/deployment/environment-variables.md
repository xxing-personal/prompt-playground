# Environment Variables Reference

Complete reference for all environment variables used in Prompt Playground.

## Overview

Environment variables configure the application's behavior, database connections, and external integrations. They can be set via:

- `.env` file in the project root
- Docker Compose environment configuration
- System environment variables
- Container orchestration secrets (K8s, Docker Swarm)

---

## Required Variables

### Database

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+asyncpg://user:pass@localhost:5432/prompt_playground` |

**Format:**
```
postgresql+asyncpg://<user>:<password>@<host>:<port>/<database>
```

**Components:**
- `user`: Database username
- `password`: Database password (URL-encoded if special characters)
- `host`: Database server hostname
- `port`: Database port (default: 5432)
- `database`: Database name

**Examples:**
```bash
# Local development
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/prompt_playground

# Docker Compose
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/prompt_playground

# Production (with strong password)
DATABASE_URL=postgresql+asyncpg://appuser:Str0ng%23Pass@db.example.com:5432/prompt_playground
```

---

## LLM API Keys

At least one API key is required to use LLM features.

### OpenAI

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |

**Supported Models:**
- gpt-4o, gpt-4o-mini
- gpt-4-turbo, gpt-4
- gpt-3.5-turbo

### Anthropic

| Variable | Description | Example |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Anthropic API key | `sk-ant-...` |

**Supported Models:**
- claude-3-5-sonnet-20241022
- claude-3-opus-20240229
- claude-3-sonnet-20240229
- claude-3-haiku-20240307

### Google (Gemini)

| Variable | Description | Example |
|----------|-------------|---------|
| `GOOGLE_API_KEY` | Google AI API key | `AIza...` |

**Supported Models:**
- gemini-pro
- gemini-pro-vision

---

## Optional Variables

### Application Settings

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `DEBUG` | boolean | `false` | Enable debug mode |
| `LOG_LEVEL` | string | `INFO` | Logging level (DEBUG, INFO, WARNING, ERROR) |
| `DEFAULT_MODEL` | string | `gpt-4o-mini` | Default LLM model |

### Server Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `HOST` | string | `0.0.0.0` | Server bind host |
| `PORT` | integer | `8000` | Server bind port |
| `WORKERS` | integer | `1` | Uvicorn workers (production) |

### Evaluation Settings

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `EVAL_CONCURRENCY` | integer | `5` | Concurrent evaluation requests |
| `EVAL_RETRIES` | integer | `3` | LLM call retry attempts |
| `EVAL_TIMEOUT` | integer | `60` | LLM call timeout (seconds) |

### CORS Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `CORS_ORIGINS` | string | `http://localhost:3000` | Allowed origins (comma-separated) |

---

## Environment Files

### .env.example

```env
# ============================================
# Prompt Playground Configuration
# ============================================

# Database Configuration
# Required: PostgreSQL connection string
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/prompt_playground

# LLM API Keys
# At least one API key is required for LLM features
OPENAI_API_KEY=sk-your-openai-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
# GOOGLE_API_KEY=AIza-your-google-key-here

# Application Settings
DEBUG=false
LOG_LEVEL=INFO
DEFAULT_MODEL=gpt-4o-mini

# Server Configuration
# HOST=0.0.0.0
# PORT=8000
# WORKERS=1

# Evaluation Settings
# EVAL_CONCURRENCY=5
# EVAL_RETRIES=3
# EVAL_TIMEOUT=60

# CORS (comma-separated origins)
# CORS_ORIGINS=http://localhost:3000,https://your-domain.com
```

### Development (.env.development)

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/prompt_playground
DEBUG=true
LOG_LEVEL=DEBUG

OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### Production (.env.production)

```env
DATABASE_URL=postgresql+asyncpg://produser:StrongPassword123@db.internal:5432/prompt_playground
DEBUG=false
LOG_LEVEL=INFO
WORKERS=4

EVAL_CONCURRENCY=10
EVAL_RETRIES=3
EVAL_TIMEOUT=120

CORS_ORIGINS=https://prompt-playground.example.com

# API keys should be managed via secrets manager
# OPENAI_API_KEY=<from secrets manager>
# ANTHROPIC_API_KEY=<from secrets manager>
```

---

## Docker Compose Configuration

### Using .env File

```yaml
# docker-compose.yml
services:
  api:
    env_file:
      - .env
```

### Inline Environment Variables

```yaml
services:
  api:
    environment:
      DATABASE_URL: postgresql+asyncpg://postgres:${DB_PASSWORD}@db:5432/prompt_playground
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      DEBUG: "false"
```

### Multiple Environment Files

```yaml
services:
  api:
    env_file:
      - .env.common
      - .env.${ENVIRONMENT:-development}
```

---

## Security Best Practices

### Do's

1. **Use `.env` files for local development only**
   ```bash
   # Add to .gitignore
   echo ".env" >> .gitignore
   echo ".env.*" >> .gitignore
   echo "!.env.example" >> .gitignore
   ```

2. **Use secrets managers in production**
   - AWS Secrets Manager
   - HashiCorp Vault
   - Google Secret Manager
   - Azure Key Vault

3. **Rotate API keys regularly**
   ```bash
   # Generate new keys and update
   # OpenAI: https://platform.openai.com/api-keys
   # Anthropic: https://console.anthropic.com/account/keys
   ```

4. **Use strong database passwords**
   ```bash
   # Generate secure password
   openssl rand -base64 32
   ```

### Don'ts

1. **Never commit secrets to version control**
   ```bash
   # Check for secrets before committing
   git diff --cached | grep -i "api_key\|password\|secret"
   ```

2. **Don't log sensitive values**
   ```python
   # Bad
   logger.info(f"Using API key: {api_key}")

   # Good
   logger.info("API key configured")
   ```

3. **Don't use weak passwords**
   ```bash
   # Bad
   DATABASE_URL=postgresql+asyncpg://postgres:password@db:5432/db

   # Good
   DATABASE_URL=postgresql+asyncpg://postgres:xK9$mN2#pQ7!vL4@db:5432/db
   ```

---

## Validation

### Check Required Variables

```python
# app/core/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str  # Required - will fail if not set
    openai_api_key: str | None = None  # Optional
    anthropic_api_key: str | None = None  # Optional

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.openai_api_key and not self.anthropic_api_key:
            raise ValueError("At least one API key is required")
```

### Startup Validation

```bash
# Test configuration
python -c "from app.core.config import settings; print(settings)"
```

---

## Troubleshooting

### Variable Not Loading

```bash
# Check if variable is set
echo $DATABASE_URL

# Check in Docker container
docker compose exec api env | grep DATABASE_URL

# Check .env file is being read
docker compose config
```

### Invalid Database URL

```bash
# Test connection
python -c "
from sqlalchemy import create_engine
engine = create_engine('postgresql://...')
engine.connect()
print('Connection successful')
"
```

### API Key Invalid

```bash
# Test OpenAI key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"

# Test Anthropic key
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2024-01-01" \
  -d '{"model":"claude-3-haiku-20240307","max_tokens":1,"messages":[{"role":"user","content":"Hi"}]}'
```

---

## Quick Reference

### Minimum Configuration

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/prompt_playground
OPENAI_API_KEY=sk-...
```

### Recommended Development

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/prompt_playground
DEBUG=true
LOG_LEVEL=DEBUG
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### Recommended Production

```env
DATABASE_URL=postgresql+asyncpg://user:StrongPass@db:5432/prompt_playground
DEBUG=false
LOG_LEVEL=INFO
WORKERS=4
EVAL_CONCURRENCY=10
# API keys via secrets manager
```

---

## Related Documentation

- [Development Setup](../getting-started/development-setup.md)
- [Docker Deployment](./docker.md)
- [Production Setup](./production.md)

---

*Environment variables documentation generated December 2024*
