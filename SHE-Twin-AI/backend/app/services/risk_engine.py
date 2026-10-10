from typing import List, Dict, Any, Optional, Tuple

EMERGENCY_SYMPTOM_KEYWORDS = [
    "chest pain", "severe shortness of breath", "difficulty breathing",
    "vaginal bleeding", "leakage of fluid", "fluid leakage",
    "severe abdominal pain", "reduced or changed fetal movement", "reduced fetal movement",
    "loss of consciousness", "severe or persistent vomiting", "severe continuous vomiting",
    "sudden vision loss", "blurred vision or severe headache", "blurred vision",
    "sudden swelling of face or hands", "sudden swelling", "pain or redness around c-section",
    "thoughts of self-harm", "harming baby", "seizure", "stiff neck with high fever",
    "persistent uterine contractions"
]

def evaluate_emergency_flags(
    symptoms: List[Dict[str, Any]],
    vitals: Optional[Dict[str, Any]] = None,
    life_stage_mode: str = "My Health"
) -> Tuple[bool, List[str]]:
    reasons = []
    is_emergency = False

    # Check symptom keywords & severe markers
    for s in symptoms:
        name = s.get("name", "").lower()
        sev = s.get("severity", "").lower()
        for kw in EMERGENCY_SYMPTOM_KEYWORDS:
            if kw in name:
                is_emergency = True
                reasons.append(f"Reported critical red flag symptom: '{s.get('name')}'")
        if ("pregnancy" in life_stage_mode.lower() or "postpartum" in life_stage_mode.lower()) and "bleeding" in name:
            is_emergency = True
            if not any("bleeding" in r.lower() for r in reasons):
                reasons.append(f"Maternal red-flag bleeding indicator: '{s.get('name')}'")
        if sev == "severe" and any(k in name for k in ["bleeding", "cramps", "headache", "dizziness", "vomiting"]):
            is_emergency = True
            reasons.append(f"Severe acute symptom requiring immediate evaluation: '{s.get('name')}'")

    # Check vitals crisis
    if vitals:
        systolic = vitals.get("systolic") or vitals.get("bp_systolic")
        diastolic = vitals.get("diastolic") or vitals.get("bp_diastolic")
        glucose = vitals.get("glucose") or vitals.get("glucose_mg_dl")
        spo2 = vitals.get("spo2") or vitals.get("spo2_pct")

        if systolic and systolic >= 180:
            is_emergency = True
            reasons.append(f"Severe Hypertensive Crisis (Systolic BP {systolic} >= 180 mmHg)")
        elif diastolic and diastolic >= 120:
            is_emergency = True
            reasons.append(f"Severe Hypertensive Crisis (Diastolic BP {diastolic} >= 120 mmHg)")

        if spo2 and spo2 < 90:
            is_emergency = True
            reasons.append(f"Critical Hypoxemia (SpO2 {spo2}% < 90%)")

        if glucose and glucose >= 350:
            is_emergency = True
            reasons.append(f"Critical Hyperglycemia (Fasting/Random Glucose {glucose} mg/dL >= 350)")

    return is_emergency, reasons


def calculate_deterministic_risk(
    profile_data: Dict[str, Any],
    vitals_data: Optional[Dict[str, Any]],
    symptoms: List[Dict[str, Any]],
    confirmed_labs: List[Dict[str, Any]],
    life_stage_mode: str = "My Health"
) -> Dict[str, Any]:
    score = 10.0 # Base score for healthy preventive baseline
    contributing_factors = []
    data_points_used = []
    recommended_next_steps = []
    suggested_specialty = "General Physician"
    risk_category = "General Preventive Health Screening"

    # 1. Emergency Warning Signs Check (Overrides everything)
    is_emergency, emergency_reasons = evaluate_emergency_flags(symptoms, vitals_data, life_stage_mode)
    if is_emergency:
        return {
            "screeningTier": "High Concern",
            "riskCategory": "Acute / Emergency Warning Sign Detected",
            "riskScore": 95.0,
            "isEmergency": True,
            "emergencyActionRecommended": "Immediate emergency room or acute medical evaluation recommended (Call 112 / 108 in India).",
            "contributingFactors": emergency_reasons,
            "dataPointsUsed": [f"Symptom: {s.get('name')}" for s in symptoms] + (["Vitals: Blood pressure / SpO2 / Glucose"] if vitals_data else []),
            "recommendedNextSteps": [
                "Seek immediate emergency medical attention at the nearest hospital.",
                "Do not wait for AI chat responses or clinic appointment schedules.",
                "Have someone accompany you to the hospital emergency department."
            ],
            "suggestedSpecialty": "Emergency Medicine / Urgent Care",
            "disclaimer": "Emergency screening alert. This is not a diagnosis. Please proceed to emergency care immediately."
        }

    # 2. Evaluate Confirmed Lab Results
    hb_val = None
    ferritin_val = None
    tsh_val = None
    glucose_lab_val = None

    for lab in confirmed_labs:
        name_low = lab.get("test_name", "").lower()
        val_str = str(lab.get("value", ""))
        num_val = lab.get("numeric_value")
        if num_val is None:
            try:
                num_val = float(val_str.split()[0].replace(",", ""))
            except Exception:
                num_val = None

        if "hemoglobin" in name_low or "hb" in name_low:
            hb_val = num_val
            data_points_used.append(f"Confirmed Hemoglobin: {val_str} {lab.get('unit', 'g/dL')}")
        elif "ferritin" in name_low:
            ferritin_val = num_val
            data_points_used.append(f"Confirmed Serum Ferritin: {val_str} {lab.get('unit', 'ng/mL')}")
        elif "tsh" in name_low or "thyroid" in name_low:
            tsh_val = num_val
            data_points_used.append(f"Confirmed TSH: {val_str} {lab.get('unit', 'uIU/mL')}")
        elif "glucose" in name_low or "sugar" in name_low:
            glucose_lab_val = num_val
            data_points_used.append(f"Confirmed Blood Glucose: {val_str} {lab.get('unit', 'mg/dL')}")

    # Anemia Screening Rules
    if hb_val is not None:
        if hb_val < 10.0:
            score += 45.0
            contributing_factors.append(f"Moderate-to-Severe Anemia indicator: Hemoglobin {hb_val} g/dL (< 10.0)")
            suggested_specialty = "General Physician & Hematologist"
            risk_category = "Iron Deficiency & Hematologic Care"
        elif hb_val < 12.0:
            score += 25.0
            contributing_factors.append(f"Mild Anemia indicator: Hemoglobin {hb_val} g/dL (Female reference: 12.0-15.5)")
            suggested_specialty = "General Physician / Nutritionist"
            risk_category = "Iron Deficiency Screening"

    if ferritin_val is not None and ferritin_val < 20.0:
        score += 20.0
        contributing_factors.append(f"Depleted iron reserves: Ferritin {ferritin_val} ng/mL (< 20.0)")

    # Thyroid Screening Rules
    if tsh_val is not None:
        if tsh_val > 4.5:
            score += 25.0
            contributing_factors.append(f"Elevated TSH: {tsh_val} uIU/mL (Hypothyroidism screening indicator)")
            suggested_specialty = "Endocrinologist"
            risk_category = "Thyroid & Endocrine Health"
        elif tsh_val < 0.4:
            score += 25.0
            contributing_factors.append(f"Suppressed TSH: {tsh_val} uIU/mL (Hyperthyroidism screening indicator)")
            suggested_specialty = "Endocrinologist"
            risk_category = "Thyroid & Endocrine Health"

    # 3. Evaluate Vitals
    if vitals_data:
        sys_bp = vitals_data.get("systolic") or vitals_data.get("bp_systolic", 120)
        dia_bp = vitals_data.get("diastolic") or vitals_data.get("bp_diastolic", 80)
        gluc = vitals_data.get("glucose") or vitals_data.get("glucose_mg_dl", 90)
        data_points_used.append(f"Vitals: BP {sys_bp}/{dia_bp} mmHg, Glucose {gluc} mg/dL")

        if sys_bp >= 140 or dia_bp >= 90:
            score += 25.0
            contributing_factors.append(f"Stage 1/2 Hypertension BP reading: {sys_bp}/{dia_bp} mmHg")
            suggested_specialty = "General Physician / Cardiologist"
        elif sys_bp >= 130 or dia_bp >= 85:
            score += 15.0
            contributing_factors.append(f"Elevated Pre-hypertension BP reading: {sys_bp}/{dia_bp} mmHg")

        if gluc >= 126:
            score += 30.0
            contributing_factors.append(f"Elevated Fasting Glucose: {gluc} mg/dL (Diabetes screening indicator)")
            suggested_specialty = "Endocrinologist / Diabetologist"
        elif gluc >= 100:
            score += 15.0
            contributing_factors.append(f"Impaired Fasting Glucose: {gluc} mg/dL (Pre-diabetes range)")

    # 4. Evaluate Symptoms & Life Stage
    symptom_count = len(symptoms)
    if symptom_count > 0:
        data_points_used.append(f"Reported Symptoms: {', '.join([s.get('name', '') for s in symptoms])}")
        for s in symptoms:
            name = s.get("name", "").lower()
            sev = s.get("severity", "Mild").lower()
            if sev == "severe":
                score += 20.0
                contributing_factors.append(f"Severe reported symptom: {s.get('name')}")
            elif sev == "moderate":
                score += 10.0
                contributing_factors.append(f"Moderate reported symptom: {s.get('name')}")
            else:
                score += 5.0

            if any(k in name for k in ["pcos", "irregular", "missed", "period", "cramp", "ovary"]):
                suggested_specialty = "Gynecologist & Obstetrician"
                risk_category = "Women's Reproductive & Hormonal Health"
                contributing_factors.append("Preliminary screening note: Irregular cycles or hormonal skin symptoms are screening markers and do not constitute a clinical diagnosis of PCOS.")
            elif any(k in name for k in ["fatigue", "hair fall", "cold intolerance", "weight gain"]):
                if not risk_category or risk_category == "General Preventive Health Screening":
                    risk_category = "Metabolic & Thyroid Wellness"

    # Life Stage Mode Specialization
    mode_low = life_stage_mode.lower()
    if "pregnancy" in mode_low:
        suggested_specialty = "Obstetrician / Antenatal Care Specialist"
        risk_category = "Antenatal & Maternal Health Screening"
        data_points_used.append("Mode: Pregnancy Care Track")
    elif "postpartum" in mode_low:
        suggested_specialty = "Obstetrician / Maternal Health Specialist"
        risk_category = "Postpartum Maternal Recovery & Wellness"
        data_points_used.append("Mode: Postpartum Recovery Care")
    elif "menopause" in mode_low:
        suggested_specialty = "Gynecologist / Menopause Specialist"
        risk_category = "Menopause Transition & Bone Health Screening"
        data_points_used.append("Mode: Menopause Transition Track")
    elif "teen" in mode_low:
        suggested_specialty = "Adolescent Health / Gynecologist"
        risk_category = "Adolescent Wellness & Menstrual Health Screening"
        data_points_used.append("Mode: Teen / Young Women Track")
    elif "reproductive" in mode_low:
        if suggested_specialty == "General Physician":
            suggested_specialty = "Gynecologist & Reproductive Specialist"
        data_points_used.append("Mode: Reproductive Health Track")
    elif "family" in mode_low:
        data_points_used.append(f"Mode: Family Ally ({life_stage_mode})")

    # Clamp score
    score = min(score, 100.0)

    # Determine Tier
    if score >= 60.0:
        tier = "High Concern"
        recommended_next_steps = [
            f"Schedule a priority consultation with a {suggested_specialty}.",
            "Bring your confirmed diagnostic lab reports and vitals history to your appointment.",
            "Monitor daily blood pressure and fasting glucose observations in SHE Twin AI."
        ]
    elif score >= 35.0:
        tier = "Medium Concern"
        recommended_next_steps = [
            f"Book a routine consultation with a {suggested_specialty} within 1-2 weeks.",
            "Continue logging your symptoms and menstrual cycles in your Health Twin.",
            "Consider a dietary review for adequate micronutrient and iron support."
        ]
    else:
        tier = "Lower Concern"
        recommended_next_steps = [
            "Maintain regular hydration (2-2.5L daily) and balanced micronutrient nutrition.",
            "Continue tracking quarterly routine vitals in SHE Twin AI.",
            "Schedule standard annual preventive wellness checkups."
        ]

    return {
        "screeningTier": tier,
        "riskCategory": risk_category,
        "riskScore": round(score, 1),
        "isEmergency": False,
        "emergencyActionRecommended": None,
        "contributingFactors": contributing_factors if contributing_factors else ["No significant acute clinical risks identified; baseline values within healthy limits."],
        "dataPointsUsed": data_points_used if data_points_used else ["Standard Health Twin profile biometrics"],
        "recommendedNextSteps": recommended_next_steps,
        "suggestedSpecialty": suggested_specialty,
        "disclaimer": "This is an algorithmic decision-support tool for educational screening only. It does not replace clinical diagnosis or professional medical advice."
    }
