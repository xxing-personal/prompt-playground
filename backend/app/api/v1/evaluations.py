from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel, Field
from typing import Dict, List, Any, Optional
from uuid import UUID
from datetime import datetime, timezone, timedelta
import secrets

from app.core.database import get_db
from app.models import EvalRun, EvalResult, PromptVersion, Dataset, DatasetItem
from app.schemas import PaginatedResponse

router = APIRouter(tags=["evaluations"])


# === Schemas ===

class ModelConfig(BaseModel):
    id: Optional[str] = None
    model: str
    provider: Optional[str] = None
    temperature: float = 0.7
    max_tokens: int = 1024
    top_p: float = 1.0


class AssertionConfig(BaseModel):
    type: str
    config: Dict[str, Any] = Field(default_factory=dict)


class EvalRunCreate(BaseModel):
    name: Optional[str] = None
    prompt_version_id: UUID
    dataset_id: UUID
    models: List[ModelConfig]
    assertions: List[AssertionConfig] = Field(default_factory=list)
    created_by: Optional[str] = None


class EvalRunResponse(BaseModel):
    id: UUID
    name: Optional[str]
    prompt_version_id: UUID
    dataset_id: UUID
    models: List[Dict[str, Any]]
    assertions: List[Dict[str, Any]]
    status: str
    progress: Dict[str, Any]
    summary: Optional[Dict[str, Any]]
    error_message: Optional[str]
    created_by: Optional[str]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime
    share_token: Optional[str]
    share_expires_at: Optional[datetime]

    class Config:
        from_attributes = True


class EvalResultResponse(BaseModel):
    model_config = {"from_attributes": True}
    
    id: UUID
    eval_run_id: UUID
    dataset_item_id: UUID
    model_id: str
    model_configuration: Dict[str, Any] = Field(alias="model_config", serialization_alias="model_config")
    input: Dict[str, Any]
    expected_output: Optional[Any]
    output: Optional[str]
    output_json: Optional[Dict[str, Any]]
    grading: Dict[str, Any]
    metrics: Dict[str, Any]
    created_at: datetime


# === Endpoints ===

@router.post("/eval-runs", response_model=EvalRunResponse, status_code=201)
async def create_eval_run(
    data: EvalRunCreate,
    db: AsyncSession = Depends(get_db)
):
    # Verify prompt version exists
    version = await db.get(PromptVersion, data.prompt_version_id)
    if not version:
        raise HTTPException(status_code=404, detail="Prompt version not found")

    # Verify dataset exists
    dataset = await db.get(Dataset, data.dataset_id)
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")

    # Convert models and assertions to dict format
    models_list = [m.model_dump() for m in data.models]
    for i, m in enumerate(models_list):
        if not m.get("id"):
            m["id"] = f"model_{i}"
    
    assertions_list = [a.model_dump() for a in data.assertions]

    run = EvalRun(
        name=data.name,
        prompt_version_id=data.prompt_version_id,
        dataset_id=data.dataset_id,
        models=models_list,
        assertions=assertions_list,
        status="pending",
        progress={"total": 0, "completed": 0, "failed": 0, "percent": 0},
        created_by=data.created_by,
    )
    db.add(run)
    await db.commit()
    await db.refresh(run)
    return EvalRunResponse.model_validate(run)


@router.get("/eval-runs", response_model=PaginatedResponse[EvalRunResponse])
async def list_eval_runs(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    status: Optional[str] = None,
    prompt_version_id: Optional[UUID] = None,
    dataset_id: Optional[UUID] = None,
    db: AsyncSession = Depends(get_db)
):
    base_query = select(EvalRun)
    
    if status:
        base_query = base_query.where(EvalRun.status == status)
    if prompt_version_id:
        base_query = base_query.where(EvalRun.prompt_version_id == prompt_version_id)
    if dataset_id:
        base_query = base_query.where(EvalRun.dataset_id == dataset_id)

    count_query = select(func.count()).select_from(base_query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    query = base_query.offset((page - 1) * limit).limit(limit).order_by(EvalRun.created_at.desc())
    result = await db.execute(query)
    items = result.scalars().all()

    return PaginatedResponse(
        items=[EvalRunResponse.model_validate(r) for r in items],
        total=total,
        page=page,
        limit=limit,
        pages=(total + limit - 1) // limit
    )


@router.get("/eval-runs/{run_id}", response_model=EvalRunResponse)
async def get_eval_run(run_id: UUID, db: AsyncSession = Depends(get_db)):
    run = await db.get(EvalRun, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Eval run not found")
    return EvalRunResponse.model_validate(run)


@router.post("/eval-runs/{run_id}/cancel", response_model=EvalRunResponse)
async def cancel_eval_run(run_id: UUID, db: AsyncSession = Depends(get_db)):
    run = await db.get(EvalRun, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Eval run not found")

    if run.status not in ["pending", "running"]:
        raise HTTPException(status_code=400, detail="Can only cancel pending or running runs")

    run.status = "canceled"
    run.completed_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(run)
    return EvalRunResponse.model_validate(run)


@router.delete("/eval-runs/{run_id}", status_code=204)
async def delete_eval_run(run_id: UUID, db: AsyncSession = Depends(get_db)):
    run = await db.get(EvalRun, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Eval run not found")

    await db.delete(run)
    await db.commit()


@router.get("/eval-runs/{run_id}/results", response_model=PaginatedResponse[EvalResultResponse])
async def list_eval_results(
    run_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    model_id: Optional[str] = None,
    passed: Optional[bool] = None,
    db: AsyncSession = Depends(get_db)
):
    run = await db.get(EvalRun, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Eval run not found")

    base_query = select(EvalResult).where(EvalResult.eval_run_id == run_id)
    
    if model_id:
        base_query = base_query.where(EvalResult.model_id == model_id)

    count_query = select(func.count()).select_from(base_query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    query = base_query.offset((page - 1) * limit).limit(limit)
    result = await db.execute(query)
    rows = result.scalars().all()

    # Load dataset items for input/expected
    item_ids = list({r.dataset_item_id for r in rows})
    items = {}
    if item_ids:
        items_result = await db.execute(select(DatasetItem).where(DatasetItem.id.in_(item_ids)))
        for item in items_result.scalars().all():
            items[item.id] = item

    responses = []
    for r in rows:
        item = items.get(r.dataset_item_id)
        
        # Filter by passed if specified
        if passed is not None:
            if r.grading.get("pass") != passed:
                continue
        
        responses.append(EvalResultResponse(
            id=r.id,
            eval_run_id=r.eval_run_id,
            dataset_item_id=r.dataset_item_id,
            model_id=r.model_id,
            model_configuration=r.model_config,
            input=item.input if item else {},
            expected_output=item.expected_output if item else None,
            output=r.output,
            output_json=r.output_json,
            grading=r.grading,
            metrics=r.metrics,
            created_at=r.created_at,
        ))

    return PaginatedResponse(
        items=responses,
        total=total,
        page=page,
        limit=limit,
        pages=(total + limit - 1) // limit
    )


# === Share endpoints ===

@router.post("/eval-runs/{run_id}/share", response_model=dict)
async def create_share_link(
    run_id: UUID,
    expires_in_days: int = Query(7, ge=1, le=365),
    db: AsyncSession = Depends(get_db)
):
    run = await db.get(EvalRun, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Eval run not found")

    token = secrets.token_urlsafe(16)
    run.share_token = token
    run.share_expires_at = datetime.now(timezone.utc) + timedelta(days=expires_in_days)
    await db.commit()
    
    return {
        "token": token,
        "url": f"/reports/{token}",
        "expires_at": run.share_expires_at.isoformat()
    }


@router.delete("/eval-runs/{run_id}/share", status_code=204)
async def revoke_share_link(run_id: UUID, db: AsyncSession = Depends(get_db)):
    run = await db.get(EvalRun, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Eval run not found")
    
    run.share_token = None
    run.share_expires_at = None
    await db.commit()
