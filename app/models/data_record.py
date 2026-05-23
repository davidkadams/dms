import uuid
from datetime import datetime, timezone
from typing import List
from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class DataRecord(Base):
    __tablename__ = "data_records"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    schema_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("schemas.id"), nullable=False, index=True)
    label: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    schema: Mapped["Schema"] = relationship("Schema", back_populates="data_records")
    field_values: Mapped[List["FieldValue"]] = relationship(
        "FieldValue", back_populates="data_record", cascade="all, delete-orphan"
    )
    generated_documents: Mapped[List["GeneratedDocument"]] = relationship("GeneratedDocument", back_populates="data_record")
