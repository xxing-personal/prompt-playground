from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime
from app.schemas.base import BaseSchema


class UseCaseCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None


class UseCaseUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None


class UseCaseResponse(BaseSchema):
    id: UUID
    project_id: UUID
    name: str
    description: Optional[str]
    created_at: datetime
    updated_at: datetime


class UseCaseWithStats(UseCaseResponse):
    prompt_count: int = 0
    dataset_count: int = 0
