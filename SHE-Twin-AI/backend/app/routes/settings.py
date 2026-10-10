import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from app.models.user import User
from app.models.settings import UserSettings
from app.models.health_twin import HealthProfile
from app.models.vital_observation import VitalObservation
from app.models.medical_report import MedicalReport
from app.models.cycle_log import CycleLog
from app.models.family import FamilyMember
from app.schemas.settings import UserSettingsOut, UserSettingsUpdate
from app.schemas.user import PasswordChangeRequest
from app.core.security import verify_password, get_password_hash
from app.core.deps import get_current_user

router = APIRouter(prefix="/settings", tags=["Settings & Privacy"])

@router.get("", response_model=UserSettingsOut)
def get_user_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    if not settings:
        settings = UserSettings(user_id=current_user.id)
        db.add(settings)
        db.commit()
        db.refresh(settings)

    return UserSettingsOut(
        emailNotifications=settings.email_notifications,
        smsNotifications=settings.sms_notifications,
        menstrualCycleReminders=settings.menstrual_cycle_reminders,
        medicationReminders=settings.medication_reminders,
        dataSharingForResearch=settings.data_sharing_for_research,
        twoFactorAuthEnabled=settings.two_factor_auth_enabled,
        theme=settings.theme,
        language=settings.language
    )

@router.put("", response_model=UserSettingsOut)
def update_user_settings(
    updates: UserSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    if not settings:
        settings = UserSettings(user_id=current_user.id)
        db.add(settings)

    if updates.emailNotifications is not None:
        settings.email_notifications = updates.emailNotifications
    if updates.smsNotifications is not None:
        settings.sms_notifications = updates.smsNotifications
    if updates.menstrualCycleReminders is not None:
        settings.menstrual_cycle_reminders = updates.menstrualCycleReminders
    if updates.medicationReminders is not None:
        settings.medication_reminders = updates.medicationReminders
    if updates.dataSharingForResearch is not None:
        settings.data_sharing_for_research = updates.dataSharingForResearch
    if updates.twoFactorAuthEnabled is not None:
        settings.two_factor_auth_enabled = updates.twoFactorAuthEnabled
    if updates.theme is not None:
        settings.theme = updates.theme
    if updates.language is not None:
        settings.language = updates.language

    db.commit()
    db.refresh(settings)

    return UserSettingsOut(
        emailNotifications=settings.email_notifications,
        smsNotifications=settings.sms_notifications,
        menstrualCycleReminders=settings.menstrual_cycle_reminders,
        medicationReminders=settings.medication_reminders,
        dataSharingForResearch=settings.data_sharing_for_research,
        twoFactorAuthEnabled=settings.two_factor_auth_enabled,
        theme=settings.theme,
        language=settings.language
    )

@router.post("/change-password")
def change_password(
    req: PasswordChangeRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not verify_password(req.currentPassword, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password entered is incorrect."
        )

    if len(req.newPassword) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters."
        )

    current_user.hashed_password = get_password_hash(req.newPassword)
    current_user.updated_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Password changed successfully"}

@router.get("/export-data")
def export_user_data(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    twin = db.query(HealthProfile).filter(HealthProfile.user_id == current_user.id).first()
    vitals = db.query(VitalObservation).filter(VitalObservation.user_id == current_user.id).all()
    reports = db.query(MedicalReport).filter(MedicalReport.user_id == current_user.id).all()
    cycles = db.query(CycleLog).filter(CycleLog.user_id == current_user.id).all()
    family = db.query(FamilyMember).filter(FamilyMember.user_id == current_user.id).all()

    export_payload = {
        "exportDate": datetime.now(timezone.utc).isoformat(),
        "platform": "SHE Twin AI",
        "user": {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "role": current_user.role,
            "createdAt": current_user.created_at.isoformat() if current_user.created_at else ""
        },
        "healthProfile": {
            "fullName": twin.full_name if twin else "",
            "age": twin.age if twin else 0,
            "gender": twin.gender if twin else "",
            "bloodGroup": twin.blood_group if twin else "",
            "heightCm": twin.height_cm if twin else 0,
            "weightKg": twin.weight_kg if twin else 0,
            "bmi": twin.bmi if twin else 0,
            "allergies": twin.allergies if twin else [],
            "chronicConditions": twin.chronic_conditions if twin else [],
            "currentMedications": twin.current_medications if twin else []
        },
        "vitalsHistory": [
            {
                "date": v.date,
                "systolic": v.systolic,
                "diastolic": v.diastolic,
                "glucose": v.glucose,
                "heartRate": v.heart_rate,
                "weight": v.weight,
                "bmi": v.bmi,
                "spo2": v.spo2,
                "notes": v.notes
            }
            for v in vitals
        ],
        "medicalReports": [
            {
                "fileName": r.file_name,
                "reportDate": r.report_date,
                "category": r.report_category,
                "lab": r.lab_or_hospital_name,
                "insights": r.key_insights,
                "testResults": r.test_results
            }
            for r in reports
        ],
        "cycleLogs": [
            {
                "startDate": c.start_date,
                "cycleLength": c.cycle_length_days,
                "periodLength": c.period_length_days,
                "flow": c.flow_intensity,
                "symptoms": c.symptoms,
                "mood": c.mood,
                "notes": c.notes
            }
            for c in cycles
        ],
        "familyProfiles": [
            {
                "name": f.name,
                "relationship": f.relationship_type,
                "age": f.age,
                "gender": f.gender,
                "bloodGroup": f.blood_group,
                "allergies": f.allergies,
                "chronicConditions": f.chronic_conditions
            }
            for f in family
        ]
    }

    return export_payload

@router.delete("/account")
def delete_user_account(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.delete(current_user)
    db.commit()
    return {"message": "Account and all associated health records permanently deleted"}
