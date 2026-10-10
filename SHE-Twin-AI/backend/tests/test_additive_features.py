import pytest
import os
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base, get_db
from main import app

# Test database
TEST_DB_URL = "sqlite:///./test_she_twin_additive.db"
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
    if os.path.exists("./test_she_twin_additive.db"):
        try:
            os.remove("./test_she_twin_additive.db")
        except Exception:
            pass

client = TestClient(app)

@pytest.fixture
def auth_headers():
    reg_payload = {
        "name": "Dr. Kavita Reddy",
        "email": "kavita.reddy@test.com",
        "password": "Password123!"
    }
    reg_res = client.post("/api/auth/register", json=reg_payload)
    if reg_res.status_code == 200:
        token = reg_res.json()["token"]
    else:
        login_res = client.post("/api/auth/login", json={
            "email": "kavita.reddy@test.com",
            "password": "Password123!"
        })
        token = login_res.json()["token"]
    return {"Authorization": f"Bearer {token}"}

def test_location_api(auth_headers):
    payload = {
        "city": "Bengaluru",
        "state": "Karnataka",
        "pincode": "560001",
        "latitude": 12.9716,
        "longitude": 77.5946
    }
    resp = client.put("/api/location", json=payload, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["city"] == "Bengaluru"
    assert data["state"] == "Karnataka"
    assert data["pincode"] == "560001"

    resp2 = client.get("/api/location", headers=auth_headers)
    assert resp2.status_code == 200
    assert resp2.json()["city"] == "Bengaluru"

def test_life_stage_api(auth_headers):
    resp = client.put("/api/lifestage", json={
        "mode": "Pregnancy",
        "notes": "2nd trimester care track",
        "metadata": {"trimester": 2, "gestational_week": 18}
    }, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["currentMode"] == "Pregnancy"

    resp2 = client.get("/api/lifestage", headers=auth_headers)
    assert resp2.status_code == 200
    assert resp2.json()["currentMode"] == "Pregnancy"

def test_adaptive_onboarding_api(auth_headers):
    resp = client.get("/api/onboarding/questions?life_stage=Pregnancy", headers=auth_headers)
    assert resp.status_code == 200
    questions = resp.json()
    assert len(questions) >= 3
    assert any("trimester" in q["title"].lower() for q in questions)

    submit_payload = {
        "lifeStageMode": "Pregnancy",
        "responses": {
            "q_preg_1": "trim_2",
            "q_preg_2": "consistent",
            "q_preg_3": ["none"]
        },
        "completedSteps": ["step_1", "step_2", "step_3"]
    }
    resp2 = client.post("/api/onboarding/submit", json=submit_payload, headers=auth_headers)
    assert resp2.status_code == 200
    assert resp2.json()["isCompleted"] == "completed"

def test_symptom_assessment_and_red_flag_triage(auth_headers):
    routine_payload = {
        "lifeStageMode": "Pregnancy",
        "symptoms": [
            {"name": "Mild morning nausea", "severity": "Mild", "duration": "1-3 days"}
        ],
        "severity": "Mild",
        "duration": "1-3 days",
        "notes": "Normal morning sickness"
    }
    resp = client.post("/api/assessments/symptoms", json=routine_payload, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["hasEmergencyFlags"] is False

    emergency_payload = {
        "lifeStageMode": "Pregnancy",
        "symptoms": [
            {"name": "Heavy vaginal bleeding in pregnancy", "severity": "Severe", "duration": "<2 hours"}
        ],
        "severity": "Severe",
        "duration": "<2 hours",
        "notes": "Urgent pain and bleeding"
    }
    resp_emg = client.post("/api/assessments/symptoms", json=emergency_payload, headers=auth_headers)
    assert resp_emg.status_code == 200
    data_emg = resp_emg.json()
    assert data_emg["hasEmergencyFlags"] is True
    assert len(data_emg["emergencyReasons"]) > 0

def test_confirmed_lab_results_workflow(auth_headers):
    lab_batch = {
        "testDate": "2026-10-10",
        "items": [
            {
                "testName": "Hemoglobin (Hb)",
                "category": "Hematology",
                "value": "11.2",
                "numericValue": 11.2,
                "unit": "g/dL",
                "referenceRange": "12.0 - 15.5",
                "status": "low",
                "userNotes": "Verified from blood test printout"
            },
            {
                "testName": "Serum Ferritin",
                "category": "Iron Study",
                "value": "18",
                "numericValue": 18.0,
                "unit": "ng/mL",
                "referenceRange": "20 - 200",
                "status": "low"
            }
        ]
    }
    resp = client.post("/api/labs/confirm", json=lab_batch, headers=auth_headers)
    assert resp.status_code == 200
    saved = resp.json()
    assert len(saved) == 2
    assert saved[0]["testName"] == "Hemoglobin (Hb)"
    assert saved[0]["isUserConfirmed"] is True

    resp2 = client.get("/api/labs/confirmed", headers=auth_headers)
    assert resp2.status_code == 200
    all_labs = resp2.json()
    assert any(l["testName"] == "Hemoglobin (Hb)" for l in all_labs)

def test_deterministic_risk_engine(auth_headers):
    eval_req = {
        "lifeStageMode": "Pregnancy",
        "symptoms": [
            {"name": "Fatigue and weakness", "severity": "Moderate", "duration": "1-2 weeks"}
        ]
    }
    resp = client.post("/api/assessments/evaluate-risk", json=eval_req, headers=auth_headers)
    assert resp.status_code == 200
    risk = resp.json()
    assert "screeningTier" in risk
    assert risk["riskScore"] >= 0.0
    assert "suggestedSpecialty" in risk
    assert "disclaimer" in risk

    resp2 = client.get("/api/assessments/latest-risk", headers=auth_headers)
    assert resp2.status_code == 200
    assert resp2.json()["screeningTier"] == risk["screeningTier"]

def test_care_navigation_directory(auth_headers):
    resp = client.get("/api/doctors/care-navigation?city_filter=Bengaluru", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "matched_providers" in data
    assert len(data["matched_providers"]) > 0
    assert "appointment_prep_checklist" in data
    assert len(data["appointment_prep_checklist"]) >= 3

def test_timeline_and_reminders(auth_headers):
    rem_payload = {
        "title": "Quarterly Iron & Ferritin Checkup",
        "reminderType": "Lab Test",
        "dueDate": "2026-11-15",
        "priority": "High"
    }
    resp_rem = client.post("/api/twin/reminders", json=rem_payload, headers=auth_headers)
    assert resp_rem.status_code == 200
    rem_data = resp_rem.json()
    assert rem_data["title"] == "Quarterly Iron & Ferritin Checkup"
    rem_id = rem_data["id"]

    resp_toggle = client.patch(f"/api/twin/reminders/{rem_id}/toggle", headers=auth_headers)
    assert resp_toggle.status_code == 200
    assert resp_toggle.json()["isCompleted"] is True

    resp_time = client.get("/api/twin/timeline", headers=auth_headers)
    assert resp_time.status_code == 200
    timeline_data = resp_time.json()
    assert "events" in timeline_data
    assert timeline_data["totalEvents"] > 0

def test_multilingual_assistant(auth_headers):
    resp_te = client.post("/api/assistant/chat", json={
        "message": "నాకు రక్తహీనత (Anemia) ఉంది, ఆహార సలహాలు ఇవ్వండి",
        "language": "te"
    }, headers=auth_headers)
    assert resp_te.status_code == 200
    assert resp_te.json()["language"] == "te"

    resp_hi = client.post("/api/assistant/chat", json={
        "message": "गंभीर सिरदर्द और थकान के लिए क्या उपाय करें?",
        "language": "hi"
    }, headers=auth_headers)
    assert resp_hi.status_code == 200
    assert resp_hi.json()["language"] == "hi"
