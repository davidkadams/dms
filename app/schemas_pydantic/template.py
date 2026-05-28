from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    schema_id: Optional[UUID] = None


class TemplateResponse(BaseModel):
    id: UUID
    schema_id: UUID
    name: str
    s3_key: str
    status: str
    is_default: bool
    created_at: datetime
    created_by: UUID

    model_config = {"from_attributes": True}


class TokenMappingCreate(BaseModel):
    token: str
    schema_field_id: UUID


class TokenMappingResponse(TokenMappingCreate):
    id: UUID
    template_id: UUID
    created_at: datetime
    created_by: UUID

    model_config = {"from_attributes": True}
