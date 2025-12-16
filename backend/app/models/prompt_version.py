from sqlalchemy import Column, String, Text, Integer, ForeignKey, Index, UniqueConstraint, DateTime
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.core.database import Base
import uuid


class PromptVersion(Base):
    __tablename__ = "prompt_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    prompt_id = Column(UUID(as_uuid=True), ForeignKey("prompts.id", ondelete="CASCADE"), nullable=False)
    version_number = Column(Integer, nullable=False)

    # Content
    type = Column(String(10), default="text", nullable=False)  # 'text' or 'chat'
    template_text = Column(Text, nullable=True)  # For type='text'
    template_messages = Column(JSONB, nullable=True)  # For type='chat': [{role, content}]

    # Configuration
    model_defaults = Column(JSONB, default=dict, nullable=False)
    variables_schema = Column(JSONB, nullable=True)  # JSON Schema for variables

    # Metadata
    commit_message = Column(Text, nullable=True)
    created_by = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Labels: production, beta, alpha
    labels = Column(ARRAY(String), default=list, nullable=False)

    # Relationships
    prompt = relationship("Prompt", back_populates="versions")
    eval_runs = relationship("EvalRun", back_populates="prompt_version")
    playground_runs = relationship("PlaygroundRun", back_populates="version")

    __table_args__ = (
        UniqueConstraint("prompt_id", "version_number", name="uq_prompt_version"),
        # Partial unique indexes created via raw SQL in migration
    )

    def __repr__(self):
        return f"<PromptVersion(id={self.id}, prompt_id={self.prompt_id}, v{self.version_number})>"
