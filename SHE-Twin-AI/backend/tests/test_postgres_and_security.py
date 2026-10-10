import pytest
import os
import uuid
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base, get_db
from app.core.config import Settings
from app.core.security import get_password_hash
from app.models.user import User
from app.models.health_twin import HealthProfile
from app.models.vital_observation import VitalObservation
from app.models.cycle_log import CycleLog
from app.models.family import FamilyMember
from app.models.medical_report import MedicalReport
from main import app

# Isolated test engine
TEST_DB_URL = "sqlite:///./test_security_postgres.db"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture(scope="module", autouse=True)
def setup_security_test_db():
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
    app.dependency_overrides.pop(get_db, None)
    if os.path.exists("./test_security_postgres.db"):
        try:
            os.remove("./test_security_postgres.db")
        except Exception:
            pass

client = TestClient(app)


def test_supabase_uri_adaptation():
    # Test that standard postgresql:// or postgres:// are adapted to postgresql+psycopg://
    s1 = Settings(
        DATABASE_URL="postgresql://postgres.abc:mypassword@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
        DIRECT_URL="postgres://postgres.abc:mypassword@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
    )
    assert s1.get_sqlalchemy_database_uri.startswith("postgresql+psycopg://")
    assert s1.get_sqlalchemy_direct_uri.startswith("postgresql+psycopg://")
    assert "6543" in s1.get_sqlalchemy_database_uri
    assert "5432" in s1.get_sqlalchemy_direct_uri

def test_multi_tenant_isolation_and_scoping():
    # Register User 1
    user1_email = f"user1_{uuid.uuid4().hex[:8]}@example.com"
    r1 = client.post("/api/auth/register", json={"name": "User One", "email": user1_email, "password": "Password123!"})
    assert r1.status_code == 200
    token1 = r1.json()["token"]
    h1 = {"Authorization": f"Bearer {token1}"}

    # Register User 2
    user2_email = f"user2_{uuid.uuid4().hex[:8]}@example.com"
    r2 = client.post("/api/auth/register", json={"name": "User Two", "email": user2_email, "password": "Password123!"})
    assert r2.status_code == 200
    token2 = r2.json()["token"]
    h2 = {"Authorization": f"Bearer {token2}"}

    # 1. User 1 adds a Vital
    vital_res = client.post("/api/twin/vitals", json={
        "date": "2026-10-10",
        "systolic": 120,
        "diastolic": 80,
        "glucose": 95,
        "heartRate": 72,
        "weight": 55.0,
        "bmi": 21.0,
        "spo2": 99,
        "notes": "User 1 private vital"
    }, headers=h1)
    assert vital_res.status_code == 200
    vital1_id = vital_res.json()["id"]

    # User 2 lists vitals -> MUST NOT see User 1's vital
    u2_vitals = client.get("/api/twin/vitals", headers=h2).json()
    assert not any(v["id"] == vital1_id for v in u2_vitals)

    # User 2 tries to delete User 1's vital -> MUST return 404 (or 403)
    u2_del = client.delete(f"/api/twin/vitals/{vital1_id}", headers=h2)
    assert u2_del.status_code == 404

    # 2. User 1 adds a Cycle Log
    cycle_res = client.post("/api/womens-health/cycles", json={
        "startDate": "2026-10-01",
        "cycleLengthDays": 28,
        "periodLengthDays": 5,
        "flowIntensity": "Medium",
        "symptoms": ["Bloating"],
        "mood": "Calm"
    }, headers=h1)
    assert cycle_res.status_code == 200
    cycle1_id = cycle_res.json()["id"]

    # User 2 lists cycles -> MUST NOT see User 1's cycle
    u2_cycles = client.get("/api/womens-health/cycles", headers=h2).json()
    assert not any(c["id"] == cycle1_id for c in u2_cycles)

    # User 2 tries to delete User 1's cycle -> MUST return 404
    u2_del_cyc = client.delete(f"/api/womens-health/cycles/{cycle1_id}", headers=h2)
    assert u2_del_cyc.status_code == 404

    # 3. User 1 adds a Family Member
    fam_res = client.post("/api/family/members", json={
        "name": "User 1 Sister",
        "relationship": "Sister",
        "age": 22,
        "gender": "Female",
        "bloodGroup": "O+"
    }, headers=h1)
    assert fam_res.status_code == 200
    fam1_id = fam_res.json()["id"]

    # User 2 lists family -> MUST NOT see User 1's family member
    u2_fam = client.get("/api/family/members", headers=h2).json()
    assert not any(f["id"] == fam1_id for f in u2_fam)

    # User 2 tries to update or delete User 1's family member -> MUST return 404
    u2_up_fam = client.put(f"/api/family/members/{fam1_id}", json={"name": "Hacked Name"}, headers=h2)
    assert u2_up_fam.status_code == 404
    u2_del_fam = client.delete(f"/api/family/members/{fam1_id}", headers=h2)
    assert u2_del_fam.status_code == 404

    # 4. User 1 deletes own vital -> MUST succeed
    u1_del = client.delete(f"/api/twin/vitals/{vital1_id}", headers=h1)
    assert u1_del.status_code == 200

def test_unauthenticated_requests_rejected():
    # Calling protected endpoints without token must return 401
    assert client.get("/api/auth/me").status_code == 401
    assert client.get("/api/twin/profile").status_code == 401
    assert client.get("/api/dashboard").status_code == 401
    assert client.get("/api/reports").status_code == 401
    assert client.get("/api/womens-health/cycles").status_code == 401
    assert client.get("/api/family/members").status_code == 401
    assert client.get("/api/settings").status_code == 401
