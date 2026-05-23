from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.data_record import DataRecord
from app.models.field_value import FieldValue
from app.schemas_pydantic.data_record import DataRecordCreate, DataRecordResponse

router = APIRouter()


@router.post("/", response_model=DataRecordResponse, status_code=201)
def create_data_record(
    payload: DataRecordCreate,
    x_user_id: UUID = Header(...),
    db: Session = Depends(get_db),
):
    record = DataRecord(schema_id=payload.schema_id, label=payload.label, created_by=x_user_id)
    db.add(record)
    db.flush()  # get record.id before inserting field_values
    for fv in payload.field_values:
        db.add(FieldValue(data_record_id=record.id, **fv.model_dump()))
    db.commit()
    db.refresh(record)
    return record


@router.get("/", response_model=list[DataRecordResponse])
def list_data_records(schema_id: UUID | None = None, db: Session = Depends(get_db)):
    q = db.query(DataRecord)
    if schema_id:
        q = q.filter(DataRecord.schema_id == schema_id)
    return q.all()


@router.get("/{record_id}", response_model=DataRecordResponse)
def get_data_record(record_id: UUID, db: Session = Depends(get_db)):
    record = db.get(DataRecord, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Data record not found")
    return record
