import pytest
import os
import json
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database import Base, get_db
from main import app

TEST_DB_URL = "sqlite:///./test_dynamic_symptoms.db"
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
    if os.path.exists("./test_dynamic_symptoms.db"):
        try:
            os.remove("./test_dynamic_symptoms.db")
        except Exception:
            pass

client = TestClient(app)

@pytest.fixture
def auth_headers():
    reg_payload = {
        "name": "Dynamic Symptom Tester",
        "email": "dynamic_tester@shetwin.ai",
        "password": "Password123!"
    }
    reg_res = client.post("/api/auth/register", json=reg_payload)
    if reg_res.status_code == 200:
        token = reg_res.json()["token"]
    else:
        login_res = client.post("/api/auth/login", json={
            "email": "dynamic_tester@shetwin.ai",
            "password": "Password123!"
        })
        token = login_res.json()["token"]
    return {"Authorization": f"Bearer {token}"}

def test_teen_young_women_mode(auth_headers):
    payload = {
        "lifeStageMode": "Teen / Young Women",
        "symptoms": [
            {"name": "Fatigue or frequent tiredness", "severity": "Mild", "duration": "1-3 days"},
            {"name": "Severe menstrual cramps", "severity": "Moderate", "duration": "1-3 days"},
            {"name": "Acne or skin changes", "severity": "Mild", "duration": "1-2 weeks"}
        ],
        "severity": "Moderate",
        "duration": "1-3 days",
        "notes": json.dumps({
            "mode": "Teen / Young Women",
            "answers": {
                "teenAge": 17,
                "menarcheAge": "13_14",
                "cycleRegularity": "irregular",
                "bleedingDuration": "4_7_days",
                "dailyImpact": "mild"
            }
        })
    }
    resp = client.post("/api/assessments/symptoms", json=payload, headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["lifeStageMode"] == "Teen / Young Women"
    assert data["hasEmergencyFlags"] is False
    assert len(data["symptoms"]) == 3

def test_reproductive_health_mode_pcos_non_diagnostic(auth_headers):
    payload = {
        "lifeStageMode": "Reproductive Health",
        "symptoms": [
            {"name": "Irregular or missed periods", "severity": "Moderate", "duration": "Chronic (> 1 month)"},
            {"name": "Excessive facial or body hair", "severity": "Mild", "duration": "Chronic (> 1 month)"},
            {"name": "Acne or oily skin", "severity": "Mild", "duration": "Chronic (> 1 month)"}
        ],
        "severity": "Moderate",
        "duration": "Chronic (> 1 month)",
        "notes": json.dumps({
            "mode": "Reproductive Health",
            "answers": {
                "lmpTimeframe": "over_3_months",
                "cycleLength": "unpredictable",
                "periodRegularity": "irregular",
                "symptomDuration": "over_6m",
                "diagnosedConditions": "none"
            }
        })
    }
    resp = client.post("/api/assessments/symptoms", json=payload, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["hasEmergencyFlags"] is False

    # Risk evaluation must be non-diagnostic preliminary screening
    risk_resp = client.post("/api/assessments/evaluate-risk", json={
        "lifeStageMode": "Reproductive Health",
        "symptoms": payload["symptoms"]
    }, headers=auth_headers)
    assert risk_resp.status_code == 200
    risk_data = risk_resp.json()
    assert risk_data["isEmergency"] is False
    # Check that preliminary screening disclaimer is explicitly included
    assert any("preliminary screening note" in str(factor).lower() for factor in risk_data["contributingFactors"])
    assert "not replace clinical diagnosis" in risk_data["disclaimer"].lower()

def test_pregnancy_mode_routine_and_red_flag_triggers(auth_headers):
    # 1. Routine first trimester nausea & fatigue: Non-emergency
    routine_payload = {
        "lifeStageMode": "Pregnancy Track",
        "symptoms": [
            {"name": "Nausea or vomiting", "severity": "Mild", "duration": "1-3 days"},
            {"name": "Fatigue or unusual weakness", "severity": "Mild", "duration": "1-3 days"}
        ],
        "severity": "Mild",
        "duration": "1-3 days",
        "notes": json.dumps({
            "mode": "Pregnancy Track",
            "answers": {
                "pregnancyWeeks": 9,
                "firstPregnancy": "yes",
                "antenatalCheckups": "up_to_date",
                "uploadedReport": "yes"
            }
        })
    }
    resp = client.post("/api/assessments/symptoms", json=routine_payload, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["hasEmergencyFlags"] is False

    # 2. Critical red flag: vaginal bleeding in pregnancy
    bleeding_payload = {
        "lifeStageMode": "Pregnancy",
        "symptoms": [
            {"name": "Vaginal bleeding", "severity": "Moderate", "duration": "< 24 hours"}
        ],
        "severity": "Moderate",
        "duration": "< 24 hours"
    }
    resp_bleed = client.post("/api/assessments/symptoms", json=bleeding_payload, headers=auth_headers)
    assert resp_bleed.status_code == 200
    assert resp_bleed.json()["hasEmergencyFlags"] is True
    assert len(resp_bleed.json()["emergencyReasons"]) > 0

    # 3. Critical red flag: fluid leakage
    fluid_payload = {
        "lifeStageMode": "Pregnancy",
        "symptoms": [
            {"name": "Leakage of fluid", "severity": "Severe", "duration": "< 24 hours"}
        ],
        "severity": "Severe"
    }
    resp_fluid = client.post("/api/assessments/symptoms", json=fluid_payload, headers=auth_headers)
    assert resp_fluid.status_code == 200
    assert resp_fluid.json()["hasEmergencyFlags"] is True

    # 4. Critical red flag from questionnaire: reduced fetal movement
    fetal_payload = {
        "lifeStageMode": "Pregnancy",
        "symptoms": [
            {"name": "Back pain", "severity": "Mild", "duration": "1-3 days"}
        ],
        "severity": "Mild",
        "notes": json.dumps({
            "mode": "Pregnancy",
            "answers": {
                "pregnancyWeeks": 32,
                "fetalMovementStatus": "reduced"
            }
        })
    }
    resp_fetal = client.post("/api/assessments/symptoms", json=fetal_payload, headers=auth_headers)
    assert resp_fetal.status_code == 200
    assert resp_fetal.json()["hasEmergencyFlags"] is True

def test_postpartum_mode_recovery_and_crisis_safety(auth_headers):
    # Routine postpartum fatigue
    routine_payload = {
        "lifeStageMode": "Postpartum",
        "symptoms": [
            {"name": "Persistent fatigue", "severity": "Mild", "duration": "1-2 weeks"},
            {"name": "Difficulty breastfeeding", "severity": "Mild", "duration": "1-3 days"}
        ],
        "severity": "Mild",
        "notes": json.dumps({
            "mode": "Postpartum",
            "answers": {
                "postpartumTimeframe": "3_6_weeks",
                "deliveryType": "vaginal",
                "breastfeedingStatus": "exclusive",
                "postpartumCheckup": "yes"
            }
        })
    }
    resp = client.post("/api/assessments/symptoms", json=routine_payload, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["hasEmergencyFlags"] is False

    # Crisis trigger: thoughts of self-harm
    crisis_payload = {
        "lifeStageMode": "Postpartum",
        "symptoms": [
            {"name": "Thoughts of self-harm or harming baby", "severity": "Severe", "duration": "< 24 hours"}
        ],
        "severity": "Severe"
    }
    resp_crisis = client.post("/api/assessments/symptoms", json=crisis_payload, headers=auth_headers)
    assert resp_crisis.status_code == 200
    assert resp_crisis.json()["hasEmergencyFlags"] is True

def test_menopause_mode(auth_headers):
    payload = {
        "lifeStageMode": "Menopause",
        "symptoms": [
            {"name": "Hot flashes", "severity": "Moderate", "duration": "3-6 months"},
            {"name": "Night sweats", "severity": "Moderate", "duration": "3-6 months"},
            {"name": "Vaginal dryness", "severity": "Mild", "duration": "3-6 months"}
        ],
        "severity": "Moderate",
        "notes": json.dumps({
            "mode": "Menopause",
            "answers": {
                "menopauseAge": "51_55",
                "menstrualChanges": "stopped_under_12m",
                "symptomDurationMeno": "6_12m",
                "dailyImpactMeno": "moderate"
            }
        })
    }
    resp = client.post("/api/assessments/symptoms", json=payload, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["hasEmergencyFlags"] is False

def test_my_health_general_and_emergency(auth_headers):
    # Routine fatigue & headache
    payload = {
        "lifeStageMode": "My Health",
        "symptoms": [
            {"name": "Fatigue", "severity": "Mild", "duration": "1-3 days"},
            {"name": "Headache", "severity": "Mild", "duration": "1-3 days"}
        ],
        "severity": "Mild"
    }
    resp = client.post("/api/assessments/symptoms", json=payload, headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["hasEmergencyFlags"] is False

    # Chest pain triggers emergency
    chest_payload = {
        "lifeStageMode": "My Health",
        "symptoms": [
            {"name": "Chest pain", "severity": "Severe", "duration": "< 24 hours"}
        ],
        "severity": "Severe"
    }
    resp_chest = client.post("/api/assessments/symptoms", json=chest_payload, headers=auth_headers)
    assert resp_chest.status_code == 200
    assert resp_chest.json()["hasEmergencyFlags"] is True

def test_family_ally_mode(auth_headers):
    payload = {
        "lifeStageMode": "Family Ally (Pregnancy)",
        "symptoms": [
            {"name": "Back pain", "severity": "Mild", "duration": "1-3 days"}
        ],
        "severity": "Mild",
        "notes": json.dumps({
            "mode": "Family Ally",
            "supportedPersonRelation": "Wife or Partner",
            "supportedPersonMode": "Pregnancy",
            "answers": {
                "pregnancyWeeks": 24,
                "firstPregnancy": "yes"
            }
        })
    }
    resp = client.post("/api/assessments/symptoms", json=payload, headers=auth_headers)
    assert resp.status_code == 200
    assert "Family Ally" in resp.json()["lifeStageMode"]
    assert resp.json()["hasEmergencyFlags"] is False
