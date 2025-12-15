# Prompts API

Manage prompts and their versions within use cases.

## Endpoints

### Prompts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/use-cases/{useCaseId}/prompts` | List prompts |
| POST | `/api/v1/use-cases/{useCaseId}/prompts` | Create prompt |
| GET | `/api/v1/prompts/{id}` | Get prompt |
| PATCH | `/api/v1/prompts/{id}` | Update prompt |
| DELETE | `/api/v1/prompts/{id}` | Delete prompt |

### Prompt Versions

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/prompts/{id}/versions` | List versions |
| POST | `/api/v1/prompts/{id}/versions` | Create version |
| GET | `/api/v1/prompts/{id}/versions/{num}` | Get version |
| POST | `/api/v1/prompts/{id}/versions/{num}/promote` | Add label |
| POST | `/api/v1/prompts/{id}/versions/{num}/demote` | Remove label |

---

## List Prompts

Retrieve prompts for a use case with optional tag filtering.

```http
GET /api/v1/use-cases/{useCaseId}/prompts
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| useCaseId | UUID | Parent use case ID |

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| tags | string[] | Filter by tags (comma-separated) |
| skip | integer | Number to skip (default: 0) |
| limit | integer | Maximum to return (default: 100) |

### Response

```json
[
  {
    "id": "770e8400-e29b-41d4-a716-446655440000",
    "use_case_id": "660e8400-e29b-41d4-a716-446655440000",
    "name": "General FAQ Handler",
    "description": "Handles common questions",
    "tags": ["faq", "support", "v1"],
    "created_at": "2024-12-01T10:00:00Z",
    "updated_at": "2024-12-01T10:00:00Z",
    "version_count": 3,
    "latest_version": 3
  }
]
```

### Example

```bash
# List all prompts
curl -X GET "http://localhost:8000/api/v1/use-cases/660e8400-e29b-41d4-a716-446655440000/prompts"

# Filter by tags
curl -X GET "http://localhost:8000/api/v1/use-cases/660e8400-e29b-41d4-a716-446655440000/prompts?tags=faq,support"
```

---

## Create Prompt

Create a new prompt in a use case.

```http
POST /api/v1/use-cases/{useCaseId}/prompts
```

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Prompt name (1-255 chars) |
| description | string | No | Description |
| tags | string[] | No | Tags for organization |

```json
{
  "name": "General FAQ Handler",
  "description": "Handles common customer questions",
  "tags": ["faq", "support"]
}
```

### Response (201 Created)

```json
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "use_case_id": "660e8400-e29b-41d4-a716-446655440000",
  "name": "General FAQ Handler",
  "description": "Handles common customer questions",
  "tags": ["faq", "support"],
  "created_at": "2024-12-01T10:00:00Z",
  "updated_at": "2024-12-01T10:00:00Z"
}
```

---

## Get Prompt

Retrieve a prompt with its version history.

```http
GET /api/v1/prompts/{id}
```

### Response

```json
{
  "id": "770e8400-e29b-41d4-a716-446655440000",
  "use_case_id": "660e8400-e29b-41d4-a716-446655440000",
  "name": "General FAQ Handler",
  "description": "Handles common customer questions",
  "tags": ["faq", "support"],
  "created_at": "2024-12-01T10:00:00Z",
  "updated_at": "2024-12-01T10:00:00Z",
  "version_count": 3,
  "latest_version": 3,
  "versions": [
    {
      "version_number": 3,
      "labels": ["production"],
      "created_at": "2024-12-05T10:00:00Z"
    },
    {
      "version_number": 2,
      "labels": ["beta"],
      "created_at": "2024-12-03T10:00:00Z"
    },
    {
      "version_number": 1,
      "labels": [],
      "created_at": "2024-12-01T10:00:00Z"
    }
  ]
}
```

---

## Update Prompt

Update prompt metadata (not versions).

```http
PATCH /api/v1/prompts/{id}
```

### Request Body

```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "tags": ["faq", "support", "v2"]
}
```

### Response

Returns updated prompt object.

---

## Delete Prompt

Delete a prompt and all its versions.

```http
DELETE /api/v1/prompts/{id}
```

### Response (204 No Content)

---

## List Versions

Get all versions for a prompt.

```http
GET /api/v1/prompts/{id}/versions
```

### Response

```json
[
  {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "prompt_id": "770e8400-e29b-41d4-a716-446655440000",
    "version_number": 3,
    "type": "text",
    "template_text": "You are a helpful assistant for {{company_name}}.\n\nQuestion: {{question}}\n\nProvide a helpful response.",
    "template_messages": null,
    "model_defaults": {
      "model": "gpt-4o",
      "temperature": 0.7
    },
    "variables_schema": {
      "type": "object",
      "properties": {
        "company_name": { "type": "string" },
        "question": { "type": "string" }
      },
      "required": ["company_name", "question"]
    },
    "labels": ["production"],
    "created_at": "2024-12-05T10:00:00Z",
    "created_by": "user@example.com",
    "commit_message": "Improved response quality"
  }
]
```

---

## Create Version

Create a new version for a prompt.

```http
POST /api/v1/prompts/{id}/versions
```

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type | string | Yes | "text" or "chat" |
| template_text | string | For text type | Text template |
| template_messages | array | For chat type | Chat messages |
| model_defaults | object | No | Default model config |
| variables_schema | object | No | JSON Schema for variables |
| commit_message | string | No | Version description |

### Text Template Example

```json
{
  "type": "text",
  "template_text": "You are a helpful assistant for {{company_name}}.\n\nQuestion: {{question}}\n\nProvide a helpful response.",
  "model_defaults": {
    "model": "gpt-4o",
    "temperature": 0.7,
    "max_tokens": 500
  },
  "commit_message": "Initial version"
}
```

### Chat Template Example

```json
{
  "type": "chat",
  "template_messages": [
    {
      "role": "system",
      "content": "You are a helpful assistant for {{company_name}}. Always be professional and helpful."
    },
    {
      "role": "user",
      "content": "{{question}}"
    }
  ],
  "model_defaults": {
    "model": "gpt-4o",
    "temperature": 0.7
  },
  "variables_schema": {
    "type": "object",
    "properties": {
      "company_name": {
        "type": "string",
        "description": "Name of the company"
      },
      "question": {
        "type": "string",
        "description": "Customer question"
      }
    },
    "required": ["company_name", "question"]
  },
  "commit_message": "Added chat-based version"
}
```

### Response (201 Created)

Returns the created version with auto-incremented `version_number`.

---

## Get Version

Get a specific version by number.

```http
GET /api/v1/prompts/{id}/versions/{versionNumber}
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | UUID | Prompt ID |
| versionNumber | integer | Version number |

### Response

Returns the full version object.

---

## Promote Version

Add a label to a version.

```http
POST /api/v1/prompts/{id}/versions/{versionNumber}/promote
```

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| label | string | Yes | Label to add: "production", "beta", or "alpha" |

```json
{
  "label": "production"
}
```

### Response

Returns updated version with new label in `labels` array.

### Example

```bash
curl -X POST "http://localhost:8000/api/v1/prompts/770e8400/versions/3/promote" \
  -H "Content-Type: application/json" \
  -d '{"label": "production"}'
```

---

## Demote Version

Remove a label from a version.

```http
POST /api/v1/prompts/{id}/versions/{versionNumber}/demote
```

### Request Body

```json
{
  "label": "beta"
}
```

### Response

Returns updated version with label removed from `labels` array.

---

## Data Types

### Template Variables

Templates use `{{variable_name}}` syntax:

```
Hello {{name}}, welcome to {{company}}!
```

Variables are:
- Extracted automatically from templates
- Can be validated with JSON Schema
- Substituted at runtime

### Prompt

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| use_case_id | UUID | Parent use case |
| name | string | Prompt name |
| description | string | Optional description |
| tags | string[] | Tags for filtering |
| created_at | datetime | Creation timestamp |
| updated_at | datetime | Last update |

### PromptVersion

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| prompt_id | UUID | Parent prompt |
| version_number | integer | Auto-incremented version |
| type | string | "text" or "chat" |
| template_text | string | Text template (if type=text) |
| template_messages | array | Chat messages (if type=chat) |
| model_defaults | object | Default model configuration |
| variables_schema | object | JSON Schema for variables |
| labels | string[] | Labels (production, beta, alpha) |
| created_at | datetime | Creation timestamp |
| created_by | string | Creator identifier |
| commit_message | string | Version description |

### ChatMessage

| Field | Type | Description |
|-------|------|-------------|
| role | string | "system", "user", or "assistant" |
| content | string | Message content (can include {{variables}}) |

### ModelDefaults

| Field | Type | Description |
|-------|------|-------------|
| model | string | Model identifier |
| temperature | number | 0.0 - 2.0 |
| max_tokens | integer | Maximum response tokens |
| top_p | number | 0.0 - 1.0 |

---

## Related Endpoints

- [Playground API](./playground.md) - Test prompts
- [Evaluations API](./evaluations.md) - Run batch evaluations

---

*API documentation generated December 2024*
