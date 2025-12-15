# Docker Deployment Guide

This guide covers deploying Prompt Playground using Docker and Docker Compose.

## Prerequisites

- Docker 20.10+ installed
- Docker Compose v2+ installed
- At least 4GB RAM available
- API keys for LLM providers

## Quick Start

### Development Mode

```bash
# Clone repository
git clone <repository-url>
cd prompt-playground

# Create environment file
cp .env.example .env
# Edit .env with your API keys

# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Access application
# Frontend: http://localhost:3000
# API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### Production Mode

```bash
# Build and start production containers
docker compose -f docker-compose.prod.yml up -d --build

# View logs
docker compose -f docker-compose.prod.yml logs -f

# Access application
# Frontend: http://localhost:3000
# API: http://localhost:8000
```

---

## Configuration Files

### docker-compose.yml (Development)

```yaml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: prompt_playground
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql+asyncpg://postgres:postgres@db:5432/prompt_playground
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
    ports:
      - "8000:8000"
    depends_on:
      db:
        condition: service_healthy
    volumes:
      - ./backend:/app  # For hot reload
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

volumes:
  postgres_data:
```

### docker-compose.prod.yml (Production)

```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME:-prompt_playground}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql+asyncpg://${DB_USER:-postgres}:${DB_PASSWORD}@db:5432/${DB_NAME:-prompt_playground}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
    ports:
      - "8000:8000"
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4

  worker:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      DATABASE_URL: postgresql+asyncpg://${DB_USER:-postgres}:${DB_PASSWORD}@db:5432/${DB_NAME:-prompt_playground}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      ANTHROPIC_API_KEY: ${ANTHROPIC_API_KEY}
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped
    command: python -m app.services.eval_worker

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    ports:
      - "3000:80"
    depends_on:
      - api
    restart: unless-stopped

volumes:
  postgres_data:
```

---

## Dockerfiles

### Backend Dockerfile

```dockerfile
# backend/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Set environment variables
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend Dockerfile (Production)

```dockerfile
# frontend/Dockerfile.prod
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Configuration

```nginx
# frontend/nginx.conf
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests
    location /api {
        proxy_pass http://api:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## Environment Variables

### .env.example

```env
# Database
DB_USER=postgres
DB_PASSWORD=secure_password_here
DB_NAME=prompt_playground

# Full connection URL (for local development)
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/prompt_playground

# LLM API Keys
OPENAI_API_KEY=sk-your-openai-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here

# Optional settings
DEBUG=false
LOG_LEVEL=INFO
```

### Production Environment

For production, use secure methods to manage secrets:

```bash
# Using Docker secrets
docker secret create openai_api_key ./openai_key.txt
docker secret create anthropic_api_key ./anthropic_key.txt

# Or environment file
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

---

## Common Operations

### Starting Services

```bash
# Development
docker compose up -d

# Production
docker compose -f docker-compose.prod.yml up -d

# With rebuild
docker compose up -d --build
```

### Stopping Services

```bash
# Stop all services
docker compose down

# Stop and remove volumes
docker compose down -v

# Stop specific service
docker compose stop api
```

### Viewing Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f api

# Last 100 lines
docker compose logs --tail=100 api
```

### Running Commands

```bash
# Run migrations
docker compose exec api alembic upgrade head

# Access database
docker compose exec db psql -U postgres prompt_playground

# Run Python shell
docker compose exec api python

# Access container shell
docker compose exec api bash
```

### Rebuilding Services

```bash
# Rebuild single service
docker compose build api

# Rebuild and restart
docker compose up -d --build api

# Force rebuild without cache
docker compose build --no-cache api
```

---

## Database Management

### Backup Database

```bash
# Create backup
docker compose exec db pg_dump -U postgres prompt_playground > backup.sql

# With timestamp
docker compose exec db pg_dump -U postgres prompt_playground > backup_$(date +%Y%m%d_%H%M%S).sql

# Compressed backup
docker compose exec db pg_dump -U postgres prompt_playground | gzip > backup.sql.gz
```

### Restore Database

```bash
# Restore from backup
docker compose exec -T db psql -U postgres prompt_playground < backup.sql

# From compressed backup
gunzip -c backup.sql.gz | docker compose exec -T db psql -U postgres prompt_playground
```

### Run Migrations

```bash
# Apply all migrations
docker compose exec api alembic upgrade head

# Rollback last migration
docker compose exec api alembic downgrade -1

# Check current revision
docker compose exec api alembic current
```

---

## Scaling

### Horizontal Scaling

```yaml
# docker-compose.prod.yml
services:
  api:
    deploy:
      replicas: 3
    # ... rest of config
```

```bash
# Scale manually
docker compose -f docker-compose.prod.yml up -d --scale api=3
```

### Load Balancing with Traefik

```yaml
version: '3.8'

services:
  traefik:
    image: traefik:v2.9
    command:
      - "--api.dashboard=true"
      - "--providers.docker=true"
      - "--entrypoints.web.address=:80"
    ports:
      - "80:80"
      - "8080:8080"  # Dashboard
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock

  api:
    # ... existing config
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.api.rule=PathPrefix(`/api`)"
      - "traefik.http.services.api.loadbalancer.server.port=8000"
```

---

## Health Checks

### Service Health

```bash
# Check all services
docker compose ps

# Health check endpoint
curl http://localhost:8000/health
```

### Container Resource Usage

```bash
# View resource stats
docker stats

# Specific containers
docker stats prompt-playground-api-1 prompt-playground-db-1
```

---

## Troubleshooting

### Common Issues

**Database connection failed:**
```bash
# Check database is running
docker compose ps db

# Check database logs
docker compose logs db

# Verify connection
docker compose exec api python -c "from app.core.database import engine; print(engine.url)"
```

**API not starting:**
```bash
# Check logs
docker compose logs api

# Verify environment variables
docker compose exec api env | grep DATABASE

# Check migrations
docker compose exec api alembic current
```

**Frontend not loading:**
```bash
# Check build
docker compose logs frontend

# Verify nginx config
docker compose exec frontend cat /etc/nginx/conf.d/default.conf

# Check API proxy
curl -v http://localhost:3000/api/v1/projects
```

### Reset Everything

```bash
# Stop all containers
docker compose down

# Remove all volumes
docker compose down -v

# Remove images
docker compose down --rmi all

# Fresh start
docker compose up -d --build
```

---

## Production Checklist

- [ ] Set strong database password
- [ ] Configure API keys securely
- [ ] Enable HTTPS (via reverse proxy)
- [ ] Set up database backups
- [ ] Configure logging aggregation
- [ ] Set up monitoring/alerting
- [ ] Review container resource limits
- [ ] Enable restart policies
- [ ] Configure health checks
- [ ] Set up CI/CD pipeline

---

## Related Documentation

- [Development Setup](../getting-started/development-setup.md)
- [Production Setup](./production.md)
- [Environment Variables](./environment-variables.md)

---

*Docker deployment documentation generated December 2024*
