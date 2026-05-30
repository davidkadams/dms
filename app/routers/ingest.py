from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.schema import Schema
from app.models.schema_field import SchemaField
from app.models.data_instance import DataInstance
from app.models.field_value import FieldValue
from app.models.user import User
from app.dependencies.auth import get_current_user
from app.services.text_extractor import extract_text
from app.services.llm_extractor import match_schema, extract_fields

router = APIRouter()


@router.post("/prepare")
async def prepare_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    content = await file.read()
    try:
        document_text = extract_text(content, file.filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"document_text": document_text, "filename": file.filename}


@router.post("/match")
async def match_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    content = await file.read()
    try:
        document_text = extract_text(content, file.filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    schemas = db.query(Schema).filter(Schema.created_by == current_user.id).all()
    schema_dicts = []
    for s in schemas:
        fields = db.query(SchemaField).filter(SchemaField.schema_id == s.id).all()
        schema_dicts.append({
            "id": str(s.id),
            "name": s.name,
            "fields": [{"name": f.name, "field_type": f.field_type} for f in fields],
        })

    try:
        result = match_schema(document_text, schema_dicts)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM matching failed: {str(e)}")
    return {
        **result,
        "document_text": document_text,
        "filename": file.filename,
    }


@router.post("/extract")
async def extract_document(
    schema_id: str = Form(...),
    label: str = Form(...),
    document_text: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    schema_uuid = UUID(schema_id)
    schema = db.get(Schema, schema_uuid)
    if not schema:
        raise HTTPException(status_code=404, detail="Schema not found")

    fields = db.query(SchemaField).filter(SchemaField.schema_id == schema_uuid).order_by(SchemaField.display_order).all()
    if not fields:
        raise HTTPException(status_code=400, detail="Schema has no fields to extract")

    field_defs = [
        {
            "name": f.name,
            "label": f.label,
            "field_type": f.field_type,
            "description": f.description,
            "extraction_hint": f.extraction_hint,
        }
        for f in fields
    ]

    try:
        extracted = extract_fields(document_text, field_defs)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM extraction failed: {str(e)}")

    instance = DataInstance(
        schema_id=schema_uuid,
        label=label,
        source="extracted",
        status="pending_validation",
        created_by=current_user.id,
    )
    db.add(instance)
    db.flush()

    field_map = {f.name: f.id for f in fields}
    for field_name, value in extracted.items():
        if value is None:
            continue
        field_id = field_map.get(field_name)
        if not field_id:
            continue
        db.add(FieldValue(
            data_instance_id=instance.id,
            schema_field_id=field_id,
            value=str(value),
        ))

    db.commit()
    db.refresh(instance)

    return {
        "data_instance_id": str(instance.id),
        "extracted_values": extracted,
        "fields_found": sum(1 for v in extracted.values() if v is not None),
        "fields_total": len(fields),
    }
