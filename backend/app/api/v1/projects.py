from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.models import Project, UseCase
from app.schemas import (
    ProjectCreate, ProjectUpdate, ProjectResponse, ProjectWithStats,
    PaginatedResponse, PaginationParams
)

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=PaginatedResponse[ProjectWithStats])
async def list_projects(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db)
):
    # Count total
    count_query = select(func.count(Project.id))
    total = (await db.execute(count_query)).scalar() or 0

    # Get items
    query = select(Project).offset((page - 1) * limit).limit(limit).order_by(Project.created_at.desc())
    result = await db.execute(query)
    items = result.scalars().all()

    # Get stats
    response_items = []
    if items:
        project_ids = [p.id for p in items]
        uc_query = select(
            UseCase.project_id, 
            func.count(UseCase.id)
        ).where(
            UseCase.project_id.in_(project_ids)
        ).group_by(UseCase.project_id)
        
        uc_res = await db.execute(uc_query)
        stats_map = {row[0]: row[1] for row in uc_res}
        
        for p in items:
            resp = ProjectWithStats.model_validate(p)
            resp.use_case_count = stats_map.get(p.id, 0)
            response_items.append(resp)

    return PaginatedResponse(
        items=response_items,
        total=total,
        page=page,
        limit=limit,
        pages=(total + limit - 1) // limit
    )


@router.post("", response_model=ProjectResponse, status_code=201)
async def create_project(data: ProjectCreate, db: AsyncSession = Depends(get_db)):
    project = Project(**data.model_dump())
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return ProjectResponse.model_validate(project)


@router.get("/{project_id}", response_model=ProjectWithStats)
async def get_project(project_id: UUID, db: AsyncSession = Depends(get_db)):
    query = select(Project).where(Project.id == project_id)
    result = await db.execute(query)
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Get use case count
    count_query = select(func.count(UseCase.id)).where(UseCase.project_id == project_id)
    use_case_count = (await db.execute(count_query)).scalar() or 0

    response = ProjectWithStats.model_validate(project)
    response.use_case_count = use_case_count
    return response


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(project_id: UUID, data: ProjectUpdate, db: AsyncSession = Depends(get_db)):
    query = select(Project).where(Project.id == project_id)
    result = await db.execute(query)
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(project, key, value)

    await db.commit()
    await db.refresh(project)
    return ProjectResponse.model_validate(project)


@router.delete("/{project_id}", status_code=204)
async def delete_project(project_id: UUID, db: AsyncSession = Depends(get_db)):
    query = select(Project).where(Project.id == project_id)
    result = await db.execute(query)
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    await db.delete(project)
    await db.commit()
