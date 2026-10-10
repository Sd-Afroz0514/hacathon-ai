from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from app.models.user import User
from app.models.reminder import HealthReminder
from app.models.assessment import SymptomAssessment, RiskAssessment
from app.models.confirmed_lab import ConfirmedLabResult
from app.models.medical_report import MedicalReport
from app.schemas.reminder import (
    HealthReminderCreate,
    HealthReminderOut
)
from app.core.deps import get_current_user

router = APIRouter(prefix="/twin", tags=["Health Twin Timeline & Reminders"])

@router.get("/timeline")
def get_health_timeline(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Aggregate chronological health events into a single unified timeline."""
    events = []

    # 1. Reports
    reports = db.query(MedicalReport).filter(MedicalReport.user_id == current_user.id).all()
    for rep in reports:
        events.append({
            "id": f"rep_{rep.id}",
            "type": "medical_report",
            "title": f"Report Uploaded: {rep.file_name}",
            "category": rep.report_category,
            "date": rep.report_date or (rep.created_at.strftime('%Y-%m-%d') if rep.created_at else "Recent"),
            "badge": rep.status.capitalize(),
            "badgeColor": "indigo",
            "summary": rep.ai_summary_notes[:140] + "..." if rep.ai_summary_notes and len(rep.ai_summary_notes) > 140 else rep.ai_summary_notes
        })

    # 2. Confirmed Labs
    labs = db.query(ConfirmedLabResult).filter(ConfirmedLabResult.user_id == current_user.id).all()
    for lab in labs:
        events.append({
            "id": f"lab_{lab.id}",
            "type": "lab_result",
            "title": f"Verified Metric: {lab.test_name} ({lab.value} {lab.unit})",
            "category": lab.category,
            "date": lab.test_date,
            "badge": lab.status.upper(),
            "badgeColor": "emerald" if lab.status == "normal" else ("rose" if lab.status in ["high", "critical"] else "amber"),
            "summary": f"Reference: {lab.reference_range or 'N/A'}"
        })

    # 3. Symptom Logs
    symptoms = db.query(SymptomAssessment).filter(SymptomAssessment.user_id == current_user.id).all()
    for sym in symptoms:
        sym_names = [s.get("name", "") for s in sym.symptoms] if sym.symptoms else []
        events.append({
            "id": f"sym_{sym.id}",
            "type": "symptom_log",
            "title": f"Symptom Assessment: {', '.join(sym_names) if sym_names else 'Check-in'}",
            "category": sym.life_stage_mode,
            "date": sym.created_at.strftime('%Y-%m-%d') if sym.created_at else "Recent",
            "badge": "EMERGENCY" if sym.has_emergency_flags else sym.severity,
            "badgeColor": "rose" if sym.has_emergency_flags else ("amber" if sym.severity == "Moderate" else "emerald"),
            "summary": sym.notes or f"Duration: {sym.duration}"
        })

    # 4. Risk Assessments
    risks = db.query(RiskAssessment).filter(RiskAssessment.user_id == current_user.id).all()
    for r in risks:
        events.append({
            "id": f"risk_{r.id}",
            "type": "risk_assessment",
            "title": f"Risk Evaluation: {r.screening_tier} ({r.risk_score:.0f}/100)",
            "category": r.risk_category,
            "date": r.created_at.strftime('%Y-%m-%d') if r.created_at else "Recent",
            "badge": r.screening_tier,
            "badgeColor": "rose" if r.screening_tier == "High Concern" else ("amber" if r.screening_tier == "Medium Concern" else "emerald"),
            "summary": f"Specialist Recommended: {r.suggested_specialty}"
        })

    events.sort(key=lambda x: x["date"], reverse=True)

    return {
        "totalEvents": len(events),
        "events": events
    }

@router.get("/reminders", response_model=List[HealthReminderOut])
def list_reminders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reminders = db.query(HealthReminder).filter(
        HealthReminder.user_id == current_user.id
    ).order_by(HealthReminder.due_date.asc()).all()

    return [
        HealthReminderOut(
            id=r.id,
            userId=r.user_id,
            title=r.title,
            reminderType=r.reminder_type,
            description=r.description,
            dueDate=r.due_date,
            isCompleted=r.is_completed,
            priority=r.priority,
            createdAt=r.created_at.isoformat() if r.created_at else ""
        ) for r in reminders
    ]

@router.post("/reminders", response_model=HealthReminderOut)
def create_reminder(
    req: HealthReminderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rem = HealthReminder(
        user_id=current_user.id,
        title=req.title,
        reminder_type=req.reminderType or "Follow-up",
        description=req.description,
        due_date=req.dueDate,
        priority=req.priority or "Medium",
        is_completed=False
    )
    db.add(rem)
    db.commit()
    db.refresh(rem)

    return HealthReminderOut(
        id=rem.id,
        userId=rem.user_id,
        title=rem.title,
        reminderType=rem.reminder_type,
        description=rem.description,
        dueDate=rem.due_date,
        isCompleted=rem.is_completed,
        priority=rem.priority,
        createdAt=rem.created_at.isoformat() if rem.created_at else ""
    )

@router.patch("/reminders/{reminder_id}/toggle", response_model=HealthReminderOut)
def toggle_reminder_status(
    reminder_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    rem = db.query(HealthReminder).filter(
        HealthReminder.id == reminder_id,
        HealthReminder.user_id == current_user.id
    ).first()
    if not rem:
        raise HTTPException(status_code=404, detail="Reminder not found")

    rem.is_completed = not rem.is_completed
    db.commit()
    db.refresh(rem)

    return HealthReminderOut(
        id=rem.id,
        userId=rem.user_id,
        title=rem.title,
        reminderType=rem.reminder_type,
        description=rem.description,
        dueDate=rem.due_date,
        isCompleted=rem.is_completed,
        priority=rem.priority,
        createdAt=rem.created_at.isoformat() if rem.created_at else ""
    )
