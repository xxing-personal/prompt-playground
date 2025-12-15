from sqlalchemy import Column, String, Text, ForeignKey, UniqueConstraint, Index, DateTime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.models.base import UUIDMixin
from app.core.database import Base
import uuid


class EvalRun(Base, UUIDMixin):
    __tablename__ = "eval_runs"

    name = Column(String(255), nullable=True)
    prompt_version_id = Column(UUID(as_uuid=True), ForeignKey("prompt_versions.id"), nullable=False)
    dataset_id = Column(UUID(as_uuid=True), ForeignKey("datasets.id"), nullable=False)

    # Model configs: [{id, label, provider, model, temperature, ...}]
    models = Column(JSONB, nullable=False)
    assertions = Column(JSONB, default=list, nullable=False)

    # Status
    status = Column(String(20), default="pending", nullable=False)  # pending, running, completed, failed, canceled
    progress = Column(JSONB, default=dict, nullable=False)  # {total, completed, failed, percent}
    summary = Column(JSONB, nullable=True)  # Aggregated results
    error_message = Column(Text, nullable=True)

    # Timestamps
    created_by = Column(String(255), nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Sharing
    share_token = Column(String(32), unique=True, nullable=True)
    share_expires_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    prompt_version = relationship("PromptVersion", back_populates="eval_runs")
    dataset = relationship("Dataset", back_populates="eval_runs")
    results = relationship("EvalResult", back_populates="eval_run", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<EvalRun(id={self.id}, status={self.status})>"


class EvalResult(Base):
    __tablename__ = "eval_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    eval_run_id = Column(UUID(as_uuid=True), ForeignKey("eval_runs.id", ondelete="CASCADE"), nullable=False)
    dataset_item_id = Column(UUID(as_uuid=True), ForeignKey("dataset_items.id"), nullable=False)

    # Model info
    model_id = Column(String(100), nullable=False)
    model_config = Column(JSONB, nullable=False)

    # Request/Response
    request = Column(JSONB, nullable=False)  # {compiled_prompt, variables, config}
    output = Column(Text, nullable=True)
    output_json = Column(JSONB, nullable=True)

    # Grading
    grading = Column(JSONB, nullable=False)  # {pass, score, reason, assertions: [...]}

    # Metrics
    metrics = Column(JSONB, nullable=False)  # {latency_ms, tokens, cost_usd, retries, error}

    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    eval_run = relationship("EvalRun", back_populates="results")
    dataset_item = relationship("DatasetItem", back_populates="eval_results")

    __table_args__ = (
        UniqueConstraint("eval_run_id", "dataset_item_id", "model_id", name="uq_eval_result"),
        Index("idx_eval_results_run_item", "eval_run_id", "dataset_item_id"),
    )

    def __repr__(self):
        return f"<EvalResult(id={self.id}, model={self.model_id})>"
