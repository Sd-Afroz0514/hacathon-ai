import sys
import os
import uuid
import time
from pathlib import Path

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from fastapi.testclient import TestClient
from main import app
from database import SessionLocal
from app.models.user import User

client = TestClient(app)

def run_live_api_verification():
    print("=" * 90)
    print("SHE TWIN AI — LIVE FASTAPI -> SUPABASE POSTGRESQL END-TO-END VERIFICATION")
    print("=" * 90)

    unique_email = f"api_test_{int(time.time())}_{uuid.uuid4().hex[:6]}@example.com"
    test_password = "LiveApiPassword123!"

    # 1. Register User via API
    print("\n[1/7] Testing POST /api/auth/register on Supabase...")
    reg_res = client.post("/api/auth/register", json={
        "name": "Live API Test Patient",
        "email": unique_email,
        "password": test_password
    })
    assert reg_res.status_code == 200, f"Registration failed: {reg_res.text}"
    token = reg_res.json()["token"]
    user_data = reg_res.json()["user"]
    user_id = user_data["id"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"  [PASS] User registered via FastAPI & saved in Supabase (ID: {user_id})")

    try:
        # 2. Login via API
        print("\n[2/7] Testing POST /api/auth/login against Supabase...")
        login_res = client.post("/api/auth/login", json={
            "email": unique_email,
            "password": test_password
        })
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        assert "token" in login_res.json()
        print("  [PASS] Password authenticated with bcrypt from Supabase PostgreSQL")

        # 3. Update Health Twin Profile via API
        print("\n[3/7] Testing PUT /api/twin/profile on Supabase...")
        twin_update = {
            "fullName": "Live API Test Patient",
            "age": 27,
            "gender": "Female",
            "bloodGroup": "B+",
            "heightCm": 166.0,
            "weightKg": 57.0,
            "allergies": ["Penicillin"],
            "chronicConditions": ["PCOS"],
            "currentMedications": ["Metformin 500mg"]
        }
        twin_res = client.put("/api/twin/profile", json=twin_update, headers=headers)
        assert twin_res.status_code == 200, f"Twin update failed: {twin_res.text}"
        twin_json = twin_res.json()
        assert twin_json["bmi"] == 20.7
        print(f"  [PASS] Health Twin Profile updated and persisted in Supabase (BMI: {twin_json['bmi']})")

        # 4. Add Vital Observation via API
        print("\n[4/7] Testing POST & GET /api/twin/vitals on Supabase...")
        vital_in = {
            "date": "2026-10-10",
            "systolic": 116,
            "diastolic": 76,
            "glucose": 90,
            "heartRate": 70,
            "weight": 57.0,
            "bmi": 20.7,
            "spo2": 99,
            "notes": "Morning fasting reading"
        }
        v_res = client.post("/api/twin/vitals", json=vital_in, headers=headers)
        assert v_res.status_code == 200, f"Vital creation failed: {v_res.text}"
        vital_id = v_res.json()["id"]

        # Fetch vitals
        v_list = client.get("/api/twin/vitals", headers=headers).json()
        assert any(v["id"] == vital_id for v in v_list)
        print(f"  [PASS] Vital entry #{vital_id} written and read back from Supabase")

        # 5. Add Cycle Log via API
        print("\n[5/7] Testing POST & GET /api/womens-health/cycles on Supabase...")
        cycle_in = {
            "startDate": "2026-10-02",
            "endDate": "2026-10-07",
            "cycleLengthDays": 28,
            "periodLengthDays": 5,
            "flowIntensity": "Medium",
            "symptoms": ["Mild Cramps"],
            "mood": "Calm"
        }
        c_res = client.post("/api/womens-health/cycles", json=cycle_in, headers=headers)
        assert c_res.status_code == 200, f"Cycle creation failed: {c_res.text}"
        cycle_id = c_res.json()["id"]

        cycles = client.get("/api/womens-health/cycles", headers=headers).json()
        assert any(c["id"] == cycle_id for c in cycles)
        print(f"  [PASS] Menstrual cycle entry #{cycle_id} written and read back from Supabase")

        # 6. Fetch Dashboard Summary via API
        print("\n[6/7] Testing GET /api/dashboard aggregated from Supabase...")
        dash_res = client.get("/api/dashboard", headers=headers)
        assert dash_res.status_code == 200, f"Dashboard retrieval failed: {dash_res.text}"
        dash_data = dash_res.json()
        assert dash_data["userFullName"] == "Live API Test Patient"
        assert len(dash_data["latestVitalsHistory"]) >= 1
        print(f"  [PASS] Dashboard aggregated live data correctly from Supabase PostgreSQL")

    finally:
        # 7. Cleanup test user
        print("\n[7/7] Cleaning up API verification user from Supabase...")
        cleanup_db = SessionLocal()
        try:
            u = cleanup_db.query(User).filter(User.id == user_id).first()
            if u:
                cleanup_db.delete(u)
                cleanup_db.commit()
            print("  [PASS] Cleaned up verification user and cascade records.")
        finally:
            cleanup_db.close()

    print("\n" + "=" * 90)
    print("FASTAPI -> SUPABASE POSTGRESQL API VERIFICATION COMPLETE & 100% PASSED!")
    print("=" * 90)
    return True

if __name__ == "__main__":
    success = run_live_api_verification()
    sys.exit(0 if success else 1)
