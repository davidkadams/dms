import re
from typing import List

TOKEN_PATTERN = re.compile(r"\{\{(\w+)\}\}")


def extract_tokens(docx_bytes: bytes) -> List[str]:
    """Return unique token names found in a DOCX file's paragraphs (e.g. 'counterparty_name')."""
    try:
        import docx
        from io import BytesIO

        doc = docx.Document(BytesIO(docx_bytes))
        full_text = "\n".join(p.text for p in doc.paragraphs)
        return sorted(set(TOKEN_PATTERN.findall(full_text)))
    except ImportError:
        raise RuntimeError(
            "python-docx is required for DOCX parsing. "
            "Install it with: pip install python-docx"
        )
