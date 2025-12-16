import asyncio
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional, Literal
from uuid import UUID

from app.core.database import get_db
from app.models import PromptVersion, PlaygroundRun, Prompt
from app.services.template_service import TemplateService
from app.services.llm_service import LLMService
from datetime import datetime

router = APIRouter(prefix="/playground", tags=["playground"])


# === Request/Response Schemas ===

class CompileRequest(BaseModel):
    template_type: str = "text"
    template_text: Optional[str] = None
    template_messages: Optional[List[Dict[str, str]]] = None
    variables: Dict[str, Any] = Field(default_factory=dict)


class CompileResponse(BaseModel):
    type: str
    compiled_text: Optional[str] = None
    compiled_messages: Optional[List[Dict[str, str]]] = None
    required_variables: List[str]
    provided_variables: List[str]
    missing_variables: List[str]
    is_valid: bool


class RunRequest(BaseModel):
    template_type: str = "text"
    template_text: Optional[str] = None
    template_messages: Optional[List[Dict[str, str]]] = None
    variables: Dict[str, Any] = Field(default_factory=dict)
    model: Optional[str] = None
    temperature: float = 0.7
    max_tokens: int = 1024
    top_p: float = 1.0
    reasoning_effort: Optional[str] = None


class RunResponse(BaseModel):
    output: str
    model: str
    provider: str
    latency_ms: float
    tokens: Dict[str, int]
    cost_usd: Optional[float]
    error: Optional[str] = None
    compiled_prompt: Optional[str] = None
    compiled_messages: Optional[List[Dict[str, str]]] = None


class RunVersionRequest(BaseModel):
    variables: Dict[str, Any] = Field(default_factory=dict)
    model: Optional[str] = None
    temperature: Optional[float] = None
    max_tokens: Optional[int] = None
    top_p: Optional[float] = None
    reasoning_effort: Optional[str] = None


class ModelRunConfig(BaseModel):
    """Configuration for a single model in multi-model run."""
    model: str
    provider: str = "openai"
    temperature: float = 0.7
    max_tokens: int = 1024
    top_p: float = 1.0
    reasoning_effort: Optional[str] = None


class MultiModelRunRequest(BaseModel):
    """Request for running multiple models in parallel."""
    template_type: Literal["text", "chat"] = "text"
    template_text: Optional[str] = None
    template_messages: Optional[List[Dict[str, str]]] = None
    variables: Dict[str, Any] = Field(default_factory=dict)
    models: List[ModelRunConfig]


class VersionRunConfig(BaseModel):
    """Configuration for running a specific version."""
    version_id: UUID
    model: str
    temperature: float = 0.7
    max_tokens: int = 1024
    top_p: float = 1.0
    reasoning_effort: Optional[str] = None


class MultiVersionRunRequest(BaseModel):
    """Request for running multiple versions in parallel."""
    versions: List[VersionRunConfig]
    variables: Dict[str, Any] = Field(default_factory=dict)


class VersionRunResult(BaseModel):
    """Result from running a specific version."""
    version_id: str
    version_number: int
    output: Optional[str] = None
    metrics: Dict[str, Any]
    error: Optional[str] = None


class MultiVersionRunResponse(BaseModel):
    """Response containing results from all version runs."""
    results: List[VersionRunResult]


class ModelRunResult(BaseModel):
    """Result from a single model run."""
    model_id: str
    output: Optional[str] = None
    metrics: Dict[str, Any]
    error: Optional[str] = None


class MultiModelRunResponse(BaseModel):
    """Response containing results from all models."""
    results: List[ModelRunResult]


class SaveRunRequest(BaseModel):
    """Request to save a playground run."""
    prompt_id: UUID
    version_id: Optional[UUID] = None
    config: Dict[str, Any]
    results: List[Dict[str, Any]]


class PlaygroundRunResponse(BaseModel):
    """Response for a saved playground run."""
    id: UUID
    prompt_id: UUID
    version_id: Optional[UUID]
    config: Dict[str, Any]
    results: List[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True


# === Helper Functions ===

def prepare_messages_for_llm(
    template_type: str,
    template_text: Optional[str],
    template_messages: Optional[List[Dict[str, str]]],
    variables: Dict[str, Any]
) -> List[Dict[str, str]]:
    """
    Compile template and prepare messages for LLM.
    Raises HTTPException if validation fails.
    """
    compile_result = TemplateService.dry_run(
        template_type=template_type,
        template_text=template_text,
        template_messages=template_messages,
        variables=variables,
    )
    
    if not compile_result["is_valid"]:
        raise HTTPException(
            status_code=400,
            detail=f"Missing variables: {compile_result['missing_variables']}"
        )
    
    if template_type == "chat":
        return compile_result["compiled_messages"]
    else:
        return [{"role": "user", "content": compile_result["compiled_text"]}]


# === Endpoints ===

@router.post("/compile", response_model=CompileResponse)
async def compile_template(data: CompileRequest):
    """Compile a template with variables (dry run, no LLM call)."""
    result = TemplateService.dry_run(
        template_type=data.template_type,
        template_text=data.template_text,
        template_messages=data.template_messages,
        variables=data.variables,
    )
    return CompileResponse(**result)


@router.post("/run", response_model=RunResponse)
async def run_prompt(data: RunRequest):
    """Run a prompt through the LLM."""
    # First compile the template
    compile_result = TemplateService.dry_run(
        template_type=data.template_type,
        template_text=data.template_text,
        template_messages=data.template_messages,
        variables=data.variables,
    )
    
    if not compile_result["is_valid"]:
        raise HTTPException(
            status_code=400,
            detail=f"Missing variables: {compile_result['missing_variables']}"
        )
    
    # Prepare messages for LLM
    if data.template_type == "chat":
        messages = compile_result["compiled_messages"]
    else:
        messages = [{"role": "user", "content": compile_result["compiled_text"]}]
    
    # Call LLM
    response = await LLMService.generate_completion(
        messages=messages,
        model=data.model,
        temperature=data.temperature,
        max_tokens=data.max_tokens,
        top_p=data.top_p,
        reasoning_effort=data.reasoning_effort,
    )
    
    return RunResponse(
        output=response.output,
        model=response.model,
        provider=response.provider,
        latency_ms=response.latency_ms,
        tokens=response.tokens,
        cost_usd=response.cost_usd,
        error=response.error,
        compiled_prompt=compile_result.get("compiled_text"),
        compiled_messages=compile_result.get("compiled_messages"),
    )


@router.post("/run-version/{version_id}", response_model=RunResponse)
async def run_version(
    version_id: UUID,
    data: RunVersionRequest,
    db: AsyncSession = Depends(get_db)
):
    """Run a saved prompt version through the LLM."""
    version = await db.get(PromptVersion, version_id)
    if not version:
        raise HTTPException(status_code=404, detail="Version not found")
    
    # Get model config from version defaults, override with request
    model_defaults = version.model_defaults or {}
    model = data.model or model_defaults.get("model")
    temperature = data.temperature if data.temperature is not None else model_defaults.get("temperature", 0.7)
    max_tokens = data.max_tokens if data.max_tokens is not None else model_defaults.get("max_tokens", 1024)
    top_p = data.top_p if data.top_p is not None else model_defaults.get("top_p", 1.0)
    
    # Compile template
    compile_result = TemplateService.dry_run(
        template_type=version.type,
        template_text=version.template_text,
        template_messages=version.template_messages,
        variables=data.variables,
    )
    
    if not compile_result["is_valid"]:
        raise HTTPException(
            status_code=400,
            detail=f"Missing variables: {compile_result['missing_variables']}"
        )
    
    # Prepare messages for LLM
    if version.type == "chat":
        messages = compile_result["compiled_messages"]
    else:
        messages = [{"role": "user", "content": compile_result["compiled_text"]}]
    
    # Call LLM
    response = await LLMService.generate_completion(
        messages=messages,
        model=model,
        temperature=temperature,
        max_tokens=max_tokens,
        top_p=top_p,
    )

    return RunResponse(
        output=response.output,
        model=response.model,
        provider=response.provider,
        latency_ms=response.latency_ms,
        tokens=response.tokens,
        cost_usd=response.cost_usd,
        error=response.error,
        compiled_prompt=compile_result.get("compiled_text"),
        compiled_messages=compile_result.get("compiled_messages"),
    )


@router.post("/run-multi", response_model=MultiModelRunResponse)
async def run_multi_model(data: MultiModelRunRequest):
    """Run a prompt against multiple models in parallel."""
    # First compile the template once
    compile_result = TemplateService.dry_run(
        template_type=data.template_type,
        template_text=data.template_text,
        template_messages=data.template_messages,
        variables=data.variables,
    )

    if not compile_result["is_valid"]:
        raise HTTPException(
            status_code=400,
            detail=f"Missing variables: {compile_result['missing_variables']}"
        )

    # Prepare messages for LLM
    if data.template_type == "chat":
        messages = compile_result["compiled_messages"]
    else:
        messages = [{"role": "user", "content": compile_result["compiled_text"]}]

    async def run_single_model(model_config: ModelRunConfig) -> ModelRunResult:
        """Run a single model and return result."""
        try:
            response = await LLMService.generate_completion(
                messages=messages,
                model=model_config.model,
                temperature=model_config.temperature,
                max_tokens=model_config.max_tokens,
                top_p=model_config.top_p,
                reasoning_effort=model_config.reasoning_effort,
            )
            return ModelRunResult(
                model_id=model_config.model,
                output=response.output,
                metrics={
                    "latency_ms": response.latency_ms,
                    "prompt_tokens": response.tokens.get("prompt_tokens", 0),
                    "completion_tokens": response.tokens.get("completion_tokens", 0),
                    "total_tokens": response.tokens.get("total_tokens", 0),
                    "cost_usd": response.cost_usd,
                },
                error=response.error,
            )
        except Exception as e:
            return ModelRunResult(
                model_id=model_config.model,
                output=None,
                metrics={
                    "latency_ms": 0,
                    "prompt_tokens": 0,
                    "completion_tokens": 0,
                    "total_tokens": 0,
                    "cost_usd": None,
                },
                error=str(e),
            )

    # Run all models in parallel
    tasks = [run_single_model(model_config) for model_config in data.models]
    results = await asyncio.gather(*tasks, return_exceptions=False)

    return MultiModelRunResponse(results=results)


@router.post("/run-versions", response_model=MultiVersionRunResponse)
async def run_multiple_versions(
    data: MultiVersionRunRequest,
    db: AsyncSession = Depends(get_db)
):
    """Run multiple prompt versions in parallel with the same variables."""
    
    # First, fetch all versions sequentially to avoid concurrent session access
    version_data = {}
    for config in data.versions:
        version = await db.get(PromptVersion, config.version_id)
        if version:
            version_data[str(config.version_id)] = {
                "version_number": version.version_number,
                "type": version.type,
                "template_text": version.template_text,
                "template_messages": version.template_messages,
            }
    
    async def run_single_version(config: VersionRunConfig) -> VersionRunResult:
        """Run a single version and return result."""
        try:
            version_info = version_data.get(str(config.version_id))
            if not version_info:
                return VersionRunResult(
                    version_id=str(config.version_id),
                    version_number=0,
                    output=None,
                    metrics={"latency_ms": 0, "total_tokens": 0, "cost_usd": None},
                    error="Version not found",
                )
            
            # Compile template with provided variables
            compile_result = TemplateService.dry_run(
                template_type=version_info["type"],
                template_text=version_info["template_text"],
                template_messages=version_info["template_messages"],
                variables=data.variables,
            )
            
            if not compile_result["is_valid"]:
                return VersionRunResult(
                    version_id=str(config.version_id),
                    version_number=version_info["version_number"],
                    output=None,
                    metrics={"latency_ms": 0, "total_tokens": 0, "cost_usd": None},
                    error=f"Missing variables: {compile_result['missing_variables']}",
                )
            
            # Prepare messages for LLM
            if version_info["type"] == "chat":
                messages = compile_result["compiled_messages"]
            else:
                messages = [{"role": "user", "content": compile_result["compiled_text"]}]
            
            # Call LLM
            response = await LLMService.generate_completion(
                messages=messages,
                model=config.model,
                temperature=config.temperature,
                max_tokens=config.max_tokens,
                top_p=config.top_p,
                reasoning_effort=config.reasoning_effort,
            )
            
            return VersionRunResult(
                version_id=str(config.version_id),
                version_number=version_info["version_number"],
                output=response.output,
                metrics={
                    "latency_ms": response.latency_ms,
                    "prompt_tokens": response.tokens.get("prompt_tokens", 0),
                    "completion_tokens": response.tokens.get("completion_tokens", 0),
                    "total_tokens": response.tokens.get("total_tokens", 0),
                    "cost_usd": response.cost_usd,
                },
                error=response.error,
            )
        except Exception as e:
            return VersionRunResult(
                version_id=str(config.version_id),
                version_number=0,
                output=None,
                metrics={"latency_ms": 0, "total_tokens": 0, "cost_usd": None},
                error=str(e),
            )
    
    # Run all versions in parallel (LLM calls only, DB already done)
    tasks = [run_single_version(config) for config in data.versions]
    results = await asyncio.gather(*tasks, return_exceptions=False)
    
    return MultiVersionRunResponse(results=results)


@router.post("/runs", response_model=PlaygroundRunResponse, status_code=201)
async def save_playground_run(
    data: SaveRunRequest,
    db: AsyncSession = Depends(get_db)
):
    """Save a playground run to the database."""
    # Verify prompt exists
    prompt = await db.get(Prompt, data.prompt_id)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")
    
    # Verify version exists if provided
    if data.version_id:
        version = await db.get(PromptVersion, data.version_id)
        if not version:
            raise HTTPException(status_code=404, detail="Version not found")
    
    run = PlaygroundRun(
        prompt_id=data.prompt_id,
        version_id=data.version_id,
        config=data.config,
        results=data.results,
    )
    db.add(run)
    await db.commit()
    await db.refresh(run)
    return PlaygroundRunResponse.model_validate(run)


@router.get("/runs/by-version/{version_id}", response_model=List[PlaygroundRunResponse])
async def get_playground_runs_by_version(
    version_id: UUID,
    limit: int = 10,
    db: AsyncSession = Depends(get_db)
):
    """Get recent playground runs for a specific prompt version."""
    query = (
        select(PlaygroundRun)
        .where(PlaygroundRun.version_id == version_id)
        .order_by(PlaygroundRun.created_at.desc())
        .limit(limit)
    )
    result = await db.execute(query)
    runs = result.scalars().all()
    return [PlaygroundRunResponse.model_validate(r) for r in runs]
