# Document Template Builder

Will we get rich from this? Who Knows..

FastAPI + PostgreSQL + S3 service for building, tagging, and rendering document templates.

## Setup

Setup VSCode and connect your github. Clone the repo in and then you get get started. All this shit below you can basically paste into the terminal and it will set up the shit for you.
Also, i will send you the env file codes seperately. These are AWS secretes that only we should have, so they cannot be on a public repo. But I've included an example file of what it looks like. The real env file you can just remove the .example in the file and paste the given codes i give you.

See the below, Cheers!

```bash
# 1. Create and activate a virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 2. Configure environment
cp .env.example .env   # edit with your real values
# DATABASE_URL, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION, S3_BUCKET_NAME, SECRET_KEY

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
