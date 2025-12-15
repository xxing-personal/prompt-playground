from sqlalchemy import Column, String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import UUIDMixin, TimestampMixin
from app.core.database import Base


class UseCase(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "use_cases"

    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Relationships
    project = relationship("Project", back_populates="use_cases")
    prompts = relationship("Prompt", back_populates="use_case", cascade="all, delete-orphan")
    datasets = relationship("Dataset", back_populates="use_case", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<UseCase(id={self.id}, name={self.name})>"
