from uuid import UUID
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class SchemaFieldCreate(BaseModel):
    name: str
    label: str
    field_type: str  # string | number | date
    required: bool = True
    display_order: int = 0


class SchemaFieldResponse(SchemaFieldCreate):
    id: UUID
    schema_id: UUID
    created_at: datetime
    created_by: UUID

    model_config = {"from_attributes": True}


class SchemaCreate(BaseModel):
    name: str
    description: Optional[str] = None


class SchemaResponse(SchemaCreate):
    id: UUID
    created_at: datetime
    created_by: UUID
    fields: List[SchemaFieldResponse] = []

    model_config = {"from_attributes": True}
