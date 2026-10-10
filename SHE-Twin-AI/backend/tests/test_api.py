import pytest
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base, get_db
from main import app

# Test database
TEST_DB_URL = "sqlite:///./test_she_twin.db"
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
    app.dependency_overrides.pop(get_db, None)
    if os.path.exists("./test_she_twin.db"):
        try:
            os.remove("./test_she_twin.db")
        except Exception:
            pass

client = TestClient(app)


def test_health_endpoints():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

    res_api = client.get("/api/health")
    assert res_api.status_code == 200

def test_auth_flow():
    # 1. Register new user
    reg_payload = {
        "name": "Priya Patel",
        "email": "priya.patel@test.com",
        "password": "securepassword123"
    }
    reg_res = client.post("/api/auth/register", json=reg_payload)
    assert reg_res.status_code == 200
    token_data = reg_res.json()
    assert "token" in token_data
    assert token_data["user"]["email"] == "priya.patel@test.com"

    # 2. Duplicate registration check
    dup_res = client.post("/api/auth/register", json=reg_payload)
    assert dup_res.status_code == 400

    # 3. Login with wrong password
    bad_login = client.post("/api/auth/login", json={"email": "priya.patel@test.com", "password": "wrong"})
    assert bad_login.status_code == 401

    # 4. Login with correct password
    login_res = client.post("/api/auth/login", json={"email": "priya.patel@test.com", "password": "securepassword123"})
    assert login_res.status_code == 200
    token = login_res.json()["token"]

    # 5. Get /me
    headers = {"Authorization": f"Bearer {token}"}
    me_res = client.get("/api/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["name"] == "Priya Patel"

def test_health_twin_and_vitals():
    # Login
    login_res = client.post("/api/auth/login", json={"email": "priya.patel@test.com", "password": "securepassword123"})
    token = login_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Get initial profile
    get_res = client.get("/api/twin/profile", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["fullName"] == "Priya Patel"

    # 2. Update profile
    update_payload = {
        "fullName": "Priya Patel Sharma",
        "age": 28,
        "heightCm": 168.0,
        "weightKg": 60.0,
        "allergies": ["Peanuts"],
        "chronicConditions": ["Mild PCOS"]
    }
    put_res = client.put("/api/twin/profile", json=update_payload, headers=headers)
    assert put_res.status_code == 200
    assert put_res.json()["fullName"] == "Priya Patel Sharma"
    assert put_res.json()["bmi"] == 21.3

    # 3. Add Vital log
    vital_payload = {
        "date": "2026-10-09",
        "systolic": 116,
        "diastolic": 76,
        "glucose": 90,
        "heartRate": 70,
        "weight": 60.0,
        "bmi": 21.3,
        "spo2": 99,
        "notes": "Morning fasting check"
    }
    post_vital = client.post("/api/twin/vitals", json=vital_payload, headers=headers)
    assert post_vital.status_code == 200
    assert post_vital.json()["systolic"] == 116

    # 4. Get vitals list
    get_vitals = client.get("/api/twin/vitals", headers=headers)
    assert get_vitals.status_code == 200
    assert len(get_vitals.json()) >= 1

def test_medical_reports():
    login_res = client.post("/api/auth/login", json={"email": "priya.patel@test.com", "password": "securepassword123"})
    token = login_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Upload mock diagnostic file
    file_content = b"APEX DIAGNOSTICS REPORT - PATIENT: Priya Patel\nHemoglobin: 12.4 g/dL\nTotal Leukocyte Count: 7200 cells/cu.mm\nFasting Blood Sugar: 92 mg/dL\nTSH: 2.3 uIU/mL"
    files = {"file": ("Blood_Test_Report.pdf", file_content, "application/pdf")}
    data = {"category": "Complete Blood Count (CBC)"}

    up_res = client.post("/api/reports/upload", files=files, data=data, headers=headers)
    assert up_res.status_code == 200
    report_data = up_res.json()
    assert report_data["fileName"] == "Blood_Test_Report.pdf"
    assert len(report_data["testResults"]) >= 2

    report_id = report_data["id"]

    # Get reports list
    list_res = client.get("/api/reports", headers=headers)
    assert list_res.status_code == 200
    assert len(list_res.json()) >= 1

    # Get single report
    single_res = client.get(f"/api/reports/{report_id}", headers=headers)
    assert single_res.status_code == 200

def test_assistant_chat():
    login_res = client.post("/api/auth/login", json={"email": "priya.patel@test.com", "password": "securepassword123"})
    token = login_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    chat_payload = {"message": "Can you explain my hemoglobin and iron results?"}
    chat_res = client.post("/api/assistant/chat", json=chat_payload, headers=headers)
    assert chat_res.status_code == 200
    res_json = chat_res.json()
    assert "Hemoglobin" in res_json["content"]
    assert res_json["sender"] == "assistant"

def test_womens_health_and_family():
    login_res = client.post("/api/auth/login", json={"email": "priya.patel@test.com", "password": "securepassword123"})
    token = login_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create cycle log
    cycle_in = {
        "startDate": "2026-09-25",
        "cycleLengthDays": 28,
        "periodLengthDays": 5,
        "flowIntensity": "Medium",
        "symptoms": ["Mild Cramps"],
        "mood": "Calm",
        "notes": "Good hydration"
    }
    cycle_res = client.post("/api/womens-health/cycles", json=cycle_in, headers=headers)
    assert cycle_res.status_code == 200
    cycle_id = cycle_res.json()["id"]

    # 2. Get cycles
    get_cycles = client.get("/api/womens-health/cycles", headers=headers)
    assert get_cycles.status_code == 200
    assert len(get_cycles.json()) >= 1

    # 3. Add family member
    fam_in = {
        "name": "Kavita Patel",
        "relationship": "Mother",
        "age": 54,
        "gender": "Female",
        "bloodGroup": "B+",
        "allergies": ["Sulfa"],
        "chronicConditions": ["Hypertension"],
        "lastCheckupDate": "2026-08-10",
        "notes": "Regular morning walking"
    }
    fam_res = client.post("/api/family/members", json=fam_in, headers=headers)
    assert fam_res.status_code == 200
    member_id = fam_res.json()["id"]

    # 4. Get family members
    get_fam = client.get("/api/family/members", headers=headers)
    assert get_fam.status_code == 200
    assert len(get_fam.json()) >= 1

def test_doctors_and_dashboard():
    login_res = client.post("/api/auth/login", json={"email": "priya.patel@test.com", "password": "securepassword123"})
    token = login_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Doctors list
    doc_res = client.get("/api/doctors", headers=headers)
    assert doc_res.status_code == 200
    assert len(doc_res.json()) >= 1

    # 2. Book appointment
    apt_in = {
        "doctorId": "doc_01",
        "doctorName": "Dr. Radhika Sen",
        "specialty": "Gynecologist & Obstetrician",
        "patientName": "Priya Patel",
        "preferredDate": "2026-10-20",
        "preferredTime": "11:00 AM",
        "reasonForVisit": "Annual routine checkup"
    }
    apt_res = client.post("/api/doctors/appointments", json=apt_in, headers=headers)
    assert apt_res.status_code == 200
    assert apt_res.json()["status"] == "Confirmed"

    # 3. Dashboard summary
    dash_res = client.get("/api/dashboard", headers=headers)
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert dash_data["userFullName"] == "Priya Patel Sharma"
    assert dash_data["totalReports"] >= 1
    assert dash_data["familyCount"] >= 1

def test_settings_and_export():
    login_res = client.post("/api/auth/login", json={"email": "priya.patel@test.com", "password": "securepassword123"})
    token = login_res.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Get settings
    set_res = client.get("/api/settings", headers=headers)
    assert set_res.status_code == 200
    assert set_res.json()["emailNotifications"] is True

    # 2. Update settings
    up_set = client.put("/api/settings", json={"emailNotifications": False, "theme": "dark"}, headers=headers)
    assert up_set.status_code == 200
    assert up_set.json()["emailNotifications"] is False

    # 3. Export data
    exp_res = client.get("/api/settings/export-data", headers=headers)
    assert exp_res.status_code == 200
    assert exp_res.json()["platform"] == "SHE Twin AI"
    assert "healthProfile" in exp_res.json()
