"""Additive feature tables for SHE Twin AI

Revision ID: 0002_additive_features
Revises: 0001_initial_schema
Create Date: 2026-10-10 03:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0002_additive_features'
down_revision: Union[str, None] = '0001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. user_locations
    op.create_table(
        'user_locations',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('city', sa.String(length=100), nullable=False),
        sa.Column('state', sa.String(length=100), nullable=False),
        sa.Column('pincode', sa.String(length=20), nullable=False),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('is_primary', sa.Boolean(), server_default='true', nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True)
    )
    op.create_index(op.f('ix_user_locations_user_id'), 'user_locations', ['user_id'], unique=False)

    # 2. user_life_stages
    op.create_table(
        'user_life_stages',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('current_mode', sa.String(length=50), server_default='My Health', nullable=False),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('metadata_json', sa.Text(), server_default='{}', nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True)
    )
    op.create_index(op.f('ix_user_life_stages_user_id'), 'user_life_stages', ['user_id'], unique=False)

    # 3. onboarding_responses
    op.create_table(
        'onboarding_responses',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('life_stage_mode', sa.String(length=50), nullable=False),
        sa.Column('responses_json', sa.Text(), server_default='{}', nullable=True),
        sa.Column('completed_steps_json', sa.Text(), server_default='[]', nullable=True),
        sa.Column('is_completed', sa.String(length=20), server_default='completed', nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True)
    )
    op.create_index(op.f('ix_onboarding_responses_user_id'), 'onboarding_responses', ['user_id'], unique=False)

    # 4. symptom_assessments
    op.create_table(
        'symptom_assessments',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('life_stage_mode', sa.String(length=50), server_default='My Health', nullable=True),
        sa.Column('symptoms_json', sa.Text(), server_default='[]', nullable=True),
        sa.Column('severity', sa.String(length=20), server_default='Mild', nullable=True),
        sa.Column('duration', sa.String(length=50), server_default='1-3 days', nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('has_emergency_flags', sa.Boolean(), server_default='false', nullable=True),
        sa.Column('emergency_reasons_json', sa.Text(), server_default='[]', nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True)
    )
    op.create_index(op.f('ix_symptom_assessments_user_id'), 'symptom_assessments', ['user_id'], unique=False)

    # 5. risk_assessments
    op.create_table(
        'risk_assessments',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('screening_tier', sa.String(length=30), nullable=False),
        sa.Column('risk_category', sa.String(length=100), server_default='General Preventive Screening', nullable=True),
        sa.Column('risk_score', sa.Float(), server_default='15.0', nullable=True),
        sa.Column('is_emergency', sa.Boolean(), server_default='false', nullable=True),
        sa.Column('emergency_action_recommended', sa.String(length=255), nullable=True),
        sa.Column('contributing_factors_json', sa.Text(), server_default='[]', nullable=True),
        sa.Column('data_points_used_json', sa.Text(), server_default='[]', nullable=True),
        sa.Column('recommended_next_steps_json', sa.Text(), server_default='[]', nullable=True),
        sa.Column('suggested_specialty', sa.String(length=100), server_default='General Physician', nullable=True),
        sa.Column('disclaimer', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True)
    )
    op.create_index(op.f('ix_risk_assessments_user_id'), 'risk_assessments', ['user_id'], unique=False)

    # 6. confirmed_lab_results
    op.create_table(
        'confirmed_lab_results',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('report_id', sa.String(), sa.ForeignKey('medical_reports.id', ondelete='SET NULL'), nullable=True),
        sa.Column('test_name', sa.String(length=150), nullable=False),
        sa.Column('category', sa.String(length=100), server_default='Hematology', nullable=True),
        sa.Column('value', sa.String(length=50), nullable=False),
        sa.Column('numeric_value', sa.Float(), nullable=True),
        sa.Column('unit', sa.String(length=50), nullable=False),
        sa.Column('reference_range', sa.String(length=100), nullable=True),
        sa.Column('status', sa.String(length=30), server_default='normal', nullable=True),
        sa.Column('is_user_confirmed', sa.Boolean(), server_default='true', nullable=True),
        sa.Column('user_notes', sa.Text(), nullable=True),
        sa.Column('test_date', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True)
    )
    op.create_index(op.f('ix_confirmed_lab_results_user_id'), 'confirmed_lab_results', ['user_id'], unique=False)
    op.create_index(op.f('ix_confirmed_lab_results_report_id'), 'confirmed_lab_results', ['report_id'], unique=False)

    # 7. health_reminders
    op.create_table(
        'health_reminders',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('reminder_type', sa.String(length=50), server_default='Follow-up', nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('due_date', sa.String(length=20), nullable=False),
        sa.Column('is_completed', sa.Boolean(), server_default='false', nullable=True),
        sa.Column('priority', sa.String(length=20), server_default='Medium', nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True)
    )
    op.create_index(op.f('ix_health_reminders_user_id'), 'health_reminders', ['user_id'], unique=False)

    # 8. chat_history
    op.create_table(
        'chat_history',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('agent_type', sa.String(length=50), server_default='general', nullable=True),
        sa.Column('user_message', sa.Text(), nullable=False),
        sa.Column('assistant_response', sa.Text(), nullable=False),
        sa.Column('language', sa.String(length=10), server_default='en', nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True)
    )
    op.create_index(op.f('ix_chat_history_user_id'), 'chat_history', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_table('chat_history')
    op.drop_table('health_reminders')
    op.drop_table('confirmed_lab_results')
    op.drop_table('risk_assessments')
    op.drop_table('symptom_assessments')
    op.drop_table('onboarding_responses')
    op.drop_table('user_life_stages')
    op.drop_table('user_locations')
