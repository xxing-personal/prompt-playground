from sqlalchemy import Column, String, Text, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.models.base import UUIDMixin
from app.core.database import Base


class PlaygroundRun(Base, UUIDMixin):
    """Stores playground run history for a prompt."""
    __tablename__ = "playground_runs"

    prompt_id = Column(UUID(as_uuid=True), ForeignKey("prompts.id", ondelete="CASCADE"), nullable=False)
    version_id = Column(UUID(as_uuid=True), ForeignKey("prompt_versions.id", ondelete="SET NULL"), nullable=True)

    # Configuration used for this run
    config = Column(JSONB, nullable=False)  # {template_type, template_text, template_messages, variables, models}

    # Results from all models
    results = Column(JSONB, nullable=False)  # [{model_id, model_name, output, metrics, error, completed_at}]

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    prompt = relationship("Prompt", back_populates="playground_runs")
    version = relationship("PromptVersion", back_populates="playground_runs")

    def __repr__(self):
        return f"<PlaygroundRun(id={self.id}, prompt_id={self.prompt_id})>"
