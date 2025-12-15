# Evaluations API

Run batch evaluations to test prompts against datasets.

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/eval-runs` | List evaluation runs |
| POST | `/api/v1/eval-runs` | Create evaluation run |
| GET | `/api/v1/eval-runs/{id}` | Get evaluation run |
| POST | `/api/v1/eval-runs/{id}/cancel` | Cancel running evaluation |
| GET | `/api/v1/eval-runs/{id}/results` | Get evaluation results |

---

## List Evaluation Runs

Retrieve all evaluation runs with optional filtering.

```http
GET /api/v1/eval-runs
```

### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| prompt_version_id | UUID | Filter by prompt version |
| dataset_id | UUID | Filter by dataset |
| status | string | Filter by status |
| skip | integer | Items to skip (default: 0) |
| limit | integer | Max items (default: 100) |

### Response

```json
[
  {
    "id": "ff0e8400-e29b-41d4-a716-446655440000",
    "prompt_version_id": "880e8400-e29b-41d4-a716-446655440000",
    "dataset_id": "990e8400-e29b-41d4-a716-446655440000",
    "name": "Production Readiness Test",
    "status": "completed",
    "progress": {
      "total": 50,
      "completed": 50,
      "failed": 0,
      "percent": 100
    },
    "summary": {
      "total_results": 50,
      "pass_count": 48,
      "fail_count": 2,
      "pass_rate": 0.96,
      "avg_latency_ms": 450,
      "total_tokens": 15000,
      "total_cost_usd": 0.45
    },
    "created_at": "2024-12-05T10:00:00Z",
    "started_at": "2024-12-05T10:00:05Z",
    "completed_at": "2024-12-05T10:02:30Z"
  }
]
```

### Example

```bash
# List all runs
curl -X GET "http://localhost:8000/api/v1/eval-runs"

# Filter by status
curl -X GET "http://localhost:8000/api/v1/eval-runs?status=completed"

# Filter by prompt version
curl -X GET "http://localhost:8000/api/v1/eval-runs?prompt_version_id=880e8400-..."
```

---

## Create Evaluation Run

Start a new evaluation.

```http
POST /api/v1/eval-runs
```

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| prompt_version_id | UUID | Yes | Prompt version to evaluate |
| dataset_id | UUID | Yes | Dataset for evaluation |
| name | string | No | Run name |
| models | array | Yes | Model configurations |
| assertions | array | No | Custom assertions |

### Model Configuration

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Unique model identifier |
| label | string | No | Display label |
| model | string | Yes | Model name |
| temperature | number | No | Sampling temperature |
| max_tokens | integer | No | Max response tokens |

### Example Request

```json
{
  "prompt_version_id": "880e8400-e29b-41d4-a716-446655440000",
  "dataset_id": "990e8400-e29b-41d4-a716-446655440000",
  "name": "Production Readiness Test",
  "models": [
    {
      "id": "gpt4o",
      "label": "GPT-4o",
      "model": "gpt-4o",
      "temperature": 0.7
    },
    {
      "id": "claude",
      "label": "Claude Sonnet",
      "model": "claude-3-5-sonnet-20241022",
      "temperature": 0.7
    }
  ],
  "assertions": [
    {"type": "not_contains", "value": "error"},
    {"type": "not_contains", "value": "I don't know"},
    {
      "type": "llm_grade",
      "criteria": "Is the response helpful and professional?",
      "weight": 0.5
    }
  ]
}
```

### Response (201 Created)

```json
{
  "id": "ff0e8400-e29b-41d4-a716-446655440000",
  "prompt_version_id": "880e8400-e29b-41d4-a716-446655440000",
  "dataset_id": "990e8400-e29b-41d4-a716-446655440000",
  "name": "Production Readiness Test",
  "models": [...],
  "assertions": [...],
  "status": "pending",
  "progress": {
    "total": 50,
    "completed": 0,
    "failed": 0,
    "percent": 0
  },
  "created_at": "2024-12-05T10:00:00Z",
  "started_at": null,
  "completed_at": null
}
```

---

## Get Evaluation Run

Retrieve details of an evaluation run.

```http
GET /api/v1/eval-runs/{id}
```

### Response

```json
{
  "id": "ff0e8400-e29b-41d4-a716-446655440000",
  "prompt_version_id": "880e8400-e29b-41d4-a716-446655440000",
  "dataset_id": "990e8400-e29b-41d4-a716-446655440000",
  "name": "Production Readiness Test",
  "models": [
    {
      "id": "gpt4o",
      "label": "GPT-4o",
      "model": "gpt-4o",
      "temperature": 0.7
    }
  ],
  "assertions": [...],
  "status": "completed",
  "progress": {
    "total": 50,
    "completed": 50,
    "failed": 0,
    "percent": 100
  },
  "summary": {
    "total_results": 50,
    "pass_count": 48,
    "fail_count": 2,
    "pass_rate": 0.96,
    "avg_latency_ms": 450,
    "total_tokens": 15000,
    "total_cost_usd": 0.45,
    "by_model": {
      "gpt4o": {
        "pass_count": 48,
        "fail_count": 2,
        "pass_rate": 0.96,
        "avg_latency_ms": 450,
        "total_tokens": 15000,
        "cost_usd": 0.45
      }
    }
  },
  "created_at": "2024-12-05T10:00:00Z",
  "started_at": "2024-12-05T10:00:05Z",
  "completed_at": "2024-12-05T10:02:30Z",
  "created_by": "user@example.com"
}
```

---

## Cancel Evaluation

Cancel a running evaluation.

```http
POST /api/v1/eval-runs/{id}/cancel
```

### Response

```json
{
  "id": "ff0e8400-e29b-41d4-a716-446655440000",
  "status": "canceled",
  "progress": {
    "total": 50,
    "completed": 25,
    "failed": 0,
    "percent": 50
  }
}
```

---

## Get Evaluation Results

Retrieve individual results for an evaluation run.

```http
GET /api/v1/eval-runs/{id}/results
```

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| skip | integer | 0 | Results to skip |
| limit | integer | 100 | Max results to return |
| model_id | string | | Filter by model ID |
| pass | boolean | | Filter by pass/fail |

### Response

```json
[
  {
    "id": "result-001",
    "eval_run_id": "ff0e8400-e29b-41d4-a716-446655440000",
    "dataset_item_id": "aa0e8400-e29b-41d4-a716-446655440000",
    "model_id": "gpt4o",
    "model_config": {
      "id": "gpt4o",
      "label": "GPT-4o",
      "model": "gpt-4o",
      "temperature": 0.7
    },
    "output": "Our business hours are Monday through Friday, 9 AM to 5 PM EST.",
    "grading": {
      "pass": true,
      "score": 1.0,
      "reason": "All assertions passed",
      "assertions": [
        {
          "type": "not_contains",
          "pass": true,
          "expected": "error",
          "actual": "no match"
        },
        {
          "type": "llm_grade",
          "pass": true,
          "score": 0.9,
          "reason": "Response is helpful and professional"
        }
      ]
    },
    "metrics": {
      "latency_ms": 425,
      "prompt_tokens": 150,
      "completion_tokens": 50,
      "total_tokens": 200,
      "cost_usd": 0.006
    },
    "created_at": "2024-12-05T10:00:15Z"
  }
]
```

### Example

```bash
# Get all results
curl -X GET "http://localhost:8000/api/v1/eval-runs/{id}/results"

# Get failed results only
curl -X GET "http://localhost:8000/api/v1/eval-runs/{id}/results?pass=false"

# Get results for specific model
curl -X GET "http://localhost:8000/api/v1/eval-runs/{id}/results?model_id=gpt4o"
```

---

## Data Types

### EvalRun

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| prompt_version_id | UUID | Evaluated prompt version |
| dataset_id | UUID | Evaluation dataset |
| name | string | Optional run name |
| models | ModelConfig[] | Model configurations |
| assertions | Assertion[] | Grading rules |
| status | string | Run status |
| progress | Progress | Progress tracking |
| summary | Summary | Aggregated results |
| created_at | datetime | Creation timestamp |
| started_at | datetime | Start timestamp |
| completed_at | datetime | Completion timestamp |
| created_by | string | Creator identifier |

### Status Values

| Status | Description |
|--------|-------------|
| pending | Run created, not started |
| running | Currently processing |
| completed | All items processed |
| failed | Run failed with error |
| canceled | Canceled by user |

### Progress

| Field | Type | Description |
|-------|------|-------------|
| total | integer | Total items to process |
| completed | integer | Successfully completed |
| failed | integer | Failed with errors |
| percent | integer | Completion percentage |

### Summary

| Field | Type | Description |
|-------|------|-------------|
| total_results | integer | Total result count |
| pass_count | integer | Passed assertions |
| fail_count | integer | Failed assertions |
| pass_rate | number | Pass rate (0.0-1.0) |
| avg_latency_ms | number | Average latency |
| total_tokens | integer | Total tokens used |
| total_cost_usd | number | Total cost |
| by_model | object | Per-model breakdown |

### EvalResult

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Unique identifier |
| eval_run_id | UUID | Parent run |
| dataset_item_id | UUID | Source dataset item |
| model_id | string | Model identifier |
| model_config | ModelConfig | Model configuration |
| output | string | LLM output |
| output_json | object | Parsed JSON (if applicable) |
| grading | Grading | Grading results |
| metrics | Metrics | Performance metrics |
| created_at | datetime | Creation timestamp |

### Grading

| Field | Type | Description |
|-------|------|-------------|
| pass | boolean | Overall pass/fail |
| score | number | Overall score (0.0-1.0) |
| reason | string | Explanation |
| assertions | AssertionResult[] | Individual results |

### Metrics

| Field | Type | Description |
|-------|------|-------------|
| latency_ms | integer | Response time |
| prompt_tokens | integer | Input tokens |
| completion_tokens | integer | Output tokens |
| total_tokens | integer | Total tokens |
| cost_usd | number | Estimated cost |
| error | string | Error message if failed |

---

## Assertion Types

### contains

Check if output contains a string.

```json
{
  "type": "contains",
  "value": "success"
}
```

### not_contains

Check if output does NOT contain a string.

```json
{
  "type": "not_contains",
  "value": "error"
}
```

### equals

Exact string match.

```json
{
  "type": "equals",
  "value": "yes"
}
```

### regex

Regular expression match.

```json
{
  "type": "regex",
  "value": "\\d{4}-\\d{2}-\\d{2}"
}
```

### json_match

Match a value at a JSON path.

```json
{
  "type": "json_match",
  "path": "$.status",
  "value": "success"
}
```

### llm_grade

Use an LLM to grade the response.

```json
{
  "type": "llm_grade",
  "criteria": "Is the response helpful, accurate, and professional?",
  "weight": 0.5
}
```

---

## Usage Examples

### Running a Full Evaluation

```bash
# 1. Create evaluation run
curl -X POST "http://localhost:8000/api/v1/eval-runs" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt_version_id": "880e8400-...",
    "dataset_id": "990e8400-...",
    "models": [
      {"id": "gpt4o", "model": "gpt-4o", "temperature": 0.7}
    ]
  }'

# 2. Poll for status
curl -X GET "http://localhost:8000/api/v1/eval-runs/{run_id}"

# 3. Get results when completed
curl -X GET "http://localhost:8000/api/v1/eval-runs/{run_id}/results"
```

### Comparing Models

```python
# Create run with multiple models
run = api.create_eval_run({
    "prompt_version_id": version_id,
    "dataset_id": dataset_id,
    "models": [
        {"id": "gpt4o", "model": "gpt-4o"},
        {"id": "gpt4o-mini", "model": "gpt-4o-mini"},
        {"id": "claude", "model": "claude-3-5-sonnet-20241022"}
    ]
})

# Wait for completion
while run.status == "running":
    time.sleep(5)
    run = api.get_eval_run(run.id)

# Compare results by model
for model_id, stats in run.summary["by_model"].items():
    print(f"{model_id}: {stats['pass_rate']*100}% pass rate")
```

---

## Related Endpoints

- [Prompts API](./prompts.md) - Get prompt versions
- [Datasets API](./datasets.md) - Create test datasets
- [Exports API](./exports.md) - Export results

---

*API documentation generated December 2024*
