from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional

from database import get_db
from app.models.user import User
from app.models.location import UserLocation
from app.models.assessment import RiskAssessment
from app.models.life_stage import UserLifeStage
from app.core.deps import get_current_user

router = APIRouter(prefix="/doctors", tags=["Doctor Specialty Matching & Care Navigation"])

# Verified hospital & clinic directory data by tier and city
CARE_PROVIDERS = [
    {
        "id": "doc-1",
        "name": "Dr. Sunita Rao, MD, DGO",
        "specialty": "Obstetrics & Gynecology (OB-GYN)",
        "hospital": "Apollo Cradle & Women's Hospital",
        "tier": "Tier 1 Comprehensive Care",
        "city": "Hyderabad",
        "state": "Telangana",
        "distance": "2.4 km",
        "rating": 4.9,
        "teleconsult_available": True,
        "languages": ["English", "Telugu", "Hindi"],
        "experience": "18 years",
        "focus_areas": ["PCOS", "High-Risk Pregnancy", "Hormonal Balance"]
    },
    {
        "id": "doc-2",
        "name": "Dr. Ananya Sharma, MD, DM",
        "specialty": "Endocrinology & Diabetology",
        "hospital": "Max Super Speciality Hospital",
        "tier": "Tier 1 Tertiary Center",
        "city": "Delhi NCR",
        "state": "Delhi",
        "distance": "3.1 km",
        "rating": 4.8,
        "teleconsult_available": True,
        "languages": ["English", "Hindi"],
        "experience": "14 years",
        "focus_areas": ["Thyroid Disorders", "Insulin Resistance", "Metabolic Syndrome"]
    },
    {
        "id": "doc-3",
        "name": "Dr. Radhika Menon, MS (OBG), MRCOG",
        "specialty": "Maternal-Fetal Medicine",
        "hospital": "Manipal Women & Child Hospital",
        "tier": "Tier 1 Tertiary Care",
        "city": "Bengaluru",
        "state": "Karnataka",
        "distance": "1.8 km",
        "rating": 4.9,
        "teleconsult_available": True,
        "languages": ["English", "Kannada", "Tamil", "Hindi"],
        "experience": "16 years",
        "focus_areas": ["Preeclampsia", "Fetal Growth", "Postpartum Recovery"]
    },
    {
        "id": "doc-4",
        "name": "Dr. Meenakshi Sundaram, MD",
        "specialty": "Cardiology & Vascular Medicine",
        "hospital": "Fortis Escorts Heart Institute",
        "tier": "Tier 1 Specialty Hospital",
        "city": "Chennai",
        "state": "Tamil Nadu",
        "distance": "4.2 km",
        "rating": 4.9,
        "teleconsult_available": True,
        "languages": ["English", "Tamil"],
        "experience": "20 years",
        "focus_areas": ["Hypertension", "Gestational Heart Health", "Lipid Management"]
    },
    {
        "id": "doc-5",
        "name": "Dr. Kavita Joshi, DNB (OBGYN)",
        "specialty": "Obstetrics & Gynecology (OB-GYN)",
        "hospital": "Cloudnine Hospital",
        "tier": "Tier 2 Specialized Maternity",
        "city": "Mumbai",
        "state": "Maharashtra",
        "distance": "2.8 km",
        "rating": 4.7,
        "teleconsult_available": True,
        "languages": ["English", "Hindi", "Marathi"],
        "experience": "11 years",
        "focus_areas": ["Menopause Transition", "Teen Health", "Cervical Screening"]
    },
    {
        "id": "doc-6",
        "name": "District Maternal & Child Health Centre",
        "specialty": "Public Health & Primary Gynecological Care",
        "hospital": "National Urban Health Mission (NUHM)",
        "tier": "Tier 3 Government / Subsidized Clinic",
        "city": "Pan-India",
        "state": "Pan-India",
        "distance": "Nearest Public Health Center (PHC)",
        "rating": 4.5,
        "teleconsult_available": True,
        "languages": ["English", "Telugu", "Hindi", "Kannada", "Tamil"],
        "experience": "24x7 Emergency Delivery & Anemia Clinic",
        "focus_areas": ["Free Prenatal Care", "Anemia Screening", "Vaccination", "Emergency Triage"]
    }
]

@router.get("/care-navigation")
def get_care_navigation(
    specialty_filter: Optional[str] = None,
    city_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch user location and risk state
    user_loc = db.query(UserLocation).filter(UserLocation.user_id == current_user.id).first()
    latest_risk = db.query(RiskAssessment).filter(
        RiskAssessment.user_id == current_user.id
    ).order_by(RiskAssessment.created_at.desc()).first()
    user_stage = db.query(UserLifeStage).filter(UserLifeStage.user_id == current_user.id).first()

    recommended_specialty = latest_risk.suggested_specialty if latest_risk else "Obstetrics & Gynecology (OB-GYN)"
    city = city_filter or (user_loc.city if user_loc else "Hyderabad")

    # Filter providers
    matched = []
    target_spec = specialty_filter or recommended_specialty
    
    for prov in CARE_PROVIDERS:
        # Match specialty substring or city or general
        spec_match = (not target_spec) or (target_spec.lower().split()[0] in prov["specialty"].lower()) or ("all" in prov["specialty"].lower())
        city_match = (prov["city"].lower() == city.lower()) or (prov["city"] == "Pan-India")
        
        score = 0
        if spec_match:
            score += 50
        if city_match:
            score += 30
        if prov["teleconsult_available"]:
            score += 20
            
        matched.append({**prov, "relevance_score": score})

    matched.sort(key=lambda x: x["relevance_score"], reverse=True)

    # Appointment prep checklist
    prep_checklist = [
        "Bring your latest digital lab reports (Hemoglobin, Thyroid, Lipid profile) downloaded from SHE Twin AI",
        "List down duration and severity of key symptoms tracked over the last 30 days",
        "Record your last menstrual period (LMP) date and average cycle length",
        "Note all current vitamins, iron supplements, and prescription medications",
        "Prepare 2-3 specific questions regarding treatment side-effects or dietary adjustments"
    ]

    return {
        "user_city": city,
        "recommended_specialty": recommended_specialty,
        "is_emergency": latest_risk.is_emergency if latest_risk else False,
        "emergency_helpline": "112 / 108 (National Emergency Ambulance)" if (latest_risk and latest_risk.is_emergency) else None,
        "matched_providers": matched,
        "appointment_prep_checklist": prep_checklist
    }
