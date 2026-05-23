import boto3
from app.config import settings


def _client():
    return boto3.client(
        "s3",
        aws_access_key_id=settings.aws_access_key_id,
        aws_secret_access_key=settings.aws_secret_access_key,
        region_name=settings.aws_region,
    )


def upload_file(content: bytes, s3_key: str, content_type: str = "application/octet-stream") -> str:
    _client().put_object(
        Bucket=settings.s3_bucket_name,
        Key=s3_key,
        Body=content,
        ContentType=content_type,
    )
    return s3_key


def download_file(s3_key: str) -> bytes:
    response = _client().get_object(Bucket=settings.s3_bucket_name, Key=s3_key)
    return response["Body"].read()


def delete_file(s3_key: str) -> None:
    _client().delete_object(Bucket=settings.s3_bucket_name, Key=s3_key)


def generate_presigned_url(s3_key: str, expires_in: int = 3600) -> str:
    return _client().generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.s3_bucket_name, "Key": s3_key},
        ExpiresIn=expires_in,
    )
