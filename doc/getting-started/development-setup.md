# Development Setup Guide

This guide walks you through setting up a local development environment for Prompt Playground.

## Prerequisites

Before you begin, ensure you have the following installed:

| Tool | Version | Purpose |
|------|---------|---------|
| Python | 3.11+ | Backend runtime |
| Node.js | 20+ | Frontend runtime |
| Docker | Latest | Database container |
| Docker Compose | Latest | Service orchestration |
| Git | Latest | Version control |

### Verify Prerequisites

```bash
# Check Python version
python3 --version  # Should show 3.11.x or higher

# Check Node.js version
node --version  # Should show v20.x or higher

# Check Docker
docker --version
docker compose version
```

## Step 1: Clone the Repository

```bash
git clone <repository-url>
cd prompt-playground
```

## Step 2: Environment Configuration

Create your environment configuration file:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
# Database Configuration
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/prompt_playground

# LLM API Keys (add at least one)
OPENAI_API_KEY=sk-your-openai-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here

# Optional Settings
DEBUG=true
```

## Step 3: Start PostgreSQL Database

Use Docker Compose to start the database:

```bash
docker compose up -d db
```

Verify the database is running:

```bash
docker compose ps
# Should show 'db' service as 'running'
```

## Step 4: Backend Setup

### Create Virtual Environment

```bash
cd backend
python3 -m venv .venv
```

### Activate Virtual Environment

**macOS/Linux:**
```bash
source .venv/bin/activate
```

**Windows (PowerShell):**
```powershell
.\.venv\Scripts\Activate.ps1
```

**Windows (CMD):**
```cmd
.venv\Scripts\activate.bat
```

### Install Dependencies

```bash
pip install -e ".[dev]"
```

This installs:
- FastAPI and Uvicorn
- SQLAlchemy with asyncpg driver
- Alembic for migrations
- LiteLLM for LLM integration
- Development tools (pytest, ruff)

### Run Database Migrations

```bash
# Set environment variable (or use .env file)
export DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/prompt_playground

# Run migrations
alembic upgrade head
```

### Start the Backend Server

```bash
uvicorn app.main:app --reload --port 8000
```

The backend will be available at:
- **API:** http://localhost:8000
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## Step 5: Frontend Setup

Open a new terminal and navigate to the frontend:

```bash
cd frontend
```

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm run dev
```

The frontend will be available at http://localhost:3000

## Step 6: Verify Installation

1. Open http://localhost:3000 in your browser
2. You should see the Prompt Playground home page
3. Create a test project to verify everything works

## Development Workflow

### Backend Development

The backend uses hot reload by default (`--reload` flag). Changes to Python files will automatically restart the server.

**Common commands:**

```bash
# Run backend
uvicorn app.main:app --reload --port 8000

# Run tests
pytest

# Format code
ruff format .

# Lint code
ruff check .

# Create new migration
alembic revision --autogenerate -m "migration description"

# Apply migrations
alembic upgrade head
```

### Frontend Development

Vite provides instant hot module replacement (HMR). Changes to React components will reflect immediately.

**Common commands:**

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Type check
npm run typecheck
```

## Directory Structure Reference

```
prompt-playground/
├── backend/
│   ├── app/
│   │   ├── api/v1/          # API route handlers
│   │   ├── core/            # Config, database
│   │   ├── models/          # ORM models
│   │   ├── schemas/         # Pydantic schemas
│   │   └── services/        # Business logic
│   ├── alembic/
│   │   └── versions/        # Migration files
│   └── tests/
│
├── frontend/
│   └── src/
│       ├── components/      # React components
│       ├── hooks/           # Custom hooks
│       ├── pages/           # Page components
│       ├── services/        # API client
│       └── types/           # TypeScript types
│
└── docker-compose.yml       # Development services
```

## Troubleshooting

### Database Connection Issues

**Error:** `connection refused` or `could not connect to server`

**Solutions:**
1. Ensure Docker is running: `docker compose ps`
2. Check if PostgreSQL is accepting connections: `docker compose logs db`
3. Verify DATABASE_URL is correct
4. Wait a few seconds after starting the database

### Backend Won't Start

**Error:** `ModuleNotFoundError`

**Solution:** Ensure virtual environment is activated and dependencies installed:
```bash
source .venv/bin/activate
pip install -e ".[dev]"
```

### Frontend Won't Start

**Error:** `EACCES permission denied` or `ENOENT`

**Solutions:**
1. Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
2. Ensure you're using Node.js 20+
3. Clear npm cache: `npm cache clean --force`

### API Key Issues

**Error:** `AuthenticationError` from OpenAI/Anthropic

**Solutions:**
1. Verify API keys in `.env` file
2. Ensure no extra spaces or quotes around keys
3. Check API key permissions and quotas

### Migration Issues

**Error:** `Target database is not up to date`

**Solution:**
```bash
# Check current revision
alembic current

# Upgrade to latest
alembic upgrade head
```

## IDE Setup

### VS Code (Recommended)

Install recommended extensions:
- Python (Microsoft)
- Pylance
- ESLint
- Tailwind CSS IntelliSense
- Prettier

Create `.vscode/settings.json`:
```json
{
  "python.defaultInterpreterPath": "./backend/.venv/bin/python",
  "python.formatting.provider": "none",
  "[python]": {
    "editor.defaultFormatter": "charliermarsh.ruff",
    "editor.formatOnSave": true
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.formatOnSave": true
  }
}
```

### PyCharm

1. Set Python interpreter to `backend/.venv/bin/python`
2. Mark `backend` as Sources Root
3. Enable Ruff for formatting

## Next Steps

Now that your development environment is set up:

1. Read the [Architecture Overview](../architecture/system-overview.md)
2. Explore the [API Reference](../api/overview.md)
3. Try the [Quick Start Tutorial](./quick-start.md)
4. Review [Contributing Guidelines](../../CONTRIBUTING.md)

---

*Need help? Open an issue on GitHub.*
