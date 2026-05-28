from uuid import UUID
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel


class FieldValueCreate(BaseModel):
    schema_field_id: UUID
    value: str


class FieldValueResponse(BaseModel):
    id: UUID
    data_instance_id: UUID
    schema_field_id: UUID
    value: str
    created_at: datetime

    model_config = {"from_attributes": True}


class DataInstanceCreate(BaseModel):
    schema_id: UUID
    label: str
    field_values: List[FieldValueCreate] = []


class DataInstanceResponse(BaseModel):
    id: UUID
    schema_id: UUID
    label: str
    status: str
    source: str
    created_at: datetime
    created_by: UUID
    validated_by: Optional[UUID] = None
    validated_at: Optional[datetime] = None
    field_values: List[FieldValueResponse] = []

    model_config = {"from_attributes": True}
