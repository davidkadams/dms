from uuid import UUID
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.data_instance import DataInstance
from app.models.field_value import FieldValue
from app.schemas_pydantic.data_instance import DataInstanceCreate, DataInstanceResponse

router = APIRouter()


@router.post("/", response_model=DataInstanceResponse, status_code=201)
def create_data_instance(
    payload: DataInstanceCreate,
    x_user_id: UUID = Header(...),
    db: Session = Depends(get_db),
):
    instance = DataInstance(schema_id=payload.schema_id, label=payload.label, created_by=x_user_id)
    db.add(instance)
    db.flush()
    for fv in payload.field_values:
        db.add(FieldValue(data_instance_id=instance.id, **fv.model_dump()))
    db.commit()
    db.refresh(instance)
    return instance


@router.get("/", response_model=list[DataInstanceResponse])
def list_data_instances(schema_id: UUID | None = None, db: Session = Depends(get_db)):
    q = db.query(DataInstance)
    if schema_id:
        q = q.filter(DataInstance.schema_id == schema_id)
    return q.all()


@router.get("/{instance_id}", response_model=DataInstanceResponse)
def get_data_instance(instance_id: UUID, db: Session = Depends(get_db)):
    instance = db.get(DataInstance, instance_id)
    if not instance:
        raise HTTPException(status_code=404, detail="Data instance not found")
    return instance


@router.patch("/{instance_id}/validate", response_model=DataInstanceResponse)
def validate_data_instance(
    instance_id: UUID,
    x_user_id: UUID = Header(...),
    db: Session = Depends(get_db),
):
    instance = db.get(DataInstance, instance_id)
    if not instance:
        raise HTTPException(status_code=404, detail="Data instance not found")
    if instance.status == "processed":
        raise HTTPException(status_code=400, detail="Cannot validate an already processed instance")
    instance.status = "validated"
    instance.validated_by = x_user_id
    instance.validated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(instance)
    return instance
