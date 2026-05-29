from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.data_instance import DataInstance
from app.models.generated_document import GeneratedDocument
from app.models.template import Template
from app.schemas_pydantic.document import GenerateDocumentRequest, GeneratedDocumentResponse
from fastapi.responses import Response
from app.services.document_renderer import render_document
from app.services.s3 import download_file, generate_presigned_url

router = APIRouter()


@router.post("/generate", response_model=GeneratedDocumentResponse, status_code=201)
def generate_document(
    payload: GenerateDocumentRequest,
    x_user_id: UUID = Header(...),
    db: Session = Depends(get_db),
):
    template = db.get(Template, payload.template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    if template.status != "active":
        raise HTTPException(status_code=400, detail="Template must be activated before generating documents")
    instance = db.get(DataInstance, payload.data_instance_id)
    if not instance:
        raise HTTPException(status_code=404, detail="Data instance not found")
    s3_key = render_document(payload.template_id, payload.data_instance_id, db)
    doc = GeneratedDocument(
        template_id=payload.template_id,
        data_instance_id=payload.data_instance_id,
        s3_key=s3_key,
        created_by=x_user_id,
    )
    db.add(doc)
    instance.status = "processed"
    db.commit()
    db.refresh(doc)
    return doc


@router.post("/generate-bulk")
def generate_bulk(
    x_user_id: UUID = Header(...),
    db: Session = Depends(get_db),
):
    """
    Generate documents for all validated instances that have a default template.
    Skips instances where no active default template exists for the schema.
    """
    validated = (
        db.query(DataInstance)
        .filter(DataInstance.created_by == x_user_id, DataInstance.status == "validated")
        .all()
    )

    generated = []
    skipped = []

    for instance in validated:
        default_template = (
            db.query(Template)
            .filter(
                Template.schema_id == instance.schema_id,
                Template.is_default == True,
                Template.status == "active",
            )
            .first()
        )
        if not default_template:
            skipped.append({"instance_id": str(instance.id), "label": instance.label, "reason": "no default template"})
            continue

        try:
            s3_key = render_document(default_template.id, instance.id, db)
        except Exception as e:
            skipped.append({"instance_id": str(instance.id), "label": instance.label, "reason": str(e)})
            continue

        doc = GeneratedDocument(
            template_id=default_template.id,
            data_instance_id=instance.id,
            s3_key=s3_key,
            created_by=x_user_id,
        )
        db.add(doc)
        instance.status = "processed"
        db.flush()
        generated.append({"instance_id": str(instance.id), "label": instance.label, "document_id": str(doc.id)})

    db.commit()
    return {"generated": generated, "skipped": skipped, "total_generated": len(generated), "total_skipped": len(skipped)}


@router.get("/", response_model=list[GeneratedDocumentResponse])
def list_documents(db: Session = Depends(get_db)):
    return db.query(GeneratedDocument).all()


@router.get("/{document_id}", response_model=GeneratedDocumentResponse)
def get_document(document_id: UUID, db: Session = Depends(get_db)):
    doc = db.get(GeneratedDocument, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return GeneratedDocumentResponse.model_validate(doc)


@router.get("/{document_id}/download")
def download_document(document_id: UUID, db: Session = Depends(get_db)):
    doc = db.get(GeneratedDocument, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    content = download_file(doc.s3_key)
    filename = doc.s3_key.split("/")[-1]
    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
