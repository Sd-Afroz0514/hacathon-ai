"""Initial PostgreSQL schema for SHE Twin AI

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-10-10 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '0001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users
    op.create_table(
        'users',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=150), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('role', sa.String(length=20), server_default='patient', nullable=True),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=True),
        sa.Column('is_demo_user', sa.Boolean(), server_default='false', nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True)
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # 2. doctors
    op.create_table(
        'doctors',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('title', sa.String(length=100), nullable=False),
        sa.Column('specialty', sa.String(length=100), nullable=False),
        sa.Column('experience_years', sa.Integer(), server_default='10', nullable=True),
        sa.Column('qualification', sa.String(length=200), nullable=False),
        sa.Column('clinic_or_hospital', sa.String(length=200), nullable=False),
        sa.Column('location', sa.String(length=200), nullable=False),
        sa.Column('rating', sa.Float(), server_default='4.9', nullable=True),
        sa.Column('review_count', sa.Integer(), server_default='100', nullable=True),
        sa.Column('consultation_fee', sa.String(length=50), server_default='₹800', nullable=True),
        sa.Column('available_days_json', sa.Text(), nullable=True),
        sa.Column('available_time_slot', sa.String(length=100), server_default='10:00 AM - 02:00 PM', nullable=True),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('email', sa.String(length=100), nullable=True),
        sa.Column('is_demo_listing', sa.Boolean(), server_default='true', nullable=True)
    )

    # 3. health_profiles
    op.create_table(
        'health_profiles',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False),
        sa.Column('full_name', sa.String(length=100), nullable=False),
        sa.Column('age', sa.Integer(), server_default='26', nullable=True),
        sa.Column('gender', sa.String(length=20), server_default='Female', nullable=True),
        sa.Column('blood_group', sa.String(length=10), server_default='B+', nullable=True),
        sa.Column('height_cm', sa.Float(), server_default='165.0', nullable=True),
        sa.Column('weight_kg', sa.Float(), server_default='58.5', nullable=True),
        sa.Column('bmi', sa.Float(), server_default='21.5', nullable=True),
        sa.Column('allergies_json', sa.Text(), server_default='[]', nullable=True),
        sa.Column('chronic_conditions_json', sa.Text(), server_default='[]', nullable=True),
        sa.Column('current_medications_json', sa.Text(), server_default='[]', nullable=True),
        sa.Column('emergency_name', sa.String(length=100), server_default='Rajesh Sharma', nullable=True),
        sa.Column('emergency_phone', sa.String(length=50), server_default='+91 98765 43210', nullable=True),
        sa.Column('emergency_relationship', sa.String(length=50), server_default='Father', nullable=True),
        sa.Column('activity_level', sa.String(length=50), server_default='Moderately Active', nullable=True),
        sa.Column('sleep_hours', sa.Float(), server_default='7.5', nullable=True),
        sa.Column('diet_type', sa.String(length=50), server_default='Vegetarian', nullable=True),
        sa.Column('water_intake_liters', sa.Float(), server_default='2.4', nullable=True),
        sa.Column('bp_systolic', sa.Integer(), server_default='118', nullable=True),
        sa.Column('bp_diastolic', sa.Integer(), server_default='78', nullable=True),
        sa.Column('heart_rate_bpm', sa.Integer(), server_default='72', nullable=True),
        sa.Column('glucose_mg_dl', sa.Integer(), server_default='92', nullable=True),
        sa.Column('spo2_pct', sa.Integer(), server_default='99', nullable=True),
        sa.Column('temperature_c', sa.Float(), server_default='36.6', nullable=True),
        sa.Column('vitals_recorded_at', sa.DateTime(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True)
    )
    op.create_index(op.f('ix_health_profiles_user_id'), 'health_profiles', ['user_id'], unique=True)

    # 4. user_settings
    op.create_table(
        'user_settings',
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('email_notifications', sa.Boolean(), server_default='true', nullable=True),
        sa.Column('sms_notifications', sa.Boolean(), server_default='false', nullable=True),
        sa.Column('menstrual_cycle_reminders', sa.Boolean(), server_default='true', nullable=True),
        sa.Column('medication_reminders', sa.Boolean(), server_default='true', nullable=True),
        sa.Column('data_sharing_for_research', sa.Boolean(), server_default='false', nullable=True),
        sa.Column('two_factor_auth_enabled', sa.Boolean(), server_default='false', nullable=True),
        sa.Column('theme', sa.String(length=20), server_default='light', nullable=True),
        sa.Column('language', sa.String(length=50), server_default='English (US)', nullable=True)
    )
    op.create_index(op.f('ix_user_settings_user_id'), 'user_settings', ['user_id'], unique=True)

    # 5. vital_observations
    op.create_table(
        'vital_observations',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('date', sa.String(length=20), nullable=False),
        sa.Column('systolic', sa.Integer(), nullable=False),
        sa.Column('diastolic', sa.Integer(), nullable=False),
        sa.Column('glucose', sa.Integer(), nullable=False),
        sa.Column('heart_rate', sa.Integer(), nullable=False),
        sa.Column('weight', sa.Float(), nullable=False),
        sa.Column('bmi', sa.Float(), nullable=False),
        sa.Column('spo2', sa.Integer(), server_default='99', nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True)
    )
    op.create_index(op.f('ix_vital_observations_user_id'), 'vital_observations', ['user_id'], unique=False)

    # 6. cycle_logs
    op.create_table(
        'cycle_logs',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('start_date', sa.String(length=20), nullable=False),
        sa.Column('end_date', sa.String(length=20), nullable=True),
        sa.Column('cycle_length_days', sa.Integer(), server_default='28', nullable=True),
        sa.Column('period_length_days', sa.Integer(), server_default='5', nullable=True),
        sa.Column('flow_intensity', sa.String(length=30), server_default='Medium', nullable=True),
        sa.Column('symptoms_json', sa.Text(), server_default='[]', nullable=True),
        sa.Column('mood', sa.String(length=50), server_default='Calm', nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True)
    )
    op.create_index(op.f('ix_cycle_logs_user_id'), 'cycle_logs', ['user_id'], unique=False)

    # 7. family_members
    op.create_table(
        'family_members',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('relationship_type', sa.String(length=50), nullable=False),
        sa.Column('age', sa.Integer(), nullable=False),
        sa.Column('gender', sa.String(length=20), server_default='Female', nullable=True),
        sa.Column('blood_group', sa.String(length=10), server_default='B+', nullable=True),
        sa.Column('allergies_json', sa.Text(), server_default='[]', nullable=True),
        sa.Column('chronic_conditions_json', sa.Text(), server_default='[]', nullable=True),
        sa.Column('last_checkup_date', sa.String(length=20), nullable=True),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('avatar_color', sa.String(length=50), server_default='bg-teal-600', nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True)
    )
    op.create_index(op.f('ix_family_members_user_id'), 'family_members', ['user_id'], unique=False)

    # 8. medical_reports
    op.create_table(
        'medical_reports',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('file_name', sa.String(length=255), nullable=False),
        sa.Column('file_path', sa.String(length=500), nullable=True),
        sa.Column('file_size_formatted', sa.String(length=50), server_default='1.0 MB', nullable=True),
        sa.Column('file_type', sa.String(length=20), server_default='pdf', nullable=True),
        sa.Column('report_date', sa.String(length=20), nullable=False),
        sa.Column('lab_or_hospital_name', sa.String(length=200), server_default='Diagnostic Healthcare Lab', nullable=True),
        sa.Column('report_category', sa.String(length=100), server_default='Complete Blood Count (CBC)', nullable=True),
        sa.Column('status', sa.String(length=50), server_default='analyzed', nullable=True),
        sa.Column('doctor_name', sa.String(length=100), nullable=True),
        sa.Column('extracted_text_preview', sa.Text(), nullable=True),
        sa.Column('ai_summary_notes', sa.Text(), nullable=True),
        sa.Column('key_insights_json', sa.Text(), server_default='[]', nullable=True),
        sa.Column('test_results_json', sa.Text(), server_default='[]', nullable=True),
        sa.Column('is_demo_report', sa.Boolean(), server_default='false', nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True)
    )
    op.create_index(op.f('ix_medical_reports_user_id'), 'medical_reports', ['user_id'], unique=False)

    # 9. appointments
    op.create_table(
        'appointments',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('doctor_id', sa.String(), nullable=False),
        sa.Column('doctor_name', sa.String(length=100), nullable=False),
        sa.Column('specialty', sa.String(length=100), nullable=False),
        sa.Column('patient_name', sa.String(length=100), nullable=False),
        sa.Column('preferred_date', sa.String(length=20), nullable=False),
        sa.Column('preferred_time', sa.String(length=50), nullable=False),
        sa.Column('reason_for_visit', sa.Text(), nullable=False),
        sa.Column('status', sa.String(length=30), server_default='Confirmed', nullable=True),
        sa.Column('booked_at', sa.DateTime(), nullable=True),
        sa.Column('is_demo_booking', sa.Boolean(), server_default='false', nullable=True)
    )
    op.create_index(op.f('ix_appointments_user_id'), 'appointments', ['user_id'], unique=False)


def downgrade() -> None:
    op.drop_table('appointments')
    op.drop_table('medical_reports')
    op.drop_table('family_members')
    op.drop_table('cycle_logs')
    op.drop_table('vital_observations')
    op.drop_table('user_settings')
    op.drop_table('health_profiles')
    op.drop_table('doctors')
    op.drop_table('users')
