from uuid import UUID
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class GenerateDocumentRequest(BaseModel):
    template_id: UUID
    data_instance_id: UUID


class GeneratedDocumentResponse(BaseModel):
    id: UUID
    template_id: UUID
    data_instance_id: UUID
    s3_key: str
    created_at: datetime
    created_by: UUID

    model_config = {"from_attributes": True}
