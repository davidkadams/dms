from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.schema import Schema
from app.models.schema_field import SchemaField
from app.models.user import User
from app.dependencies.auth import get_current_user
from app.schemas_pydantic.schema import (
    SchemaCreate,
    SchemaResponse,
    SchemaFieldCreate,
    SchemaFieldUpdate,
    SchemaFieldResponse,
)

router = APIRouter()


@router.post("/", response_model=SchemaResponse, status_code=201)
def create_schema(
    payload: SchemaCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if db.query(Schema).filter(Schema.name == payload.name).first():
        raise HTTPException(status_code=409, detail="Schema name already exists")
    schema = Schema(**payload.model_dump(), created_by=current_user.id)
    db.add(schema)
    db.commit()
    db.refresh(schema)
    return schema


@router.get("/", response_model=list[SchemaResponse])
def list_schemas(db: Session = Depends(get_db)):
    return db.query(Schema).all()


@router.get("/{schema_id}", response_model=SchemaResponse)
def get_schema(schema_id: UUID, db: Session = Depends(get_db)):
    schema = db.get(Schema, schema_id)
    if not schema:
        raise HTTPException(status_code=404, detail="Schema not found")
    return schema


@router.post("/{schema_id}/fields", response_model=SchemaFieldResponse, status_code=201)
def add_field(
    schema_id: UUID,
    payload: SchemaFieldCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not db.get(Schema, schema_id):
        raise HTTPException(status_code=404, detail="Schema not found")
    field = SchemaField(**payload.model_dump(), schema_id=schema_id, created_by=current_user.id)
    db.add(field)
    db.commit()
    db.refresh(field)
    return field


@router.get("/{schema_id}/fields", response_model=list[SchemaFieldResponse])
def list_fields(schema_id: UUID, db: Session = Depends(get_db)):
    if not db.get(Schema, schema_id):
        raise HTTPException(status_code=404, detail="Schema not found")
    return db.query(SchemaField).filter(SchemaField.schema_id == schema_id).order_by(SchemaField.display_order).all()


@router.patch("/{schema_id}/fields/{field_id}", response_model=SchemaFieldResponse)
def update_field(schema_id: UUID, field_id: UUID, payload: SchemaFieldUpdate, db: Session = Depends(get_db)):
    field = db.get(SchemaField, field_id)
    if not field or field.schema_id != schema_id:
        raise HTTPException(status_code=404, detail="Field not found")
    for key, val in payload.model_dump(exclude_none=True).items():
        setattr(field, key, val)
    db.commit()
    db.refresh(field)
    return field


@router.delete("/{schema_id}/fields/{field_id}", status_code=204)
def delete_field(schema_id: UUID, field_id: UUID, db: Session = Depends(get_db)):
    field = db.get(SchemaField, field_id)
    if not field or field.schema_id != schema_id:
        raise HTTPException(status_code=404, detail="Field not found")
    db.delete(field)
    db.commit()
