from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from uuid import UUID
from pydantic import BaseModel

from app.core.database import get_db
from app.models import EvalRun, EvalResult, DatasetItem

router = APIRouter(prefix="/reports", tags=["reports"])


class EvalRunPublicResponse(BaseModel):
    id: UUID
    name: Optional[str]
    status: str
    summary: Optional[Dict[str, Any]]
    created_at: datetime
    completed_at: Optional[datetime]
    models: List[Dict[str, Any]]

    class Config:
        from_attributes = True


class EvalResultPublicResponse(BaseModel):
    id: UUID
    model_id: str
    input: Dict[str, Any]
    expected_output: Optional[Any]
    output: Optional[str]
    grading: Dict[str, Any]
    metrics: Dict[str, Any]

    class Config:
        from_attributes = True


class PaginatedPublicResponse(BaseModel):
    items: List[EvalResultPublicResponse]
    total: int
    page: int
    limit: int
    pages: int


async def _get_run_by_token(db: AsyncSession, token: str) -> EvalRun:
    """Get eval run by share token, checking expiry."""
    query = select(EvalRun).where(EvalRun.share_token == token)
    result = await db.execute(query)
    run = result.scalar_one_or_none()

    if not run:
        raise HTTPException(status_code=404, detail="Report not found")

    if run.share_expires_at and run.share_expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=410, detail="Share link has expired")

    return run


@router.get("/{token}", response_model=EvalRunPublicResponse)
async def get_report(token: str, db: AsyncSession = Depends(get_db)):
    """Get public report by share token."""
    run = await _get_run_by_token(db, token)
    return EvalRunPublicResponse.model_validate(run)


@router.get("/{token}/results", response_model=PaginatedPublicResponse)
async def get_report_results(
    token: str,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """Get public report results by share token."""
    run = await _get_run_by_token(db, token)

    base = select(EvalResult).where(EvalResult.eval_run_id == run.id)
    total = (await db.execute(select(func.count()).select_from(base.subquery()))).scalar() or 0

    result = await db.execute(base.offset((page - 1) * limit).limit(limit))
    rows = result.scalars().all()

    # Load dataset items
    item_ids = list({r.dataset_item_id for r in rows})
    items = {}
    if item_ids:
        items_result = await db.execute(select(DatasetItem).where(DatasetItem.id.in_(item_ids)))
        for it in items_result.scalars().all():
            items[it.id] = it

    responses = []
    for r in rows:
        it = items.get(r.dataset_item_id)
        responses.append(
            EvalResultPublicResponse(
                id=r.id,
                model_id=r.model_id,
                input=(it.input if it else {}),
                expected_output=(it.expected_output if it else None),
                output=r.output,
                grading=r.grading,
                metrics=r.metrics,
            )
        )

    return PaginatedPublicResponse(
        items=responses,
        total=total,
        page=page,
        limit=limit,
        pages=(total + limit - 1) // limit,
    )
