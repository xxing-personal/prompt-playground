# System Architecture Overview

This document provides a comprehensive overview of the Prompt Playground architecture, including the technology stack, system components, and data flow.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│    ┌──────────────────────────────────────────────────────────────┐     │
│    │                     React Frontend (SPA)                      │     │
│    │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐ │     │
│    │  │   Pages   │  │Components │  │   Hooks   │  │  Services │ │     │
│    │  └───────────┘  └───────────┘  └───────────┘  └───────────┘ │     │
│    │                    │                               │         │     │
│    │                    ▼                               ▼         │     │
│    │              TanStack Query              Axios API Client    │     │
│    └───────────────────────────────────────────────────────────────┘     │
│                                    │                                     │
└────────────────────────────────────┼─────────────────────────────────────┘
                                     │ HTTP/REST
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              SERVER LAYER                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│    ┌──────────────────────────────────────────────────────────────┐     │
│    │                    FastAPI Backend                             │     │
│    │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐ │     │
│    │  │ API Routes│  │  Schemas  │  │ Services  │  │  Models   │ │     │
│    │  │  (v1/)    │  │ (Pydantic)│  │ (Business)│  │   (ORM)   │ │     │
│    │  └───────────┘  └───────────┘  └───────────┘  └───────────┘ │     │
│    │        │                             │              │        │     │
│    │        └─────────────────────────────┼──────────────┘        │     │
│    │                                      ▼                       │     │
│    │                           SQLAlchemy (Async)                 │     │
│    └───────────────────────────────────────────────────────────────┘     │
│                          │                      │                        │
└──────────────────────────┼──────────────────────┼────────────────────────┘
                           │                      │
            ┌──────────────┘                      └──────────────┐
            ▼                                                    ▼
┌─────────────────────────┐                      ┌─────────────────────────┐
│     DATA LAYER          │                      │   EXTERNAL SERVICES     │
├─────────────────────────┤                      ├─────────────────────────┤
│                         │                      │                         │
│  ┌───────────────────┐  │                      │  ┌───────────────────┐  │
│  │    PostgreSQL     │  │                      │  │     LiteLLM       │  │
│  │                   │  │                      │  │   (Multi-LLM)     │  │
│  │  • Projects       │  │                      │  │                   │  │
│  │  • Use Cases      │  │                      │  │  • OpenAI         │  │
│  │  • Prompts        │  │                      │  │  • Anthropic      │  │
│  │  • Versions       │  │                      │  │  • Google         │  │
│  │  • Datasets       │  │                      │  │                   │  │
│  │  • EvalRuns       │  │                      │  └───────────────────┘  │
│  │  • Results        │  │                      │                         │
│  └───────────────────┘  │                      └─────────────────────────┘
│                         │
└─────────────────────────┘
```

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2 | UI framework |
| TypeScript | 5.3 | Type safety |
| Vite | 5.0 | Build tool & dev server |
| Tailwind CSS | 3.4 | Styling |
| TanStack Query | 5.17 | Server state management |
| TanStack Table | 8.11 | Table management |
| TanStack Virtual | 3.13 | Virtual scrolling |
| Zustand | 4.5 | Client state management |
| Axios | 1.6 | HTTP client |
| React Router | 6.22 | Routing |
| Lucide React | 0.312 | Icons |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Python | 3.11+ | Runtime |
| FastAPI | 0.109+ | Web framework |
| Uvicorn | 0.27+ | ASGI server |
| SQLAlchemy | 2.0+ | ORM (async) |
| asyncpg | 0.29+ | PostgreSQL driver |
| Alembic | 1.13+ | Migrations |
| Pydantic | 2.5+ | Validation |
| LiteLLM | 1.30+ | LLM abstraction |
| httpx | 0.26+ | HTTP client |

### Infrastructure

| Technology | Version | Purpose |
|------------|---------|---------|
| PostgreSQL | 16 | Database |
| Docker | Latest | Containerization |
| Docker Compose | Latest | Orchestration |
| Nginx | Alpine | Frontend serving (prod) |

## Component Architecture

### Frontend Architecture

```
src/
├── main.tsx              # Application entry point
├── App.tsx               # Route definitions
│
├── pages/                # Page-level components (routes)
│   ├── ProjectsPage
│   ├── ProjectDetailPage
│   ├── UseCaseDetailPage
│   ├── PromptDetailPage
│   ├── DatasetsPage
│   ├── DatasetDetailPage
│   ├── EvaluationsPage
│   ├── EvalRunDetailPage
│   └── CompareEvalRunsPage
│
├── components/
│   ├── ui/               # Primitive UI components
│   │   ├── Button
│   │   ├── Card
│   │   ├── Input
│   │   └── Modal
│   │
│   ├── shared/           # Reusable feature components
│   │   ├── EntityCard
│   │   ├── StatusBadge
│   │   ├── TagEditor
│   │   └── CreateModal
│   │
│   ├── layout/           # Layout components
│   │   ├── Layout
│   │   └── Breadcrumbs
│   │
│   ├── playground/       # Prompt testing feature
│   │   ├── TemplateEditor
│   │   ├── ChatTemplateEditor
│   │   ├── OutputPanel
│   │   ├── ModelSettings
│   │   └── ...
│   │
│   └── eval-results/     # Evaluation display
│       ├── VirtualizedResultsTable
│       └── ResultDetailPanel
│
├── hooks/                # Custom React hooks
│   ├── useProjects
│   ├── useUseCases
│   ├── usePrompts
│   ├── useDatasets
│   ├── useEvalRuns
│   └── ...
│
├── services/
│   └── api.ts           # Centralized API client
│
├── stores/              # Zustand state stores
│
├── types/
│   └── index.ts         # TypeScript definitions
│
└── constants/
    ├── index.ts
    └── models.ts        # LLM model definitions
```

### Backend Architecture

```
app/
├── main.py               # FastAPI application entry
│
├── api/
│   └── v1/
│       ├── router.py     # Main router (includes all)
│       ├── projects.py   # Project endpoints
│       ├── use_cases.py  # Use case endpoints
│       ├── prompts.py    # Prompt endpoints
│       ├── playground.py # Playground endpoints
│       ├── datasets.py   # Dataset endpoints
│       ├── evaluations.py# Evaluation endpoints
│       └── exports.py    # Export endpoints
│
├── core/
│   ├── config.py         # Application settings
│   └── database.py       # Database connection
│
├── models/               # SQLAlchemy ORM models
│   ├── base.py          # Base mixins
│   ├── project.py
│   ├── use_case.py
│   ├── prompt.py
│   ├── prompt_version.py
│   ├── dataset.py
│   └── eval.py
│
├── schemas/              # Pydantic schemas
│   ├── base.py          # Base schemas
│   ├── project.py
│   ├── use_case.py
│   ├── prompt.py
│   └── dataset.py
│
├── services/             # Business logic
│   ├── template_service.py  # Template compilation
│   ├── llm_service.py       # LLM API calls
│   ├── eval_worker.py       # Background worker
│   └── evaluators.py        # Assertion logic
│
└── utils/                # Utility functions
```

## Data Flow

### Request Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  React   │────▶│  Axios   │────▶│ FastAPI  │────▶│ Pydantic │
│Component │     │  Client  │     │  Router  │     │  Schema  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
                                        │
                                        ▼
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│PostgreSQL│◀────│SQLAlchemy│◀────│ Service  │◀────│Validation│
│          │     │   ORM    │     │  Layer   │     │  Pass    │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
```

### Prompt Execution Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                      User Interface                               │
│  1. User enters template + variables                             │
│  2. Selects model(s) and parameters                              │
│  3. Clicks "Run"                                                 │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                     Template Service                              │
│  1. Extract variables from template                              │
│  2. Validate all variables provided                              │
│  3. Compile template (substitute variables)                      │
│  4. Return compiled messages                                     │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                       LLM Service                                 │
│  1. Determine provider from model name                           │
│  2. Configure LiteLLM with API keys                              │
│  3. Send request with compiled messages                          │
│  4. Capture response, latency, token counts                      │
│  5. Calculate cost                                               │
└──────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────────┐
│                      Response Processing                          │
│  1. Parse LLM response                                           │
│  2. Package with metrics                                         │
│  3. Return to frontend                                           │
│  4. Display in OutputPanel                                       │
└──────────────────────────────────────────────────────────────────┘
```

### Evaluation Flow

```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│  EvalRun    │──▶│  Dataset    │──▶│   Items     │
│  Created    │   │  Loaded     │   │  Iterated   │
└─────────────┘   └─────────────┘   └─────────────┘
                                          │
      ┌───────────────────────────────────┘
      │
      ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│  Template   │──▶│    LLM      │──▶│  Grading    │
│  Compiled   │   │   Called    │   │  Applied    │
└─────────────┘   └─────────────┘   └─────────────┘
                                          │
      ┌───────────────────────────────────┘
      │
      ▼
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│  Results    │──▶│  Progress   │──▶│  Summary    │
│  Stored     │   │  Updated    │   │  Generated  │
└─────────────┘   └─────────────┘   └─────────────┘
```

## Design Patterns

### Backend Patterns

1. **Repository Pattern** (implicit)
   - SQLAlchemy models serve as repositories
   - Async session management via dependency injection

2. **Service Layer**
   - Business logic isolated in service classes
   - Clear separation from API handlers

3. **Dependency Injection**
   - FastAPI's `Depends()` for session management
   - Configuration via Pydantic Settings

4. **Schema Validation**
   - Pydantic models for request/response validation
   - Automatic OpenAPI documentation

### Frontend Patterns

1. **Component Composition**
   - Small, focused components
   - Props for customization
   - Children for content projection

2. **Custom Hooks**
   - Encapsulate data fetching logic
   - Provide clean API to components

3. **Server State Management**
   - TanStack Query for API data
   - Automatic caching and refetching

4. **Type Safety**
   - TypeScript throughout
   - Shared type definitions

## Security Architecture

### Authentication (Future)
- JWT-based authentication planned
- API key support for programmatic access

### Data Protection
- Input validation at API boundary
- SQL injection prevention via ORM
- XSS prevention via React's escaping

### API Security
- CORS configuration for allowed origins
- Rate limiting (configurable)
- Request size limits

## Scalability Considerations

### Horizontal Scaling
- Stateless API design
- Database connection pooling
- Background worker separation

### Performance Optimization
- Async I/O throughout backend
- Virtual scrolling for large lists
- Pagination for all list endpoints
- Database indexing (GIN for tags)

### Caching Strategy
- TanStack Query client-side caching
- Database query optimization
- Future: Redis for shared cache

## Deployment Architecture

### Development

```
┌─────────────────────────────────────────────┐
│              docker-compose.yml              │
├─────────────────────────────────────────────┤
│  ┌─────────────┐                            │
│  │  PostgreSQL │ Port 5432                  │
│  │    (db)     │                            │
│  └─────────────┘                            │
│                                              │
│  Backend:  uvicorn --reload (local)         │
│  Frontend: npm run dev (local)              │
└─────────────────────────────────────────────┘
```

### Production

```
┌─────────────────────────────────────────────┐
│          docker-compose.prod.yml             │
├─────────────────────────────────────────────┤
│                                              │
│  ┌─────────────┐  ┌─────────────┐           │
│  │  PostgreSQL │  │   Nginx     │ Port 3000 │
│  │    (db)     │  │ (frontend)  │           │
│  └─────────────┘  └─────────────┘           │
│                                              │
│  ┌─────────────┐  ┌─────────────┐           │
│  │   FastAPI   │  │   Worker    │           │
│  │   (api)     │  │ (eval jobs) │           │
│  └─────────────┘  └─────────────┘           │
│        │                                     │
│        └──────── Port 8000 ─────────────────│
│                                              │
└─────────────────────────────────────────────┘
```

## Next Steps

- [Backend Architecture](./backend-architecture.md) - Deep dive into backend
- [Frontend Architecture](./frontend-architecture.md) - Deep dive into frontend
- [Database Schema](./database-schema.md) - Data model details
- [API Reference](../api/overview.md) - API documentation

---

*Architecture documentation generated December 2024*
