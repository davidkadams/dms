from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.generated_document import GeneratedDocument
from app.schemas_pydantic.document import GenerateDocumentRequest, GeneratedDocumentResponse
from app.services.document_renderer import render_document
from app.services.s3 import generate_presigned_url

router = APIRouter()


@router.post("/generate", response_model=GeneratedDocumentResponse, status_code=201)
def generate_document(
    payload: GenerateDocumentRequest,
    x_user_id: UUID = Header(...),
    db: Session = Depends(get_db),
):
    s3_key = render_document(payload.template_id, payload.data_record_id, db)
    doc = GeneratedDocument(
        template_id=payload.template_id,
        data_record_id=payload.data_record_id,
        s3_key=s3_key,
        created_by=x_user_id,
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.get("/", response_model=list[GeneratedDocumentResponse])
def list_documents(db: Session = Depends(get_db)):
    return db.query(GeneratedDocument).all()


@router.get("/{document_id}", response_model=GeneratedDocumentResponse)
def get_document(document_id: UUID, db: Session = Depends(get_db)):
    doc = db.get(GeneratedDocument, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    response = GeneratedDocumentResponse.model_validate(doc)
    response.download_url = generate_presigned_url(doc.s3_key)
    return response
