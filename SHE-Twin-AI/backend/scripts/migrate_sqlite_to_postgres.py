import sys
import os
import sqlite3
from pathlib import Path
from datetime import datetime, timezone

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from sqlalchemy import text, inspect
from app.core.config import settings
from database import engine, Base, SessionLocal
from app.models.user import User
from app.models.health_twin import HealthProfile
from app.models.vital_observation import VitalObservation
from app.models.medical_report import MedicalReport
from app.models.cycle_log import CycleLog
from app.models.family import FamilyMember
from app.models.doctor import Doctor, Appointment
from app.models.settings import UserSettings
from scripts.test_db_connection import mask_connection_string

def migrate_sqlite_to_postgres():
    sqlite_db_path = settings.DATABASE_PATH
    if not sqlite_db_path.exists():
        print(f"[!] SQLite source database not found at {sqlite_db_path}. Nothing to migrate.")
        return False

    print("=" * 80)
    print("SHE TWIN AI — DATA MIGRATION UTILITY (SQLite -> Supabase PostgreSQL)")
    print("=" * 80)
    print(f"Source Database : SQLite ({sqlite_db_path})")
    print(f"Target Database : {mask_connection_string(settings.DATABASE_URL)}")
    print("-" * 80)

    # 1. Ensure target tables exist in PostgreSQL
    print("[1/5] Ensuring target tables exist in PostgreSQL...")
    try:
        Base.metadata.create_all(bind=engine)
        print("  -> PostgreSQL schema verified/created successfully.")
    except Exception as e:
        print(f"  -> [ERROR] Failed to initialize PostgreSQL tables: {e}")
        return False

    # 2. Connect to SQLite
    print("[2/5] Reading data from source SQLite database...")
    sqlite_conn = sqlite3.connect(sqlite_db_path)
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cur = sqlite_conn.cursor()

    pg_db = SessionLocal()

    try:
        # Table list in dependency order
        # 1. Users
        sqlite_cur.execute("SELECT * FROM users")
        user_rows = sqlite_cur.fetchall()
        users_migrated = 0
        for r in user_rows:
            existing = pg_db.query(User).filter(User.id == r["id"]).first()
            if not existing:
                u = User(
                    id=r["id"],
                    name=r["name"],
                    email=r["email"],
                    hashed_password=r["hashed_password"],
                    role=r["role"],
                    is_active=bool(r["is_active"]),
                    is_demo_user=bool(r["is_demo_user"])
                )
                pg_db.add(u)
                users_migrated += 1
        pg_db.commit()
        print(f"  -> Users: {users_migrated} inserted / {len(user_rows)} found in SQLite.")

        # 2. Doctors
        sqlite_cur.execute("SELECT * FROM doctors")
        doc_rows = sqlite_cur.fetchall()
        docs_migrated = 0
        for r in doc_rows:
            existing = pg_db.query(Doctor).filter(Doctor.id == r["id"]).first()
            if not existing:
                d = Doctor(
                    id=r["id"],
                    name=r["name"],
                    title=r["title"],
                    specialty=r["specialty"],
                    experience_years=r["experience_years"],
                    qualification=r["qualification"],
                    clinic_or_hospital=r["clinic_or_hospital"],
                    location=r["location"],
                    rating=r["rating"],
                    review_count=r["review_count"],
                    consultation_fee=r["consultation_fee"],
                    available_days_json=r["available_days_json"],
                    available_time_slot=r["available_time_slot"],
                    phone=r["phone"],
                    email=r["email"],
                    is_demo_listing=bool(r["is_demo_listing"])
                )
                pg_db.add(d)
                docs_migrated += 1
        pg_db.commit()
        print(f"  -> Doctors: {docs_migrated} inserted / {len(doc_rows)} found in SQLite.")

        # 3. Health Profiles
        sqlite_cur.execute("SELECT * FROM health_profiles")
        hp_rows = sqlite_cur.fetchall()
        hp_migrated = 0
        for r in hp_rows:
            existing = pg_db.query(HealthProfile).filter(HealthProfile.id == r["id"]).first()
            if not existing:
                hp = HealthProfile(
                    id=r["id"],
                    user_id=r["user_id"],
                    full_name=r["full_name"],
                    age=r["age"],
                    gender=r["gender"],
                    blood_group=r["blood_group"],
                    height_cm=r["height_cm"],
                    weight_kg=r["weight_kg"],
                    bmi=r["bmi"],
                    allergies_json=r["allergies_json"],
                    chronic_conditions_json=r["chronic_conditions_json"],
                    current_medications_json=r["current_medications_json"],
                    emergency_name=r["emergency_name"],
                    emergency_phone=r["emergency_phone"],
                    emergency_relationship=r["emergency_relationship"],
                    activity_level=r["activity_level"],
                    sleep_hours=r["sleep_hours"],
                    diet_type=r["diet_type"],
                    water_intake_liters=r["water_intake_liters"],
                    bp_systolic=r["bp_systolic"],
                    bp_diastolic=r["bp_diastolic"],
                    heart_rate_bpm=r["heart_rate_bpm"],
                    glucose_mg_dl=r["glucose_mg_dl"],
                    spo2_pct=r["spo2_pct"],
                    temperature_c=r["temperature_c"]
                )
                pg_db.add(hp)
                hp_migrated += 1
        pg_db.commit()
        print(f"  -> Health Profiles: {hp_migrated} inserted / {len(hp_rows)} found in SQLite.")

        # 4. User Settings
        sqlite_cur.execute("SELECT * FROM user_settings")
        us_rows = sqlite_cur.fetchall()
        us_migrated = 0
        for r in us_rows:
            existing = pg_db.query(UserSettings).filter(UserSettings.user_id == r["user_id"]).first()
            if not existing:
                us = UserSettings(
                    user_id=r["user_id"],
                    email_notifications=bool(r["email_notifications"]),
                    sms_notifications=bool(r["sms_notifications"]),
                    menstrual_cycle_reminders=bool(r["menstrual_cycle_reminders"]),
                    medication_reminders=bool(r["medication_reminders"]),
                    data_sharing_for_research=bool(r["data_sharing_for_research"]),
                    two_factor_auth_enabled=bool(r["two_factor_auth_enabled"]),
                    theme=r["theme"],
                    language=r["language"]
                )
                pg_db.add(us)
                us_migrated += 1
        pg_db.commit()
        print(f"  -> User Settings: {us_migrated} inserted / {len(us_rows)} found in SQLite.")

        # 5. Vital Observations
        sqlite_cur.execute("SELECT * FROM vital_observations")
        vo_rows = sqlite_cur.fetchall()
        vo_migrated = 0
        for r in vo_rows:
            existing = pg_db.query(VitalObservation).filter(VitalObservation.id == r["id"]).first()
            if not existing:
                vo = VitalObservation(
                    id=r["id"],
                    user_id=r["user_id"],
                    date=r["date"],
                    systolic=r["systolic"],
                    diastolic=r["diastolic"],
                    glucose=r["glucose"],
                    heart_rate=r["heart_rate"],
                    weight=r["weight"],
                    bmi=r["bmi"],
                    spo2=r["spo2"],
                    notes=r["notes"]
                )
                pg_db.add(vo)
                vo_migrated += 1
        pg_db.commit()
        print(f"  -> Vital Observations: {vo_migrated} inserted / {len(vo_rows)} found in SQLite.")

        # 6. Cycle Logs
        sqlite_cur.execute("SELECT * FROM cycle_logs")
        cl_rows = sqlite_cur.fetchall()
        cl_migrated = 0
        for r in cl_rows:
            existing = pg_db.query(CycleLog).filter(CycleLog.id == r["id"]).first()
            if not existing:
                cl = CycleLog(
                    id=r["id"],
                    user_id=r["user_id"],
                    start_date=r["start_date"],
                    end_date=r["end_date"],
                    cycle_length_days=r["cycle_length_days"],
                    period_length_days=r["period_length_days"],
                    flow_intensity=r["flow_intensity"],
                    symptoms_json=r["symptoms_json"],
                    mood=r["mood"],
                    notes=r["notes"]
                )
                pg_db.add(cl)
                cl_migrated += 1
        pg_db.commit()
        print(f"  -> Cycle Logs: {cl_migrated} inserted / {len(cl_rows)} found in SQLite.")

        # 7. Family Members
        sqlite_cur.execute("SELECT * FROM family_members")
        fm_rows = sqlite_cur.fetchall()
        fm_migrated = 0
        for r in fm_rows:
            existing = pg_db.query(FamilyMember).filter(FamilyMember.id == r["id"]).first()
            if not existing:
                fm = FamilyMember(
                    id=r["id"],
                    user_id=r["user_id"],
                    name=r["name"],
                    relationship_type=r["relationship_type"],
                    age=r["age"],
                    gender=r["gender"],
                    blood_group=r["blood_group"],
                    allergies_json=r["allergies_json"],
                    chronic_conditions_json=r["chronic_conditions_json"],
                    last_checkup_date=r["last_checkup_date"],
                    notes=r["notes"],
                    avatar_color=r["avatar_color"]
                )
                pg_db.add(fm)
                fm_migrated += 1
        pg_db.commit()
        print(f"  -> Family Members: {fm_migrated} inserted / {len(fm_rows)} found in SQLite.")

        # 8. Medical Reports
        sqlite_cur.execute("SELECT * FROM medical_reports")
        mr_rows = sqlite_cur.fetchall()
        mr_migrated = 0
        for r in mr_rows:
            existing = pg_db.query(MedicalReport).filter(MedicalReport.id == r["id"]).first()
            if not existing:
                mr = MedicalReport(
                    id=r["id"],
                    user_id=r["user_id"],
                    file_name=r["file_name"],
                    file_path=r["file_path"],
                    file_size_formatted=r["file_size_formatted"],
                    file_type=r["file_type"],
                    report_date=r["report_date"],
                    lab_or_hospital_name=r["lab_or_hospital_name"],
                    report_category=r["report_category"],
                    status=r["status"],
                    doctor_name=r["doctor_name"],
                    extracted_text_preview=r["extracted_text_preview"],
                    ai_summary_notes=r["ai_summary_notes"],
                    key_insights_json=r["key_insights_json"],
                    test_results_json=r["test_results_json"],
                    is_demo_report=bool(r["is_demo_report"])
                )
                pg_db.add(mr)
                mr_migrated += 1
        pg_db.commit()
        print(f"  -> Medical Reports: {mr_migrated} inserted / {len(mr_rows)} found in SQLite.")

        # 9. Appointments
        sqlite_cur.execute("SELECT * FROM appointments")
        apt_rows = sqlite_cur.fetchall()
        apt_migrated = 0
        for r in apt_rows:
            existing = pg_db.query(Appointment).filter(Appointment.id == r["id"]).first()
            if not existing:
                apt = Appointment(
                    id=r["id"],
                    user_id=r["user_id"],
                    doctor_id=r["doctor_id"],
                    doctor_name=r["doctor_name"],
                    specialty=r["specialty"],
                    patient_name=r["patient_name"],
                    preferred_date=r["preferred_date"],
                    preferred_time=r["preferred_time"],
                    reason_for_visit=r["reason_for_visit"],
                    status=r["status"],
                    is_demo_booking=bool(r["is_demo_booking"])
                )
                pg_db.add(apt)
                apt_migrated += 1
        pg_db.commit()
        print(f"  -> Appointments: {apt_migrated} inserted / {len(apt_rows)} found in SQLite.")

        print("-" * 80)
        print("[SUCCESS] All data from SQLite safely copied to Supabase PostgreSQL!")
        print("Original SQLite database remains intact and preserved.")
        print("=" * 80)
        return True

    except Exception as e:
        pg_db.rollback()
        print(f"[ERROR] Migration failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        pg_db.close()
        sqlite_conn.close()

if __name__ == "__main__":
    success = migrate_sqlite_to_postgres()
    sys.exit(0 if success else 1)
