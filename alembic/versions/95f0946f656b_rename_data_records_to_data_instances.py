"""rename_data_records_to_data_instances

Revision ID: 95f0946f656b
Revises: 6740b3b1af92
Create Date: 2026-05-25 14:50:23.993513

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '95f0946f656b'
down_revision: Union[str, None] = '6740b3b1af92'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.rename_table("data_records", "data_instances")
    op.alter_column("field_values", "data_record_id", new_column_name="data_instance_id")
    op.alter_column("generated_documents", "data_record_id", new_column_name="data_instance_id")
    op.drop_constraint("uq_field_value_record_field", "field_values", type_="unique")
    op.create_unique_constraint("uq_field_value_instance_field", "field_values", ["data_instance_id", "schema_field_id"])


def downgrade() -> None:
    op.drop_constraint("uq_field_value_instance_field", "field_values", type_="unique")
    op.create_unique_constraint("uq_field_value_record_field", "field_values", ["data_record_id", "schema_field_id"])
    op.alter_column("generated_documents", "data_instance_id", new_column_name="data_record_id")
    op.alter_column("field_values", "data_instance_id", new_column_name="data_record_id")
    op.rename_table("data_instances", "data_records")
