import uuid
from datetime import datetime, timezone
from sqlalchemy import Text, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class FieldValue(Base):
    __tablename__ = "field_values"
    __table_args__ = (
        UniqueConstraint("data_record_id", "schema_field_id", name="uq_field_value_record_field"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    data_record_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("data_records.id"), nullable=False, index=True)
    schema_field_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("schema_fields.id"), nullable=False)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    data_record: Mapped["DataRecord"] = relationship("DataRecord", back_populates="field_values")
    schema_field: Mapped["SchemaField"] = relationship("SchemaField", back_populates="field_values")
