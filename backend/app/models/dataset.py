from sqlalchemy import Column, String, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from app.models.base import UUIDMixin, TimestampMixin
from app.core.database import Base


class Dataset(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "datasets"

    use_case_id = Column(UUID(as_uuid=True), ForeignKey("use_cases.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    # Optional schemas for validation
    input_schema = Column(JSONB, nullable=True)
    expected_output_schema = Column(JSONB, nullable=True)
    default_assertions = Column(JSONB, default=list, nullable=False)

    # Relationships
    use_case = relationship("UseCase", back_populates="datasets")
    items = relationship("DatasetItem", back_populates="dataset", cascade="all, delete-orphan")
    eval_runs = relationship("EvalRun", back_populates="dataset")

    def __repr__(self):
        return f"<Dataset(id={self.id}, name={self.name})>"


class DatasetItem(Base, UUIDMixin, TimestampMixin):
    __tablename__ = "dataset_items"

    dataset_id = Column(UUID(as_uuid=True), ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False)
    input = Column(JSONB, nullable=False)
    expected_output = Column(JSONB, nullable=True)
    item_metadata = Column("metadata", JSONB, default=dict, nullable=False)

    # Relationships
    dataset = relationship("Dataset", back_populates="items")
    eval_results = relationship("EvalResult", back_populates="dataset_item")

    def __repr__(self):
        return f"<DatasetItem(id={self.id}, dataset_id={self.dataset_id})>"
