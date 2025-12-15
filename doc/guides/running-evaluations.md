# Running Evaluations Guide

This guide explains how to create and run batch evaluations in Prompt Playground.

## Overview

Evaluations allow you to:
- Test prompts against multiple inputs
- Compare performance across different models
- Apply automated grading with assertions
- Track metrics (latency, tokens, cost)
- Analyze results and identify issues

## Evaluation Workflow

```
1. Create Dataset     → Define test cases
2. Select Prompt      → Choose version to test
3. Configure Models   → Select LLMs to compare
4. Define Assertions  → Set grading rules
5. Run Evaluation     → Execute tests
6. Analyze Results    → Review and export
```

---

## Step 1: Create a Dataset

### Using the UI

1. Navigate to your use case
2. Click "Datasets" tab
3. Click "New Dataset"
4. Enter name and description
5. Add items manually or batch import

### Dataset Structure

Each dataset item contains:

```json
{
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
  }
}
```

### Input Variables

Match your prompt template variables:

```
Template: "You are an assistant for {{company_name}}. Question: {{question}}"

Input: {
  "company_name": "Acme Inc",
  "question": "What are your hours?"
}
```

### Expected Output (Optional)

Used for automated grading:

```json
{
  "expected_output": {
    "contains": ["Monday", "Friday"],
    "not_contains": ["closed permanently"],
    "exact": null
  }
}
```

---

## Step 2: Select Prompt Version

Choose which prompt version to evaluate:

- **Latest**: Most recent version
- **Production**: Version with "production" label
- **Specific**: Choose by version number

### Version Labels

| Label | Description |
|-------|-------------|
| production | Deployed to production |
| beta | Testing in staging |
| alpha | Early development |

---

## Step 3: Configure Models

### Single Model

```json
{
  "models": [
    {
      "id": "gpt4o",
      "model": "gpt-4o",
      "temperature": 0.7
    }
  ]
}
```

### Multiple Models (Comparison)

```json
{
  "models": [
    {
      "id": "gpt4o",
      "label": "GPT-4o",
      "model": "gpt-4o",
      "temperature": 0.7
    },
    {
      "id": "gpt4o-mini",
      "label": "GPT-4o Mini",
      "model": "gpt-4o-mini",
      "temperature": 0.7
    },
    {
      "id": "claude",
      "label": "Claude Sonnet",
      "model": "claude-3-5-sonnet-20241022",
      "temperature": 0.7
    }
  ]
}
```

### Model Parameters

| Parameter | Description | Range |
|-----------|-------------|-------|
| temperature | Randomness | 0.0 - 2.0 |
| max_tokens | Response limit | 1 - model max |
| top_p | Nucleus sampling | 0.0 - 1.0 |

---

## Step 4: Define Assertions

Assertions automatically grade responses.

### Assertion Types

#### contains

Check if output includes a string:

```json
{
  "type": "contains",
  "value": "business hours"
}
```

#### not_contains

Ensure output excludes a string:

```json
{
  "type": "not_contains",
  "value": "I don't know"
}
```

#### equals

Exact match (rarely used for LLMs):

```json
{
  "type": "equals",
  "value": "Yes"
}
```

#### regex

Pattern matching:

```json
{
  "type": "regex",
  "value": "\\d{1,2}:\\d{2}\\s*(AM|PM)"
}
```

#### json_match

Match JSON structure:

```json
{
  "type": "json_match",
  "path": "$.status",
  "value": "success"
}
```

#### llm_grade

AI-powered grading:

```json
{
  "type": "llm_grade",
  "criteria": "Is the response helpful, accurate, and professional?",
  "weight": 0.5
}
```

### Combining Assertions

```json
{
  "assertions": [
    {"type": "not_contains", "value": "error"},
    {"type": "not_contains", "value": "I don't know"},
    {"type": "contains", "value": "Acme"},
    {
      "type": "llm_grade",
      "criteria": "Does the response directly answer the question?",
      "weight": 0.5
    }
  ]
}
```

### Assertion Weights

Weights determine how much each assertion contributes to the score:

```json
[
  {"type": "contains", "value": "hours", "weight": 0.3},
  {"type": "llm_grade", "criteria": "...", "weight": 0.7}
]
```

---

## Step 5: Run Evaluation

### Using the UI

1. Navigate to the prompt detail page
2. Click "Run Evaluation"
3. Select dataset
4. Configure models
5. Set assertions
6. Click "Start"

### Using the API

```bash
curl -X POST "http://localhost:8000/api/v1/eval-runs" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt_version_id": "880e8400-...",
    "dataset_id": "990e8400-...",
    "name": "Production Test Run",
    "models": [
      {"id": "gpt4o", "model": "gpt-4o", "temperature": 0.7}
    ],
    "assertions": [
      {"type": "not_contains", "value": "error"}
    ]
  }'
```

### Evaluation Status

| Status | Description |
|--------|-------------|
| pending | Created, waiting to start |
| running | Processing items |
| completed | All items processed |
| failed | Error occurred |
| canceled | User canceled |

### Monitoring Progress

Poll the run status:

```bash
curl "http://localhost:8000/api/v1/eval-runs/{run_id}"
```

Response:

```json
{
  "status": "running",
  "progress": {
    "total": 100,
    "completed": 45,
    "failed": 2,
    "percent": 47
  }
}
```

---

## Step 6: Analyze Results

### Summary Statistics

```json
{
  "summary": {
    "total_results": 200,
    "pass_count": 185,
    "fail_count": 15,
    "pass_rate": 0.925,
    "avg_latency_ms": 450,
    "total_tokens": 50000,
    "total_cost_usd": 2.50
  }
}
```

### Per-Model Breakdown

```json
{
  "by_model": {
    "gpt4o": {
      "pass_count": 95,
      "fail_count": 5,
      "pass_rate": 0.95,
      "avg_latency_ms": 400,
      "cost_usd": 1.50
    },
    "claude": {
      "pass_count": 90,
      "fail_count": 10,
      "pass_rate": 0.90,
      "avg_latency_ms": 500,
      "cost_usd": 1.00
    }
  }
}
```

### Individual Results

```json
{
  "id": "result-001",
  "model_id": "gpt4o",
  "output": "Our business hours are...",
  "grading": {
    "pass": true,
    "score": 0.95,
    "assertions": [
      {"type": "not_contains", "pass": true},
      {"type": "llm_grade", "pass": true, "score": 0.9}
    ]
  },
  "metrics": {
    "latency_ms": 425,
    "tokens": {"prompt": 150, "completion": 50, "total": 200},
    "cost_usd": 0.006
  }
}
```

### Filtering Results

View only failures:

```bash
curl "http://localhost:8000/api/v1/eval-runs/{id}/results?pass=false"
```

View by model:

```bash
curl "http://localhost:8000/api/v1/eval-runs/{id}/results?model_id=gpt4o"
```

---

## Best Practices

### 1. Create Representative Test Cases

Include:
- Common scenarios
- Edge cases
- Error conditions
- Various input lengths

### 2. Use Meaningful Assertions

**Good:**
```json
[
  {"type": "not_contains", "value": "I cannot help"},
  {"type": "not_contains", "value": "I don't have access"},
  {"type": "llm_grade", "criteria": "Is the response relevant to the question?"}
]
```

**Bad:**
```json
[
  {"type": "contains", "value": "the"}  // Too generic
]
```

### 3. Compare Apples to Apples

When comparing models:
- Use same temperature
- Use same dataset
- Run simultaneously

### 4. Monitor Costs

Calculate before running:

```
Cost ≈ (items × models × avg_tokens × price_per_token)
```

### 5. Version Control

Track which prompt version was evaluated:

```json
{
  "name": "v3-production-test",
  "prompt_version_id": "880e8400-..."
}
```

---

## Exporting Results

### JSON Export

```bash
curl "http://localhost:8000/api/v1/eval-runs/{id}/export.json" -o results.json
```

### Markdown Export

```bash
curl "http://localhost:8000/api/v1/eval-runs/{id}/export.md" -o report.md
```

---

## Troubleshooting

### High Failure Rate

1. Review failed results
2. Check assertion configuration
3. Verify template variables match dataset
4. Adjust assertions if too strict

### Slow Evaluation

1. Check LLM provider status
2. Reduce concurrent requests
3. Use faster models for initial testing
4. Break large datasets into smaller runs

### Inconsistent Results

1. Set temperature to 0 for reproducibility
2. Use seed parameter if available
3. Run multiple evaluations for statistical significance

---

## Example: Complete Evaluation

### 1. Create Dataset

```json
{
  "name": "FAQ Test Cases",
  "items": [
    {
      "input": {"company": "Acme", "question": "What are your hours?"},
      "expected_output": {"contains": ["9 AM", "5 PM"]}
    },
    {
      "input": {"company": "Acme", "question": "How do I reset my password?"},
      "expected_output": {"contains": ["reset", "link"]}
    }
  ]
}
```

### 2. Run Evaluation

```json
{
  "prompt_version_id": "...",
  "dataset_id": "...",
  "name": "FAQ Test - v1",
  "models": [
    {"id": "gpt4o", "model": "gpt-4o", "temperature": 0}
  ],
  "assertions": [
    {"type": "not_contains", "value": "I don't know"},
    {"type": "llm_grade", "criteria": "Does the response answer the question?"}
  ]
}
```

### 3. Review Results

- Pass rate: 95%
- Failed: 2 cases
- Common failure: Missing expected keywords

### 4. Iterate

- Update prompt template
- Add more specific instructions
- Re-run evaluation
- Compare with previous run

---

## Related Documentation

- [Datasets API](../api/datasets.md)
- [Evaluations API](../api/evaluations.md)
- [Template Syntax](./template-syntax.md)
- [Multi-Model Comparison](./multi-model-comparison.md)

---

*Evaluations guide generated December 2024*
