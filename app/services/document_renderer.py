import uuid
from sqlalchemy.orm import Session


def render_document(template_id: uuid.UUID, data_instance_id: uuid.UUID, db: Session) -> str:
    from app.models.template import Template
    from app.models.token_mapping import TokenMapping
    from app.models.data_instance import DataInstance
    from app.models.field_value import FieldValue
    from app.services.s3 import download_file, upload_file

    template = db.get(Template, template_id)
    if not template:
        raise ValueError(f"Template {template_id} not found")

    instance = db.get(DataInstance, data_instance_id)
    if not instance:
        raise ValueError(f"DataInstance {data_instance_id} not found")

    token_mappings = db.query(TokenMapping).filter(TokenMapping.template_id == template_id).all()
    field_values = db.query(FieldValue).filter(FieldValue.data_instance_id == data_instance_id).all()

    value_map = {str(fv.schema_field_id): fv.value for fv in field_values}
    substitutions = {
        f"{{{{{tm.token}}}}}": value_map.get(str(tm.schema_field_id), "")
        for tm in token_mappings
    }

    try:
        import docx
        from io import BytesIO

        docx_bytes = download_file(template.s3_key)
        doc = docx.Document(BytesIO(docx_bytes))

        for paragraph in doc.paragraphs:
            for placeholder, value in substitutions.items():
                if placeholder in paragraph.text:
                    for run in paragraph.runs:
                        run.text = run.text.replace(placeholder, value)

        output = BytesIO()
        doc.save(output)
        output.seek(0)

        s3_key = f"generated/{data_instance_id}/{uuid.uuid4()}.docx"
        upload_file(
            output.read(),
            s3_key,
            content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )
        return s3_key

    except ImportError:
        raise RuntimeError(
            "python-docx is required for document rendering. "
            "Install it with: pip install python-docx"
        )
