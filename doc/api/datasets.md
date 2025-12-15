# Datasets API

Manage test datasets and items for prompt evaluation.

## Endpoints

### Datasets

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/use-cases/{useCaseId}/datasets` | List datasets |
| POST | `/api/v1/use-cases/{useCaseId}/datasets` | Create dataset |
| GET | `/api/v1/datasets/{id}` | Get dataset |
| PATCH | `/api/v1/datasets/{id}` | Update dataset |
| DELETE | `/api/v1/datasets/{id}` | Delete dataset |

### Dataset Items

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/datasets/{id}/items` | List items |
| POST | `/api/v1/datasets/{id}/items` | Create item |
| POST | `/api/v1/datasets/{id}/items/batch` | Batch create items |
| PATCH | `/api/v1/datasets/items/{id}` | Update item |
| DELETE | `/api/v1/datasets/items/{id}` | Delete item |

---

## List Datasets

Retrieve all datasets for a use case.

```http
GET /api/v1/use-cases/{useCaseId}/datasets
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| useCaseId | UUID | Parent use case ID |

### Response

```json
[
  {
    "id": "990e8400-e29b-41d4-a716-446655440000",
    "use_case_id": "660e8400-e29b-41d4-a716-446655440000",
    "name": "FAQ Test Cases",
    "description": "Common FAQ questions for testing",
    "item_count": 25,
    "created_at": "2024-12-01T10:00:00Z",
    "updated_at": "2024-12-01T10:00:00Z"
  }
]
```

---

## Create Dataset

Create a new dataset in a use case.

```http
POST /api/v1/use-cases/{useCaseId}/datasets
```

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Dataset name |
| description | string | No | Description |
| input_schema | object | No | JSON Schema for inputs |
| expected_output_schema | object | No | JSON Schema for expected outputs |
| default_assertions | array | No | Default assertions for evaluation |

### Example Request

```json
{
  "name": "FAQ Test Cases",
  "description": "Common FAQ questions for testing",
  "input_schema": {
    "type": "object",
    "properties": {
      "company_name": {"type": "string"},
      "question": {"type": "string"}
    },
    "required": ["company_name", "question"]
  },
  "default_assertions": [
    {"type": "not_contains", "value": "I don't know"},
    {"type": "contains", "value": "Acme"}
  ]
}
```

### Response (201 Created)

```json
{
  "id": "990e8400-e29b-41d4-a716-446655440000",
  "use_case_id": "660e8400-e29b-41d4-a716-446655440000",
  "name": "FAQ Test Cases",
  "description": "Common FAQ questions for testing",
  "input_schema": {...},
  "expected_output_schema": null,
  "default_assertions": [...],
  "created_at": "2024-12-01T10:00:00Z",
  "updated_at": "2024-12-01T10:00:00Z"
}
```

---

## Get Dataset

Retrieve a dataset with stats.

```http
GET /api/v1/datasets/{id}
```

### Response

```json
{
  "id": "990e8400-e29b-41d4-a716-446655440000",
  "use_case_id": "660e8400-e29b-41d4-a716-446655440000",
  "name": "FAQ Test Cases",
  "description": "Common FAQ questions for testing",
  "input_schema": {...},
  "expected_output_schema": null,
  "default_assertions": [...],
  "item_count": 25,
  "eval_run_count": 10,
  "created_at": "2024-12-01T10:00:00Z",
  "updated_at": "2024-12-01T10:00:00Z"
}
```

---

## Update Dataset

Update dataset metadata.

```http
PATCH /api/v1/datasets/{id}
```

### Request Body

```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "default_assertions": [
    {"type": "contains", "value": "success"}
  ]
}
```

---

## Delete Dataset

Delete a dataset and all its items.

```http
DELETE /api/v1/datasets/{id}
```

### Response (204 No Content)

---

## List Dataset Items

Retrieve items in a dataset with pagination.

```http
GET /api/v1/datasets/{datasetId}/items
```

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| skip | integer | 0 | Items to skip |
| limit | integer | 100 | Max items to return |

### Response

```json
[
  {
    "id": "aa0e8400-e29b-41d4-a716-446655440000",
    "dataset_id": "990e8400-e29b-41d4-a716-446655440000",
    "input": {
      "company_name": "Acme Inc",
      "question": "What are your business hours?"
    },
    "expected_output": {
      "contains": ["9 AM", "5 PM"]
    },
    "metadata": {
      "category": "hours",
      "priority": "high"
    },
    "created_at": "2024-12-01T10:00:00Z",
    "updated_at": "2024-12-01T10:00:00Z"
  }
]
```

---

## Create Dataset Item

Add a single item to a dataset.

```http
POST /api/v1/datasets/{datasetId}/items
```

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| input | object | Yes | Input variables for template |
| expected_output | object | No | Expected output for validation |
| metadata | object | No | Additional metadata |

### Example Request

```json
{
  "input": {
    "company_name": "Acme Inc",
    "question": "What are your business hours?"
  },
  "expected_output": {
    "contains": ["9 AM", "5 PM", "Monday", "Friday"]
  },
  "metadata": {
    "category": "hours",
    "source": "manual"
  }
}
```

### Response (201 Created)

```json
{
  "id": "aa0e8400-e29b-41d4-a716-446655440000",
  "dataset_id": "990e8400-e29b-41d4-a716-446655440000",
  "input": {...},
  "expected_output": {...},
  "metadata": {...},
  "created_at": "2024-12-01T10:00:00Z",
  "updated_at": "2024-12-01T10:00:00Z"
}
```

---

## Batch Create Items

Add multiple items at once.

```http
POST /api/v1/datasets/{datasetId}/items/batch
```

### Request Body

```json
{
  "items": [
    {
      "input": {
        "company_name": "Acme Inc",
        "question": "What are your business hours?"
      }
    },
    {
      "input": {
        "company_name": "Acme Inc",
        "question": "How do I contact support?"
      }
    },
    {
      "input": {
        "company_name": "Acme Inc",
        "question": "What's your return policy?"
      }
    }
  ]
}
```

### Response (201 Created)

```json
{
  "created_count": 3,
  "items": [
    {"id": "aa0e8400-...", ...},
    {"id": "bb0e8400-...", ...},
    {"id": "cc0e8400-...", ...}
  ]
}
```

---

## Update Item

Update a dataset item.

```http
PATCH /api/v1/datasets/items/{itemId}
```

### Request Body

```json
{
  "input": {
    "company_name": "Acme Inc",
    "question": "Updated question"
  },
  "expected_output": {
    "contains": ["expected", "words"]
  }
}
```

---

## Delete Item

Remove an item from a dataset.

```http
DELETE /api/v1/datasets/items/{itemId}
```

### Response (204 No Content)

---

## Data Types

### Dataset

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| use_case_id | UUID | Parent use case |
| name | string | Dataset name |
| description | string | Optional description |
| input_schema | object | JSON Schema for input validation |
| expected_output_schema | object | JSON Schema for expected output |
| default_assertions | Assertion[] | Default grading rules |
| created_at | datetime | Creation timestamp |
| updated_at | datetime | Last update |

### DatasetItem

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| dataset_id | UUID | Parent dataset |
| input | object | Input variables (matches template) |
| expected_output | object | Expected output for validation |
| metadata | object | Additional metadata |
| created_at | datetime | Creation timestamp |
| updated_at | datetime | Last update |

### Assertion

Used for automated grading during evaluation.

| Field | Type | Description |
|-------|------|-------------|
| type | string | Assertion type |
| value | string | Value to check |
| path | string | JSON path (for json_match) |
| criteria | string | Criteria (for llm_grade) |
| weight | number | Assertion weight (0.0-1.0) |

### Assertion Types

| Type | Description | Example |
|------|-------------|---------|
| contains | Output contains value | `{"type": "contains", "value": "success"}` |
| not_contains | Output doesn't contain | `{"type": "not_contains", "value": "error"}` |
| equals | Exact match | `{"type": "equals", "value": "yes"}` |
| regex | Regex pattern match | `{"type": "regex", "value": "\\d{4}"}` |
| json_match | JSON path match | `{"type": "json_match", "path": "$.status", "value": "ok"}` |
| llm_grade | LLM-based grading | `{"type": "llm_grade", "criteria": "Is the response helpful?"}` |

---

## Usage Examples

### Creating a Test Dataset

```bash
# 1. Create dataset
curl -X POST "http://localhost:8000/api/v1/use-cases/{useCaseId}/datasets" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "FAQ Tests",
    "default_assertions": [
      {"type": "not_contains", "value": "I dont know"}
    ]
  }'

# 2. Add test cases
curl -X POST "http://localhost:8000/api/v1/datasets/{datasetId}/items/batch" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"input": {"question": "What are your hours?"}},
      {"input": {"question": "How do I reset my password?"}},
      {"input": {"question": "Where are you located?"}}
    ]
  }'
```

### Importing from JSON

```python
import requests
import json

# Load test cases from file
with open('test_cases.json') as f:
    items = json.load(f)

# Batch import
response = requests.post(
    f"{API_URL}/datasets/{dataset_id}/items/batch",
    json={"items": items}
)
```

---

## Related Endpoints

- [Evaluations API](./evaluations.md) - Run evaluations with datasets
- [Exports API](./exports.md) - Export evaluation results

---

*API documentation generated December 2024*
