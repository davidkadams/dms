# Document Template Builder

FastAPI + PostgreSQL + S3 service for building, tagging, and rendering document templates.

## Setup

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Configure environment
cp .env .env.local   # edit with your real values
# DATABASE_URL, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET_NAME

# 3. Create the database
createdb template_builder

# 4. Run migrations
alembic upgrade head

# 5. Start the server
uvicorn app.main:app --reload
```

Swagger UI: http://localhost:8000/docs

## Migrations

```bash
# Generate a new migration after model changes
alembic revision --autogenerate -m "describe change"

# Apply
alembic upgrade head

# Rollback one step
alembic downgrade -1
```

## Authentication placeholder

Routes that write data require an `X-User-ID` header (a valid user UUID). Create a user first via `POST /auth/users`, then pass its `id` as the header. Replace with JWT middleware when adding real auth.

## Optional: DOCX rendering

To use `POST /documents/generate` and token extraction, install python-docx:

```bash
pip install python-docx
```

## Project structure

```
app/
  models/          SQLAlchemy ORM (8 tables)
  routers/         FastAPI route handlers
  schemas_pydantic/ Pydantic request/response models
  services/
    s3.py          upload / download / presigned URLs
    template_parser.py   extract {{tokens}} from DOCX
    document_renderer.py merge data record into template
alembic/           migrations
```
