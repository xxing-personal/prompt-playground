from sqlalchemy import Column, String, Text, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from sqlalchemy.orm import relationship
from app.models.base import UUIDMixin, TimestampMixin
from app.core.database import Base


class Prompt(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "prompts"

    use_case_id = Column(UUID(as_uuid=True), ForeignKey("use_cases.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    tags = Column(ARRAY(String), default=list, nullable=False)

    # Relationships
    use_case = relationship("UseCase", back_populates="prompts")
    versions = relationship("PromptVersion", back_populates="prompt", cascade="all, delete-orphan", order_by="PromptVersion.version_number.desc()")

    def __repr__(self):
        return f"<Prompt(id={self.id}, name={self.name})>"


# GIN index for tags (created via Alembic migration)
Index("idx_prompts_tags", Prompt.tags, postgresql_using="gin")
