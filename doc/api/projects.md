# Projects API

Projects are the top-level organizational containers in Prompt Playground.

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/projects` | List all projects |
| POST | `/api/v1/projects` | Create a new project |
| GET | `/api/v1/projects/{id}` | Get project by ID |
| PATCH | `/api/v1/projects/{id}` | Update a project |
| DELETE | `/api/v1/projects/{id}` | Delete a project |

---

## List Projects

Retrieve all projects with optional pagination.

```http
GET /api/v1/projects
```

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| skip | integer | 0 | Number of items to skip |
| limit | integer | 100 | Maximum items to return (max: 1000) |

### Response

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Customer Support Bot",
    "description": "AI-powered customer support assistant",
    "created_at": "2024-12-01T10:00:00Z",
    "updated_at": "2024-12-01T10:00:00Z"
  },
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Content Generator",
    "description": "Marketing content generation prompts",
    "created_at": "2024-12-02T14:30:00Z",
    "updated_at": "2024-12-02T14:30:00Z"
  }
]
```

### Example

```bash
curl -X GET "http://localhost:8000/api/v1/projects?skip=0&limit=10"
```

---

## Create Project

Create a new project.

```http
POST /api/v1/projects
```

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Project name (1-255 characters) |
| description | string | No | Project description |

```json
{
  "name": "Customer Support Bot",
  "description": "AI-powered customer support assistant for our platform"
}
```

### Response (201 Created)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Customer Support Bot",
  "description": "AI-powered customer support assistant for our platform",
  "created_at": "2024-12-01T10:00:00Z",
  "updated_at": "2024-12-01T10:00:00Z"
}
```

### Example

```bash
curl -X POST "http://localhost:8000/api/v1/projects" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Customer Support Bot",
    "description": "AI-powered customer support assistant"
  }'
```

---

## Get Project

Retrieve a single project by ID with stats.

```http
GET /api/v1/projects/{id}
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | UUID | Project ID |

### Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Customer Support Bot",
  "description": "AI-powered customer support assistant",
  "created_at": "2024-12-01T10:00:00Z",
  "updated_at": "2024-12-01T10:00:00Z",
  "use_case_count": 3,
  "prompt_count": 12,
  "eval_run_count": 45
}
```

### Error Response (404)

```json
{
  "detail": "Project not found"
}
```

### Example

```bash
curl -X GET "http://localhost:8000/api/v1/projects/550e8400-e29b-41d4-a716-446655440000"
```

---

## Update Project

Update an existing project.

```http
PATCH /api/v1/projects/{id}
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | UUID | Project ID |

### Request Body

All fields are optional. Only include fields to update.

| Field | Type | Description |
|-------|------|-------------|
| name | string | New project name (1-255 characters) |
| description | string | New project description |

```json
{
  "name": "Updated Project Name",
  "description": "Updated description"
}
```

### Response

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Updated Project Name",
  "description": "Updated description",
  "created_at": "2024-12-01T10:00:00Z",
  "updated_at": "2024-12-05T16:20:00Z"
}
```

### Example

```bash
curl -X PATCH "http://localhost:8000/api/v1/projects/550e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Project Name"
  }'
```

---

## Delete Project

Delete a project and all its contents (use cases, prompts, datasets, evaluations).

```http
DELETE /api/v1/projects/{id}
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | UUID | Project ID |

### Response (204 No Content)

No response body on success.

### Error Response (404)

```json
{
  "detail": "Project not found"
}
```

### Example

```bash
curl -X DELETE "http://localhost:8000/api/v1/projects/550e8400-e29b-41d4-a716-446655440000"
```

---

## Data Types

### Project

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| name | string | Project name |
| description | string | Optional description |
| created_at | datetime | ISO 8601 creation timestamp |
| updated_at | datetime | ISO 8601 last update timestamp |

### ProjectCreate

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| name | string | Yes | 1-255 characters |
| description | string | No | No limit |

### ProjectUpdate

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| name | string | No | 1-255 characters |
| description | string | No | No limit |

### ProjectWithStats

Extends Project with:

| Field | Type | Description |
|-------|------|-------------|
| use_case_count | integer | Number of use cases |
| prompt_count | integer | Total prompts across use cases |
| eval_run_count | integer | Total evaluation runs |

---

## Related Endpoints

After creating a project, you can:

- [Create Use Cases](./use-cases.md) - Add use cases to organize prompts
- [View Prompts](./prompts.md) - Manage prompts within use cases
- [Run Evaluations](./evaluations.md) - Test prompts at scale

---

*API documentation generated December 2024*
