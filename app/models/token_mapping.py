import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class TokenMapping(Base):
    __tablename__ = "token_mappings"
    __table_args__ = (
        UniqueConstraint("template_id", "token", name="uq_token_mapping_template_token"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    template_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("templates.id"), nullable=False, index=True)
    token: Mapped[str] = mapped_column(String(255), nullable=False)
    schema_field_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("schema_fields.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    template: Mapped["Template"] = relationship("Template", back_populates="token_mappings")
    schema_field: Mapped["SchemaField"] = relationship("SchemaField", back_populates="token_mappings")
