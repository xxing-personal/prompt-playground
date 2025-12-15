# Multi-Model Comparison Guide

This guide explains how to compare outputs from different LLM models in Prompt Playground.

## Overview

Multi-model comparison helps you:
- Evaluate different models for your use case
- Compare cost vs. quality trade-offs
- Identify model-specific strengths and weaknesses
- Make informed decisions about production deployment

## Quick Start

### In the Playground

1. Open a prompt in the Playground tab
2. Click "Add Model" to add multiple models
3. Configure each model's parameters
4. Click "Run All"
5. View outputs side-by-side

### Using the API

```bash
curl -X POST "http://localhost:8000/api/v1/playground/run-multi" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "chat",
    "template_messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "{{question}}"}
    ],
    "variables": {
      "question": "What is the capital of France?"
    },
    "models": [
      {"id": "gpt4o", "model": "gpt-4o", "temperature": 0.7},
      {"id": "claude", "model": "claude-3-5-sonnet-20241022", "temperature": 0.7}
    ]
  }'
```

---

## Supported Models

### OpenAI

| Model | Best For | Cost |
|-------|----------|------|
| gpt-4o | Complex reasoning, latest capabilities | $$$ |
| gpt-4o-mini | Balanced performance/cost | $$ |
| gpt-4-turbo | Large context windows | $$$ |
| gpt-3.5-turbo | Fast, simple tasks | $ |

### Anthropic

| Model | Best For | Cost |
|-------|----------|------|
| claude-3-5-sonnet | Latest Claude, balanced | $$$ |
| claude-3-opus | Complex analysis | $$$$ |
| claude-3-sonnet | General purpose | $$ |
| claude-3-haiku | Speed, simple tasks | $ |

### Google

| Model | Best For | Cost |
|-------|----------|------|
| gemini-pro | Multi-modal, fast | $$ |
| gemini-pro-vision | Image analysis | $$ |

---

## Comparison Strategies

### Strategy 1: Quality vs. Cost

Compare premium and economy models:

```json
{
  "models": [
    {"id": "premium", "model": "gpt-4o", "temperature": 0.7},
    {"id": "economy", "model": "gpt-4o-mini", "temperature": 0.7}
  ]
}
```

**Analyze:**
- Are the quality differences significant?
- Is the premium model worth the extra cost?
- Can economy model handle simpler queries?

### Strategy 2: Cross-Provider

Compare models from different providers:

```json
{
  "models": [
    {"id": "openai", "model": "gpt-4o", "temperature": 0.7},
    {"id": "anthropic", "model": "claude-3-5-sonnet-20241022", "temperature": 0.7}
  ]
}
```

**Analyze:**
- Style differences
- Accuracy on domain-specific content
- Response format preferences
- Cost differences

### Strategy 3: Parameter Tuning

Same model, different parameters:

```json
{
  "models": [
    {"id": "creative", "model": "gpt-4o", "temperature": 1.2},
    {"id": "balanced", "model": "gpt-4o", "temperature": 0.7},
    {"id": "precise", "model": "gpt-4o", "temperature": 0.1}
  ]
}
```

**Analyze:**
- Impact of temperature on quality
- Consistency vs. creativity trade-off
- Best temperature for your use case

### Strategy 4: Speed vs. Quality

Fast models vs. powerful models:

```json
{
  "models": [
    {"id": "fast", "model": "claude-3-haiku-20240307", "temperature": 0.7},
    {"id": "powerful", "model": "claude-3-opus-20240229", "temperature": 0.7}
  ]
}
```

**Analyze:**
- Latency differences
- Quality differences
- When to use each

---

## Comparison Metrics

### Response Quality

Assess using:
- LLM grading assertions
- Human evaluation
- Task-specific criteria

### Performance Metrics

| Metric | Description | Lower is Better |
|--------|-------------|-----------------|
| latency_ms | Response time | Yes |
| prompt_tokens | Input tokens | Yes |
| completion_tokens | Output tokens | Depends |
| total_tokens | Total tokens | Yes |
| cost_usd | API cost | Yes |

### Results Comparison Table

```
┌─────────────────┬───────────┬───────────┬───────────┐
│ Model           │ Pass Rate │ Avg Latency│ Avg Cost  │
├─────────────────┼───────────┼───────────┼───────────┤
│ GPT-4o          │ 95%       │ 850ms     │ $0.015    │
│ GPT-4o-mini     │ 88%       │ 320ms     │ $0.001    │
│ Claude Sonnet   │ 93%       │ 650ms     │ $0.008    │
│ Claude Haiku    │ 82%       │ 180ms     │ $0.0003   │
└─────────────────┴───────────┴───────────┴───────────┘
```

---

## Running Batch Comparisons

### Create Evaluation Run

```bash
curl -X POST "http://localhost:8000/api/v1/eval-runs" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt_version_id": "...",
    "dataset_id": "...",
    "name": "Model Comparison - December 2024",
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
        "id": "claude-sonnet",
        "label": "Claude Sonnet",
        "model": "claude-3-5-sonnet-20241022",
        "temperature": 0.7
      }
    ],
    "assertions": [
      {"type": "not_contains", "value": "error"},
      {
        "type": "llm_grade",
        "criteria": "Is the response helpful and accurate?"
      }
    ]
  }'
```

### Analyze Results

The evaluation summary provides per-model breakdown:

```json
{
  "summary": {
    "by_model": {
      "gpt4o": {
        "pass_count": 95,
        "fail_count": 5,
        "pass_rate": 0.95,
        "avg_latency_ms": 850,
        "total_tokens": 25000,
        "cost_usd": 1.50
      },
      "gpt4o-mini": {
        "pass_count": 88,
        "fail_count": 12,
        "pass_rate": 0.88,
        "avg_latency_ms": 320,
        "total_tokens": 22000,
        "cost_usd": 0.10
      },
      "claude-sonnet": {
        "pass_count": 93,
        "fail_count": 7,
        "pass_rate": 0.93,
        "avg_latency_ms": 650,
        "total_tokens": 24000,
        "cost_usd": 0.80
      }
    }
  }
}
```

---

## Best Practices

### 1. Use Consistent Parameters

For fair comparison:

```json
{
  "models": [
    {"id": "model-a", "model": "gpt-4o", "temperature": 0.7, "max_tokens": 500},
    {"id": "model-b", "model": "claude-3-5-sonnet-20241022", "temperature": 0.7, "max_tokens": 500}
  ]
}
```

### 2. Test Representative Samples

Include diverse test cases:
- Simple queries
- Complex queries
- Edge cases
- Domain-specific content

### 3. Run Multiple Times

For statistical significance:
- Run evaluation 3+ times
- Use temperature=0 for reproducibility
- Calculate averages and variance

### 4. Consider Total Cost of Ownership

Beyond API cost:
- Latency impact on UX
- Token limits for context
- Rate limits
- Availability/reliability

### 5. Document Your Findings

Track comparison results:

```markdown
## Model Comparison Report - 2024-12

### Use Case: Customer Support FAQ

| Model | Pass Rate | Latency | Cost/1K | Recommendation |
|-------|-----------|---------|---------|----------------|
| GPT-4o | 95% | 850ms | $0.015 | Production |
| GPT-4o-mini | 88% | 320ms | $0.001 | High volume |
| Claude Sonnet | 93% | 650ms | $0.008 | Alternative |

### Conclusion
GPT-4o recommended for production due to highest accuracy.
GPT-4o-mini suitable for high-volume, simpler queries.
```

---

## Viewing Comparisons

### Side-by-Side Outputs

In the Playground UI:
1. Run multiple models
2. View outputs in columns
3. Click to see full output
4. Use diff view to compare

### Diff Visualization

```
Output A (GPT-4o):
  Our business hours are Monday through Friday,
- 9:00 AM to 5:00 PM Eastern Time.
+ 9:00 AM to 5:00 PM EST.
  We're closed on weekends and holidays.

Output B (Claude):
  Our business hours are Monday through Friday,
  9:00 AM to 5:00 PM EST.
  We're closed on weekends and holidays.
```

---

## Common Comparison Scenarios

### Scenario 1: Choosing a Primary Model

**Goal:** Select model for production

**Approach:**
1. Run 100+ test cases
2. Compare accuracy rates
3. Analyze failure cases
4. Calculate cost projections
5. Test latency requirements

### Scenario 2: Fallback Strategy

**Goal:** Choose backup model

**Approach:**
1. Test primary model
2. Identify failure patterns
3. Test alternative on failures
4. Configure routing logic

### Scenario 3: A/B Testing

**Goal:** Real-world performance comparison

**Approach:**
1. Split traffic between models
2. Track user satisfaction
3. Monitor error rates
4. Analyze cost difference

---

## Cost Estimation

### Per-Model Pricing (Approximate)

| Model | Input $/1M tokens | Output $/1M tokens |
|-------|-------------------|-------------------|
| GPT-4o | $2.50 | $10.00 |
| GPT-4o-mini | $0.15 | $0.60 |
| Claude 3.5 Sonnet | $3.00 | $15.00 |
| Claude 3 Haiku | $0.25 | $1.25 |

### Estimation Formula

```
Cost = (input_tokens × input_price) + (output_tokens × output_price)

For 100 evaluations with avg 200 tokens each:
GPT-4o: 100 × 200 × $0.0025/1K + 100 × 200 × $0.01/1K = $0.25
GPT-4o-mini: 100 × 200 × $0.00015/1K + 100 × 200 × $0.0006/1K = $0.015
```

---

## Exporting Comparisons

### JSON Export

Includes all model results for analysis:

```bash
curl "http://localhost:8000/api/v1/eval-runs/{id}/export.json" -o comparison.json
```

### Markdown Report

Generates formatted comparison report:

```bash
curl "http://localhost:8000/api/v1/eval-runs/{id}/export.md" -o comparison_report.md
```

---

## Related Documentation

- [Playground API](../api/playground.md)
- [Evaluations API](../api/evaluations.md)
- [Running Evaluations](./running-evaluations.md)

---

*Multi-model comparison guide generated December 2024*
