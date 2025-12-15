from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime
from app.schemas.base import BaseSchema


class AssertionConfig(BaseModel):
    type: str  # exact_match, contains, regex, json_valid, json_schema, llm_judge
    config: Dict[str, Any] = Field(default_factory=dict)


class DatasetCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    input_schema: Optional[Dict[str, Any]] = None
    expected_output_schema: Optional[Dict[str, Any]] = None
    default_assertions: List[AssertionConfig] = Field(default_factory=list)


class DatasetUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    input_schema: Optional[Dict[str, Any]] = None
    expected_output_schema: Optional[Dict[str, Any]] = None
    default_assertions: Optional[List[AssertionConfig]] = None


class DatasetResponse(BaseSchema):
    id: UUID
    use_case_id: UUID
    name: str
    description: Optional[str]
    input_schema: Optional[Dict[str, Any]]
    expected_output_schema: Optional[Dict[str, Any]]
    default_assertions: List[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime


class DatasetWithStats(DatasetResponse):
    item_count: int = 0


# Dataset Item Schemas
class DatasetItemCreate(BaseModel):
    input: Dict[str, Any]
    expected_output: Optional[Any] = None
    item_metadata: Dict[str, Any] = Field(default_factory=dict, alias="metadata")


class DatasetItemUpdate(BaseModel):
    input: Optional[Dict[str, Any]] = None
    expected_output: Optional[Any] = None
    item_metadata: Optional[Dict[str, Any]] = Field(None, alias="metadata")


class DatasetItemResponse(BaseSchema):
    id: UUID
    dataset_id: UUID
    input: Dict[str, Any]
    expected_output: Optional[Any]
    item_metadata: Dict[str, Any] = Field(alias="metadata", serialization_alias="metadata")
    created_at: datetime
    updated_at: datetime


class DatasetItemBatchCreate(BaseModel):
    items: List[DatasetItemCreate]
