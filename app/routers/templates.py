from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.template import Template
from app.models.token_mapping import TokenMapping
from app.models.user import User
from app.dependencies.auth import get_current_user
from app.schemas_pydantic.template import TemplateResponse, TemplateUpdate, TokenMappingCreate, TokenMappingResponse
from fastapi.responses import Response
from app.services.s3 import delete_file, download_file, generate_presigned_url, upload_file

router = APIRouter()


@router.post("/", response_model=TemplateResponse, status_code=201)
async def create_template(
    name: str = Form(...),
    schema_id: UUID = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    content = await file.read()
    s3_key = f"templates/{schema_id}/{file.filename}"
    upload_file(content, s3_key, content_type=file.content_type or "application/octet-stream")
    try:
        template = Template(name=name, schema_id=schema_id, s3_key=s3_key, created_by=current_user.id)
        db.add(template)
        db.commit()
        db.refresh(template)
    except Exception:
        db.rollback()
        delete_file(s3_key)
        raise HTTPException(status_code=400, detail="Failed to save template — S3 upload rolled back. Check that schema_id exists.")
    return template


@router.get("/", response_model=list[TemplateResponse])
def list_templates(schema_id: UUID | None = None, db: Session = Depends(get_db)):
    q = db.query(Template)
    if schema_id:
        q = q.filter(Template.schema_id == schema_id)
    return q.all()


@router.get("/{template_id}", response_model=TemplateResponse)
def get_template(template_id: UUID, db: Session = Depends(get_db)):
    template = db.get(Template, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@router.patch("/{template_id}", response_model=TemplateResponse)
def update_template(template_id: UUID, payload: TemplateUpdate, db: Session = Depends(get_db)):
    template = db.get(Template, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    if payload.name is not None:
        template.name = payload.name
    if payload.schema_id is not None:
        template.schema_id = payload.schema_id
    db.commit()
    db.refresh(template)
    return template


@router.delete("/{template_id}", status_code=204)
def delete_template(template_id: UUID, db: Session = Depends(get_db)):
    template = db.get(Template, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    delete_file(template.s3_key)
    db.delete(template)
    db.commit()


@router.patch("/{template_id}/activate", response_model=TemplateResponse)
def activate_template(template_id: UUID, db: Session = Depends(get_db)):
    template = db.get(Template, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    template.status = "active"
    db.commit()
    db.refresh(template)
    return template


@router.patch("/{template_id}/set-default", response_model=TemplateResponse)
def set_default_template(template_id: UUID, db: Session = Depends(get_db)):
    template = db.get(Template, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    db.query(Template).filter(
        Template.schema_id == template.schema_id,
        Template.is_default == True,
    ).update({"is_default": False})
    template.is_default = True
    db.commit()
    db.refresh(template)
    return template


@router.get("/{template_id}/file")
def get_template_file(template_id: UUID, db: Session = Depends(get_db)):
    template = db.get(Template, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    content = download_file(template.s3_key)
    return Response(
        content=content,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )


@router.post("/{template_id}/token-mappings", response_model=TokenMappingResponse, status_code=201)
def add_token_mapping(
    template_id: UUID,
    payload: TokenMappingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not db.get(Template, template_id):
        raise HTTPException(status_code=404, detail="Template not found")
    mapping = TokenMapping(**payload.model_dump(), template_id=template_id, created_by=current_user.id)
    db.add(mapping)
    db.commit()
    db.refresh(mapping)
    return mapping


@router.get("/{template_id}/token-mappings", response_model=list[TokenMappingResponse])
def list_token_mappings(template_id: UUID, db: Session = Depends(get_db)):
    return db.query(TokenMapping).filter(TokenMapping.template_id == template_id).all()


@router.delete("/{template_id}/token-mappings/{mapping_id}", status_code=204)
def delete_token_mapping(template_id: UUID, mapping_id: UUID, db: Session = Depends(get_db)):
    mapping = db.get(TokenMapping, mapping_id)
    if not mapping or mapping.template_id != template_id:
        raise HTTPException(status_code=404, detail="Token mapping not found")
    db.delete(mapping)
    db.commit()
