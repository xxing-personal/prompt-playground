from pydantic import BaseModel, ConfigDict
from typing import Generic, TypeVar, List, Optional
from uuid import UUID
from datetime import datetime

T = TypeVar('T')


class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    limit: int
    pages: int


class PaginationParams(BaseModel):
    page: int = 1
    limit: int = 50
    sort: str = "created_at"
    order: str = "desc"

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.limit
