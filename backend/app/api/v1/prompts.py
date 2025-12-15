from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from uuid import UUID
from datetime import datetime, timezone

from app.core.database import get_db
from app.models import UseCase, Prompt, PromptVersion
from app.schemas import (
    PromptCreate, PromptUpdate, PromptResponse, PromptWithVersions,
    PromptVersionCreate, PromptVersionResponse, PromptVersionPromote, PromptVersionDemote,
    PaginatedResponse
)

router = APIRouter(tags=["prompts"])


# === Prompt CRUD ===

@router.get("/use-cases/{use_case_id}/prompts", response_model=PaginatedResponse[PromptResponse])
async def list_prompts(
    use_case_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    tag: str = Query(None, description="Filter by tag"),
    db: AsyncSession = Depends(get_db)
):
    use_case = await db.get(UseCase, use_case_id)
    if not use_case:
        raise HTTPException(status_code=404, detail="Use case not found")

    base_query = select(Prompt).where(Prompt.use_case_id == use_case_id)
    if tag:
        base_query = base_query.where(Prompt.tags.contains([tag]))

    count_query = select(func.count()).select_from(base_query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    query = base_query.offset((page - 1) * limit).limit(limit).order_by(Prompt.updated_at.desc())
    result = await db.execute(query)
    items = result.scalars().all()

    # Enrich with version info
    if items:
        prompt_ids = [p.id for p in items]
        
        # Get latest versions
        latest_q = select(
            PromptVersion.prompt_id, 
            func.max(PromptVersion.version_number).label('max_ver')
        ).where(
            PromptVersion.prompt_id.in_(prompt_ids)
        ).group_by(PromptVersion.prompt_id)
        
        latest_res = await db.execute(latest_q)
        latest_map = {row.prompt_id: row.max_ver for row in latest_res}
        
        # Get production versions
        prod_q = select(
            PromptVersion.prompt_id,
            PromptVersion.version_number
        ).where(
            and_(
                PromptVersion.prompt_id.in_(prompt_ids),
                PromptVersion.labels.contains(["production"])
            )
        )
        
        prod_res = await db.execute(prod_q)
        prod_map = {row.prompt_id: row.version_number for row in prod_res}

        response_items = []
        for p in items:
            resp = PromptResponse.model_validate(p)
            resp.latest_version = latest_map.get(p.id, 0)
            resp.production_version = prod_map.get(p.id)
            response_items.append(resp)
    else:
        response_items = []

    return PaginatedResponse(
        items=response_items,
        total=total,
        page=page,
        limit=limit,
        pages=(total + limit - 1) // limit
    )


@router.post("/use-cases/{use_case_id}/prompts", response_model=PromptResponse, status_code=201)
async def create_prompt(
    use_case_id: UUID,
    data: PromptCreate,
    db: AsyncSession = Depends(get_db)
):
    use_case = await db.get(UseCase, use_case_id)
    if not use_case:
        raise HTTPException(status_code=404, detail="Use case not found")

    prompt = Prompt(use_case_id=use_case_id, **data.model_dump())
    db.add(prompt)
    await db.commit()
    await db.refresh(prompt)
    return PromptResponse.model_validate(prompt)


@router.get("/prompts/{prompt_id}", response_model=PromptWithVersions)
async def get_prompt(prompt_id: UUID, db: AsyncSession = Depends(get_db)):
    prompt = await db.get(Prompt, prompt_id)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    # Get version stats
    versions_query = select(PromptVersion).where(PromptVersion.prompt_id == prompt_id)
    versions_result = await db.execute(versions_query)
    versions = versions_result.scalars().all()

    response = PromptWithVersions.model_validate(prompt)
    response.version_count = len(versions)

    for v in versions:
        if "production" in v.labels:
            response.production_version = v.version_number
        if "beta" in v.labels:
            response.beta_version = v.version_number
        if "alpha" in v.labels:
            response.alpha_version = v.version_number

    if versions:
        response.latest_version = max(v.version_number for v in versions)

    return response


@router.patch("/prompts/{prompt_id}", response_model=PromptResponse)
async def update_prompt(
    prompt_id: UUID,
    data: PromptUpdate,
    db: AsyncSession = Depends(get_db)
):
    prompt = await db.get(Prompt, prompt_id)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(prompt, key, value)

    await db.commit()
    await db.refresh(prompt)
    return PromptResponse.model_validate(prompt)


@router.delete("/prompts/{prompt_id}", status_code=204)
async def delete_prompt(prompt_id: UUID, db: AsyncSession = Depends(get_db)):
    prompt = await db.get(Prompt, prompt_id)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    await db.delete(prompt)
    await db.commit()


# === Prompt Versions ===

@router.get("/prompts/{prompt_id}/versions", response_model=PaginatedResponse[PromptVersionResponse])
async def list_versions(
    prompt_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db)
):
    prompt = await db.get(Prompt, prompt_id)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    base_query = select(PromptVersion).where(PromptVersion.prompt_id == prompt_id)
    count_query = select(func.count()).select_from(base_query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    query = base_query.offset((page - 1) * limit).limit(limit).order_by(PromptVersion.version_number.desc())
    result = await db.execute(query)
    items = result.scalars().all()

    return PaginatedResponse(
        items=[PromptVersionResponse.model_validate(v) for v in items],
        total=total,
        page=page,
        limit=limit,
        pages=(total + limit - 1) // limit
    )


@router.post("/prompts/{prompt_id}/versions", response_model=PromptVersionResponse, status_code=201)
async def create_version(
    prompt_id: UUID,
    data: PromptVersionCreate,
    db: AsyncSession = Depends(get_db)
):
    prompt = await db.get(Prompt, prompt_id)
    if not prompt:
        raise HTTPException(status_code=404, detail="Prompt not found")

    # Get next version number
    max_version_query = select(func.max(PromptVersion.version_number)).where(
        PromptVersion.prompt_id == prompt_id
    )
    max_version = (await db.execute(max_version_query)).scalar() or 0
    next_version = max_version + 1

    # Convert model_defaults to dict
    model_defaults_dict = data.model_defaults.model_dump(exclude_none=True) if data.model_defaults else {}
    
    # Convert template_messages to list of dicts
    template_messages_list = None
    if data.template_messages:
        template_messages_list = [msg.model_dump() for msg in data.template_messages]

    version = PromptVersion(
        prompt_id=prompt_id,
        version_number=next_version,
        type=data.type,
        template_text=data.template_text,
        template_messages=template_messages_list,
        model_defaults=model_defaults_dict,
        variables_schema=data.variables_schema,
        commit_message=data.commit_message,
        created_by=data.created_by,
        labels=[],
    )
    db.add(version)
    await db.commit()
    await db.refresh(version)
    return PromptVersionResponse.model_validate(version)


@router.get("/prompts/{prompt_id}/versions/{version_number}", response_model=PromptVersionResponse)
async def get_version(
    prompt_id: UUID,
    version_number: int,
    db: AsyncSession = Depends(get_db)
):
    query = select(PromptVersion).where(
        and_(
            PromptVersion.prompt_id == prompt_id,
            PromptVersion.version_number == version_number
        )
    )
    result = await db.execute(query)
    version = result.scalar_one_or_none()

    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    return PromptVersionResponse.model_validate(version)


@router.post("/prompts/{prompt_id}/versions/{version_number}/promote", response_model=PromptVersionResponse)
async def promote_version(
    prompt_id: UUID,
    version_number: int,
    data: PromptVersionPromote,
    db: AsyncSession = Depends(get_db)
):
    # Get the version to promote
    query = select(PromptVersion).where(
        and_(
            PromptVersion.prompt_id == prompt_id,
            PromptVersion.version_number == version_number
        )
    )
    result = await db.execute(query)
    version = result.scalar_one_or_none()

    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    # Remove label from any other version that has it
    all_versions_query = select(PromptVersion).where(PromptVersion.prompt_id == prompt_id)
    all_versions_result = await db.execute(all_versions_query)
    all_versions = all_versions_result.scalars().all()

    for v in all_versions:
        if data.label in v.labels:
            v.labels = [l for l in v.labels if l != data.label]

    # Add label to this version
    if data.label not in version.labels:
        version.labels = version.labels + [data.label]

    await db.commit()
    await db.refresh(version)
    return PromptVersionResponse.model_validate(version)


@router.post("/prompts/{prompt_id}/versions/{version_number}/demote", response_model=PromptVersionResponse)
async def demote_version(
    prompt_id: UUID,
    version_number: int,
    data: PromptVersionDemote,
    db: AsyncSession = Depends(get_db)
):
    query = select(PromptVersion).where(
        and_(
            PromptVersion.prompt_id == prompt_id,
            PromptVersion.version_number == version_number
        )
    )
    result = await db.execute(query)
    version = result.scalar_one_or_none()

    if not version:
        raise HTTPException(status_code=404, detail="Version not found")

    # Remove the label
    version.labels = [l for l in version.labels if l != data.label]

    await db.commit()
    await db.refresh(version)
    return PromptVersionResponse.model_validate(version)


# === Get version by label ===

@router.get("/prompts/{prompt_id}/versions/by-label/{label}", response_model=PromptVersionResponse)
async def get_version_by_label(
    prompt_id: UUID,
    label: str,
    db: AsyncSession = Depends(get_db)
):
    query = select(PromptVersion).where(
        and_(
            PromptVersion.prompt_id == prompt_id,
            PromptVersion.labels.contains([label])
        )
    )
    result = await db.execute(query)
    version = result.scalar_one_or_none()

    if not version:
        raise HTTPException(status_code=404, detail=f"No version with label '{label}' found")

    return PromptVersionResponse.model_validate(version)
