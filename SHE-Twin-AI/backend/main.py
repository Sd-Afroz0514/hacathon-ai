import json
from datetime import datetime, timezone
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from database import engine, Base, SessionLocal
from app.core.config import settings
from app.models.user import User
from app.models.health_twin import HealthProfile
from app.models.vital_observation import VitalObservation
from app.models.medical_report import MedicalReport
from app.models.cycle_log import CycleLog
from app.models.family import FamilyMember
from app.models.doctor import Doctor
from app.models.settings import UserSettings
from app.core.security import get_password_hash
from app.routes.doctors import seed_doctors_if_empty

# Routers
from app.routes import (
    auth_router,
    health_twin_router,
    dashboard_router,
    reports_router,
    assistant_router,
    womens_health_router,
    family_router,
    doctors_router,
    settings_router,
    location_router,
    life_stage_router,
    onboarding_router,
    assessment_router,
    confirmed_lab_router,
    care_navigation_router,
    timeline_router
)

def seed_demo_data_if_empty():
    db = SessionLocal()
    try:
        # Check if demo user exists
        demo_user = db.query(User).filter(User.email == "ananya.sharma@example.com").first()
        if not demo_user:
            demo_user = User(
                id="usr_demo_01",
                name="Ananya Sharma",
                email="ananya.sharma@example.com",
                hashed_password=get_password_hash("password123"),
                role="patient",
                is_demo_user=True
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)

            # Health Profile
            twin = HealthProfile(
                id="twin_demo_01",
                user_id=demo_user.id,
                full_name="Ananya Sharma",
                age=26,
                gender="Female",
                blood_group="B+",
                height_cm=165.0,
                weight_kg=58.5,
                bmi=21.5,
                allergies_json=json.dumps(["Dust Mites", "Penicillin (mild rash)"]),
                chronic_conditions_json=json.dumps(["Mild Iron Deficiency Anemia (Under Management)", "PCOS (Mild)"]),
                current_medications_json=json.dumps(["Ferrous Ascorbate 100mg (Daily)", "Vitamin D3 60,000 IU (Weekly)"]),
                emergency_name="Rajesh Sharma",
                emergency_phone="+91 98765 43210",
                emergency_relationship="Father",
                activity_level="Moderately Active",
                sleep_hours=7.5,
                diet_type="Vegetarian",
                water_intake_liters=2.4,
                bp_systolic=118,
                bp_diastolic=78,
                heart_rate_bpm=72,
                glucose_mg_dl=92,
                spo2_pct=99,
                temperature_c=36.6
            )
            db.add(twin)

            # User Settings
            user_settings = UserSettings(user_id=demo_user.id)
            db.add(user_settings)

            # Vitals History
            vitals_samples = [
                {"id": "v_1", "date": "2026-05-10", "systolic": 124, "diastolic": 82, "glucose": 98, "heart_rate": 78, "weight": 60.0, "bmi": 22.0, "spo2": 98, "notes": "Routine checkup"},
                {"id": "v_2", "date": "2026-06-15", "systolic": 122, "diastolic": 80, "glucose": 95, "heart_rate": 75, "weight": 59.5, "bmi": 21.9, "spo2": 99, "notes": "Morning check"},
                {"id": "v_3", "date": "2026-07-20", "systolic": 120, "diastolic": 80, "glucose": 94, "heart_rate": 74, "weight": 59.0, "bmi": 21.7, "spo2": 98, "notes": "Post workout rest"},
                {"id": "v_4", "date": "2026-08-25", "systolic": 119, "diastolic": 79, "glucose": 93, "heart_rate": 73, "weight": 58.8, "bmi": 21.6, "spo2": 99, "notes": "Quarterly review"},
                {"id": "v_5", "date": "2026-09-20", "systolic": 118, "diastolic": 78, "glucose": 91, "heart_rate": 71, "weight": 58.6, "bmi": 21.5, "spo2": 99, "notes": "Fasting measurements"},
                {"id": "v_6", "date": "2026-10-05", "systolic": 118, "diastolic": 78, "glucose": 92, "heart_rate": 72, "weight": 58.5, "bmi": 21.5, "spo2": 99, "notes": "Latest check"}
            ]
            for v in vitals_samples:
                db.add(VitalObservation(user_id=demo_user.id, **v))

            # Medical Reports
            rep1_tests = [
                {"id": "t_1", "testName": "Hemoglobin (Hb)", "category": "Hematology", "value": "11.8", "unit": "g/dL", "referenceRange": "12.0 - 15.5", "status": "low", "explanation": "Slightly below female reference cutoff; improving."},
                {"id": "t_2", "testName": "Total Leukocyte Count (WBC)", "category": "Hematology", "value": "6800", "unit": "cells/cu.mm", "referenceRange": "4000 - 11000", "status": "normal", "explanation": "Within healthy immunological baseline."},
                {"id": "t_3", "testName": "Platelet Count", "category": "Hematology", "value": "2.40 Lakhs", "unit": "/cu.mm", "referenceRange": "1.50 - 4.50 Lakhs", "status": "normal", "explanation": "Normal clotting potential."},
                {"id": "t_4", "testName": "Serum Ferritin", "category": "Iron Study", "value": "22", "unit": "ng/mL", "referenceRange": "20 - 200", "status": "normal", "explanation": "Adequate iron stores recorded."},
                {"id": "t_5", "testName": "Thyroid Stimulating Hormone (TSH)", "category": "Endocrinology", "value": "2.1", "unit": "uIU/mL", "referenceRange": "0.4 - 4.5", "status": "normal", "explanation": "Euthyroid state confirmed."}
            ]
            rep1 = MedicalReport(
                id="rep_01",
                user_id=demo_user.id,
                file_name="CBC_Iron_Panel_Oct2026.pdf",
                file_size_formatted="1.4 MB",
                file_type="pdf",
                report_date="2026-10-05",
                lab_or_hospital_name="Apex Diagnostic Care & Research Center",
                report_category="Complete Blood Count (CBC)",
                status="analyzed",
                doctor_name="Dr. Neha Kulkarni, MD Pathologist",
                extracted_text_preview="APEX DIAGNOSTICS REPORT - PATIENT: Ananya Sharma | AGE: 26/F | HEMOGLOBIN: 11.8 g/dL (Ref: 12.0-15.5) | RBC COUNT: 4.2 mill/uL | FERRITIN: 22 ng/mL (Ref: 20-200) | WBC: 6,800 /uL | PLATELETS: 240,000 /uL | TSH: 2.1 uIU/mL...",
                ai_summary_notes="Sample Fictional Analysis: Mild microcytic anemia showing positive recovery compared to previous 3-month labs. Hemoglobin is near lower normal threshold (11.8 g/dL). Ferritin is in acceptable range (22 ng/mL). Continue dietary iron support.",
                key_insights_json=json.dumps([
                    "Hemoglobin increased from 10.4 g/dL to 11.8 g/dL over 3 months.",
                    "Platelet and Total WBC counts are well within normal reference ranges.",
                    "Thyroid stimulating hormone (TSH 2.1 uIU/mL) is healthy and balanced."
                ]),
                test_results_json=json.dumps(rep1_tests),
                is_demo_report=True
            )
            db.add(rep1)

            # Cycle Logs
            cycle1 = CycleLog(
                id="cyc_01",
                user_id=demo_user.id,
                start_date="2026-09-18",
                end_date="2026-09-23",
                cycle_length_days=29,
                period_length_days=5,
                flow_intensity="Medium",
                symptoms_json=json.dumps(["Mild Cramps (Day 1)", "Bloating", "Fatigue"]),
                mood="Tired",
                notes="Took warm chamomile tea. Felt better by Day 3."
            )
            db.add(cycle1)

            # Family Members
            fam1 = FamilyMember(
                id="fam_01",
                user_id=demo_user.id,
                name="Sunita Sharma",
                relationship_type="Mother",
                age=52,
                gender="Female",
                blood_group="B+",
                allergies_json=json.dumps(["Sulfa drugs"]),
                chronic_conditions_json=json.dumps(["Hypertension (Stage 1, Medicated)", "Type 2 Diabetes (Diet Controlled)"]),
                last_checkup_date="2026-09-10",
                notes="Takes Telmisartan 40mg daily morning. Walks 30 mins every morning.",
                avatar_color="bg-rose-500"
            )
            db.add(fam1)

            db.commit()

        # Seed doctors
        seed_doctors_if_empty(db)

    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables and seed initial demo dataset
    Base.metadata.create_all(bind=engine)
    seed_demo_data_if_empty()
    yield

app = FastAPI(
    title="SHE Twin AI — Healthcare Platform API",
    description="Backend API services for Digital Health Twin, Medical Report Analyzer, AI Health Assistant, Women's & Family Care.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Middleware — supports configured origins, localhost, and all deployed HTTPS/HTTP domains
cors_origins = [o for o in settings.cors_origins_list if o != "*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Sub-Routers under /api
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(health_twin_router, prefix=settings.API_V1_STR)
app.include_router(dashboard_router, prefix=settings.API_V1_STR)
app.include_router(reports_router, prefix=settings.API_V1_STR)
app.include_router(assistant_router, prefix=settings.API_V1_STR)
app.include_router(womens_health_router, prefix=settings.API_V1_STR)
app.include_router(family_router, prefix=settings.API_V1_STR)
app.include_router(doctors_router, prefix=settings.API_V1_STR)
app.include_router(settings_router, prefix=settings.API_V1_STR)

# Additive Feature Routers
app.include_router(location_router, prefix=settings.API_V1_STR)
app.include_router(life_stage_router, prefix=settings.API_V1_STR)
app.include_router(onboarding_router, prefix=settings.API_V1_STR)
app.include_router(assessment_router, prefix=settings.API_V1_STR)
app.include_router(confirmed_lab_router, prefix=settings.API_V1_STR)
app.include_router(care_navigation_router, prefix=settings.API_V1_STR)
app.include_router(timeline_router, prefix=settings.API_V1_STR)

@app.get("/health")
@app.get("/api/health")
def health_check():
    return {"status": "healthy", "database": "connected"}

@app.get("/api")
@app.get("/api/info")
def api_info():
    return {
        "name": "SHE Twin AI Backend API",
        "status": "online",
        "version": "1.0.0",
        "docs": "/docs",
        "time": datetime.now(timezone.utc).isoformat()
    }

# Frontend SPA Direct Application Serving for Deployment
FRONTEND_DIST_DIR = Path(__file__).resolve().parent.parent / "frontend" / "dist"

if FRONTEND_DIST_DIR.exists() and (FRONTEND_DIST_DIR / "index.html").exists():
    assets_dir = FRONTEND_DIST_DIR / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="static_assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Exclude backend API routes and Swagger docs from SPA catch-all
        if (
            full_path.startswith("api/")
            or full_path == "api"
            or full_path in ["docs", "redoc", "openapi.json", "health"]
        ):
            raise HTTPException(status_code=404, detail="Not Found")

        # Serve static file if it exists directly in frontend dist (e.g. favicon.svg)
        target_file = FRONTEND_DIST_DIR / full_path
        if full_path and target_file.is_file():
            return FileResponse(target_file)

        # Serve SPA index.html for root and all client-side application routes
        return FileResponse(FRONTEND_DIST_DIR / "index.html")
else:
    @app.get("/")
    def root():
        return {
            "name": "SHE Twin AI Backend API",
            "status": "online",
            "version": "1.0.0",
            "docs": "/docs",
            "time": datetime.now(timezone.utc).isoformat()
        }

if __name__ == "__main__":
    import os
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    is_prod = os.environ.get("APP_ENV", "development").lower() == "production"
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=not is_prod)

