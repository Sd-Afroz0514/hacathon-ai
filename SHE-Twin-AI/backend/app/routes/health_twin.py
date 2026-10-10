import json
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from app.models.user import User
from app.models.health_twin import HealthProfile
from app.models.vital_observation import VitalObservation
from app.schemas.health_twin import (
    HealthTwinProfileOut,
    HealthTwinProfileUpdate,
    VitalLogCreate,
    VitalLogOut,
    EmergencyContactSchema,
    LifestyleSchema,
    LatestVitalsSchema
)
from app.core.deps import get_current_user

router = APIRouter(prefix="/twin", tags=["Health Twin"])

def format_twin_response(twin: HealthProfile) -> HealthTwinProfileOut:
    return HealthTwinProfileOut(
        id=twin.id,
        userId=twin.user_id,
        fullName=twin.full_name,
        age=twin.age,
        gender=twin.gender,
        bloodGroup=twin.blood_group,
        heightCm=twin.height_cm,
        weightKg=twin.weight_kg,
        bmi=twin.bmi,
        allergies=twin.allergies,
        chronicConditions=twin.chronic_conditions,
        currentMedications=twin.current_medications,
        emergencyContact=EmergencyContactSchema(
            name=twin.emergency_name,
            relationship=twin.emergency_relationship,
            phone=twin.emergency_phone
        ),
        lifestyle=LifestyleSchema(
            activityLevel=twin.activity_level,
            sleepHoursPerDay=twin.sleep_hours,
            dietType=twin.diet_type,
            waterIntakeLiters=twin.water_intake_liters
        ),
        latestVitals=LatestVitalsSchema(
            bloodPressureSystolic=twin.bp_systolic,
            bloodPressureDiastolic=twin.bp_diastolic,
            heartRateBpm=twin.heart_rate_bpm,
            fastingGlucoseMgDl=twin.glucose_mg_dl,
            spo2Percentage=twin.spo2_pct,
            temperatureCelsius=twin.temperature_c,
            recordedAt=twin.vitals_recorded_at.isoformat() if twin.vitals_recorded_at else datetime.now(timezone.utc).isoformat()
        ),
        lastUpdated=twin.updated_at.isoformat() if twin.updated_at else datetime.now(timezone.utc).isoformat()
    )

def vital_to_schema(v: VitalObservation) -> VitalLogOut:
    return VitalLogOut(
        id=v.id,
        date=v.date,
        systolic=v.systolic,
        diastolic=v.diastolic,
        glucose=v.glucose,
        heartRate=v.heart_rate,
        weight=v.weight,
        bmi=v.bmi,
        spo2=v.spo2,
        notes=v.notes
    )

@router.get("/profile", response_model=HealthTwinProfileOut)
def get_health_twin_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    twin = db.query(HealthProfile).filter(HealthProfile.user_id == current_user.id).first()
    if not twin:
        # Create default profile if not exists
        twin = HealthProfile(
            user_id=current_user.id,
            full_name=current_user.name,
            age=26,
            gender="Female",
            blood_group="B+"
        )
        db.add(twin)
        db.commit()
        db.refresh(twin)
    
    return format_twin_response(twin)

@router.put("/profile", response_model=HealthTwinProfileOut)
def update_health_twin_profile(
    updates: HealthTwinProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    twin = db.query(HealthProfile).filter(HealthProfile.user_id == current_user.id).first()
    if not twin:
        twin = HealthProfile(user_id=current_user.id, full_name=current_user.name)
        db.add(twin)

    if updates.fullName is not None:
        twin.full_name = updates.fullName
    if updates.age is not None:
        twin.age = updates.age
    if updates.gender is not None:
        twin.gender = updates.gender
    if updates.bloodGroup is not None:
        twin.blood_group = updates.bloodGroup
    if updates.heightCm is not None:
        twin.height_cm = updates.heightCm
    if updates.weightKg is not None:
        twin.weight_kg = updates.weightKg
    if updates.bmi is not None:
        twin.bmi = updates.bmi
    elif updates.heightCm and updates.weightKg:
        h_m = updates.heightCm / 100.0
        twin.bmi = round(updates.weightKg / (h_m * h_m), 1)

    if updates.allergies is not None:
        twin.allergies = updates.allergies
    if updates.chronicConditions is not None:
        twin.chronic_conditions = updates.chronicConditions
    if updates.currentMedications is not None:
        twin.current_medications = updates.currentMedications

    if updates.emergencyContact is not None:
        twin.emergency_name = updates.emergencyContact.name
        twin.emergency_phone = updates.emergencyContact.phone
        twin.emergency_relationship = updates.emergencyContact.relationship

    if updates.lifestyle is not None:
        twin.activity_level = updates.lifestyle.activityLevel
        twin.sleep_hours = updates.lifestyle.sleepHoursPerDay
        twin.diet_type = updates.lifestyle.dietType
        twin.water_intake_liters = updates.lifestyle.waterIntakeLiters

    twin.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(twin)
    return format_twin_response(twin)

@router.get("/vitals", response_model=List[VitalLogOut])
def get_vitals_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    vitals = db.query(VitalObservation).filter(
        VitalObservation.user_id == current_user.id
    ).order_by(VitalObservation.date.asc()).all()
    
    return [vital_to_schema(v) for v in vitals]

@router.post("/vitals", response_model=VitalLogOut)
def add_vital_log(
    entry: VitalLogCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    vital = VitalObservation(
        user_id=current_user.id,
        date=entry.date,
        systolic=entry.systolic,
        diastolic=entry.diastolic,
        glucose=entry.glucose,
        heart_rate=entry.heartRate,
        weight=entry.weight,
        bmi=entry.bmi,
        spo2=entry.spo2,
        notes=entry.notes
    )
    db.add(vital)

    # Also update HealthProfile cache
    twin = db.query(HealthProfile).filter(HealthProfile.user_id == current_user.id).first()
    if twin:
        twin.bp_systolic = entry.systolic
        twin.bp_diastolic = entry.diastolic
        twin.glucose_mg_dl = entry.glucose
        twin.heart_rate_bpm = entry.heartRate
        twin.weight_kg = entry.weight
        twin.bmi = entry.bmi
        twin.spo2_pct = entry.spo2
        twin.vitals_recorded_at = datetime.now(timezone.utc)
        twin.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(vital)
    return vital_to_schema(vital)

@router.delete("/vitals/{vital_id}")
def delete_vital_log(
    vital_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    vital = db.query(VitalObservation).filter(
        VitalObservation.id == vital_id,
        VitalObservation.user_id == current_user.id
    ).first()
    if not vital:
        raise HTTPException(status_code=404, detail="Vital observation not found.")
    
    db.delete(vital)
    db.commit()
    return {"message": "Vital observation deleted successfully"}

