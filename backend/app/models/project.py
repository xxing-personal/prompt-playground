from sqlalchemy import Column, String, Text
from sqlalchemy.orm import relationship
from app.models.base import UUIDMixin, TimestampMixin
from app.core.database import Base


class Project(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "projects"

    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Relationships
    use_cases = relationship("UseCase", back_populates="project", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Project(id={self.id}, name={self.name})>"
