from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from app.models.user import User
from app.models.health_twin import HealthProfile
from app.models.vital_observation import VitalObservation
from app.models.medical_report import MedicalReport
from app.models.cycle_log import CycleLog
from app.models.family import FamilyMember
from app.schemas.dashboard import DashboardSummaryOut
from app.schemas.medical_report import MedicalReportOut, LabTestItemSchema
from app.schemas.cycle_log import CycleLogOut
from app.schemas.family import FamilyMemberOut
from app.routes.health_twin import format_twin_response, vital_to_schema
from app.core.deps import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("", response_model=DashboardSummaryOut)
def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    twin = db.query(HealthProfile).filter(HealthProfile.user_id == current_user.id).first()
    twin_out = format_twin_response(twin) if twin else None
    user_full_name = twin.full_name if (twin and twin.full_name) else current_user.name

    # Vitals history (last 10)
    vitals = db.query(VitalObservation).filter(
        VitalObservation.user_id == current_user.id
    ).order_by(VitalObservation.date.asc()).limit(10).all()
    vitals_out = [vital_to_schema(v) for v in vitals]

    # Reports
    total_reports = db.query(MedicalReport).filter(MedicalReport.user_id == current_user.id).count()
    recent_reports = db.query(MedicalReport).filter(
        MedicalReport.user_id == current_user.id
    ).order_by(MedicalReport.created_at.desc()).limit(3).all()
    
    reports_out = []
    for r in recent_reports:
        test_items = [LabTestItemSchema(**t) for t in r.test_results]
        reports_out.append(
            MedicalReportOut(
                id=r.id,
                userId=r.user_id,
                fileName=r.file_name,
                fileSizeFormatted=r.file_size_formatted,
                fileType=r.file_type,
                uploadedAt=r.created_at.isoformat() if r.created_at else "",
                reportDate=r.report_date,
                labOrHospitalName=r.lab_or_hospital_name,
                reportCategory=r.report_category,
                status=r.status,
                doctorName=r.doctor_name,
                extractedTextPreview=r.extracted_text_preview,
                aiSummaryNotes=r.ai_summary_notes,
                keyInsights=r.key_insights,
                testResults=test_items,
                isDemoReport=r.is_demo_report
            )
        )

    # Latest cycle log
    latest_cycle = db.query(CycleLog).filter(
        CycleLog.user_id == current_user.id
    ).order_by(CycleLog.start_date.desc()).first()
    cycle_out = None
    if latest_cycle:
        cycle_out = CycleLogOut(
            id=latest_cycle.id,
            startDate=latest_cycle.start_date,
            endDate=latest_cycle.end_date,
            cycleLengthDays=latest_cycle.cycle_length_days,
            periodLengthDays=latest_cycle.period_length_days,
            flowIntensity=latest_cycle.flow_intensity,
            symptoms=latest_cycle.symptoms,
            mood=latest_cycle.mood,
            notes=latest_cycle.notes
        )

    # Family profiles
    family_count = db.query(FamilyMember).filter(FamilyMember.user_id == current_user.id).count()
    recent_family = db.query(FamilyMember).filter(
        FamilyMember.user_id == current_user.id
    ).order_by(FamilyMember.created_at.desc()).limit(4).all()
    
    family_out = [
        FamilyMemberOut(
            id=f.id,
            primaryUserId=f.user_id,
            name=f.name,
            relationship=f.relationship_type,
            age=f.age,
            gender=f.gender,
            bloodGroup=f.blood_group,
            allergies=f.allergies,
            chronicConditions=f.chronic_conditions,
            lastCheckupDate=f.last_checkup_date,
            notes=f.notes,
            avatarColor=f.avatar_color
        )
        for f in recent_family
    ]

    return DashboardSummaryOut(
        userFullName=user_full_name,
        healthTwin=twin_out,
        latestVitalsHistory=vitals_out,
        totalReports=total_reports,
        recentReports=reports_out,
        latestCycleLog=cycle_out,
        familyCount=family_count,
        recentFamilyMembers=family_out
    )
