import json
import re
import anthropic
from app.config import settings


def _client():
    return anthropic.Anthropic(api_key=settings.anthropic_api_key)


def match_schema(document_text: str, schemas: list[dict]) -> dict:
    """
    Given extracted document text and a list of existing schemas,
    ask Claude if the document matches one of them.

    Returns:
        {
            "matched_schema_id": str | None,
            "confidence": int (0-100),
            "reason": str,
            "suggested_fields": [{"name": str, "label": str, "field_type": str, "description": str}]
        }
    """
    if not schemas:
        schema_list = "No existing schemas."
    else:
        lines = []
        for s in schemas:
            field_summary = ", ".join(
                f"{f['name']} ({f['field_type']})" for f in s.get("fields", [])
            )
            lines.append(f"- ID: {s['id']} | Name: {s['name']} | Fields: {field_summary}")
        schema_list = "\n".join(lines)

    prompt = f"""You are a document classification assistant for a document management system.

Existing schemas:
{schema_list}

Document text (first 3000 characters):
{document_text[:3000]}

Task:
1. Determine if this document matches one of the existing schemas above.
2. If it matches, return the schema ID and your confidence (0-100).
3. If it does not match (confidence < 70), suggest a list of fields that should be extracted from this document type.

Return ONLY valid JSON in this exact format:
{{
  "matched_schema_id": "<schema_id or null>",
  "confidence": <0-100>,
  "reason": "<one sentence explanation>",
  "suggested_fields": [
    {{"name": "<snake_case>", "label": "<Human Label>", "field_type": "<string|number|date>", "description": "<what this field means in context>"}}
  ]
}}

If a schema matches with confidence >= 70, suggested_fields can be an empty array.
If no schema matches, matched_schema_id must be null."""

    message = _client().messages.create(
        model="claude-opus-4-5",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    return json.loads(raw)


def extract_fields(document_text: str, fields: list[dict]) -> dict:
    """
    Given document text and a list of schema fields, extract values for each field.

    fields: [{"name": str, "label": str, "field_type": str, "description": str, "extraction_hint": str}]

    Returns: {"field_name": "extracted value or null", ...}
    """
    field_lines = []
    for f in fields:
        parts = [f"- {f['name']} ({f['field_type']}): {f.get('description') or f['label']}"]
        if f.get("extraction_hint"):
            parts.append(f"  Hint: {f['extraction_hint']}")
        field_lines.append("\n".join(parts))
    field_descriptions = "\n".join(field_lines)

    prompt = f"""You are a data extraction assistant. Extract specific field values from the document below.

Fields to extract:
{field_descriptions}

Document text:
{document_text}

Instructions:
- Extract the value for each field from the document.
- If a field cannot be found, use null.
- For number fields, return only the numeric value (no currency symbols or units).
- For date fields, return in YYYY-MM-DD format if possible.
- Be precise — extract the actual value, not a description of where it is.

Return ONLY valid JSON mapping field names to extracted values:
{{
  "field_name": "value or null",
  ...
}}"""

    message = _client().messages.create(
        model="claude-opus-4-5",
        max_tokens=2048,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = message.content[0].text.strip()
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)
    return json.loads(raw)
