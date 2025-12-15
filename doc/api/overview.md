# API Reference Overview

This document provides a comprehensive guide to the Prompt Playground REST API.

## Base URL

```
Development: http://localhost:8000/api/v1
Production:  https://your-domain.com/api/v1
```

## Authentication

Currently, the API does not require authentication. Future versions will support:

- JWT Bearer tokens
- API keys for programmatic access

## Common Headers

```http
Content-Type: application/json
Accept: application/json
```

## Response Format

### Success Response

```json
{
  "id": "uuid",
  "name": "Resource name",
  "created_at": "2024-12-01T10:00:00Z",
  "updated_at": "2024-12-01T10:00:00Z"
}
```

### Error Response

```json
{
  "detail": "Error message describing what went wrong"
}
```

### Validation Error

```json
{
  "detail": [
    {
      "loc": ["body", "name"],
      "msg": "field required",
      "type": "value_error.missing"
    }
  ]
}
```

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request succeeded |
| 201 | Created - Resource created successfully |
| 204 | No Content - Deletion successful |
| 400 | Bad Request - Invalid request body |
| 404 | Not Found - Resource doesn't exist |
| 422 | Unprocessable Entity - Validation error |
| 500 | Internal Server Error |
| 502 | Bad Gateway - LLM API error |

## Pagination

List endpoints support pagination:

```http
GET /api/v1/projects?skip=0&limit=20
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| skip | integer | 0 | Number of items to skip |
| limit | integer | 100 | Maximum items to return |

Paginated response includes metadata:

```json
{
  "items": [...],
  "total": 150,
  "page": 1,
  "limit": 20,
  "pages": 8
}
```

## API Endpoints Summary

### Projects

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/projects` | List all projects |
| POST | `/projects` | Create a project |
| GET | `/projects/{id}` | Get project details |
| PATCH | `/projects/{id}` | Update a project |
| DELETE | `/projects/{id}` | Delete a project |

### Use Cases

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/projects/{id}/use-cases` | List use cases |
| POST | `/projects/{id}/use-cases` | Create use case |
| GET | `/use-cases/{id}` | Get use case |
| PATCH | `/use-cases/{id}` | Update use case |
| DELETE | `/use-cases/{id}` | Delete use case |

### Prompts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/use-cases/{id}/prompts` | List prompts |
| POST | `/use-cases/{id}/prompts` | Create prompt |
| GET | `/prompts/{id}` | Get prompt |
| PATCH | `/prompts/{id}` | Update prompt |
| DELETE | `/prompts/{id}` | Delete prompt |

### Prompt Versions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/prompts/{id}/versions` | List versions |
| POST | `/prompts/{id}/versions` | Create version |
| GET | `/prompts/{id}/versions/{num}` | Get specific version |
| POST | `/prompts/{id}/versions/{num}/promote` | Add label |
| POST | `/prompts/{id}/versions/{num}/demote` | Remove label |

### Playground

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/playground/compile` | Compile template |
| POST | `/playground/run` | Execute template |
| POST | `/playground/run-version/{id}` | Execute saved version |
| POST | `/playground/run-multi` | Execute multiple models |

### Datasets

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/use-cases/{id}/datasets` | List datasets |
| POST | `/use-cases/{id}/datasets` | Create dataset |
| GET | `/datasets/{id}` | Get dataset |
| PATCH | `/datasets/{id}` | Update dataset |
| DELETE | `/datasets/{id}` | Delete dataset |

### Dataset Items

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/datasets/{id}/items` | List items |
| POST | `/datasets/{id}/items` | Create item |
| POST | `/datasets/{id}/items/batch` | Batch create |
| PATCH | `/datasets/items/{id}` | Update item |
| DELETE | `/datasets/items/{id}` | Delete item |

### Evaluations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/eval-runs` | List eval runs |
| POST | `/eval-runs` | Create eval run |
| GET | `/eval-runs/{id}` | Get eval run |
| POST | `/eval-runs/{id}/cancel` | Cancel run |
| GET | `/eval-runs/{id}/results` | Get results |

### Exports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/eval-runs/{id}/export.json` | Export as JSON |
| GET | `/eval-runs/{id}/export.md` | Export as Markdown |

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |

## Interactive Documentation

When running the backend, visit:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Rate Limiting

Currently no rate limiting is enforced. Future versions will include:

- Request rate limits per IP/API key
- LLM call quotas

## Versioning

The API uses URL versioning:

- Current: `/api/v1/`
- Future versions will use `/api/v2/`, etc.

## Detailed Documentation

- [Projects API](./projects.md)
- [Use Cases API](./use-cases.md)
- [Prompts API](./prompts.md)
- [Playground API](./playground.md)
- [Datasets API](./datasets.md)
- [Evaluations API](./evaluations.md)
- [Exports API](./exports.md)

---

*API documentation generated December 2024*
