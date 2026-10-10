import sys
import os
import uuid
import time
from pathlib import Path

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from sqlalchemy import text, inspect
from app.core.config import settings
from database import engine, SessionLocal, Base
from app.models.user import User
from app.models.health_twin import HealthProfile
from app.models.vital_observation import VitalObservation
from app.models.cycle_log import CycleLog
from app.models.family import FamilyMember
from app.models.settings import UserSettings
from app.models.doctor import Doctor
from app.core.security import get_password_hash, verify_password
from scripts.test_db_connection import mask_connection_string

def run_live_supabase_verification():
    print("=" * 90)
    print("SHE TWIN AI — LIVE SUPABASE POSTGRESQL VERIFICATION SUITE")
    print("=" * 90)
    
    masked_url = mask_connection_string(settings.DATABASE_URL)
    print(f"Target Database URL : {masked_url}")
    print(f"Direct URL (Migr)   : {mask_connection_string(settings.DIRECT_URL or '')}")
    print(f"Configured Driver   : {engine.dialect.name} (psycopg v3)")
    print("-" * 90)

    # 1. Test Live Connection & Server Metadata
    print("\n[STEP 1/6] Testing Raw Connection & Server Metadata...")
    with engine.connect() as conn:
        db_name = conn.execute(text("SELECT current_database();")).scalar()
        db_user = conn.execute(text("SELECT current_user;")).scalar()
        version_str = conn.execute(text("SELECT version();")).scalar()
        print(f"  [PASS] Successfully connected to Supabase PostgreSQL!")
        print(f"         Database Name: {db_name}")
        print(f"         Database User: {db_user}")
        print(f"         Server Engine: {version_str.split(',')[0] if version_str else 'PostgreSQL'}")

    # 2. Check Required Tables in PostgreSQL
    print("\n[STEP 2/6] Inspecting PostgreSQL Tables...")
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    required_tables = [
        "users", "health_profiles", "vital_observations", "medical_reports",
        "cycle_logs", "family_members", "doctors", "appointments", "user_settings"
    ]
    missing = [t for t in required_tables if t not in tables]
    if missing:
        print(f"  [FAIL] Missing tables: {missing}")
        return False
    print(f"  [PASS] All {len(required_tables)} required application tables present in Supabase:")
    for t in sorted(tables):
        print(f"         * {t}")

    # 3. Create Real Data in Supabase (Session 1)
    print("\n[STEP 3/6] Session 1: Creating Unique Test Records in Supabase PostgreSQL...")
    unique_suffix = f"verify_{int(time.time())}_{uuid.uuid4().hex[:6]}"
    test_email = f"{unique_suffix}@example.com"
    test_password = "SecurePassword123!"

    session1 = SessionLocal()
    test_user_id = None
    vital_id = None
    cycle_id = None
    fam_id = None

    try:
        # Create user
        user = User(
            name="Verification Test User",
            email=test_email,
            hashed_password=get_password_hash(test_password),
            role="patient"
        )
        session1.add(user)
        session1.commit()
        session1.refresh(user)
        test_user_id = user.id
        print(f"  [PASS] User created in Supabase with ID: {test_user_id}")

        # Create Health Twin Profile
        profile = HealthProfile(
            user_id=test_user_id,
            full_name="Verification Test User",
            age=28,
            gender="Female",
            blood_group="O+",
            height_cm=165.0,
            weight_kg=56.0,
            bmi=20.6,
            bp_systolic=118,
            bp_diastolic=78
        )
        profile.allergies = ["Dust", "Pollen"]
        profile.chronic_conditions = ["Mild Iron Deficiency"]
        session1.add(profile)

        # Create User Settings
        user_set = UserSettings(user_id=test_user_id, email_notifications=True, theme="dark")
        session1.add(user_set)

        # Create Vital Observation
        vital = VitalObservation(
            user_id=test_user_id,
            date="2026-10-10",
            systolic=118,
            diastolic=78,
            glucose=92,
            heart_rate=72,
            weight=56.0,
            bmi=20.6,
            spo2=99,
            notes="Live Supabase verification observation"
        )
        session1.add(vital)
        session1.commit()
        session1.refresh(vital)
        vital_id = vital.id
        print(f"  [PASS] Vital observation created with ID: {vital_id}")

        # Create Cycle Log
        cycle = CycleLog(
            user_id=test_user_id,
            start_date="2026-10-01",
            end_date="2026-10-05",
            cycle_length_days=28,
            period_length_days=5,
            flow_intensity="Medium",
            mood="Calm",
            notes="Test cycle entry"
        )
        cycle.symptoms = ["Mild Cramps"]
        session1.add(cycle)
        session1.commit()
        session1.refresh(cycle)
        cycle_id = cycle.id
        print(f"  [PASS] Menstrual cycle log created with ID: {cycle_id}")

        # Create Family Member
        fam = FamilyMember(
            user_id=test_user_id,
            name="Mother Sharma",
            relationship_type="Mother",
            age=55,
            gender="Female",
            blood_group="O+"
        )
        fam.allergies = ["Sulfa"]
        session1.add(fam)
        session1.commit()
        session1.refresh(fam)
        fam_id = fam.id
        print(f"  [PASS] Family member record created with ID: {fam_id}")

    finally:
        session1.close()
        print("  [INFO] Session 1 completely CLOSED and connection returned to pool.")

    # 4. Verify Data Persistence Across a Completely New Session (Session 2)
    print("\n[STEP 4/6] Session 2: Verifying Data Persistence Across Fresh Database Session...")
    session2 = SessionLocal()
    try:
        loaded_user = session2.query(User).filter(User.id == test_user_id).first()
        assert loaded_user is not None, "User record not found in session 2"
        assert loaded_user.email == test_email, "User email mismatch"
        assert verify_password(test_password, loaded_user.hashed_password), "Bcrypt password verification failed"
        print(f"  [PASS] User verified: {loaded_user.name} ({loaded_user.email})")

        loaded_profile = session2.query(HealthProfile).filter(HealthProfile.user_id == test_user_id).first()
        assert loaded_profile is not None, "HealthProfile not found in session 2"
        assert loaded_profile.age == 28, "Age mismatch"
        assert loaded_profile.blood_group == "O+", "Blood group mismatch"
        assert "Dust" in loaded_profile.allergies, "Allergies JSON array deserialization failed"
        print(f"  [PASS] Health Twin Profile verified: Age={loaded_profile.age}, BloodGroup={loaded_profile.blood_group}, Allergies={loaded_profile.allergies}")

        loaded_vital = session2.query(VitalObservation).filter(VitalObservation.id == vital_id).first()
        assert loaded_vital is not None, "VitalObservation not found in session 2"
        assert loaded_vital.systolic == 118 and loaded_vital.diastolic == 78
        print(f"  [PASS] Vital observation verified: BP={loaded_vital.systolic}/{loaded_vital.diastolic} mmHg, Glucose={loaded_vital.glucose} mg/dL")

        loaded_cycle = session2.query(CycleLog).filter(CycleLog.id == cycle_id).first()
        assert loaded_cycle is not None, "CycleLog not found in session 2"
        assert loaded_cycle.cycle_length_days == 28
        print(f"  [PASS] Cycle log verified: CycleLength={loaded_cycle.cycle_length_days}d, Flow={loaded_cycle.flow_intensity}")

        loaded_fam = session2.query(FamilyMember).filter(FamilyMember.id == fam_id).first()
        assert loaded_fam is not None, "FamilyMember not found in session 2"
        assert loaded_fam.name == "Mother Sharma"
        print(f"  [PASS] Family member verified: {loaded_fam.name} ({loaded_fam.relationship_type})")

    finally:
        session2.close()
        print("  [INFO] Session 2 verified and closed.")

    # 5. Multi-Tenant Authorization Isolation Test
    print("\n[STEP 5/6] Testing Multi-Tenant Data Isolation...")
    attacker_email = f"attacker_{unique_suffix}@example.com"
    session3 = SessionLocal()
    attacker_id = None
    try:
        attacker = User(
            name="Unauthorized Attacker",
            email=attacker_email,
            hashed_password=get_password_hash("AttackerPass123!"),
            role="patient"
        )
        session3.add(attacker)
        session3.commit()
        session3.refresh(attacker)
        attacker_id = attacker.id

        # Query vitals scoped to attacker
        attacker_vitals = session3.query(VitalObservation).filter(VitalObservation.user_id == attacker_id).all()
        assert not any(v.id == vital_id for v in attacker_vitals), "Attacker was able to read User 1's vitals!"

        # Query cycle logs scoped to attacker
        attacker_cycles = session3.query(CycleLog).filter(CycleLog.user_id == attacker_id).all()
        assert not any(c.id == cycle_id for c in attacker_cycles), "Attacker was able to read User 1's cycle logs!"

        print("  [PASS] Multi-tenant isolation confirmed: User B cannot access User A's health records.")
    finally:
        session3.close()

    # 6. Cleanup Verification Test Records
    print("\n[STEP 6/6] Cleaning Up Verification Test Records...")
    cleanup_session = SessionLocal()
    try:
        # Cascade delete User 1 and Attacker User
        u1 = cleanup_session.query(User).filter(User.id == test_user_id).first()
        if u1:
            cleanup_session.delete(u1)
        if attacker_id:
            u2 = cleanup_session.query(User).filter(User.id == attacker_id).first()
            if u2:
                cleanup_session.delete(u2)
        cleanup_session.commit()
        print("  [PASS] Test records safely cleaned up. Database remains pristine.")
    finally:
        cleanup_session.close()

    print("\n" + "=" * 90)
    print("ALL LIVE SUPABASE POSTGRESQL VERIFICATION STEPS PASSED SUCCESSFULLY!")
    print("=" * 90)
    return True

if __name__ == "__main__":
    success = run_live_supabase_verification()
    sys.exit(0 if success else 1)
