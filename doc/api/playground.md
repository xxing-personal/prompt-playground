# Playground API

The Playground API enables testing prompts against LLMs in real-time.

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/playground/compile` | Compile template (dry run) |
| POST | `/api/v1/playground/run` | Execute template against LLM |
| POST | `/api/v1/playground/run-version/{id}` | Execute a saved version |
| POST | `/api/v1/playground/run-multi` | Execute multiple models in parallel |
| POST | `/api/v1/playground/run-versions` | Execute multiple versions in parallel |
| POST | `/api/v1/playground/runs` | Save a playground run to history |
| GET | `/api/v1/playground/runs/by-version/{id}` | Get run history for a version |

---

## Compile Template

Validate and compile a template without calling the LLM.

```http
POST /api/v1/playground/compile
```

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type | string | Yes | "text" or "chat" |
| text | string | For text type | Text template |
| messages | array | For chat type | Chat messages |
| variables | object | Yes | Variable values |

### Text Template Example

```json
{
  "type": "text",
  "text": "You are a helpful assistant for {{company_name}}.\n\nQuestion: {{question}}",
  "variables": {
    "company_name": "Acme Inc",
    "question": "What are your business hours?"
  }
}
```

### Chat Template Example

```json
{
  "type": "chat",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant for {{company_name}}."},
    {"role": "user", "content": "{{question}}"}
  ],
  "variables": {
    "company_name": "Acme Inc",
    "question": "What are your business hours?"
  }
}
```

### Response

```json
{
  "valid": true,
  "compiled_text": "You are a helpful assistant for Acme Inc.\n\nQuestion: What are your business hours?",
  "compiled_messages": [
    {"role": "system", "content": "You are a helpful assistant for Acme Inc."},
    {"role": "user", "content": "What are your business hours?"}
  ],
  "variables_found": ["company_name", "question"],
  "missing_variables": []
}
```

### Error Response (Validation)

```json
{
  "valid": false,
  "compiled_text": null,
  "compiled_messages": null,
  "variables_found": ["company_name", "question", "tone"],
  "missing_variables": ["tone"]
}
```

### Example

```bash
curl -X POST "http://localhost:8000/api/v1/playground/compile" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "text",
    "text": "Hello {{name}}!",
    "variables": {"name": "World"}
  }'
```

---

## Run Template

Execute a template against an LLM.

```http
POST /api/v1/playground/run
```

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type | string | Yes | "text" or "chat" |
| template_text | string | For text type | Text template |
| template_messages | array | For chat type | Chat messages |
| variables | object | Yes | Variable values |
| model_config | object | Yes | Model configuration |

### Model Configuration

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| id | string | Yes | Unique identifier for this run |
| model | string | Yes | Model name (e.g., "gpt-4o") |
| temperature | number | No | 0.0-2.0 (default: 0.7) |
| max_tokens | integer | No | Max response tokens |
| top_p | number | No | 0.0-1.0 |

### Request Example

```json
{
  "type": "chat",
  "template_messages": [
    {"role": "system", "content": "You are a helpful assistant for {{company_name}}."},
    {"role": "user", "content": "{{question}}"}
  ],
  "variables": {
    "company_name": "Acme Inc",
    "question": "What are your business hours?"
  },
  "model_config": {
    "id": "run-1",
    "model": "gpt-4o",
    "temperature": 0.7,
    "max_tokens": 500
  }
}
```

### Response

```json
{
  "output": "Our business hours are Monday through Friday, 9:00 AM to 5:00 PM EST. We're closed on weekends and major holidays. Is there anything specific I can help you with?",
  "model_id": "run-1",
  "latency_ms": 1250,
  "tokens": {
    "prompt": 45,
    "completion": 42,
    "total": 87
  },
  "cost_usd": 0.00261
}
```

### Error Response (LLM Error)

```json
{
  "detail": "LLM API error: Rate limit exceeded"
}
```

### Example

```bash
curl -X POST "http://localhost:8000/api/v1/playground/run" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "text",
    "template_text": "Say hello to {{name}}",
    "variables": {"name": "World"},
    "model_config": {
      "id": "test-1",
      "model": "gpt-4o-mini",
      "temperature": 0.5
    }
  }'
```

---

## Run Version

Execute a saved prompt version.

```http
POST /api/v1/playground/run-version/{versionId}
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| versionId | UUID | Prompt version ID |

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| variables | object | Yes | Variable values |
| model_config | object | Yes | Model configuration |

```json
{
  "variables": {
    "company_name": "Acme Inc",
    "question": "What's your refund policy?"
  },
  "model_config": {
    "id": "version-run-1",
    "model": "gpt-4o",
    "temperature": 0.7
  }
}
```

### Response

Same format as `/playground/run`.

### Example

```bash
curl -X POST "http://localhost:8000/api/v1/playground/run-version/880e8400-e29b-41d4-a716-446655440000" \
  -H "Content-Type: application/json" \
  -d '{
    "variables": {"company_name": "Test Co", "question": "Hello"},
    "model_config": {"id": "test", "model": "gpt-4o-mini"}
  }'
```

---

## Run Multiple Models

Execute a template against multiple models in parallel.

```http
POST /api/v1/playground/run-multi
```

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type | string | Yes | "text" or "chat" |
| template_text | string | For text type | Text template |
| template_messages | array | For chat type | Chat messages |
| variables | object | Yes | Variable values |
| models | array | Yes | Array of model configurations |

### Request Example

```json
{
  "type": "chat",
  "template_messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "{{question}}"}
  ],
  "variables": {
    "question": "What is the capital of France?"
  },
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

### Response

Array of results, one per model:

```json
[
  {
    "output": "The capital of France is Paris.",
    "model_id": "gpt4o",
    "latency_ms": 850,
    "tokens": {"prompt": 25, "completion": 8, "total": 33},
    "cost_usd": 0.00099
  },
  {
    "output": "Paris is the capital of France.",
    "model_id": "gpt4o-mini",
    "latency_ms": 420,
    "tokens": {"prompt": 25, "completion": 8, "total": 33},
    "cost_usd": 0.00005
  },
  {
    "output": "The capital of France is Paris, often called the 'City of Light'.",
    "model_id": "claude",
    "latency_ms": 1100,
    "tokens": {"prompt": 25, "completion": 15, "total": 40},
    "cost_usd": 0.00045
  }
]
```

### Error Handling

If one model fails, its result includes an error:

```json
[
  {
    "output": "The capital of France is Paris.",
    "model_id": "gpt4o",
    "latency_ms": 850,
    "tokens": {"prompt": 25, "completion": 8, "total": 33},
    "cost_usd": 0.00099
  },
  {
    "output": null,
    "model_id": "invalid-model",
    "latency_ms": 50,
    "tokens": null,
    "cost_usd": null,
    "error": "Model not found: invalid-model"
  }
]
```

---

## Supported Models

### OpenAI

| Model | Description |
|-------|-------------|
| gpt-4o | Latest GPT-4 Omni |
| gpt-4o-mini | Smaller, faster GPT-4 |
| gpt-4-turbo | GPT-4 Turbo |
| gpt-4 | Standard GPT-4 |
| gpt-3.5-turbo | GPT-3.5 Turbo |

### Anthropic

| Model | Description |
|-------|-------------|
| claude-3-5-sonnet-20241022 | Latest Claude 3.5 Sonnet |
| claude-3-opus-20240229 | Claude 3 Opus |
| claude-3-sonnet-20240229 | Claude 3 Sonnet |
| claude-3-haiku-20240307 | Claude 3 Haiku |

### Google

| Model | Description |
|-------|-------------|
| gemini/gemini-pro | Gemini Pro |

### Using Prefixes

You can use provider prefixes for clarity:

```json
{
  "model": "openai/gpt-4o"
}
```

```json
{
  "model": "anthropic/claude-3-5-sonnet-20241022"
}
```

---

## Data Types

### PlaygroundRequest

| Field | Type | Description |
|-------|------|-------------|
| type | string | "text" or "chat" |
| template_text | string | Text template |
| template_messages | ChatMessage[] | Chat messages |
| variables | object | Variable key-value pairs |
| model_config | ModelConfig | Model configuration |

### PlaygroundResponse

| Field | Type | Description |
|-------|------|-------------|
| output | string | LLM response text |
| model_id | string | Model identifier from request |
| latency_ms | integer | Response time in milliseconds |
| tokens | TokenUsage | Token counts |
| cost_usd | number | Estimated cost |
| error | string | Error message if failed |

### TokenUsage

| Field | Type | Description |
|-------|------|-------------|
| prompt | integer | Input tokens |
| completion | integer | Output tokens |
| total | integer | Total tokens |

### ModelConfig

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique identifier |
| label | string | Display label |
| model | string | Model name |
| temperature | number | Sampling temperature |
| max_tokens | integer | Max response tokens |
| top_p | number | Nucleus sampling |

---

## Best Practices

### Temperature Settings

| Use Case | Temperature |
|----------|-------------|
| Factual Q&A | 0.0 - 0.3 |
| Balanced | 0.5 - 0.7 |
| Creative writing | 0.8 - 1.2 |

### Token Limits

- Set `max_tokens` to prevent runaway responses
- Consider input token limits per model
- Monitor costs with token tracking

### Error Handling

Always handle potential errors:

```javascript
try {
  const response = await playgroundApi.run(request)
  console.log(response.output)
} catch (error) {
  if (error.response?.status === 502) {
    // LLM API error
    console.error('LLM error:', error.response.data.detail)
  } else if (error.response?.status === 422) {
    // Validation error
    console.error('Invalid request:', error.response.data.detail)
  }
}
```

---

## Run Multiple Versions

Execute multiple prompt versions in parallel with the same variables. Useful for A/B testing different prompt versions.

```http
POST /api/v1/playground/run-versions
```

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| versions | array | Yes | Array of version configurations |
| variables | object | Yes | Variable values (shared across all versions) |

### Version Configuration

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| version_id | UUID | Yes | Prompt version ID |
| model | string | Yes | Model name |
| temperature | number | No | 0.0-2.0 (default: 0.7) |
| max_tokens | integer | No | Max response tokens |
| top_p | number | No | 0.0-1.0 |
| reasoning_effort | string | No | For reasoning models (low/medium/high) |

### Request Example

```json
{
  "versions": [
    {
      "version_id": "880e8400-e29b-41d4-a716-446655440001",
      "model": "gpt-4o",
      "temperature": 0.7,
      "max_tokens": 1024
    },
    {
      "version_id": "880e8400-e29b-41d4-a716-446655440002",
      "model": "gpt-4o",
      "temperature": 0.7,
      "max_tokens": 1024
    }
  ],
  "variables": {
    "company_name": "Acme Inc",
    "question": "What are your business hours?"
  }
}
```

### Response

```json
{
  "results": [
    {
      "version_id": "880e8400-e29b-41d4-a716-446655440001",
      "version_number": 1,
      "output": "Our business hours are...",
      "metrics": {
        "latency_ms": 850,
        "prompt_tokens": 45,
        "completion_tokens": 42,
        "total_tokens": 87,
        "cost_usd": 0.00261
      },
      "error": null
    },
    {
      "version_id": "880e8400-e29b-41d4-a716-446655440002",
      "version_number": 2,
      "output": "Thank you for asking! Our hours are...",
      "metrics": {
        "latency_ms": 920,
        "prompt_tokens": 52,
        "completion_tokens": 55,
        "total_tokens": 107,
        "cost_usd": 0.00321
      },
      "error": null
    }
  ]
}
```

---

## Save Playground Run

Save a playground run to the database for history tracking.

```http
POST /api/v1/playground/runs
```

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| prompt_id | UUID | Yes | Parent prompt ID |
| version_id | UUID | No | Specific version ID |
| config | object | Yes | Run configuration |
| results | array | Yes | Array of run results |

### Request Example

```json
{
  "prompt_id": "880e8400-e29b-41d4-a716-446655440000",
  "version_id": "880e8400-e29b-41d4-a716-446655440001",
  "config": {
    "templateType": "chat",
    "templateText": null,
    "templateMessages": [{"role": "user", "content": "{{question}}"}],
    "variables": {"question": "Hello"},
    "models": ["gpt-4o"]
  },
  "results": [
    {
      "modelId": "gpt-4o",
      "output": "Hello! How can I help?",
      "latencyMs": 450,
      "tokens": {"prompt": 10, "completion": 8, "total": 18}
    }
  ]
}
```

---

## Get Run History

Get recent playground runs for a specific prompt version.

```http
GET /api/v1/playground/runs/by-version/{versionId}?limit=10
```

### Path Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| versionId | UUID | Prompt version ID |

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | integer | 10 | Max results to return |

### Response

```json
[
  {
    "id": "990e8400-e29b-41d4-a716-446655440000",
    "prompt_id": "880e8400-e29b-41d4-a716-446655440000",
    "version_id": "880e8400-e29b-41d4-a716-446655440001",
    "config": {...},
    "results": [...],
    "created_at": "2024-12-15T10:30:00Z"
  }
]
```

---

## Related Endpoints

- [Prompts API](./prompts.md) - Save tested templates
- [Evaluations API](./evaluations.md) - Batch testing

---

*API documentation updated December 2024*
