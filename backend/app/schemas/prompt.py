from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Literal
from uuid import UUID
from datetime import datetime
from app.schemas.base import BaseSchema


class PromptCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    tags: List[str] = Field(default_factory=list)


class PromptUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    tags: Optional[List[str]] = None


class PromptResponse(BaseSchema):
    id: UUID
    use_case_id: UUID
    name: str
    description: Optional[str]
    tags: List[str]
    created_at: datetime
    updated_at: datetime
    latest_version: Optional[int] = None
    production_version: Optional[int] = None


class PromptWithVersions(PromptResponse):
    version_count: int = 0
    production_version: Optional[int] = None
    beta_version: Optional[int] = None
    alpha_version: Optional[int] = None
    latest_version: Optional[int] = None


# Prompt Version Schemas
class ChatMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str


class ModelDefaults(BaseModel):
    provider: Optional[str] = None
    model: Optional[str] = None
    temperature: Optional[float] = Field(None, ge=0, le=2)
    max_tokens: Optional[int] = Field(None, ge=1)
    top_p: Optional[float] = Field(None, ge=0, le=1)


class PromptVersionCreate(BaseModel):
    type: Literal["text", "chat"] = "text"
    template_text: Optional[str] = None
    template_messages: Optional[List[ChatMessage]] = None
    model_defaults: ModelDefaults = Field(default_factory=ModelDefaults)
    variables_schema: Optional[Dict[str, Any]] = None
    commit_message: Optional[str] = None
    created_by: Optional[str] = None


class PromptVersionResponse(BaseSchema):
    id: UUID
    prompt_id: UUID
    version_number: int
    type: str
    template_text: Optional[str]
    template_messages: Optional[List[Dict[str, str]]]
    model_defaults: Dict[str, Any]
    variables_schema: Optional[Dict[str, Any]]
    commit_message: Optional[str]
    created_by: Optional[str]
    created_at: datetime
    labels: List[str]


class PromptVersionPromote(BaseModel):
    label: Literal["production", "beta", "alpha"]


class PromptVersionDemote(BaseModel):
    label: Literal["production", "beta", "alpha"]
