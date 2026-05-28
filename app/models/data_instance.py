import uuid
from datetime import datetime, timezone
from typing import List
from sqlalchemy import String, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class DataInstance(Base):
    __tablename__ = "data_instances"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    schema_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("schemas.id"), nullable=False, index=True)
    label: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="pending", nullable=False)
    source: Mapped[str] = mapped_column(String(50), default="manual", nullable=False)  # manual | extracted
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    validated_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    validated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    schema: Mapped["Schema"] = relationship("Schema", back_populates="data_instances")
    field_values: Mapped[List["FieldValue"]] = relationship(
        "FieldValue", back_populates="data_instance", cascade="all, delete-orphan"
    )
    generated_documents: Mapped[List["GeneratedDocument"]] = relationship("GeneratedDocument", back_populates="data_instance")
