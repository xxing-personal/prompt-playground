# Exports API

Export evaluation results in various formats.

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/eval-runs/{id}/export.json` | Export as JSON |
| GET | `/api/v1/eval-runs/{id}/export.md` | Export as Markdown |

---

## Export as JSON

Download evaluation results as a JSON file.

```http
GET /api/v1/eval-runs/{id}/export.json
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | UUID | Evaluation run ID |

### Response Headers

```
Content-Type: application/json
Content-Disposition: attachment; filename="eval-run-{id}.json"
```

### Response Body

```json
{
  "meta": {
    "id": "ff0e8400-e29b-41d4-a716-446655440000",
    "name": "Production Readiness Test",
    "prompt_version_id": "880e8400-e29b-41d4-a716-446655440000",
    "dataset_id": "990e8400-e29b-41d4-a716-446655440000",
    "status": "completed",
    "created_at": "2024-12-05T10:00:00Z",
    "completed_at": "2024-12-05T10:02:30Z",
    "models": [
      {
        "id": "gpt4o",
        "label": "GPT-4o",
        "model": "gpt-4o",
        "temperature": 0.7
      }
    ],
    "assertions": [
      {"type": "not_contains", "value": "error"}
    ]
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
  "results": [
    {
      "id": "result-001",
      "dataset_item": {
        "id": "aa0e8400-e29b-41d4-a716-446655440000",
        "input": {
          "company_name": "Acme Inc",
          "question": "What are your business hours?"
        },
        "expected_output": null
      },
      "model_id": "gpt4o",
      "output": "Our business hours are Monday through Friday, 9 AM to 5 PM EST.",
      "grading": {
        "pass": true,
        "score": 1.0,
        "reason": "All assertions passed",
        "assertions": [
          {
            "type": "not_contains",
            "pass": true,
            "expected": "error"
          }
        ]
      },
      "metrics": {
        "latency_ms": 425,
        "prompt_tokens": 150,
        "completion_tokens": 50,
        "total_tokens": 200,
        "cost_usd": 0.006
      }
    }
  ]
}
```

### Example

```bash
curl -X GET "http://localhost:8000/api/v1/eval-runs/{id}/export.json" \
  -o evaluation-results.json
```

---

## Export as Markdown

Download evaluation results as a Markdown report.

```http
GET /api/v1/eval-runs/{id}/export.md
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| id | UUID | Evaluation run ID |

### Response Headers

```
Content-Type: text/markdown
Content-Disposition: attachment; filename="eval-run-{id}.md"
```

### Response Body

```markdown
# Evaluation Report: Production Readiness Test

## Summary

| Metric | Value |
|--------|-------|
| Status | Completed |
| Total Results | 50 |
| Pass Rate | 96.0% |
| Avg Latency | 450ms |
| Total Tokens | 15,000 |
| Total Cost | $0.45 |

## Models

### GPT-4o

| Metric | Value |
|--------|-------|
| Pass Rate | 96.0% |
| Passed | 48 |
| Failed | 2 |
| Avg Latency | 450ms |
| Total Tokens | 15,000 |
| Cost | $0.45 |

## Assertions

1. **not_contains**: `error`

## Results

### Test Case 1

**Input:**
```json
{
  "company_name": "Acme Inc",
  "question": "What are your business hours?"
}
```

**Output (GPT-4o):**
> Our business hours are Monday through Friday, 9 AM to 5 PM EST.

**Grading:** PASS (Score: 1.0)

**Metrics:**
- Latency: 425ms
- Tokens: 200 (150 prompt + 50 completion)
- Cost: $0.006

---

### Test Case 2

...

---

## Failed Results

### Test Case 15

**Input:**
```json
{
  "company_name": "Acme Inc",
  "question": "What's the CEO's email?"
}
```

**Output (GPT-4o):**
> I'm sorry, I don't know the CEO's email address.

**Grading:** FAIL (Score: 0.5)

**Reason:** Contains "I don't know"

---

*Generated: 2024-12-05T10:02:30Z*
```

### Example

```bash
curl -X GET "http://localhost:8000/api/v1/eval-runs/{id}/export.md" \
  -o evaluation-report.md
```

---

## Usage Examples

### Programmatic Export

```python
import requests

# Export as JSON
response = requests.get(
    f"{API_URL}/eval-runs/{run_id}/export.json"
)
with open('results.json', 'w') as f:
    f.write(response.text)

# Export as Markdown
response = requests.get(
    f"{API_URL}/eval-runs/{run_id}/export.md"
)
with open('report.md', 'w') as f:
    f.write(response.text)
```

### JavaScript/TypeScript

```typescript
// Export JSON
const jsonResponse = await fetch(`${API_URL}/eval-runs/${runId}/export.json`)
const jsonData = await jsonResponse.json()

// Export Markdown
const mdResponse = await fetch(`${API_URL}/eval-runs/${runId}/export.md`)
const markdownText = await mdResponse.text()
```

### Save to File (Browser)

```javascript
async function downloadExport(runId, format) {
  const response = await fetch(`${API_URL}/eval-runs/${runId}/export.${format}`)
  const blob = await response.blob()

  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `eval-run-${runId}.${format}`
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(url)
}

// Usage
downloadExport('ff0e8400-...', 'json')
downloadExport('ff0e8400-...', 'md')
```

---

## Export Format Details

### JSON Export

The JSON export includes:

- **meta**: Run configuration and metadata
- **summary**: Aggregated statistics
- **results**: All individual results with full details

Use cases:
- Programmatic analysis
- Data processing pipelines
- Integration with other tools
- Archival

### Markdown Export

The Markdown export includes:

- **Summary table**: Key metrics at a glance
- **Model breakdown**: Per-model statistics
- **All results**: Formatted test case details
- **Failed results section**: Quick reference for failures

Use cases:
- Documentation
- Team sharing
- Code reviews
- Stakeholder reports

---

## Best Practices

### Large Evaluations

For evaluations with many results:

```python
# Stream large exports
response = requests.get(
    f"{API_URL}/eval-runs/{run_id}/export.json",
    stream=True
)
with open('large-results.json', 'wb') as f:
    for chunk in response.iter_content(chunk_size=8192):
        f.write(chunk)
```

### Archiving Results

```bash
# Export and compress
curl -s "http://localhost:8000/api/v1/eval-runs/{id}/export.json" | gzip > results.json.gz

# With timestamp
curl -s "http://localhost:8000/api/v1/eval-runs/{id}/export.json" \
  | gzip > "eval-$(date +%Y%m%d-%H%M%S).json.gz"
```

### Batch Export

```python
import asyncio
import aiohttp

async def export_all_runs(run_ids):
    async with aiohttp.ClientSession() as session:
        tasks = [
            session.get(f"{API_URL}/eval-runs/{rid}/export.json")
            for rid in run_ids
        ]
        responses = await asyncio.gather(*tasks)
        return [await r.json() for r in responses]

# Usage
run_ids = ['id1', 'id2', 'id3']
results = asyncio.run(export_all_runs(run_ids))
```

---

## Related Endpoints

- [Evaluations API](./evaluations.md) - Run evaluations
- [Playground API](./playground.md) - Test prompts interactively

---

*API documentation generated December 2024*
