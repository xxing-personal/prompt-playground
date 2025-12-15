from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from uuid import UUID

from app.core.database import get_db
from app.models import Project, UseCase, Prompt, Dataset
from app.schemas import (
    UseCaseCreate, UseCaseUpdate, UseCaseResponse, UseCaseWithStats,
    PaginatedResponse
)

router = APIRouter(tags=["use-cases"])


@router.get("/projects/{project_id}/use-cases", response_model=PaginatedResponse[UseCaseWithStats])
async def list_use_cases(
    project_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db)
):
    # Verify project exists
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Count total
    count_query = select(func.count(UseCase.id)).where(UseCase.project_id == project_id)
    total = (await db.execute(count_query)).scalar() or 0

    # Get items
    query = (
        select(UseCase)
        .where(UseCase.project_id == project_id)
        .offset((page - 1) * limit)
        .limit(limit)
        .order_by(UseCase.created_at.desc())
    )
    result = await db.execute(query)
    items = result.scalars().all()

    # Get stats
    response_items = []
    if items:
        uc_ids = [uc.id for uc in items]
        
        # Prompt counts
        p_query = select(
            Prompt.use_case_id, 
            func.count(Prompt.id)
        ).where(
            Prompt.use_case_id.in_(uc_ids)
        ).group_by(Prompt.use_case_id)
        p_res = await db.execute(p_query)
        p_map = {row[0]: row[1] for row in p_res}

        # Dataset counts
        d_query = select(
            Dataset.use_case_id, 
            func.count(Dataset.id)
        ).where(
            Dataset.use_case_id.in_(uc_ids)
        ).group_by(Dataset.use_case_id)
        d_res = await db.execute(d_query)
        d_map = {row[0]: row[1] for row in d_res}

        for uc in items:
            resp = UseCaseWithStats.model_validate(uc)
            resp.prompt_count = p_map.get(uc.id, 0)
            resp.dataset_count = d_map.get(uc.id, 0)
            response_items.append(resp)

    return PaginatedResponse(
        items=response_items,
        total=total,
        page=page,
        limit=limit,
        pages=(total + limit - 1) // limit
    )


@router.post("/projects/{project_id}/use-cases", response_model=UseCaseResponse, status_code=201)
async def create_use_case(
    project_id: UUID,
    data: UseCaseCreate,
    db: AsyncSession = Depends(get_db)
):
    # Verify project exists
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    use_case = UseCase(project_id=project_id, **data.model_dump())
    db.add(use_case)
    await db.commit()
    await db.refresh(use_case)
    return UseCaseResponse.model_validate(use_case)


@router.get("/use-cases/{use_case_id}", response_model=UseCaseWithStats)
async def get_use_case(use_case_id: UUID, db: AsyncSession = Depends(get_db)):
    use_case = await db.get(UseCase, use_case_id)
    if not use_case:
        raise HTTPException(status_code=404, detail="Use case not found")

    # Get counts
    prompt_count = (await db.execute(
        select(func.count(Prompt.id)).where(Prompt.use_case_id == use_case_id)
    )).scalar() or 0

    dataset_count = (await db.execute(
        select(func.count(Dataset.id)).where(Dataset.use_case_id == use_case_id)
    )).scalar() or 0

    response = UseCaseWithStats.model_validate(use_case)
    response.prompt_count = prompt_count
    response.dataset_count = dataset_count
    return response


@router.patch("/use-cases/{use_case_id}", response_model=UseCaseResponse)
async def update_use_case(
    use_case_id: UUID,
    data: UseCaseUpdate,
    db: AsyncSession = Depends(get_db)
):
    use_case = await db.get(UseCase, use_case_id)
    if not use_case:
        raise HTTPException(status_code=404, detail="Use case not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(use_case, key, value)

    await db.commit()
    await db.refresh(use_case)
    return UseCaseResponse.model_validate(use_case)


@router.delete("/use-cases/{use_case_id}", status_code=204)
async def delete_use_case(use_case_id: UUID, db: AsyncSession = Depends(get_db)):
    use_case = await db.get(UseCase, use_case_id)
    if not use_case:
        raise HTTPException(status_code=404, detail="Use case not found")

    await db.delete(use_case)
    await db.commit()
