# Use Cases API

Use cases organize prompts and datasets within a project.

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/projects/{projectId}/use-cases` | List use cases in project |
| POST | `/api/v1/projects/{projectId}/use-cases` | Create use case |
| GET | `/api/v1/use-cases/{id}` | Get use case by ID |
| PATCH | `/api/v1/use-cases/{id}` | Update use case |
| DELETE | `/api/v1/use-cases/{id}` | Delete use case |

---

## List Use Cases

Retrieve all use cases for a project.

```http
GET /api/v1/projects/{projectId}/use-cases
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| projectId | UUID | Parent project ID |

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| skip | integer | 0 | Number of items to skip |
| limit | integer | 100 | Maximum items to return |

### Response

```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "project_id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "FAQ Responses",
    "description": "Handle common customer questions",
    "created_at": "2024-12-01T10:00:00Z",
    "updated_at": "2024-12-01T10:00:00Z",
    "prompt_count": 5,
    "dataset_count": 2
  }
]
```

### Example

```bash
curl -X GET "http://localhost:8000/api/v1/projects/550e8400-e29b-41d4-a716-446655440000/use-cases"
```

---

## Create Use Case

Create a new use case within a project.

```http
POST /api/v1/projects/{projectId}/use-cases
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| projectId | UUID | Parent project ID |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Use case name (1-255 characters) |
| description | string | No | Use case description |

```json
{
  "name": "FAQ Responses",
  "description": "Handle common customer questions"
}
```

### Response (201 Created)

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "project_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "FAQ Responses",
  "description": "Handle common customer questions",
  "created_at": "2024-12-01T10:00:00Z",
  "updated_at": "2024-12-01T10:00:00Z"
}
```

### Example

```bash
curl -X POST "http://localhost:8000/api/v1/projects/550e8400-e29b-41d4-a716-446655440000/use-cases" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "FAQ Responses",
    "description": "Handle common customer questions"
  }'
```

---

## Get Use Case

Retrieve a single use case by ID.

```http
GET /api/v1/use-cases/{id}
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | UUID | Use case ID |

### Response

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "project_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "FAQ Responses",
  "description": "Handle common customer questions",
  "created_at": "2024-12-01T10:00:00Z",
  "updated_at": "2024-12-01T10:00:00Z",
  "prompt_count": 5,
  "dataset_count": 2
}
```

### Example

```bash
curl -X GET "http://localhost:8000/api/v1/use-cases/660e8400-e29b-41d4-a716-446655440000"
```

---

## Update Use Case

Update an existing use case.

```http
PATCH /api/v1/use-cases/{id}
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | UUID | Use case ID |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | No | New name |
| description | string | No | New description |

```json
{
  "name": "Updated FAQ Handler",
  "description": "Improved FAQ handling logic"
}
```

### Response

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440000",
  "project_id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Updated FAQ Handler",
  "description": "Improved FAQ handling logic",
  "created_at": "2024-12-01T10:00:00Z",
  "updated_at": "2024-12-05T16:20:00Z"
}
```

### Example

```bash
curl -X PATCH "http://localhost:8000/api/v1/use-cases/660e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated FAQ Handler"}'
```

---

## Delete Use Case

Delete a use case and all its prompts and datasets.

```http
DELETE /api/v1/use-cases/{id}
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | UUID | Use case ID |

### Response (204 No Content)

No response body on success.

### Example

```bash
curl -X DELETE "http://localhost:8000/api/v1/use-cases/660e8400-e29b-41d4-a716-446655440000"
```

---

## Data Types

### UseCase

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| project_id | UUID | Parent project ID |
| name | string | Use case name |
| description | string | Optional description |
| created_at | datetime | Creation timestamp |
| updated_at | datetime | Last update timestamp |

### UseCaseWithStats

Extends UseCase with:

| Field | Type | Description |
|-------|------|-------------|
| prompt_count | integer | Number of prompts |
| dataset_count | integer | Number of datasets |

---

## Related Endpoints

- [Prompts API](./prompts.md) - Manage prompts within use cases
- [Datasets API](./datasets.md) - Create test datasets

---

*API documentation generated December 2024*
