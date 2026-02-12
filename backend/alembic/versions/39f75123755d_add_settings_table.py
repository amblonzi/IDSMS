"""add_settings_table

Revision ID: 39f75123755d
Revises: 9c873cfcb3dd
Create Date: 2026-02-09 10:04:34.515382

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision: str = '39f75123755d'
down_revision: Union[str, Sequence[str], None] = '9c873cfcb3dd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Create settings table
    op.create_table(
        'settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('school_name', sa.String(length=100), nullable=False),
        sa.Column('school_tagline', sa.String(length=200), nullable=False),
        sa.Column('contact_email', sa.String(length=100), nullable=True),
        sa.Column('contact_phone', sa.String(length=20), nullable=True),
        sa.Column('address', sa.String(length=500), nullable=True),
        sa.Column('primary_color', sa.String(length=7), nullable=False),
        sa.Column('logo_url', sa.String(length=500), nullable=True),
        sa.Column('timezone', sa.String(length=50), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.Column('updated_by', UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(['updated_by'], ['user.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Insert default settings (singleton row with id=1)
    op.execute("""
        INSERT INTO settings (
            id, school_name, school_tagline, contact_email, contact_phone,
            address, primary_color, logo_url, timezone, currency, updated_at
        ) VALUES (
            1, 'IDSMS', 'Inphora Driving School Management System', NULL, NULL,
            NULL, '#3b82f6', NULL, 'Africa/Nairobi', 'KES', CURRENT_TIMESTAMP
        )
    """)


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table('settings')
