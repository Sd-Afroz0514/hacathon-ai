import json
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from app.models.user import User
from app.models.onboarding import OnboardingResponse
from app.models.life_stage import UserLifeStage
from app.schemas.onboarding import (
    OnboardingQuestion,
    OnboardingQuestionOption,
    OnboardingSubmitRequest,
    OnboardingOut
)
from app.core.deps import get_current_user

router = APIRouter(prefix="/onboarding", tags=["Smart Adaptive Onboarding"])

STAGE_QUESTIONS_DATA: Dict[str, List[Dict[str, Any]]] = {
    "Teen / Young Women": [
        {
            "id": "q_teen_1",
            "title": "What is your typical cycle length?",
            "description": "Counting from first day of one period to the first day of the next",
            "type": "select",
            "category": "Cycle Health",
            "options": [
                {"label": "Less than 21 days (Frequent)", "value": "under_21"},
                {"label": "21 to 35 days (Regular)", "value": "21_35"},
                {"label": "More than 35 days (Infrequent)", "value": "over_35"},
                {"label": "Irregular / Unpredictable", "value": "irregular"}
            ]
        },
        {
            "id": "q_teen_2",
            "title": "Do you experience severe cramps or pain during periods?",
            "type": "select",
            "category": "Pain & Comfort",
            "options": [
                {"label": "None or Mild (Manageable)", "value": "mild"},
                {"label": "Moderate (Disrupts school/work)", "value": "moderate"},
                {"label": "Severe (Requires bed rest / strong painkillers)", "value": "severe"}
            ]
        },
        {
            "id": "q_teen_3",
            "title": "Have you noticed any skin or hair changes?",
            "type": "multiselect",
            "category": "Hormonal Symptoms",
            "options": [
                {"label": "Persistent facial acne", "value": "acne"},
                {"label": "Excessive facial or body hair growth", "value": "hirsutism"},
                {"label": "Scalp hair thinning", "value": "hair_fall"},
                {"label": "None of these", "value": "none"}
            ]
        }
    ],
    "Reproductive Health": [
        {
            "id": "q_rep_1",
            "title": "What is your primary reproductive health goal?",
            "type": "select",
            "category": "Goals",
            "options": [
                {"label": "Optimizing fertility & Trying to conceive", "value": "ttc"},
                {"label": "Cycle & Ovulation tracking", "value": "tracking"},
                {"label": "Managing PCOS / Hormonal balance", "value": "pcos_management"},
                {"label": "General preventive health", "value": "preventive"}
            ]
        },
        {
            "id": "q_rep_2",
            "title": "Have you been diagnosed with any hormonal or metabolic condition?",
            "type": "multiselect",
            "category": "Clinical History",
            "options": [
                {"label": "Polycystic Ovary Syndrome (PCOS/PCOD)", "value": "pcos"},
                {"label": "Thyroid Imbalance (Hypo/Hyperthyroidism)", "value": "thyroid"},
                {"label": "Iron Deficiency Anemia", "value": "anemia"},
                {"label": "Endometriosis or Fibroids", "value": "endometriosis"},
                {"label": "None diagnosed", "value": "none"}
            ]
        },
        {
            "id": "q_rep_3",
            "title": "How would you describe your typical daily energy and fatigue levels?",
            "type": "select",
            "category": "Daily Vitality",
            "options": [
                {"label": "Good, energetic throughout the day", "value": "high"},
                {"label": "Moderate, occasional afternoon dips", "value": "moderate"},
                {"label": "Constant fatigue, waking up tired", "value": "fatigue"}
            ]
        }
    ],
    "Pregnancy": [
        {
            "id": "q_preg_1",
            "title": "Which stage or trimester are you currently in?",
            "type": "select",
            "category": "Trimester Phase",
            "options": [
                {"label": "1st Trimester (Weeks 1 - 12)", "value": "trim_1"},
                {"label": "2nd Trimester (Weeks 13 - 27)", "value": "trim_2"},
                {"label": "3rd Trimester (Weeks 28+)", "value": "trim_3"},
                {"label": "Post-term / Due date approaching", "value": "due_soon"}
            ]
        },
        {
            "id": "q_preg_2",
            "title": "Are you taking regular prenatal supplements?",
            "type": "select",
            "category": "Prenatal Care",
            "options": [
                {"label": "Yes, Folic Acid + Iron + Calcium daily", "value": "consistent"},
                {"label": "Sometimes forget or irregular", "value": "irregular"},
                {"label": "Not started yet / Need guidance", "value": "not_started"}
            ]
        },
        {
            "id": "q_preg_3",
            "title": "Any maternal health risk factors flagged by your doctor?",
            "type": "multiselect",
            "category": "Risk Factors",
            "options": [
                {"label": "Gestational Diabetes (GDM)", "value": "gdm"},
                {"label": "Elevated Blood Pressure / Preeclampsia risk", "value": "preeclampsia_risk"},
                {"label": "Low Hemoglobin / Anemia", "value": "anemia"},
                {"label": "None - healthy pregnancy", "value": "none"}
            ]
        }
    ],
    "Postpartum": [
        {
            "id": "q_post_1",
            "title": "How many weeks/months postpartum are you?",
            "type": "select",
            "category": "Recovery Phase",
            "options": [
                {"label": "0 to 6 weeks (Early recovery)", "value": "early_0_6w"},
                {"label": "6 weeks to 6 months", "value": "6w_6m"},
                {"label": "6 to 12 months", "value": "6m_12m"},
                {"label": "Over 1 year", "value": "over_1y"}
            ]
        },
        {
            "id": "q_post_2",
            "title": "How has your emotional well-being and mood been?",
            "type": "select",
            "category": "Mental Wellbeing",
            "options": [
                {"label": "Well-supported and stable mood", "value": "good"},
                {"label": "Mild baby blues / occasional anxiety", "value": "mild_blues"},
                {"label": "Feeling constantly overwhelmed, exhausted, or anxious", "value": "overwhelmed"},
                {"label": "Persistent low mood for >2 weeks", "value": "low_mood"}
            ]
        }
    ],
    "Menopause": [
        {
            "id": "q_meno_1",
            "title": "What is the status of your menstrual cycles?",
            "type": "select",
            "category": "Menopause Stage",
            "options": [
                {"label": "Perimenopause: Cycles irregular / skipping months", "value": "peri"},
                {"label": "Menopause: Periods stopped for over 12 months", "value": "meno_reached"},
                {"label": "Postmenopause: >2 years since last period", "value": "post_meno"}
            ]
        },
        {
            "id": "q_meno_2",
            "title": "Which symptoms are most prominent?",
            "type": "multiselect",
            "category": "Vasomotor & Bone Health",
            "options": [
                {"label": "Hot flashes / night sweats", "value": "hot_flashes"},
                {"label": "Sleep disruptions / insomnia", "value": "insomnia"},
                {"label": "Joint aches & stiffness", "value": "joint_pain"},
                {"label": "Mood fluctuations / brain fog", "value": "brain_fog"},
                {"label": "None of these", "value": "none"}
            ]
        }
    ],
    "My Health": [
        {
            "id": "q_myh_1",
            "title": "What is your primary wellness focus?",
            "type": "select",
            "category": "Health Priorities",
            "options": [
                {"label": "Energy & Metabolic Fitness", "value": "metabolic"},
                {"label": "Preventive Screening & Lab Tracking", "value": "preventive"},
                {"label": "Hormonal Balance & Weight Control", "value": "hormonal"},
                {"label": "Heart & Blood Pressure Health", "value": "cardio"}
            ]
        },
        {
            "id": "q_myh_2",
            "title": "When was your last comprehensive blood test or checkup?",
            "type": "select",
            "category": "Screening History",
            "options": [
                {"label": "Within the last 3 months", "value": "last_3m"},
                {"label": "3 to 12 months ago", "value": "3_12m"},
                {"label": "Over 1 year ago", "value": "over_1y"},
                {"label": "Never / Cannot recall", "value": "never"}
            ]
        }
    ],
    "Family Ally": [
        {
            "id": "q_fam_1",
            "title": "Who are you primarily caring for or monitoring?",
            "type": "select",
            "category": "Beneficiary",
            "options": [
                {"label": "Daughter / Teenager", "value": "daughter"},
                {"label": "Mother / Elder Family Member", "value": "mother"},
                {"label": "Partner / Spouse", "value": "spouse"},
                {"label": "Self and Whole Family", "value": "family"}
            ]
        }
    ]
}

@router.get("/questions", response_model=List[OnboardingQuestion])
def get_onboarding_questions(
    life_stage: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_stage = life_stage
    if not target_stage:
        ls = db.query(UserLifeStage).filter(UserLifeStage.user_id == current_user.id).first()
        target_stage = ls.current_mode if ls else "My Health"

    raw_questions = STAGE_QUESTIONS_DATA.get(target_stage, STAGE_QUESTIONS_DATA["My Health"])
    results = []
    for q in raw_questions:
        opts = [OnboardingQuestionOption(**o) for o in q.get("options", [])] if q.get("options") else None
        results.append(OnboardingQuestion(
            id=q["id"],
            title=q["title"],
            description=q.get("description"),
            type=q["type"],
            options=opts,
            required=True,
            category=q.get("category", "General")
        ))
    return results

@router.post("/submit", response_model=OnboardingOut)
def submit_onboarding_responses(
    req: OnboardingSubmitRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    onb = db.query(OnboardingResponse).filter(OnboardingResponse.user_id == current_user.id).first()
    if not onb:
        onb = OnboardingResponse(
            user_id=current_user.id,
            life_stage_mode=req.lifeStageMode,
            responses_json=json.dumps(req.responses),
            completed_steps_json=json.dumps(req.completedSteps),
            is_completed="completed"
        )
        db.add(onb)
    else:
        onb.life_stage_mode = req.lifeStageMode
        onb.responses_json = json.dumps(req.responses)
        onb.completed_steps_json = json.dumps(req.completedSteps)
        onb.is_completed = "completed"
        onb.updated_at = datetime.now(timezone.utc)

    # Sync user's life stage mode
    ls = db.query(UserLifeStage).filter(UserLifeStage.user_id == current_user.id).first()
    if ls:
        ls.current_mode = req.lifeStageMode
    else:
        ls = UserLifeStage(user_id=current_user.id, current_mode=req.lifeStageMode)
        db.add(ls)

    db.commit()
    db.refresh(onb)

    return OnboardingOut(
        id=onb.id,
        userId=onb.user_id,
        lifeStageMode=onb.life_stage_mode,
        responses=onb.responses,
        completedSteps=onb.completed_steps,
        isCompleted=onb.is_completed,
        updatedAt=onb.updated_at.isoformat() if onb.updated_at else ""
    )

@router.get("", response_model=Optional[OnboardingOut])
def get_user_onboarding(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    onb = db.query(OnboardingResponse).filter(OnboardingResponse.user_id == current_user.id).first()
    if not onb:
        return None
    return OnboardingOut(
        id=onb.id,
        userId=onb.user_id,
        lifeStageMode=onb.life_stage_mode,
        responses=onb.responses,
        completedSteps=onb.completed_steps,
        isCompleted=onb.is_completed,
        updatedAt=onb.updated_at.isoformat() if onb.updated_at else ""
    )
