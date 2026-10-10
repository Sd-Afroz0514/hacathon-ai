import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from app.models.user import User
from app.models.assessment import SymptomAssessment, RiskAssessment
from app.models.confirmed_lab import ConfirmedLabResult
from app.models.health_twin import HealthProfile
from app.models.life_stage import UserLifeStage
from app.schemas.assessment import (
    SymptomItem,
    SymptomAssessmentCreate,
    SymptomAssessmentOut,
    RiskAssessmentOut,
    RiskEvaluationRequest
)
from app.core.deps import get_current_user
from app.services.risk_engine import calculate_deterministic_risk

router = APIRouter(prefix="/assessments", tags=["Symptom & Risk Assessments"])

@router.post("/symptoms", response_model=SymptomAssessmentOut)
def record_symptom_assessment(
    req: SymptomAssessmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    emergency_flags = []
    for sym in req.symptoms:
        name_lower = sym.name.lower()
        if any(red in name_lower for red in [
            "chest pain", "severe shortness of breath", "difficulty breathing",
            "vision loss", "blurred vision", "sudden severe headache", "fainting",
            "heavy vaginal bleeding", "vaginal bleeding", "leakage of fluid", "fluid leakage",
            "severe abdominal pain", "reduced or changed fetal movement", "reduced fetal movement",
            "severe or persistent vomiting", "sudden swelling", "pain or redness around c-section",
            "self-harm", "harming baby", "high fever with stiff neck", "persistent uterine contractions"
        ]):
            emergency_flags.append(f"Red-Flag Symptom: {sym.name} (Severity: {sym.severity})")

    # Check questionnaire notes for red-flag answers
    if req.notes:
        try:
            parsed_notes = json.loads(req.notes)
            if isinstance(parsed_notes, dict):
                answers = parsed_notes.get("answers", {})
                fetal_status = answers.get("fetalMovementStatus")
                if fetal_status in ["reduced", "none_today"]:
                    emergency_flags.append("Red-Flag Sign: Reduced or absent fetal movement reported in antenatal questionnaire")
        except Exception:
            pass

    has_emergency = len(emergency_flags) > 0 or req.severity == "Severe"

    symp_record = SymptomAssessment(
        user_id=current_user.id,
        life_stage_mode=req.lifeStageMode or "My Health",
        symptoms_json=json.dumps([s.model_dump() for s in req.symptoms]),
        severity=req.severity or "Mild",
        duration=req.duration or "1-3 days",
        notes=req.notes,
        has_emergency_flags=has_emergency,
        emergency_reasons_json=json.dumps(emergency_flags)
    )
    db.add(symp_record)
    db.commit()
    db.refresh(symp_record)

    symptom_items = [SymptomItem(**s) for s in symp_record.symptoms]

    return SymptomAssessmentOut(
        id=symp_record.id,
        userId=symp_record.user_id,
        lifeStageMode=symp_record.life_stage_mode,
        symptoms=symptom_items,
        severity=symp_record.severity,
        duration=symp_record.duration,
        notes=symp_record.notes,
        hasEmergencyFlags=symp_record.has_emergency_flags,
        emergencyReasons=symp_record.emergency_reasons,
        createdAt=symp_record.created_at.isoformat() if symp_record.created_at else ""
    )

@router.post("/evaluate-risk", response_model=RiskAssessmentOut)
def evaluate_risk(
    req: RiskEvaluationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    stage_rec = db.query(UserLifeStage).filter(UserLifeStage.user_id == current_user.id).first()
    active_stage = req.lifeStageMode or (stage_rec.current_mode if stage_rec else "My Health")

    # Fetch confirmed labs
    labs_query = db.query(ConfirmedLabResult).filter(ConfirmedLabResult.user_id == current_user.id).all()
    confirmed_labs_data = [
        {
            "test_name": lab.test_name,
            "value": lab.value,
            "numeric_value": lab.numeric_value,
            "unit": lab.unit,
            "reference_range": lab.reference_range,
            "status": lab.status
        } for lab in labs_query
    ]

    # Fetch HealthProfile vitals
    twin = db.query(HealthProfile).filter(HealthProfile.user_id == current_user.id).first()
    vitals_dict = None
    profile_dict = {}
    if twin:
        profile_dict = {
            "age": twin.age,
            "gender": twin.gender,
            "blood_group": twin.blood_group,
            "bmi": twin.bmi
        }
        vitals_dict = {
            "systolic": twin.bp_systolic,
            "diastolic": twin.bp_diastolic,
            "glucose": twin.glucose_mg_dl,
            "heart_rate": twin.heart_rate_bpm,
            "spo2": twin.spo2_pct
        }

    # Extract symptoms
    symptoms_list = [s.model_dump() for s in req.symptoms] if req.symptoms else []

    eval_res = calculate_deterministic_risk(
        profile_data=profile_dict,
        vitals_data=vitals_dict,
        symptoms=symptoms_list,
        confirmed_labs=confirmed_labs_data,
        life_stage_mode=active_stage
    )

    risk_record = RiskAssessment(
        user_id=current_user.id,
        screening_tier=eval_res["screeningTier"],
        risk_category=eval_res["riskCategory"],
        risk_score=float(eval_res["riskScore"]),
        is_emergency=eval_res["isEmergency"],
        emergency_action_recommended=eval_res.get("emergencyActionRecommended"),
        contributing_factors_json=json.dumps(eval_res["contributingFactors"]),
        data_points_used_json=json.dumps(eval_res["dataPointsUsed"]),
        recommended_next_steps_json=json.dumps(eval_res["recommendedNextSteps"]),
        suggested_specialty=eval_res["suggestedSpecialty"],
        disclaimer=eval_res["disclaimer"]
    )
    db.add(risk_record)
    db.commit()
    db.refresh(risk_record)

    return RiskAssessmentOut(
        id=risk_record.id,
        userId=risk_record.user_id,
        screeningTier=risk_record.screening_tier,
        riskCategory=risk_record.risk_category,
        riskScore=risk_record.risk_score,
        isEmergency=risk_record.is_emergency,
        emergencyActionRecommended=risk_record.emergency_action_recommended,
        contributingFactors=risk_record.contributing_factors,
        dataPointsUsed=risk_record.data_points_used,
        recommendedNextSteps=risk_record.recommended_next_steps,
        suggestedSpecialty=risk_record.suggested_specialty,
        disclaimer=risk_record.disclaimer,
        createdAt=risk_record.created_at.isoformat() if risk_record.created_at else ""
    )

@router.get("/latest-risk", response_model=Optional[RiskAssessmentOut])
def get_latest_risk(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    risk = db.query(RiskAssessment).filter(
        RiskAssessment.user_id == current_user.id
    ).order_by(RiskAssessment.created_at.desc()).first()

    if not risk:
        return None

    return RiskAssessmentOut(
        id=risk.id,
        userId=risk.user_id,
        screeningTier=risk.screening_tier,
        riskCategory=risk.risk_category,
        riskScore=risk.risk_score,
        isEmergency=risk.is_emergency,
        emergencyActionRecommended=risk.emergency_action_recommended,
        contributingFactors=risk.contributing_factors,
        dataPointsUsed=risk.data_points_used,
        recommendedNextSteps=risk.recommended_next_steps,
        suggestedSpecialty=risk.suggested_specialty,
        disclaimer=risk.disclaimer,
        createdAt=risk.created_at.isoformat() if risk.created_at else ""
    )
