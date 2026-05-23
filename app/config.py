from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    aws_access_key_id: str
    aws_secret_access_key: str
    aws_region: str = "us-east-1"
    s3_bucket_name: str
    secret_key: str

    model_config = {"env_file": ".env"}


settings = Settings()
