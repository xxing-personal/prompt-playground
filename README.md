# Prompt Playground

A powerful full-stack application for managing, testing, and evaluating LLM prompts across multiple providers.

## Overview

Prompt Playground is a comprehensive platform designed for AI/ML engineers, prompt engineers, and developers who need to:

- **Create and organize** prompts with version control
- **Test prompts** across multiple LLM providers (OpenAI, Anthropic, Google)
- **Run batch evaluations** with custom datasets
- **Compare outputs** from different models side-by-side
- **Track and analyze** prompt performance over time

## Features

### Prompt Management
- Organize prompts into projects and use cases
- Support for both text and chat message templates
- Version control with commit messages
- Label system (production, beta, alpha) for promotion workflow
- Tag-based organization and filtering

### Template System
- Mustache-style variable syntax: `{{variable_name}}`
- Support for nested variables in chat messages
- Real-time template compilation and validation
- Variable schema definitions with JSON Schema

### Multi-Model Testing
- Run prompts against multiple models simultaneously
- Compare outputs side-by-side
- Configurable model parameters (temperature, max_tokens, top_p)
- Support for OpenAI, Anthropic Claude, and Google Gemini

### Evaluation System
- Create custom datasets with input/output pairs
- Define assertions and grading rules
- Run batch evaluations across models
- Track metrics: latency, token usage, cost
- Export results as JSON or Markdown

## Tech Stack

### Backend
- **Framework:** FastAPI with async support
- **Database:** PostgreSQL with SQLAlchemy ORM
- **LLM Integration:** LiteLLM for multi-provider support
- **Migrations:** Alembic
- **Python:** 3.11+

### Frontend
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite
- **Styling:** Tailwind CSS
- **Data Fetching:** TanStack Query (React Query)
- **State Management:** Zustand
- **Icons:** Lucide React

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 20+
- Docker & Docker Compose
- OpenAI and/or Anthropic API keys

### Option 1: Docker Compose (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd prompt-playground

# Create environment file
cp .env.example .env
# Edit .env with your API keys

# Start all services
docker compose up -d

# Open in browser
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/docs
```

### Option 2: Local Development

1. **Start the database:**
   ```bash
   docker compose up -d db
   ```

2. **Backend setup:**
   ```bash
   cd backend
   python3 -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -e ".[dev]"

   # Set environment variables
   export DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/prompt_playground
   export OPENAI_API_KEY=your-key-here
   export ANTHROPIC_API_KEY=your-key-here

   # Run migrations
   alembic upgrade head

   # Start server
   uvicorn app.main:app --reload --port 8000
   ```

3. **Frontend setup:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Open in browser:**
   - Frontend: http://localhost:3000
   - API Docs: http://localhost:8000/docs

## Project Structure

```
prompt-playground/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # REST API endpoints
│   │   │   └── v1/         # API version 1
│   │   ├── core/           # Configuration, database setup
│   │   ├── models/         # SQLAlchemy ORM models
│   │   ├── schemas/        # Pydantic request/response schemas
│   │   ├── services/       # Business logic layer
│   │   └── utils/          # Utility functions
│   ├── alembic/            # Database migrations
│   ├── tests/              # Backend tests
│   ├── requirements.txt    # Python dependencies
│   └── Dockerfile          # Backend container
│
├── frontend/               # React TypeScript frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── ui/         # Base UI components
│   │   │   ├── shared/     # Reusable feature components
│   │   │   ├── layout/     # Layout components
│   │   │   ├── playground/ # Prompt testing components
│   │   │   └── eval-results/ # Evaluation display
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page components
│   │   ├── services/       # API client
│   │   ├── stores/         # Zustand stores
│   │   ├── types/          # TypeScript types
│   │   └── constants/      # App constants
│   ├── package.json        # Node.js dependencies
│   └── Dockerfile          # Frontend container
│
├── doc/                    # Documentation
├── scripts/                # Build and deployment scripts
├── docker-compose.yml      # Development setup
├── docker-compose.prod.yml # Production setup
└── .env.example            # Environment template
```

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `OPENAI_API_KEY` | OpenAI API key | For OpenAI models |
| `ANTHROPIC_API_KEY` | Anthropic API key | For Claude models |
| `DEBUG` | Enable debug mode | No (default: false) |

### Supported Models

**OpenAI:**
- gpt-5.2, gpt-5-mini, gpt-5-nano
- gpt-4o, gpt-4o-mini
- gpt-4-turbo, gpt-4
- gpt-3.5-turbo

**Anthropic:**
- claude-opus-4-5, claude-sonnet-4-5, claude-haiku-4-5
- claude-3-5-sonnet-20241022
- claude-3-opus-20240229

**Google:**
- gemini-3.0-pro-preview, gemini-3.0-deep-think-preview
- gemini-2.5-flash

## API Documentation

Interactive API documentation is available at `/docs` when the backend is running.

### Key Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/v1/projects` | List all projects |
| `POST /api/v1/projects` | Create a new project |
| `GET /api/v1/prompts/{id}/versions` | List prompt versions |
| `POST /api/v1/playground/run` | Execute a prompt |
| `POST /api/v1/playground/run-versions` | Compare multiple versions |
| `POST /api/v1/playground/runs` | Save run to history |
| `GET /api/v1/playground/runs/by-version/{id}` | Get run history |
| `POST /api/v1/eval-runs` | Start an evaluation |

See the [API Reference](./doc/api/overview.md) for complete documentation.

## Usage Guide

### Creating a Prompt

1. Create a **Project** to organize your work
2. Add a **Use Case** within the project
3. Create a **Prompt** with a name and tags
4. Add a **Version** with your template content

### Template Syntax

Use double curly braces for variables:

```
You are a helpful assistant for {{company_name}}.

The user's question is: {{user_question}}

Please provide a {{tone}} response.
```

### Running Evaluations

1. Create a **Dataset** with test cases
2. Add **Dataset Items** with input variables
3. Create an **Evaluation Run** selecting:
   - Prompt version
   - Dataset
   - Models to test
   - Assertions (optional)
4. View results and export as needed

## Development

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

### Code Quality

```bash
# Backend linting
cd backend
ruff check .
ruff format .

# Frontend linting
cd frontend
npm run lint
```

### Database Migrations

```bash
cd backend

# Create a new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

## Deployment

### Production with Docker Compose

```bash
# Build and start production containers
docker compose -f docker-compose.prod.yml up -d --build

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

See [Deployment Guide](./doc/deployment/docker.md) for detailed instructions.

## Documentation

Comprehensive documentation is available in the `/doc` directory:

- [Getting Started](./doc/getting-started/development-setup.md)
- [Architecture Overview](./doc/architecture/system-overview.md)
- [API Reference](./doc/api/overview.md)
- [Frontend Guide](./doc/frontend/components.md)
- [Backend Guide](./doc/backend/services.md)
- [Deployment](./doc/deployment/docker.md)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [LiteLLM](https://github.com/BerriAI/litellm) - Multi-provider LLM abstraction
- [React](https://react.dev/) - UI library
- [TanStack Query](https://tanstack.com/query) - Data fetching library
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework

---

*Built with care for the AI/ML community.*
