from pydantic import BaseModel, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from app.schemas.base import BaseSchema


class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None


class ProjectResponse(BaseSchema):
    id: UUID
    name: str
    description: Optional[str]
    created_at: datetime
    updated_at: datetime


class ProjectWithStats(ProjectResponse):
    use_case_count: int = 0
