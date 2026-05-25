from fastapi import FastAPI
from app.routers import auth, schemas, templates, data_instances, documents

app = FastAPI(title="Document Template Builder", version="0.1.0")

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(schemas.router, prefix="/schemas", tags=["schemas"])
app.include_router(templates.router, prefix="/templates", tags=["templates"])
app.include_router(data_instances.router, prefix="/data-instances", tags=["data-instances"])
app.include_router(documents.router, prefix="/documents", tags=["documents"])


@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}
