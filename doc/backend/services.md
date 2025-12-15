# Backend Services Guide

This document describes the service layer components in Prompt Playground.

## Overview

The service layer contains business logic, separated from API handlers and data access:

```
app/services/
├── template_service.py    # Template compilation
├── llm_service.py         # LLM API calls
├── eval_worker.py         # Background evaluation
└── evaluators.py          # Assertion logic
```

---

## Template Service

Handles prompt template compilation and variable management.

### Location

`app/services/template_service.py`

### Methods

#### extract_variables

Extract variable names from a template.

```python
from app.services.template_service import TemplateService

template = "Hello {{name}}, welcome to {{company}}!"
variables = TemplateService.extract_variables(template)
# ['name', 'company']
```

#### extract_variables_from_messages

Extract variables from chat message array.

```python
messages = [
    {"role": "system", "content": "You work for {{company}}."},
    {"role": "user", "content": "{{question}}"}
]
variables = TemplateService.extract_variables_from_messages(messages)
# ['company', 'question']
```

#### compile_template

Replace variables with values.

```python
template = "Hello {{name}}!"
compiled = TemplateService.compile_template(
    template,
    {"name": "World"}
)
# "Hello World!"
```

#### compile_messages

Compile all messages in a chat template.

```python
messages = [
    {"role": "system", "content": "You are {{role}}."},
    {"role": "user", "content": "{{question}}"}
]
compiled = TemplateService.compile_messages(
    messages,
    {"role": "an assistant", "question": "Hello"}
)
# [
#   {"role": "system", "content": "You are an assistant."},
#   {"role": "user", "content": "Hello"}
# ]
```

#### validate_variables

Check if all required variables are provided.

```python
template = "Hello {{name}}, {{greeting}}!"
is_valid, missing = TemplateService.validate_variables(
    template,
    {"name": "World"}
)
# is_valid: False
# missing: ['greeting']
```

#### dry_run

Full compilation validation.

```python
result = TemplateService.dry_run(
    type="text",
    text="Hello {{name}}!",
    messages=None,
    variables={"name": "World"}
)
# {
#   "valid": True,
#   "compiled_text": "Hello World!",
#   "variables_found": ["name"],
#   "missing_variables": []
# }
```

---

## LLM Service

Handles communication with LLM APIs via LiteLLM.

### Location

`app/services/llm_service.py`

### Classes

#### LLMResponse

Response dataclass:

```python
@dataclass
class LLMResponse:
    output: str
    latency_ms: int
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    cost_usd: float | None
```

### Methods

#### get_provider

Determine provider from model name.

```python
from app.services.llm_service import LLMService

provider = LLMService.get_provider("gpt-4o")
# "openai"

provider = LLMService.get_provider("claude-3-5-sonnet-20241022")
# "anthropic"

provider = LLMService.get_provider("openai/gpt-4")
# "openai"
```

#### generate_completion

Call LLM API and return response with metrics.

```python
response = await LLMService.generate_completion(
    messages=[
        {"role": "user", "content": "Hello!"}
    ],
    model="gpt-4o",
    temperature=0.7,
    max_tokens=500
)

print(response.output)        # "Hello! How can I help you?"
print(response.latency_ms)    # 450
print(response.total_tokens)  # 15
print(response.cost_usd)      # 0.00015
```

### Provider Configuration

API keys are loaded from settings:

```python
# app/core/config.py
class Settings(BaseSettings):
    openai_api_key: str | None = None
    anthropic_api_key: str | None = None
    google_api_key: str | None = None
```

### Model Mapping

Common model names are mapped to providers:

```python
PROVIDER_MAP = {
    "gpt-4o": "openai",
    "gpt-4o-mini": "openai",
    "gpt-4-turbo": "openai",
    "gpt-3.5-turbo": "openai",
    "claude-3-5-sonnet": "anthropic",
    "claude-3-opus": "anthropic",
    "claude-3-sonnet": "anthropic",
    "claude-3-haiku": "anthropic",
}
```

---

## Evaluation Worker

Background worker for processing evaluation runs.

### Location

`app/services/eval_worker.py`

### Process Flow

```
1. Poll for pending runs
2. Set status to "running"
3. For each dataset item:
   a. For each model config:
      - Compile template
      - Call LLM
      - Run assertions
      - Save result
      - Update progress
4. Generate summary
5. Set status to "completed"
```

### Functions

#### process_evaluation

Main evaluation processing function.

```python
async def process_evaluation(run_id: str, db: AsyncSession):
    """Process all items in an evaluation run."""
    run = await db.get(EvalRun, run_id)
    run.status = "running"
    run.started_at = datetime.utcnow()
    await db.commit()

    try:
        # Load data
        items = await load_dataset_items(run.dataset_id, db)
        version = await db.get(PromptVersion, run.prompt_version_id)

        total = len(items) * len(run.models)
        completed = 0
        failed = 0

        # Process each combination
        for item in items:
            for model_config in run.models:
                try:
                    result = await process_single_item(
                        version, item, model_config, run.assertions
                    )
                    # Save result...
                    completed += 1
                except Exception as e:
                    failed += 1

                # Update progress
                run.progress = {
                    "total": total,
                    "completed": completed,
                    "failed": failed,
                    "percent": int((completed + failed) / total * 100)
                }
                await db.commit()

        # Generate summary
        run.summary = await generate_summary(run_id, db)
        run.status = "completed"
        run.completed_at = datetime.utcnow()

    except Exception as e:
        run.status = "failed"

    await db.commit()
```

#### process_single_item

Process one dataset item with one model.

```python
async def process_single_item(
    version: PromptVersion,
    item: DatasetItem,
    model_config: dict,
    assertions: list[dict]
) -> ProcessResult:
    """Process a single item-model combination."""

    # Compile template
    if version.type == "text":
        compiled = TemplateService.compile_template(
            version.template_text,
            item.input
        )
        messages = [{"role": "user", "content": compiled}]
    else:
        messages = TemplateService.compile_messages(
            version.template_messages,
            item.input
        )

    # Call LLM
    llm_response = await LLMService.generate_completion(
        messages=messages,
        model=model_config["model"],
        temperature=model_config.get("temperature", 0.7),
        max_tokens=model_config.get("max_tokens")
    )

    # Run assertions
    grading = run_assertions(
        llm_response.output,
        assertions,
        item.expected_output
    )

    return ProcessResult(
        output=llm_response.output,
        grading=grading,
        metrics={
            "latency_ms": llm_response.latency_ms,
            "prompt_tokens": llm_response.prompt_tokens,
            "completion_tokens": llm_response.completion_tokens,
            "total_tokens": llm_response.total_tokens,
            "cost_usd": llm_response.cost_usd
        }
    )
```

### Configuration

Evaluation settings from config:

```python
# app/core/config.py
class Settings(BaseSettings):
    eval_concurrency: int = 5    # Concurrent LLM calls
    eval_retries: int = 3        # Retry failed calls
    eval_timeout: int = 60       # Call timeout (seconds)
```

---

## Evaluators

Assertion and grading logic.

### Location

`app/services/evaluators.py`

### Functions

#### run_assertions

Run all assertions against output.

```python
from app.services.evaluators import run_assertions

grading = run_assertions(
    output="The answer is 42.",
    assertions=[
        {"type": "contains", "value": "42"},
        {"type": "not_contains", "value": "error"}
    ],
    expected_output={"contains": ["answer"]}
)

# {
#   "pass": True,
#   "score": 1.0,
#   "reason": "All assertions passed",
#   "assertions": [
#     {"type": "contains", "pass": True, "expected": "42"},
#     {"type": "not_contains", "pass": True, "expected": "error"}
#   ]
# }
```

### Assertion Types

#### contains

```python
def check_contains(output: str, value: str) -> AssertionResult:
    passed = value.lower() in output.lower()
    return AssertionResult(
        type="contains",
        pass_=passed,
        expected=value,
        actual="found" if passed else "not found"
    )
```

#### not_contains

```python
def check_not_contains(output: str, value: str) -> AssertionResult:
    passed = value.lower() not in output.lower()
    return AssertionResult(
        type="not_contains",
        pass_=passed,
        expected=f"not {value}",
        actual="not found" if passed else "found"
    )
```

#### equals

```python
def check_equals(output: str, value: str) -> AssertionResult:
    passed = output.strip() == value.strip()
    return AssertionResult(
        type="equals",
        pass_=passed,
        expected=value,
        actual=output[:100]
    )
```

#### regex

```python
import re

def check_regex(output: str, pattern: str) -> AssertionResult:
    try:
        match = re.search(pattern, output)
        passed = match is not None
        return AssertionResult(
            type="regex",
            pass_=passed,
            expected=pattern,
            actual=match.group() if match else "no match"
        )
    except re.error as e:
        return AssertionResult(
            type="regex",
            pass_=False,
            expected=pattern,
            reason=f"Invalid regex: {e}"
        )
```

#### json_match

```python
import json
from jsonpath_ng import parse

def check_json_match(output: str, path: str, value: str) -> AssertionResult:
    try:
        data = json.loads(output)
        expr = parse(path)
        matches = [m.value for m in expr.find(data)]

        if not matches:
            return AssertionResult(
                type="json_match",
                pass_=False,
                expected=f"{path} = {value}",
                reason="Path not found"
            )

        passed = str(matches[0]) == value
        return AssertionResult(
            type="json_match",
            pass_=passed,
            expected=value,
            actual=str(matches[0])
        )

    except json.JSONDecodeError:
        return AssertionResult(
            type="json_match",
            pass_=False,
            reason="Output is not valid JSON"
        )
```

#### llm_grade

```python
async def check_llm_grade(
    output: str,
    criteria: str,
    weight: float = 1.0
) -> AssertionResult:
    """Use LLM to grade the response."""

    grading_prompt = f"""
    Evaluate the following response based on this criteria:
    {criteria}

    Response to evaluate:
    {output}

    Provide your evaluation as JSON:
    {{"pass": true/false, "score": 0.0-1.0, "reason": "explanation"}}
    """

    response = await LLMService.generate_completion(
        messages=[{"role": "user", "content": grading_prompt}],
        model="gpt-4o-mini",  # Use fast model for grading
        temperature=0
    )

    result = json.loads(response.output)

    return AssertionResult(
        type="llm_grade",
        pass_=result["pass"],
        score=result["score"] * weight,
        reason=result["reason"]
    )
```

### Scoring

Calculate overall score from assertions:

```python
def calculate_score(assertion_results: list[AssertionResult]) -> float:
    """Calculate weighted score from assertion results."""
    if not assertion_results:
        return 1.0

    total_weight = sum(r.weight for r in assertion_results)
    if total_weight == 0:
        return 1.0 if all(r.pass_ for r in assertion_results) else 0.0

    weighted_sum = sum(
        r.score * r.weight
        for r in assertion_results
        if r.score is not None
    )

    return weighted_sum / total_weight
```

---

## Error Handling

### LLM Errors

```python
from litellm.exceptions import (
    AuthenticationError,
    RateLimitError,
    APIError
)

async def generate_with_retry(messages, model, **kwargs):
    """Generate with retry logic."""
    retries = settings.eval_retries

    for attempt in range(retries):
        try:
            return await LLMService.generate_completion(
                messages, model, **kwargs
            )
        except RateLimitError:
            if attempt < retries - 1:
                await asyncio.sleep(2 ** attempt)
                continue
            raise
        except AuthenticationError:
            raise  # Don't retry auth errors
        except APIError as e:
            if attempt < retries - 1:
                await asyncio.sleep(1)
                continue
            raise
```

### Evaluation Errors

```python
async def process_with_error_handling(run_id: str, db: AsyncSession):
    """Process evaluation with error handling."""
    try:
        await process_evaluation(run_id, db)
    except Exception as e:
        run = await db.get(EvalRun, run_id)
        run.status = "failed"
        run.summary = {"error": str(e)}
        await db.commit()
        raise
```

---

## Extending Services

### Adding New Assertion Type

```python
# app/services/evaluators.py

def check_custom_assertion(output: str, config: dict) -> AssertionResult:
    """Custom assertion implementation."""
    # Your logic here
    return AssertionResult(
        type="custom",
        pass_=True,
        reason="Custom check passed"
    )

# Register in assertion dispatcher
ASSERTION_HANDLERS = {
    "contains": check_contains,
    "not_contains": check_not_contains,
    "equals": check_equals,
    "regex": check_regex,
    "json_match": check_json_match,
    "llm_grade": check_llm_grade,
    "custom": check_custom_assertion,  # Add here
}
```

### Adding New LLM Provider

```python
# app/services/llm_service.py

class LLMService:
    PROVIDER_MAP = {
        # Existing...
        "new-model": "new_provider",
    }

    @staticmethod
    def configure_new_provider():
        """Configure new provider API key."""
        import litellm
        litellm.new_provider_key = settings.new_provider_api_key
```

---

## Related Documentation

- [Backend Architecture](../architecture/backend-architecture.md)
- [API Reference](../api/overview.md)
- [Running Evaluations](../guides/running-evaluations.md)

---

*Services guide generated December 2024*
