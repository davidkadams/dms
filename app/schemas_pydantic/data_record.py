from uuid import UUID
from datetime import datetime
from typing import List
from pydantic import BaseModel


class FieldValueCreate(BaseModel):
    schema_field_id: UUID
    value: str


class FieldValueResponse(BaseModel):
    id: UUID
    data_record_id: UUID
    schema_field_id: UUID
    value: str
    created_at: datetime

    model_config = {"from_attributes": True}


class DataRecordCreate(BaseModel):
    schema_id: UUID
    label: str
    field_values: List[FieldValueCreate] = []


class DataRecordResponse(BaseModel):
    id: UUID
    schema_id: UUID
    label: str
    created_at: datetime
    created_by: UUID
    field_values: List[FieldValueResponse] = []

    model_config = {"from_attributes": True}
