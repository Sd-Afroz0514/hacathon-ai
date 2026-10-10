import os
import re
import json
import httpx
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from app.core.config import settings

DISCLAIMER_MAP = {
    "en": "\n\n⚠️ Disclaimer: I am an AI health educational assistant, not a doctor. This guidance is for informational purposes only. Please consult a qualified healthcare provider for clinical diagnosis or treatment.",
    "te": "\n\n⚠️ నిరాకరణ: నేను AI ఆరోగ్య సహాయకుడిని, వైద్యుడిని కాదు. ఈ సమాచారం కేవలం అవగాహన కొరకు మాత్రమే. వైద్య నిర్ధారణ లేదా చికిత్స కోసం దయచేసి అర్హతగల వైద్యుడిని సంప్రదించండి.",
    "hi": "\n\n⚠️ अस्वीकरण: मैं एक एआई स्वास्थ्य शैक्षिक सहायक हूँ, डॉक्टर नहीं। यह मार्गदर्शन केवल सूचनात्मक उद्देश्यों के लिए है। चिकित्सीय निदान या उपचार के लिए कृपया किसी योग्य चिकित्सक से परामर्श करें।",
    "kn": "\n\n⚠️ ಹಕ್ಕುತ್ಯಾಗ: ನಾನು AI ಆರೋಗ್ಯ ಶೈಕ್ಷಣಿಕ ಸಹಾಯಕ, ವೈದ್ಯರಲ್ಲ. ಈ ಮಾರ್ಗದರ್ಶನವು ಮಾಹಿತಿ ಉದ್ದೇಶಗಳಿಗಾಗಿ ಮಾತ್ರ. ವೈದ್ಯಕೀಯ ರೋಗನಿರ್ಣಯ ಅಥವಾ ಚಿಕಿತ್ಸೆಗಾಗಿ ದಯವಿಟ್ಟು ಅರ್ಹ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ.",
    "ta": "\n\n⚠️ பொறுப்புத்துறப்பு: நான் ஒரு AI சுகாதார கல்வி உதவியாளர், மருத்துவர் அல்ல. இந்த வழிகாட்டுதல் தகவல் நோக்கங்களுக்காக மட்டுமே. மருத்துவ பரிசோதனை அல்லது சிகிச்சைக்கு தகுதியான மருத்துவரை அணுகவும்."
}

EMERGENCY_WORDS = [
    "chest pain", "bleeding heavily", "unconscious", "cannot breathe", "severe sudden pain",
    "poisoning", "suicidal", "coughing blood", "slurred speech", "paralysis", "anaphylaxis",
    "sudden numbness", "loss of vision", "severe chest pressure", "బ్లీడింగ్", "ఛాతీ నొప్పి",
    "सीने में तेज दर्द", "बेहोश", "శ్వాస ఆడకపోవడం"
]

def _matches(msg: str, keywords: List[str]) -> bool:
    for k in keywords:
        if len(k) <= 4 and k.isalnum():
            if re.search(rf"\b{re.escape(k)}\b", msg):
                return True
        else:
            if k in msg:
                return True
    return False

def detect_agent_type(message: str, life_stage: Optional[str] = None) -> str:
    """Classifies user inquiry into specific clinical and wellness domains with multilingual matching."""
    msg = message.lower()

    # Life-Stage Contextual Priority: Tailor symptoms according to active life stage
    if life_stage and life_stage.strip() not in ["My Health", "None"]:
        stg = life_stage.lower()
        if "pregnancy" in stg and _matches(msg, [
            "nausea", "vomit", "morning sickness", "back", "swelling", "cramp", "headache", "dizzy",
            "fatigue", "tired", "belly", "fluid", "contraction", "movement", "kick", "baby",
            "trimester", "week", "antenatal", "ultrasound", "scan", "spotting", "bleeding"
        ]):
            return "pregnancy_maternal"
        if "postpartum" in stg and _matches(msg, [
            "bleed", "breast", "sad", "tired", "exhausted", "fever", "pain", "wound", "recovery",
            "lochia", "baby", "delivery", "latch", "c-section", "c section", "feeding", "blues", "engorgement"
        ]):
            return "postpartum_recovery"
        if ("teen" in stg or "young women" in stg) and _matches(msg, [
            "cramp", "period", "cycle", "acne", "pain", "school", "heavy", "first", "flow",
            "puberty", "skin", "menarche", "irregular"
        ]):
            return "teen_health"
        if "menopause" in stg and _matches(msg, [
            "sweat", "hot", "period", "sleep", "joint", "mood", "dryness", "flash", "flashes", "bone", "estrogen"
        ]):
            return "menopause_perimenopause"
        if "reproductive" in stg and _matches(msg, [
            "period", "cycle", "cramp", "acne", "weight", "flow", "pcos", "bleeding", "ovulation", "pelvic"
        ]):
            return "womens_health_pcos_cycle"
        if "family" in stg and _matches(msg, [
            "support", "care", "help", "daughter", "mother", "wife", "checklist", "doctor", "medicine", "caregiver"
        ]):
            return "family_ally_care"

    # 1. Headache & Migraine
    if _matches(msg, [
        "headache", "migraine", "head pain", "head ache", "throbbing head", "forehead",
        "temple pain", "cluster headache", "tension headache", "తలనొప్పి", "తల నొప్పి",
        "सिरदर्द", "सिर दर्द", "ತಲೆನೋವು", "தலைவலி"
    ]):
        return "headache_migraine"

    # 2. Dizziness & Vertigo
    if _matches(msg, [
        "dizziness", "dizzy", "lightheaded", "lightheadedness", "vertigo", "spinning",
        "loss of balance", "faint", "fainting", "తలతిరగడం", "చక్కర్లు", "चक्कर", "ತಲೆತಿರುಗುವಿಕೆ", "மயக்கம்"
    ]):
        return "dizziness_vertigo"

    # 3. Stomach, Abdominal Pain, Acidity & GERD (prioritize before fever/flu checks to avoid 'reflux' conflict)
    if _matches(msg, [
        "stomach", "abdomen", "abdominal", "belly", "acidity", "gas", "bloat", "bloating",
        "indigestion", "gerd", "heartburn", "acid reflux", "gut", "gastric", "stomach pain",
        "belly ache", "కడుపునొప్పి", "ఎసిడిటీ", "గ్యాస్", "पेट दर्द", "एसिडिटी", "गैस", "ಹೊಟ್ಟೆ ನೋವು", "வயிற்று வலி"
    ]):
        return "digestive_abdominal"

    # 4. Nausea & Vomiting
    if _matches(msg, [
        "nausea", "vomit", "vomiting", "throwing up", "puke", "motion sickness", "morning sickness",
        "వాంతి", "వాంతులు", "ఉల్టీ", "उल्टी", "जी मिचलाना", "ವಾಂತಿ", "வாந்தி"
    ]):
        return "nausea_vomiting"

    # 5. Diarrhea & Loose Motions
    if _matches(msg, [
        "diarrhea", "diarrhoea", "loose motion", "loose stool", "watery stool", "stomach bug",
        "food poisoning", "విరేచనాలు", "మోషన్స్", "दस्त", "लूज मोशन", "ಅತಿಸಾರ", "வயிற்றுப்போக்கு"
    ]):
        return "diarrhea_loose_motion"

    # 6. Constipation & Bowel Issues
    if _matches(msg, [
        "constipation", "constipated", "hard stool", "difficulty passing stool", "bowel movement",
        "మలబద్ధకం", "कब्ज", "ಮಲಬದ್ಧತೆ", "மலச்சிக்கல்"
    ]):
        return "constipation_bowel"

    # 7. Urinary Tract & Burning Urination (UTI)
    if _matches(msg, [
        "uti", "urine", "urination", "burning urine", "painful urination", "peeing",
        "bladder", "frequent urination", "urinary", "మూత్రంలో మంట", "మూత్రం", "पेशाब में जलन", "मूत्र संक्रमण", "ಮೂತ್ರದಲ್ಲಿ ಉರಿ", "சிறுநீர் எரிச்சல்"
    ]):
        return "uti_urinary_burning"

    # 8. Fever & Infection
    if _matches(msg, [
        "fever", "temperature", "chills", "shivering", "sweating", "hot and cold",
        "body ache", "viral", "infection", "flu", "dengue", "malaria", "typhoid", "high temp",
        "100°f", "101°f", "102°f", "103°f", "104°f", "101 f", "102 f", "103 f", "102", "103", "104",
        "జ్వరం", "చలిజ్వరం", "बुखार", "ताप", "ಜ್ವರ", "காய்ச்சல்"
    ]):
        return "fever_infection"

    # 9. Shortness of Breath & Wheezing
    if _matches(msg, [
        "shortness of breath", "breathless", "breathlessness", "difficulty breathing",
        "wheezing", "asthma", "suffocating", "gasping", "ఆయాసం", "శ్వాస", "सांस फूलना", "दम घुटना", "ಉಸಿರಾಟದ ತೊಂದರೆ", "மூச்சுத்திணறல்"
    ]):
        return "breathing_wheezing"

    # 10. Respiratory, Cough & Cold
    if _matches(msg, [
        "cough", "cold", "sneeze", "sneezing", "sore throat", "phlegm", "mucus",
        "congestion", "runny nose", "blocked nose", "sinus", "bronchitis", "throat pain",
        "dry cough", "wet cough", "దగ్గు", "జలుబు", "గొంతునొప్పి", "खांसी", "जुकाम", "गले में खराश", "ಕೆಮ್ಮು", "ಶೀತ", "இருமல்", "சளி"
    ]):
        return "respiratory_cough_cold"

    # 11. Cardiovascular & Blood Pressure
    if any(k in msg for k in [
        "blood pressure", "high bp", "low bp", "hypertension", "palpitation", "heart beat",
        "pulse rate", "cardio", "tachycardia", "bp is", "systolic", "diastolic",
        "రక్తపోటు", "గుండె దడ", "रक्तचाप", "ब्लड प्रेशर", "ರಕ್ತದೊತ್ತಡ", "இரத்த அழுத்தம்"
    ]):
        return "cardiovascular_bp"

    # 12. Diabetes & Blood Sugar
    if any(k in msg for k in [
        "sugar", "glucose", "diabetes", "diabetic", "hba1c", "insulin", "hyperglycemia",
        "hypoglycemia", "fasting sugar", "pp sugar", "షుగర్", "మధుమేహం", "ब्लड शुगर", "डायबिटीज", "ಮಧುಮೇಹ", "சர்க்கரை நோய்"
    ]):
        return "diabetes_metabolic"

    # 13. Fatigue, Weakness & Anemia
    if any(k in msg for k in [
        "fatigue", "tired", "tiredness", "exhausted", "exhaustion", "weakness", "weak",
        "low energy", "anemia", "anemic", "drowsy", "lethargic", "vitality",
        "నీరసం", "అలసట", "రక్తహీనత", "कमजोरी", "थकान", "एनीमिया", "ಸುಸ್ತು", "ನಿಶ್ಯಕ್ತಿ", "சோர்வு", "பலவீனம்"
    ]):
        return "fatigue_weakness_sleep"

    # 14. Sleep & Insomnia
    if any(k in msg for k in [
        "insomnia", "sleepless", "sleeplessness", "cannot sleep", "can't sleep", "sleep quality",
        "night awakenings", "restless sleep", "నిద్రలేమి", "నిద్ర పట్టడం లేదు", "अनिद्रा", "नींद न आना", "ನಿದ್ರಾಹೀನತೆ", "தூக்கமின்மை"
    ]):
        return "sleep_insomnia"

    # 15. Back Pain & Spine
    if any(k in msg for k in [
        "back pain", "lower back", "backache", "spine", "cervical", "sciatica", "lumbar",
        "slip disc", "నడుము నొప్పి", "వెన్నునొప్పి", "कमर दर्द", "पीठ दर्द", "ಬೆನ್ನು ನೋವು", "முதுகு வலி"
    ]):
        return "musculoskeletal_joint_back"

    # 16. Joint & Knee Pain (Arthritis)
    if any(k in msg for k in [
        "knee pain", "joint pain", "joints", "knee", "swollen joint", "arthritis", "stiffness",
        "మోకాలి నొప్పి", "కీళ్ల నొప్పులు", "घुटने का दर्द", "जोड़ों का दर्द", "ಗಂಟು ನೋವು", "மூட்டு வலி"
    ]):
        return "knee_joint_arthritis"

    # 17. Body Ache & Muscle Pain
    if any(k in msg for k in [
        "body pain", "body ache", "muscle pain", "muscle soreness", "muscle cramp", "stiff muscles",
        "ఒంటి నొప్పులు", "కండరాల నొప్పి", "बदन दर्द", "मांसपेशियों में दर्द", "ಮೈಕೈ ನೋವು", "உடல் வலி"
    ]):
        return "muscle_body_pain"

    # 18. Skin, Rash & Allergy
    if any(k in msg for k in [
        "rash", "skin", "itch", "itching", "itchy", "hives", "allergy", "allergic", "redness",
        "bumps", "eczema", "blister", "fungal", "దురద", "దద్దుర్లు", "చర్మ సమస్య", "खुजली", "चकत्ते", "एलर्जी", "ತುರಿಕೆ", "அரிப்பு"
    ]):
        return "skin_dermatology"

    # 19. Acne & Pimples
    if any(k in msg for k in [
        "acne", "pimple", "pimples", "breakout", "breakouts", "blackheads", "cystic acne",
        "మొటిమలు", "कील मुहासे", "ಮೊಡವೆ", "பருக்கள்"
    ]):
        return "acne_skincare"

    # 20. Hair Loss & Scalp
    if any(k in msg for k in [
        "hair fall", "hair loss", "hair thinning", "bald", "balding", "scalp", "dandruff",
        "జుట్టు రాలడం", "తల వెంట్రుకలు", "बाल झड़ना", "रूसी", "ಕೂದಲು ಉದುರುವುದು", "முடி உதிர்தல்"
    ]):
        return "hair_fall_loss"

    # 21. Eye & Vision Issues
    if any(k in msg for k in [
        "eye pain", "red eye", "watery eyes", "eye irritation", "blurred vision", "eye strain",
        "conjunctivitis", "కంటి నొప్పి", "కళ్ళు ఎర్రబడటం", "आंखों में दर्द", "कंजंक्टिवाइटिस", "ಕಣ್ಣು ನೋವು", "கண் வலி"
    ]):
        return "eye_vision_pain"

    # 22. Ear Pain & Infection
    if any(k in msg for k in [
        "ear pain", "ear ache", "earache", "ear infection", "ringing in ear", "tinnitus",
        "చెవి నొప్పి", "कान का दर्द", "ಕಿವಿ ನೋವು", "காது வலி"
    ]):
        return "ear_pain_infection"

    # 23. Dental & Tooth Pain
    if any(k in msg for k in [
        "tooth pain", "toothache", "teeth", "gum pain", "bleeding gums", "cavity", "dental",
        "పంటి నొప్పి", "చిగుళ్ళు", "दांत दर्द", "मसूड़ों में सूजन", "ಹಲ್ಲು ನೋವು", "பல் வலி"
    ]):
        return "dental_toothache"

    # 24. Stress & Anxiety
    if any(k in msg for k in [
        "stress", "anxiety", "anxious", "panic", "panic attack", "nervous", "tension",
        "overwhelm", "burnout", "restless", "ఆందోళన", "ఒత్తిడి", "तनाव", "चिंता", "ಗಾಬರಿ", "மன அழுத்தம்"
    ]):
        return "mental_health_anxiety"

    # 25. Depression & Low Mood
    if any(k in msg for k in [
        "depress", "depression", "depressed", "sad", "sadness", "feeling down", "hopeless",
        "lost interest", "నిరాశ", "కుంగుబాటు", "उदासी", "अवसाद", "ಖಿನ್ನತೆ", "மனச்சோர்வு"
    ]):
        return "depression_mood"

    # 26. Male Health & Prostate
    if any(k in msg for k in [
        "prostate", "urinary stream", "testosterone", "erectile", "libido", "male health",
        "men's health", "stamina", "psa", "testicular", "పురుషుల ఆరోగ్యం", "पुरुष स्वास्थ्य"
    ]):
        return "male_health_prostate"

    # 27. Postpartum Recovery & Maternal Healing
    if any(k in msg for k in [
        "postpartum", "after delivery", "after birth", "lochia", "breastfeeding", "nursing",
        "mastitis", "c-section recovery", "episiotomy", "baby blues", "డెలివరీ తర్వాత", "ప్రసవానంతరం", "डिलीवरी के बाद", "प्रसवोत्तर"
    ]):
        return "postpartum_recovery"

    # 28. Teen & Adolescent Health
    if any(k in msg for k in [
        "teen", "teenager", "first period", "menarche", "adolescent", "school cramps", "టీనేజ్", "కిశోర ప్రాయం", "किशोरी", "पहला मासिक धर्म"
    ]):
        return "teen_health"

    # 29. Family Ally & Caregiver Support
    if any(k in msg for k in [
        "family ally", "supporting mother", "my daughter", "my wife", "caring for", "caregiver", "కన్సల్టేషన్ సహాయం", "परिवार"
    ]):
        return "family_ally_care"

    # 30. Pregnancy & Antenatal Care
    if any(k in msg for k in [
        "pregnant", "pregnancy", "trimester", "fetus", "antenatal", "kick count",
        "fetal movement", "contraction", "delivery", "ultrasound", "గర్భం", "గర్భిణి",
        "గర్భధారణ", "गर्भावस्था", "गर्भवती", "ಗರ್ಭಿಣಿ", "கர்ப்பம்"
    ]):
        return "pregnancy_maternal"

    # 31. Menopause & Perimenopause
    if any(k in msg for k in [
        "menopause", "perimenopause", "hot flash", "hot flashes", "night sweat", "night sweats",
        "vaginal dryness", "periods stopped", "మెనోపాజ్", "रजोनिवृत्ति", "ಋತುಬಂಧ", "மாதவிடாய் நிறுத்தம்"
    ]):
        return "menopause_perimenopause"

    # 32. Women's Health, Periods & PCOS
    if any(k in msg for k in [
        "pcos", "pcod", "period", "periods", "menstrual", "menstruation", "cycle", "cramps",
        "ovulation", "flow", "spotting", "heavy period", "delayed period", "missed period",
        "పీరియడ్స్", "రుతుచక్రం", "ఋతుక్రమం", "పీరియడ్ నొప్పి", "मासिक धर्म", "पीरियड्स", "ಮುಟ್ಟು", "மாதவிடாய்"
    ]):
        return "womens_health_pcos_cycle"

    # 33. Lab Reports & Diagnostic Explainer
    if any(k in msg for k in [
        "report", "cbc", "hemoglobin", "tsh", "ferritin", "platelet", "lab", "test result",
        "blood test", "cholesterol", "lipid", "vitamin d", "b12", "creatinine", "thyroid", "wbc", "rbc",
        "రిపోర్ట్", "రక్త పరీక్ష", "रिपोर्ट", "रक्त जांच", "ವರದಿ", "அறிக்கை"
    ]):
        return "report_explainer"

    # 34. Nutrition & Diet
    if any(k in msg for k in [
        "food", "diet", "nutrition", "eat", "protein", "vitamin", "meal", "iron food",
        "water", "calorie", "weight loss", "weight gain", "ఆహారం", "డైట్", "పోషకాహారం", "आहार", "भोजन", "ಪೋಷಕಾಂಶ", "உணவு"
    ]):
        return "nutrition_diet"

    # 35. Care Navigation & Doctors
    if any(k in msg for k in [
        "doctor", "clinic", "hospital", "specialist", "gynecologist", "physician",
        "appointment", "book consultation", "డాక్టర్", "ఆసుపత్రి", "डॉक्टर", "अस्पताल", "ವೈದ್ಯರು", "மருத்துவர்"
    ]):
        return "care_navigation"

    # 36. Health History & Timeline
    if any(k in msg for k in [
        "history", "timeline", "past log", "trend", "last month", "change", "progress",
        "టైమ్‌లైన్", "చరిత్ర", "समयरेखा", "इतिहास"
    ]):
        return "timeline_history"

    # Life-Stage Contextual Fallback: If query matches symptoms or concerns within user's active life-stage, adapt to it!
    if life_stage:
        stg = life_stage.lower()
        if "pregnancy" in stg and _matches(msg, [
            "nausea", "headache", "dizzy", "swelling", "back", "tired", "cramp", "belly", "pain",
            "kick", "baby", "trimester", "week", "fluid", "contractions", "movement", "antenatal"
        ]):
            return "pregnancy_maternal"
        if "postpartum" in stg and _matches(msg, [
            "bleed", "breast", "sad", "tired", "fever", "pain", "wound", "recovery", "lochia",
            "baby", "delivery", "latch", "c-section", "c section", "feeding", "blues"
        ]):
            return "postpartum_recovery"
        if "menopause" in stg and _matches(msg, [
            "sweat", "hot", "period", "sleep", "joint", "mood", "dryness", "flash", "flashes", "bone"
        ]):
            return "menopause_perimenopause"
        if "teen" in stg and _matches(msg, [
            "cramp", "period", "cycle", "acne", "pain", "school", "heavy", "first", "flow", "puberty", "skin"
        ]):
            return "teen_health"
        if "reproductive" in stg and _matches(msg, [
            "period", "cycle", "cramp", "acne", "weight", "flow", "pcos", "bleeding", "ovulation", "pelvic"
        ]):
            return "womens_health_pcos_cycle"
        if "family" in stg and _matches(msg, [
            "support", "care", "help", "daughter", "mother", "wife", "checklist", "doctor", "medicine"
        ]):
            return "family_ally_care"

    return "general_triage"


# Domain responses with tailored clinical reviews and specific diagnostic questions
RESPONSES_BY_AGENT: Dict[str, Dict[str, str]] = {
    "headache_migraine": {
        "en": "Hello {user_name}! Let's assess your headache and neurological symptoms{profile_summary}.\n\n• **Common Triggers:** Tension (stress, prolonged screen time), dehydration, migraines, cervical spine strain, or sinus congestion.\n• **Immediate Relief Steps:** Rest in a quiet dark room, drink 500ml water with electrolytes, apply a cool temple compress, and take a 20-minute screen break.\n• **Clinical Questions for You:**\n  1. Is the pain throbbing/pulsing, band-like tension, or sharp on one side?\n  2. Are you experiencing visual changes (aura), nausea, or light sensitivity?\n  3. How long has this headache lasted, and what makes it better or worse?\n• **Emergency Red Flags:** Sudden 'thunderclap' severity, stiff neck with fever, or slurred speech requires urgent ER care.",
        "te": "నమస్కారం {user_name}! మీ తలనొప్పి లక్షణాల వివరాలు:\n\n• **సాధారణ కారణాలు:** ఒత్తిడి, నిద్రలేమి, అధిక స్క్రీన్ సమయం, డీహైడ్రేషన్ లేదా మైగ్రేన్.\n• **ఉపశమనం:** చీకటి గదిలో విశ్రాంతి, 500ml నీరు త్రాగడం, చల్లని కాపడం.\n• **మీరు గమనించాల్సిన ప్రశ్నలు:** తలనొప్పి ఒకవైపు మాత్రమే ఉందా? వెలుతురు చూస్తే ఎక్కువవుతుందా? ఎన్ని రోజులుగా ఉంది?\n• **అత్యవసరం:** తీవ్రమైన ఆకస్మిక నొప్పి లేదా చూపు మందగిస్తే వెంటనే వైద్యుడిని సంప్రదించండి.",
        "hi": "नमस्ते {user_name}! आपके सिरदर्द के लक्षणों का विश्लेषण:\n\n• **संभावित कारण:** तनाव, स्क्रीन का अधिक उपयोग, निर्जलीकरण (Dehydration) या माइग्रेन।\n• **घरेलू राहत:** अंधेरे कमरे में आराम करें, पर्याप्त पानी पिएं और ठंडी सिकाई करें।\n• **महत्वपूर्ण प्रश्न:** क्या दर्द एकतरफा है? क्या उल्टी या तेज रोशनी से परेशानी हो रही है? यह सिरदर्द कब से है?\n• **चेतावनी:** अचानक असहनीय तेज दर्द या गर्दन में अकड़न पर तुरंत इमरजेंसी जाएं।"
    },
    "dizziness_vertigo": {
        "en": "Hello {user_name}! Evaluating your dizziness or lightheadedness{profile_summary}.\n\n• **Key Factors:** Postural hypotension (standing up quickly), inner ear imbalance (BPPV/vertigo), dehydration, low blood sugar, or mild anemia.\n• **Immediate Care:** Sit or lie down immediately to avoid falls. Sip water slowly and avoid sudden head turns.\n• **Diagnostic Inquiry:**\n  1. Does the room feel like it is spinning around you (vertigo), or do you feel faint/lightheaded?\n  2. Does dizziness worsen with head movement or when standing up?\n  3. Any ringing in ears, nausea, or sweating accompanying it?",
        "te": "నమస్కారం {user_name}! మీ తలతిరగడం (Dizziness) వివరాలు:\n\n• **కారణాలు:** రక్తపోటు తగ్గడం, చెవి లోపలి అసమతుల్యత, డీహైడ్రేషన్ లేదా రక్తహీనత.\n• **జాగ్రత్త:** వెంటనే కూర్చోండి లేదా పడుకోండి. నెమ్మదిగా నీరు త్రాగండి.\n• **ప్రశ్నలు:** పరిసరాలు తిరుగుతున్నట్లు అనిపిస్తోందా? లేచినప్పుడు ఎక్కువవుతుందా?",
        "hi": "नमस्ते {user_name}! चक्कर आने और संतुलन संबंधी समस्या का विश्लेषण:\n\n• **संभावित कारण:** लो बीपी, कान के अंदर का असंतुलन (वर्टिगो), पानी की कमी या खून की कमी।\n• **सावधानी:** तुरंत बैठ जाएं या लेट जाएं, अचानक सिर न हिलाएं।"
    },
    "fever_infection": {
        "en": "Hello {user_name}! Regarding your fever and temperature symptoms:\n\n• **Clinical Context:** Fever above 100.4°F (38°C) is an active immune defense fighting viral or bacterial organisms.\n• **Management:** Hydrate with ORS, tender coconut water, and herbal broths. Rest in well-ventilated, light clothing.\n• **Triage Questions:**\n  1. What is your latest thermometer reading (temperature in °F or °C)?\n  2. How many days have you had the fever, and is there shivering/chills?\n  3. Do you have body aches, burning urination, rash, or persistent vomiting?\n• **Warning Signs:** Fever >103°F, lasting >3 days, or confusion warrants prompt physician review.",
        "te": "నమస్కారం {user_name}! మీ జ్వరం వివరాలు:\n\n• **లక్షణాలు:** శరీర ఉష్ణోగ్రత 100.4°F దాటితే జ్వరం. ద్రవాహారం (ORS, కొబ్బరినీళ్ళు) అధికంగా తీసుకోండి.\n• **ప్రశ్నలు:** థర్మామీటర్ లో ఎంత ఉష్ణోగ్రత వచ్చింది? ఎన్ని రోజులుగా ఉంది? చలి లేదా దగ్గు ఉందా?\n• **గమనిక:** జ్వరం 3 రోజులకు మించితే CBC మరియు డెంగ్యూ/మలేరియా పరీక్షలు అవసరం.",
        "hi": "नमस्ते {user_name}! बुखार और तापमान का विश्लेषण:\n\n• **देखभाल:** 100.4°F से अधिक बुखार संक्रमण का संकेत है। खूब तरल पदार्थ (ORS) पिएं और आराम करें।\n• **प्रश्न:** थर्मामीटर पर कितना तापमान आया? क्या कंपकंपी, खांसी या पेशाब में जलन है?"
    },
    "breathing_wheezing": {
        "en": "Hello {user_name}! Assessing your respiratory comfort and breathing{profile_summary}.\n\n• **Potential Drivers:** Bronchospasm, asthma flare, respiratory allergy, bronchitis, or cardiovascular strain.\n• **Immediate Posture:** Sit upright in a comfortable position, loosen tight clothing, and take slow pursed-lip breaths.\n• **Clinical Inquiry:**\n  1. Did breathlessness begin suddenly or build gradually over days?\n  2. Is there a high-pitched whistling/wheezing sound when you exhale?\n  3. Does walking or lying flat worsen the breathing difficulty?\n• **Emergency Alert:** If lips turn blue, chest tightens painfully, or you cannot speak full sentences, call 112 immediately.",
        "te": "నమస్కారం {user_name}! ఆయాసం మరియు శ్వాస సమస్యల వివరాలు:\n\n• **జాగ్రత్త:** తిన్నగా కూర్చోండి, నిదానంగా శ్వాస తీసుకోండి. పొగ మరియు దుమ్ముకు దూరంగా ఉండండి.\n• **ప్రశ్నలు:** గురక శబ్దం వస్తోందా? నడిచినప్పుడు ఆయాసం పెరుగుతుందా?",
        "hi": "नमस्ते {user_name}! सांस फूलने और घबराहट की समीक्षा:\n\n• **सलाह:** सीधे बैठें, गहरी सांस लें। यदि सीने में दर्द या होंठ नीले पड़ें तो तुरंत इमरजेंसी जाएं।"
    },
    "respiratory_cough_cold": {
        "en": "Hello {user_name}! Managing your cough, cold, and throat discomfort:\n\n• **Pathways:** Upper respiratory tract infection (URTI) usually peaks between days 3-5.\n• **Home Care:** Warm saline gargles (3x daily), steam inhalation with eucalyptus, and honey-ginger-tulsi tea.\n• **Triage Questions:**\n  1. Is the cough dry and tickly, or producing yellow/green mucus/phlegm?\n  2. Do you have sinus pressure around forehead/cheeks or severe throat pain?\n  3. How many days have symptoms persisted?",
        "te": "నమస్కారం {user_name}! దగ్గు మరియు జలుబు ఉపశమనం:\n\n• **ఉపాయాలు:** గోరువెచ్చని ఉప్పునీటితో గార్గ్లింగ్, ఆవిరి పట్టడం, అల్లం-తులసి టీ.\n• **ప్రశ్నలు:** పొడి దగ్గా లేక కఫం వస్తోందా? గొంతులో తీవ్రమైన నొప్పి ఉందా?",
        "hi": "नमस्ते {user_name}! खांसी, जुकाम और गले की खराश का विश्लेषण:\n\n• **उपाय:** गुनगुने नमक पानी के गरारे, भाप लें और अदरक-शहद का सेवन करें।\n• **प्रश्न:** क्या बलगम आ रहा है या सूखी खांसी है? कितने दिनों से समस्या है?"
    },
    "nausea_vomiting": {
        "en": "Hello {user_name}! Reviewing your nausea and vomiting symptoms:\n\n• **Common Triggers:** Acute gastroenteritis, food intolerance, gastritis, motion sickness, or early pregnancy.\n• **Rehydration Protocol:** Do not drink large volumes at once. Sip small spoons of ORS, electrolyte water, or ginger tea every 10 minutes.\n• **Diagnostic Questions:**\n  1. How many episodes of vomiting have occurred in the last 24 hours?\n  2. Are you able to keep sips of liquids down without throwing up?\n  3. Have you noticed fever, diarrhea, or severe localized belly pain?",
        "te": "నమస్కారం {user_name}! వాంతులు మరియు వికారం ఉపశమనం:\n\n• **జాగ్రత్త:** ఒక్కసారిగా ఎక్కువ నీరు త్రాగవద్దు. చెంచాతో ORS నీరు నిదానంగా తీసుకోండి.\n• **ప్రశ్నలు:** గత 24 గంటల్లో ఎన్నిసార్లు వాంతి అయింది? కడుపునొప్పి లేదా జ్వరం ఉందా?",
        "hi": "नमस्ते {user_name}! उल्टी और जी मिचलाने का विश्लेषण:\n\n• **उपाय:** एक साथ ज्यादा पानी न पिएं, छोटे-छोटे घूंट में ORS लें। अदरक का टुकड़ा चबाएं।"
    },
    "diarrhea_loose_motion": {
        "en": "Hello {user_name}! Managing loose motions and diarrhea:\n\n• **Critical Priority:** Preventing dehydration is the primary goal. Drink 1 cup of ORS solution after every loose stool.\n• **Dietary Support:** BRAT diet (Bananas, Rice/congee, Applesauce, Toast) and curd/buttermilk with cumin.\n• **Triage Questions:**\n  1. How many loose bowel movements have occurred today?\n  2. Is there any visible blood, mucus, or dark coloration in the stool?\n  3. Do you have cramps, fever, or signs of dry mouth/dark urine?",
        "te": "నమస్కారం {user_name}! విరేచనాలు (Loose Motions) సంరక్షణ:\n\n• **ముఖ్య జాగ్రత్త:** ప్రతి విరేచనం తర్వాత ఒక గ్లాసు ORS లేదా మజ్జిగ తీసుకోండి.\n• **ప్రశ్నలు:** రోజుకు ఎన్నిసార్లు అవుతోంది? మలంలో రక్తం లేదా జిగట కనిపిస్తోందా?",
        "hi": "नमस्ते {user_name}! दस्त (Loose Motions) का प्रबंधन:\n\n• **प्राथमिकता:** पानी की कमी न होने दें। हर दस्त के बाद ORS या मट्ठा पिएं।\n• **प्रश्न:** दिन में कितनी बार दस्त हुए? क्या पेट में मरोड़ या बुखार है?"
    },
    "constipation_bowel": {
        "en": "Hello {user_name}! Managing bowel irregularity and constipation:\n\n• **Therapeutic Factors:** Dietary fiber deficit, inadequate hydration (<2L daily), lack of physical movement, or medication side effects.\n• **Immediate Relief:** Drink 2 glasses of warm water on an empty stomach, increase soluble fiber (isabgol/psyllium husk, soaked prunes/figs, papaya).\n• **Clinical Questions:**\n  1. How many days has it been since your last normal bowel movement?\n  2. Are you experiencing hard, painful stools or abdominal bloating?\n  3. Have you experienced nausea, severe pain, or bleeding on straining?",
        "te": "నమస్కారం {user_name}! మలబద్ధకం నివారణ సూచనలు:\n\n• **పరిష్కారం:** పరగడుపున గోరువెచ్చని నీరు, బొప్పాయి, నానబెట్టిన అంజీర మరియు పీచు పదార్థాలు.\n• **ప్రశ్నలు:** ఎన్ని రోజులుగా విసర్జన సాఫీగా జరగలేదు? కడుపు ఉబ్బరంగా ఉందా?",
        "hi": "नमस्ते {user_name}! कब्ज और पाचन संबंधी सलाह:\n\n• **उपाय:** पर्याप्त पानी पिएं, पपीता और फाइबर युक्त फल खाएं, सुबह गुनगुना पानी लें।"
    },
    "digestive_abdominal": {
        "en": "Hello {user_name}! Assessing your stomach discomfort and digestion:\n\n• **Common Triggers:** Gastric hyperacidity, peptic irritation, bloating from heavy lentils/spices, or irritable bowel.\n• **Supportive Action:** Eat light non-spicy meals (khichdi, curd rice). Avoid caffeine, carbonated sodas, and lying down within 2 hours after meals.\n• **Triage Questions:**\n  1. Where is the discomfort located: upper belly, lower abdomen, or right lower side?\n  2. Does the discomfort worsen before meals (hunger pangs) or after eating greasy foods?\n  3. Is there sour water coming up in the throat (acid reflux) or gas bloating?",
        "te": "నమస్కారం {user_name}! కడుపునొప్పి మరియు ఎసిడిటీ వివరాలు:\n\n• **సలహాలు:** కారం, మసాలాలు తగ్గించండి. పెరుగు అన్నం, మజ్జిగ తీసుకోండి. భోజనం తర్వాత వెంటనే పడుకోవద్దు.\n• **ప్రశ్నలు:** నొప్పి ఎక్కడ ఉంది (పై కడుపు లేదా కింద)? తిన్న తర్వాత పెరుగుతోందా?",
        "hi": "नमस्ते {user_name}! पेट दर्द और गैस/एसिडिटी का विश्लेषण:\n\n• **उपाय:** हल्का भोजन (खिचड़ी, दही) लें। चाय-कॉफी और तली चीजों से बचें।\n• **प्रश्न:** दर्द पेट के किस हिस्से में है? क्या सीने में जलन या खट्टी डकारें आ रही हैं?"
    },
    "uti_urinary_burning": {
        "en": "Hello {user_name}! Evaluating urinary discomfort and bladder health:\n\n• **Clinical Context:** Burning during urination often indicates urethral or bladder bacterial colonization (Cystitis/UTI).\n• **Conservative Protocol:** Drink 2.5-3 Liters of water daily to flush the urinary tract. Avoid holding urine. Coconut water and unsweetened cranberry assist.\n• **Triage Questions:**\n  1. Is there burning or sharp pain specifically while passing urine?\n  2. Are you having frequent urges to urinate with only small droplets coming out?\n  3. Have you noticed cloudy/pinkish urine, foul odor, or lower back/flank pain?\n• **Medical Threshold:** Fever, chills, or flank pain suggests kidney involvement requiring urgent doctor review.",
        "te": "నమస్కారం {user_name}! మూత్రంలో మంట (UTI) వివరాలు:\n\n• **సంరక్షణ:** రోజుకు 3 లీటర్ల నీరు, కొబ్బరినీళ్ళు త్రాగండి. మూత్రాన్ని ఆపుకోవద్దు.\n• **ప్రశ్నలు:** మూత్రవిసర్జన సమయంలో తీవ్రమైన మంట ఉందా? తరచూ కొద్దికొద్దిగా వస్తోందా? నడుము నొప్పి లేదా జ్వరం ఉందా?",
        "hi": "नमस्ते {user_name}! पेशाब में जलन (UTI) का विश्लेषण:\n\n• **देखभाल:** खूब पानी और नारियल पानी पिएं। पेशाब रोक कर न रखें।\n• **प्रश्न:** क्या पेशाब करते समय तेज जलन होती है? क्या बार-बार पेशाब जाने की इच्छा होती है?"
    },
    "cardiovascular_bp": {
        "en": "Hello {user_name}! Reviewing your blood pressure and cardiovascular wellness{profile_summary}:\n\n• **Parameters:** Optimal resting BP is <120/80 mmHg. Stage 1 hypertension begins at 130/80 mmHg.\n• **Regulation:** Moderate sodium intake (<5g salt/day), DASH diet rich in potassium, and 30-min daily brisk walks.\n• **Triage Questions:**\n  1. What was your most recent systolic and diastolic BP reading?\n  2. Are you feeling chest heaviness, heart racing (palpitations), or shortness of breath?\n  3. Do you have a prior diagnosis of hypertension or are taking regular BP tablets?\n• **Emergency Alert:** Pressure radiating to arm/jaw or sudden sweating requires immediate emergency room care.",
        "te": "నమస్కారం {user_name}! రక్తపోటు (BP) మరియు గుండె ఆరోగ్యం:\n\n• **సాధారణ కొలత:** 120/80 mmHg ఆదర్శవంతమైన రీడింగ్. ఉప్పు తగ్గించండి, రోజూ నడవండి.\n• **ప్రశ్నలు:** మీ తాజా BP రీడింగ్ ఎంత వచ్చింది? గుండె దడ లేదా ఆయాసం ఉందా?",
        "hi": "नमस्ते {user_name}! ब्लड प्रेशर (BP) और हृदय स्वास्थ्य की समीक्षा:\n\n• **सामान्य स्तर:** 120/80 mmHg उत्तम है। खाने में नमक कम करें।\n• **प्रश्न:** आपकी हालिया बीपी रीडिंग क्या है? क्या सीने में भारीपन या घबराहट है?"
    },
    "diabetes_metabolic": {
        "en": "Hello {user_name}! Glycemic and metabolic health analysis{profile_summary}:\n\n• **Benchmarks:** Fasting glucose 70-99 mg/dL is normal (100-125 is prediabetes). Post-prandial should be <140 mg/dL.\n• **Lifestyle Control:** High-fiber complex carbs (methi, millets), lean proteins, and a 15-minute gentle walk after meals.\n• **Triage Questions:**\n  1. What was your latest fasting or post-meal blood sugar reading?\n  2. Are you experiencing unusual excessive thirst, hunger, or frequent nighttime urination?\n  3. Have you tested your 3-month HbA1c test recently?\n• **Safety Alert:** Shaking, cold sweat, or confusion indicates low blood sugar (<70 mg/dL) requiring immediate 15g fast sugar.",
        "te": "నమస్కారం {user_name}! మధుమేహం మరియు రక్తంలో చక్కెర స్థాయిల వివరాలు:\n\n• **ఆదర్శ కొలత:** పరగడుపున గ్లూకోజ్ 70 - 99 mg/dL. భోజనం తర్వాత నడవడం అలవాటు చేసుకోండి.\n• **ప్రశ్నలు:** తాజా షుగర్ లెవెల్స్ ఎంత ఉన్నాయి? అధిక దాహం లేదా రాత్రి వేళల్లో తరచూ మూత్రం వస్తోందా?",
        "hi": "नमस्ते {user_name}! ब्लड शुगर और डायबिटीज का विश्लेषण:\n\n• **लक्ष्य:** खाली पेट शुगर 70-99 mg/dL सामान्य है। मेथी दाना और हरी सब्जियां लें।\n• **प्रश्न:** आपकी हालिया खाली पेट या भोजन के बाद की शुगर कितनी थी? क्या अत्यधिक प्यास लग रही है?"
    },
    "fatigue_weakness_sleep": {
        "en": "Hello {user_name}! Investigating persistent fatigue and low vitality{profile_summary}:\n\n• **Biological Drivers:** Low Ferritin / iron deficiency, Vitamin D3/B12 insufficiency, underactive thyroid (TSH), or chronic unrefreshing sleep.\n• **Therapeutic Steps:** Ensure 7-8 hours restful sleep. Pair iron-rich foods (spinach, beetroot, dates) with Vitamin C (amla, lemon). Spend 15 minutes in morning sun.\n• **Triage Questions:**\n  1. Does fatigue improve after a full night's sleep, or is it present all day?\n  2. Have you checked Hemoglobin, Ferritin, or Thyroid (TSH) in the past 6 months?\n  3. Are you experiencing dizziness, brittle nails, or cold hands and feet?",
        "te": "నమస్కారం {user_name}! నిరంతర అలసట మరియు నీరసం పై విశ్లేషణ:\n\n• **కారణాలు:** ఐరన్ లోపం (హీమోగ్లోబిన్/ఫెర్రిటిన్), విటమిన్ D3 లోపం లేదా థైరాయిడ్ సమస్య.\n• **పరిష్కారం:** పౌష్టికాహారం, ఉదయం ఎండలో కూర్చోవడం, 8 గంటల నిద్ర.\n• **ప్రశ్నలు:** నిద్రపోయిన తర్వాత కూడా అలసట తగ్గడం లేదా? రక్త పరీక్షలు ఎప్పుడు చేయించారు?",
        "hi": "नमस्ते {user_name}! अत्यधिक थकान और कमजोरी का विश्लेषण:\n\n• **मुख्य कारण:** हीमोग्लोबिन, फेरिटिन या विटामिन D3 की कमी।\n• **प्रश्न:** क्या सोने के बाद भी थकान बनी रहती है? क्या हाल ही में CBC या थायरॉइड टेस्ट कराया?"
    },
    "sleep_insomnia": {
        "en": "Hello {user_name}! Managing insomnia and sleep quality:\n\n• **Sleep Architecture:** Cortisol-melatonin rhythm balance is essential for deep cellular repair.\n• **Sleep Hygiene Protocol:** Stop screens 60 minutes before bed, keep room temperature cool, avoid caffeine after 2 PM, and try 4-7-8 relaxation breathing.\n• **Triage Questions:**\n  1. Is the problem falling asleep initially, or waking up repeatedly in the middle of the night?\n  2. How many hours of actual sleep are you getting per night?\n  3. Are you experiencing daytime sleepiness or racing thoughts before sleep?",
        "te": "నమస్కారం {user_name}! నిద్రలేమి సమస్యల పరిష్కారం:\n\n• **సూచనలు:** పడుకునే గంట ముందు మొబైల్ ఆపండి. సాయంత్రం కాఫీ/టీ మానేయండి.\n• **ప్రశ్నలు:** నిద్ర పట్టడం ఆలస్యమవుతోందా లేదా మధ్యలో మెలకువ వస్తోందా?",
        "hi": "नमस्ते {user_name}! अनिद्रा (नींद न आना) का प्रबंधन:\n\n• **उपाय:** सोने से 1 घंटा पहले स्क्रीन बंद करें, कमरे में अंधेरा रखें, प्राणायाम करें।"
    },
    "musculoskeletal_joint_back": {
        "en": "Hello {user_name}! Assessing musculoskeletal and back discomfort:\n\n• **Ergonomic Context:** Lumbar spine disc pressure, poor sitting posture, weak core stabilizers, or muscular spasms.\n• **Conservative Care:** Maintain a neutral spine, do gentle cat-cow stretches, apply warm compresses for 15 mins, and avoid prolonged stationary sitting.\n• **Triage Questions:**\n  1. Does pain stay in the lower back, or radiate down into your buttocks or legs (sciatica)?\n  2. Is there numbness, tingling, or weakness in your feet or toes?\n  3. Did the pain start after lifting something heavy, or develop gradually over weeks?",
        "te": "నమస్కారం {user_name}! నడుము మరియు వెన్నునొప్పి వివరాలు:\n\n• **సలహాలు:** ఎక్కువసేపు ఒకేచోట కూర్చోవద్దు. వేడి నీటి కాపడం పెట్టండి.\n• **ప్రశ్నలు:** నొప్పి కాళ్ళలోకి పాకుతోందా? తిమ్మిర్లు ఉన్నాయా? బరువులు ఎత్తినప్పుడు మొదలైందా?",
        "hi": "नमस्ते {user_name}! कमर और रीढ़ की हड्डी के दर्द का विश्लेषण:\n\n• **उपाय:** सही मुद्रा में बैठें, गर्म सेक लें और भारी वजन उठाने से बचें।\n• **प्रश्न:** क्या दर्द पैरों तक जा रहा है? क्या सुन्नपन या झनझनाहट है?"
    },
    "knee_joint_arthritis": {
        "en": "Hello {user_name}! Reviewing knee and joint comfort:\n\n• **Pathology:** Cartilage wear, synovial irritation, uric acid elevation, or low Calcium/Vitamin D mineralization.\n• **Supportive Action:** Low-impact movement (swimming, cycling), hot/cold therapy, maintaining healthy joint load, and turmeric-curcumin intake.\n• **Triage Questions:**\n  1. Is there swelling, warmth, or redness around the affected joint?\n  2. Is stiffness worse in the morning for >30 minutes (rheumatoid indicator)?\n  3. Do you hear cracking/grating sounds with walking or climbing stairs?",
        "te": "నమస్కారం {user_name}! మోకాళ్ళు మరియు కీళ్ళ నొప్పుల వివరాలు:\n\n• **సూచనలు:** బరువు తగ్గించడం, తేలికపాటి వ్యాయామాలు, పసుపు-పాలు.\n• **ప్రశ్నలు:** కీళ్ళలో వాపు లేదా వేడి ఉందా? ఉదయం లేచినప్పుడు బిగుతుగా ఉంటోందా?",
        "hi": "नमस्ते {user_name}! घुटनों और जोड़ों के दर्द का विश्लेषण:\n\n• **प्रश्न:** क्या जोड़ों में सूजन या लालिमा है? क्या सुबह उठने पर जोड़ों में अकड़न रहती है?"
    },
    "muscle_body_pain": {
        "en": "Hello {user_name}! Evaluating generalized body aches and muscle soreness:\n\n• **Underlying Drivers:** Post-viral myalgia, intense physical exertion, dehydration, low potassium/magnesium, or fibromyalgia.\n• **Relief:** Warm Epsom salt bath, adequate electrolyte hydration, light full-body stretching, and adequate protein intake.\n• **Triage Questions:**\n  1. Did the body ache start alongside a fever, cough, or cold?\n  2. Are the aches generalized all over, or localized to specific muscle groups?\n  3. How many days have the muscle aches lasted?",
        "te": "నమస్కారం {user_name}! ఒంటి నొప్పులు మరియు కండరాల నొప్పి వివరాలు:\n\n• **సంరక్షణ:** గోరువెచ్చని నీటి స్నానం, ఎలక్ట్రోలైట్ ద్రవాలు, తగినంత విశ్రాంతి.\n• **ప్రశ్నలు:** జ్వరంతో పాటు ఒంటి నొప్పులు వచ్చాయా? ఎన్ని రోజులుగా ఉన్నాయి?",
        "hi": "नमस्ते {user_name}! बदन दर्द और मांसपेशियों में खिंचाव का प्रबंधन:\n\n• **प्रश्न:** क्या बदन दर्द बुखार के साथ है? क्या अत्यधिक थकान या कमजोरी भी है?"
    },
    "skin_dermatology": {
        "en": "Hello {user_name}! Dermatological and skin allergy assessment:\n\n• **Causes:** Contact dermatitis (soaps, cosmetics, fabric), allergic urticaria, fungal infection, or eczema.\n• **Safe First Steps:** Avoid scratching, wash gently with fragrance-free cleanser, apply cold compresses or calamine, and avoid hot showers.\n• **Triage Questions:**\n  1. Where on your body is the rash/itching located, and is it spreading?\n  2. Have you introduced any new food, laundry detergent, soap, or medications?\n  3. Are there raised red welts (hives), blisters, or peeling skin?\n• **Red Flag:** Any swelling of the lips, eyes, or throat requires immediate emergency care.",
        "te": "నమస్కారం {user_name}! చర్మ సమస్యలు మరియు దురద వివరాలు:\n\n• **జాగ్రత్త:** చర్మాన్ని గోకవద్దు. సువాసన లేని సబ్బులు వాడండి, చల్లని కాపడం పెట్టండి.\n• **ప్రశ్నలు:** దద్దుర్లు ఎక్కడ ఉన్నాయి? కొత్త ఆహారం లేదా మందులు ఏమైనా తీసుకున్నారా?",
        "hi": "नमस्ते {user_name}! त्वचा की एलर्जी और खुजली का विश्लेषण:\n\n• **उपाय:** त्वचा को खुजलाएं नहीं, माइल्ड साबुन का प्रयोग करें, ठंडी सिकाई करें।\n• **प्रश्न:** क्या चकत्ते फैल रहे हैं? क्या होठों या चेहरे पर सूजन है?"
    },
    "acne_skincare": {
        "en": "Hello {user_name}! Acne and skincare management:\n\n• **Hormonal & Sebum Factors:** Excess sebum, C. acnes bacteria, high glycemic diet, or PCOS androgen surges.\n• **Skin Routine:** Gentle salicylic acid wash, non-comedogenic gel moisturizer, spearmint tea, and avoiding touching the face.\n• **Triage Questions:**\n  1. Is the acne primarily whiteheads/blackheads or deep painful hormonal cysts around jawline/chin?\n  2. Does acne flare right before your menstrual cycle?\n  3. What skincare active ingredients are you currently using?",
        "te": "నమస్కారం {user_name}! మొటిమలు (Acne) సంరక్షణ వివరాలు:\n\n• **సలహాలు:** ముఖాన్ని తరచూ తాకవద్దు, తక్కువ గ్లైసెమిక్ ఆహారం తీసుకోండి, పుష్కలంగా నీరు త్రాగండి.\n• **ప్రశ్నలు:** మొటిమలు దవడల వద్ద ఎక్కువగా వస్తున్నాయా? పీరియడ్స్ కు ముందు పెరుగుతున్నాయా?",
        "hi": "नमस्ते {user_name}! कील-मुहांसों और त्वचा की देखभाल:\n\n• **प्रश्न:** क्या मुहांसे जबड़े के पास हैं? क्या ये पीरियड्स से पहले बढ़ जाते हैं?"
    },
    "hair_fall_loss": {
        "en": "Hello {user_name}! Investigating hair fall and scalp vitality:\n\n• **Biological Root Causes:** Telogen effluvium (stress, post-viral), low Ferritin (<50 ng/mL), Vitamin D3 or B12 deficiency, or thyroid fluctuations.\n• **Nutritional Support:** Biotin, pumpkin seeds, curry leaves, amla, and checking serum Ferritin stores.\n• **Triage Questions:**\n  1. Are hairs shedding with the white root bulb intact, or snapping along the shaft?\n  2. Have you experienced major illness, high fever, or severe emotional stress in the last 3-4 months?\n  3. Is the thinning generalized across the whole scalp, or concentrated in a widening part-line?",
        "te": "నమస్కారం {user_name}! జుట్టు రాలడం పై విశ్లేషణ:\n\n• **కారణాలు:** రక్తం లో ఫెర్రిటిన్ (ఐరన్) లోపం, విటమిన్ D లోపం, ఒత్తిడి లేదా థైరాయిడ్.\n• **ప్రశ్నలు:** జుట్టు కుదుళ్ళ నుంచి రాలుతోందా? గత 3 నెలల్లో తీవ్రమైన జ్వరం లేదా ఒత్తిడి ఉందా?",
        "hi": "नमस्ते {user_name}! बाल झड़ने और स्कैल्प की समस्याओं का विश्लेषण:\n\n• **प्रश्न:** क्या बाल जड़ों से टूट रहे हैं? क्या हाल ही में गंभीर तनाव या बुखार हुआ था?"
    },
    "eye_vision_pain": {
        "en": "Hello {user_name}! Ophthalmic and eye discomfort assessment:\n\n• **Common Conditions:** Digital eye strain, dry eyes, allergic conjunctivitis, or viral conjunctivitis.\n• **Visual Hygiene:** 20-20-20 rule (every 20 mins, look 20 feet away for 20 secs), use preservative-free lubricating drops, wash hands.\n• **Triage Questions:**\n  1. Is there discharge (sticky yellow crust or clear watery tears)?\n  2. Do you have sharp eye pain, light sensitivity, or any blurred vision?\n  3. Have you been wearing contact lenses recently?",
        "te": "నమస్కారం {user_name}! కంటి సమస్యల వివరాలు:\n\n• **జాగ్రత్త:** స్క్రీన్ సమయం తగ్గించండి. కళ్ళను రుద్దవద్దు. చల్లని నీటితో కడగండి.\n• **ప్రశ్నలు:** కళ్ళలో నుండి నీరు లేదా చీము వస్తోందా? చూపు మందగించడం ఉందా?",
        "hi": "नमस्ते {user_name}! आंखों में जलन और दर्द का विश्लेषण:\n\n• **प्रश्न:** क्या आंखों से पानी या चिपचिपा स्राव निकल रहा है? क्या देखने में धुंधलापन है?"
    },
    "ear_pain_infection": {
        "en": "Hello {user_name}! Otologic and ear discomfort assessment:\n\n• **Pathways:** Otitis media (middle ear infection post-cold), swimmer's ear (water entrapment), wax impaction, or jaw TMJ referred pain.\n• **Self-Care:** Keep ear dry, apply a warm washcloth over outer ear. Never insert cotton buds into ear canal.\n• **Triage Questions:**\n  1. Is the ear pain throbbing, sharp, or aggravated when pulling the earlobe?\n  2. Has there been any fluid drainage, reduced hearing, or fever?\n  3. Did the pain develop following a recent cold or sinus congestion?",
        "te": "నమస్కారం {user_name}! చెవి నొప్పి వివరాలు:\n\n• **జాగ్రత్త:** చెవిలో బడ్స్ పెట్టవద్దు. చెవి లోపలికి నీరు వెళ్ళకుండా చూసుకోండి.\n• **ప్రశ్నలు:** చెవిలో నుండి ద్రవం కారుతోందా? వినికిడి తగ్గిందా? జలుబు తర్వాత మొదలైందా?",
        "hi": "नमस्ते {user_name}! कान दर्द और संक्रमण का विश्लेषण:\n\n• **प्रश्न:** क्या कान से कोई पानी आ रहा है? क्या सुनने में कठिनाई हो रही है?"
    },
    "dental_toothache": {
        "en": "Hello {user_name}! Dental and oral discomfort review:\n\n• **Pathology:** Dental pulpitis/cavity, gum inflammation (gingivitis), cracked tooth, or wisdom tooth impaction.\n• **Temporary Relief:** Warm salt water rinses (3x daily), apply a dab of clove oil on cotton, avoid hot/cold liquids.\n• **Triage Questions:**\n  1. Is the pain triggered by cold/hot drinks, or is it continuous throbbing?\n  2. Do you see swelling in your gums, cheek, or under your jawline?\n  3. How long has the tooth pain been present?",
        "te": "నమస్కారం {user_name}! పంటి నొప్పి ఉపశమనం:\n\n• **ఉపాయాలు:** గోరువెచ్చని ఉప్పునీటితో పుక్కిలించండి, లవంగ నూనె రాయండి.\n• **ప్రశ్నలు:** చల్లని/వేడి పదార్థాలు తిన్నప్పుడు నొప్పి వస్తోందా? చిగుళ్ళలో వాపు ఉందా?",
        "hi": "नमस्ते {user_name}! दांत दर्द और मसूड़ों की समस्या:\n\n• **उपाय:** गुनगुने नमक पानी से कुल्ला करें, लौंग का तेल लगाएं।\n• **प्रश्न:** क्या ठंडा-गर्म खाने से झनझनाहट होती है? क्या मसूड़ों में सूजन है?"
    },
    "mental_health_anxiety": {
        "en": "Hello {user_name}! Prioritizing your emotional and mental wellbeing:\n\n• **Physiological Link:** Elevated cortisol triggers autonomic arousal (heart racing, muscle tension, shallow breathing).\n• **Grounding Strategies:** 4-7-8 breathing method (inhale 4s, hold 7s, exhale 8s), 5-4-3-2-1 sensory grounding, limiting caffeine.\n• **Exploratory Questions:**\n  1. How is anxiety affecting your daily sleep, appetite, and ability to focus?\n  2. Are you experiencing physical symptoms like palpitations, trembling, or chest tightness?\n  3. Would you like a guided relaxation protocol or help finding a licensed therapist?",
        "te": "నమస్కారం {user_name}! మానసిక ప్రశాంతత మరియు ఒత్తిడి నిర్వహణ:\n\n• **సలహాలు:** 4-7-8 శ్వాస వ్యాయామం, ధ్యానం, సాయంత్రం స్క్రీన్ వాడకం తగ్గించడం.\n• **ప్రశ్నలు:** ఆందోళన మీ నిద్రను ఎలా ప్రభావితం చేస్తోంది? గుండె వేగంగా కొట్టుకోవడం లేదా భయం అనిపిస్తోందా?",
        "hi": "नमस्ते {user_name}! मानसिक शांति और तनाव प्रबंधन:\n\n• **उपाय:** प्राणायाम (गहरी सांस लेना), 10 मिनट ध्यान, कैफीन का कम सेवन।\n• **प्रश्न:** क्या घबराहट या दिल की धड़कन तेज होती है? नींद पर इसका क्या असर है?"
    },
    "depression_mood": {
        "en": "Hello {user_name}! Supporting you with compassion and care:\n\n• **Neurobiological Reality:** Depression is a real health condition linked to neurotransmitter shifts, chronic inflammation, and hormonal changes.\n• **Supportive Daily Steps:** Spend 20 mins in morning sunlight, set 1 micro-goal per day, reach out to a trusted loved one.\n• **Triage Questions:**\n  1. How long have you felt persistently low, empty, or exhausted (>2 weeks)?\n  2. Are you having changes in sleep (sleeping too much or insomnia) and appetite?\n  3. Are you feeling safe right now? (National Helpline: 14416 is available 24/7 free).",
        "te": "నమస్కారం {user_name}! మీ మానసిక ఆరోగ్యం మా ప్రాధాన్యత:\n\n• **సహాయం:** ఒంటరిగా ఉండకండి, కుటుంబ సభ్యులతో మాట్లాడండి. టెలి-మానస్ హెల్ప్‌లైన్: 14416.\n• **ప్రశ్నలు:** నిరాశ ఎన్ని రోజులుగా వేధిస్తోంది? ఆకలి మరియు నిద్రలో మార్పులు ఉన్నాయా?",
        "hi": "नमस्ते {user_name}! उदासी और मानसिक स्वास्थ्य पर मार्गदर्शन:\n\n• **सहायता:** किसी अपने से बात करें। टेली-मानस हेल्पलाइन 14416 चौबीसों घंटे उपलब्ध है।"
    },
    "male_health_prostate": {
        "en": "Hello {user_name}! Tailored Male Health & Vitality Guidance{profile_summary}:\n\n• **Prostate & Endocrine Health:** Proper hydration, reducing evening fluids, zinc-rich nutrition (pumpkin seeds, lentils, almonds).\n• **Vitality Support:** Consistent resistance training and 7-8 hours sleep naturally regulate testosterone and physical stamina.\n• **Triage Questions:**\n  1. Are you experiencing a weak urinary stream, hesitancy, or waking >2 times per night to pee?\n  2. Have you noticed changes in stamina, workout recovery, or morning energy levels?\n  3. Would you like age-specific guidance on PSA screening tests?",
        "te": "నమస్కారం {user_name}! పురుషుల ఆరోగ్యం మరియు జీవశక్తి వివరాలు:\n\n• **సంరక్షణ:** ప్రోటీన్, జింక్ కలిగిన ఆహారం మరియు తగినంత నిద్ర టెస్టోస్టెరాన్ సమతుల్యతకు తోడ్పడతాయి.\n• **ప్రశ్నలు:** రాత్రి వేళల్లో తరచూ మూత్రవిసర్జన చేయాల్సి వస్తోందా? శారీరక స్టామినాలో మార్పు ఉందా?",
        "hi": "नमस्ते {user_name}! पुरुष स्वास्थ्य और स्टैमिना मार्गदर्शन:\n\n• **प्रश्न:** क्या रात में बार-बार पेशाब आने या धार कमजोर होने की समस्या है? क्या थकान ज्यादा महसूस हो रही है?"
    },
    "postpartum_recovery": {
        "en": "Dear {user_name}, here is your Postpartum Recovery & Fourth-Trimester Clinical Guide{profile_summary}:\n\n• **Physical Healing:** Uterine involution takes 6 weeks. Bleeding (lochia) transitions from bright red to pink to pale white/yellow.\n• **Wound & Lactation Care:** For C-sections, keep the incision clean and dry; for perineal tears, warm water sitz baths provide relief. Frequent gentle latching relieves engorgement.\n• **Mental Wellbeing:** 'Baby blues' peak at days 3-5. If persistent anxiety, insomnia, or profound sadness continues past 2 weeks, maternal mental healthcare is essential.\n• **Clinical Questions for You:**\n  1. How many weeks postpartum are you, and was your delivery vaginal or cesarean?\n  2. Are you soaking more than one full sanitary pad per hour or passing large clots?\n  3. Are you experiencing fever, severe breast tenderness, or persistent low mood?\n• **Emergency Red Flags:** Soaking >1 pad/hour, fever >100.4°F with foul discharge, or severe headache with visual blur requires immediate ER care.",
        "te": "ప్రియమైన {user_name}, ప్రసవానంతర సంరక్షణ మరియు రికవరీ గైడ్:\n\n• **శారీరక స్వస్థత:** గర్భాశయం సాధారణ స్థితికి రావడానికి 6 వారాలు పడుతుంది. లోకియా (రక్తస్రావం) క్రమంగా తగ్గుతుంది. గాయం వద్ద పరిశుభ్రత పాటించండి.\n• **మానసిక ఆరోగ్యం:** ప్రసవం తర్వాత డిప్రెషన్ లేదా ఆందోళన ఉంటే కుటుంబ సభ్యులతో మాట్లాడండి.\n• **ప్రశ్నలు:** డెలివరీ అయి ఎన్ని వారాలైంది? గంటకు ఒక ప్యాడ్ కంటే ఎక్కువ తడుస్తోందా? జ్వరం లేదా రొమ్ము నొప్పి ఉందా?\n• **అత్యవసరం:** అధిక రక్తస్రావం లేదా తీవ్రమైన జ్వరం ఉంటే వెంటనే ఆసుపత్రికి వెళ్ళండి.",
        "hi": "प्रिय {user_name}, प्रसवोत्तर (डिलीवरी के बाद) देखभाल और स्वास्थ्य गाइड:\n\n• **शारीरिक सुधार:** रिकवरी में 6 सप्ताह लगते हैं। टांकों की सफाई रखें, गुनगुने पानी से सिकाई करें और पर्याप्त तरल पदार्थ लें।\n• **मानसिक स्वास्थ्य:** डिलीवरी के बाद अत्यधिक उदासी या चिंता होने पर डॉक्टर से बात करें।\n• **महत्वपूर्ण प्रश्न:** डिलीवरी को कितने सप्ताह हुए हैं? क्या रक्तस्राव बहुत अधिक है (1 घंटे में 1 से अधिक पैड)? क्या बुखार या सीने में तेज दर्द है?\n• **चेतावनी:** अत्यधिक रक्तस्राव या 100.4°F से अधिक बुखार पर तुरंत अस्पताल जाएं।"
    },
    "teen_health": {
        "en": "Hello {user_name}! Adolescent & Teen Health Guidance{profile_summary}:\n\n• **Menstrual Maturation:** The hypothalamic-pituitary-ovarian axis takes 2 to 3 years to fully mature after menarche, making irregular cycle lengths very common.\n• **Cramp Relief:** Prostaglandin production causes dysmenorrhea. Hydration, magnesium-rich seeds, warm heat packs, and light stretching offer gentle relief.\n• **Iron & Energy:** Blood loss during growth spurts increases risk of teen anemia. Include moringa, lentils, jaggery, and citrus fruits.\n• **Clinical Questions for You:**\n  1. What is your age, and how long ago was your first menstrual period (menarche)?\n  2. Are cramps causing you to miss school or stay in bed?\n  3. Are you experiencing heavy bleeding, severe acne, or unexpected fatigue and dizziness?",
        "te": "నమస్కారం {user_name}! టీనేజ్ మరియు కౌమార దశ బాలికల ఆరోగ్య వివరాలు:\n\n• **పీరియడ్స్ ప్రారంభం:** మొదటి 2 సంవత్సరాలు రుతుచక్రం అనిశ్చితంగా ఉండటం సాధారణమే. వేడి కాపడం మరియు మంచి ఆహారం నొప్పిని తగ్గిస్తాయి.\n• **రక్తహీనత నివారణ:** పాలకూర, బెల్లం, వేరుశనగలు మరియు పప్పుధాన్యాలు తింటే నీరసం తగ్గుతుంది.\n• **ప్రశ్నలు:** మీ వయస్సు ఎంత? పీరియడ్స్ ప్రారంభమై ఎన్ని నెలలైంది? కడుపునొప్పి వల్ల స్కూల్ కు సెలవు పెట్టాల్సి వస్తోందా?",
        "hi": "नमस्ते {user_name}! टीनएज और युवा लड़कियों के लिए स्वास्थ्य गाइड:\n\n• **मासिक धर्म चक्र:** पहले 2 साल पीरियड्स का अनियमित होना सामान्य है। पेट दर्द के लिए गर्म पानी की सिकाई और संतुलित आहार लें।\n• **आयरन और पोषण:** कमजोरी से बचने के लिए हरी पत्तेदार सब्जियां, गुड़ और दालें खाएं।\n• **प्रश्न:** आपकी उम्र क्या है? क्या पीरियड्स के दर्द से स्कूल छूट रहा है? क्या बहुत ज्यादा ब्लीडिंग या मुहांसों की समस्या है?"
    },
    "family_ally_care": {
        "en": "Hello {user_name}! Family Ally & Caregiver Support Hub:\n\n• **Empathetic Caregiving:** Supporting a loved one through postpartum recovery, menstrual pain, or chronic health needs requires clear symptom tracking and emotional presence.\n• **Comfort Measures:** Prepare warm nutritious meals, ensure regular hydration, help track medication schedules, and facilitate restful sleep.\n• **Checklist Questions for You:**\n  1. Which family member are you assisting today (daughter, partner, mother, or other)?\n  2. What is their primary discomfort or recovery need right now?\n  3. Are there specific medication instructions or doctor follow-up dates you need help organizing?",
        "te": "నమస్కారం {user_name}! కుటుంబ సభ్యుల సంరక్షణ మరియు మద్దతు గైడ్:\n\n• **కుటుంబ సంరక్షణ:** మీ కుమార్తె, భార్య లేదా తల్లి ఆరోగ్య రికవరీలో మీరు అండగా ఉండడం చాలా ముఖ్యం.\n• **ప్రశ్నలు:** మీరు ఎవరి ఆరోగ్యం కోసం చూస్తున్నారు? వారి ప్రస్తుత సమస్య ఏమిటి? డాక్టర్ సూచించిన మందులు సరిగ్గా వేసుకుంటున్నారా?",
        "hi": "नमस्ते {user_name}! परिवार और देखभालकर्ता (Family Ally) सहायता:\n\n• **देखभाल:** अपनी बेटी, पत्नी या माताजी के स्वास्थ्य में सहयोग करना अत्यंत महत्वपूर्ण है। पौष्टिक आहार और आराम का ध्यान रखें।\n• **प्रश्न:** आप परिवार के किस सदस्य की सहायता कर रहे हैं? उनकी मुख्य समस्या क्या है? क्या डॉक्टर का परामर्श लिया गया है?"
    },
    "pregnancy_maternal": {
        "en": "Dear {user_name}, here is your maternal and antenatal educational guide{profile_summary}:\n\n• **Trimester Milestones:** Daily 400mcg folic acid (T1), ultrasound anomaly scan at 18-20 weeks (T2), kick counts monitoring (T3).\n• **Nutritional Balance:** Iron, calcium, and balanced hydration reduce nausea and maintain amniotic balance.\n• **Triage Questions:**\n  1. What is your current pregnancy week/trimester?\n  2. Are you feeling regular active fetal movements (target 10 kicks in 2 hours)?\n  3. Have you experienced severe headaches, sudden hand/face swelling, or spotting?\n• **Emergency Alert:** Any fluid leakage, vaginal bleeding, or decreased fetal movements requires urgent obstetric care.",
        "te": "ప్రియమైన {user_name}, గర్భధారణ సంరక్షణ సూచనలు:\n\n• **త్రైమాసిక జాగ్రత్తలు:** మొదటి త్రైమాసికంలో ఫోలిక్ యాసిడ్, రెండవ త్రైమాసికంలో ఐరన్-కాల్షియం, మూడవ త్రైమాసికంలో కిక్స్ కౌంట్.\n• **ప్రశ్నలు:** గర్భధారణ ఎన్నో వారం? శిశువు కదలికలు బాగానే ఉన్నాయా? తీవ్ర తలనొప్పి లేదా వాపులు ఉన్నాయా?",
        "hi": "प्रिय {user_name}, गर्भावस्था देखभाल मार्गदर्शन:\n\n• **सलाह:** फोलिक एसिड, आयरन-कैल्शियम और नियमित चेकअप आवश्यक हैं।\n• **प्रश्न:** कौन सा सप्ताह चल रहा है? क्या बच्चे की दैनिक हलचल सामान्य है? क्या कोई रक्तस्राव या सिरदर्द है?"
    },
    "menopause_perimenopause": {
        "en": "Hello {user_name}! Perimenopause and Menopause Transition Support:\n\n• **Hormonal Changes:** Estrogen and progesterone shifts cause vasomotor changes (hot flashes, night sweats) and mood swings.\n• **Supportive Action:** Phytoestrogen-rich foods (flaxseeds, soy, tofu), calcium-dense ragi/dairy, cooling layers, and weight-bearing exercise for bone density.\n• **Triage Questions:**\n  1. Are you having sudden waves of intense body heat (hot flashes) or night sweats?\n  2. How many months has it been since your last menstrual period?\n  3. Are sleep difficulties, joint aches, or mood fluctuations interfering with daily tasks?",
        "te": "నమస్కారం {user_name}! మెనోపాజ్ మరియు హార్మోన్ల మార్పుల వివరాలు:\n\n• **సలహాలు:** అవిసె గింజలు, రాగులు, సోయా మరియు వ్యాయామం ఎముకల బలానికి తోడ్పడతాయి.\n• **ప్రశ్నలు:** అకస్మాత్తుగా వేడి ఆవిర్లు (Hot Flashes) లేదా రాత్రి చెమటలు పడుతున్నాయా? చివరి పీరియడ్ ఎప్పుడు వచ్చింది?",
        "hi": "नमस्ते {user_name}! मेनोपॉज (रजोनिवृत्ति) और हार्मोनल बदलाव:\n\n• **प्रश्न:** क्या अचानक बहुत गर्मी (Hot Flashes) लगती है? अंतिम मासिक धर्म को कितने महीने हुए हैं?"
    },
    "womens_health_pcos_cycle": {
        "en": "Hello {user_name}! Women's Menstrual, Cycle & PCOS Health Guidance:\n\n• **Cycle Regularity:** Normal intervals range from 21 to 35 days. Irregular cycles often correlate with insulin resistance, thyroid, or stress.\n• **PCOS Nutrition:** Low-GI complex carbohydrates, spearmint tea, inositol-rich foods, and resistance training.\n• **Cramp Relief:** Magnesium seeds, warm heating pack on pelvis, and hydration.\n• **Triage Questions:**\n  1. How many days does your typical cycle last, and is your current period delayed?\n  2. Are cramps mild, or severe enough to disrupt work/school and require painkillers?\n  3. Are you managing symptoms like facial hair, cystic acne, or unexplained weight gain?",
        "te": "నమస్కారం {user_name}! మహిళల రుతుచక్రం మరియు PCOS ఆరోగ్యం:\n\n• **సూచనలు:** వ్యాయామం, సమతుల్య ఆహారం, వేడి కాపడం నొప్పిని తగ్గిస్తాయి.\n• **ప్రశ్నలు:** మీ సైకిల్ ఎన్ని రోజులకు వస్తుంది? కడుపునొప్పి తీవ్రంగా ఉందా? మొటిమలు లేదా బరువు పెరుగుతున్నారా?",
        "hi": "नमस्ते {user_name}! मासिक धर्म, हार्मोन और PCOS मार्गदर्शन:\n\n• **प्रश्न:** आपका चक्र कितने दिनों का है और क्या यह देर से हुआ? क्या पेट में तेज दर्द या भारी रक्तस्राव है?"
    },
    "report_explainer": {
        "en": "Hello {user_name}! Let's review your laboratory report results{profile_summary}.\n\n• **Hemoglobin (Hb):** Normal adult reference range is 12.0 - 15.5 g/dL (women) and 13.5 - 17.5 g/dL (men). Low levels indicate anemia.\n• **TSH (Thyroid):** Healthy baseline is 0.4 - 4.5 uIU/mL. Regulates systemic metabolic rate.\n• **Fasting Blood Sugar:** Normal range is 70 - 99 mg/dL.\n• **Lipid Profile:** Total cholesterol < 200 mg/dL, LDL < 100 mg/dL, HDL > 50 mg/dL.\n• **Triage Questions:**\n  1. Which specific test parameter on your report was flagged out of range?\n  2. What is the printed value and unit (e.g. Hb 11.2 g/dL)?\n  3. Are you experiencing symptoms related to this test (e.g. fatigue with low Hb)?",
        "te": "నమస్కారం {user_name}! మీ ల్యాబ్ పరీక్ష ఫలితాల వివరణ:\n\n• **హీమోగ్లోబిన్:** 12.0 - 15.5 g/dL సాధారణ పరిధి.\n• **TSH (థైరాయిడ్):** 0.4 - 4.5 uIU/mL.\n• **ప్రశ్నలు:** మీ నివేదికలో ఏ పరీక్ష ఫలితం హెచ్చుతగ్గులుగా వచ్చింది? దానికి తగిన లక్షణాలు ఏవైనా ఉన్నాయా?",
        "hi": "नमस्ते {user_name}! आपकी प्रयोगशाला रिपोर्ट की समीक्षा:\n\n• **हीमोग्लोबिन:** 12.0 - 15.5 g/dL सामान्य है।\n• **प्रश्न:** आपकी रिपोर्ट में कौन सा टेस्ट सामान्य से अधिक या कम आया है?"
    },
    "nutrition_diet": {
        "en": "Hi {user_name}! Evidence-backed personalized nutritional principles:\n\n1. **Iron & Hemoglobin:** Moringa, spinach, beetroot, dates, paired with Vitamin C (amla, lemon) to maximize absorption.\n2. **Protein Balance:** Target 0.8 - 1.0g protein per kg body weight (lentils, paneer, eggs, sprouts).\n3. **Bone & Calcium:** Sesame seeds, ragi, and dairy/plant milks with morning sun for Vitamin D3.\n4. **Hydration:** Target 2.2 - 2.5 Liters of water daily.\n• **Triage Questions:**\n  1. What is your primary nutritional goal (boosting iron, weight management, blood sugar control)?\n  2. Are you vegetarian, vegan, or non-vegetarian?\n  3. Do you have digestive intolerances like lactose or gluten sensitivity?",
        "te": "నమస్కారం {user_name}! సమతుల్య పోషకాహార సూచనలు:\n\n1. **ఐరన్ & రక్తం:** మునగాకు, పాలకూర, బీట్‌రూట్, బెల్లం, ఉసిరి.\n2. **ప్రోటీన్:** పప్పుధాన్యాలు, పనీర్, గుడ్లు, మొలకలు. రోజూ 2.5L నీరు త్రాగండి.\n• **ప్రశ్నలు:** మీ ఆహార ప్రాధాన్యత ఏమిటి (శాకాహారమా లేదా మాంసాహారమా)?",
        "hi": "नमस्ते {user_name}! पोषण और स्वस्थ आहार संबंधी दिशा-निर्देश:\n\n1. **आयरन:** सहजन, पालक, चुकंदर, आंवला।\n2. **प्रोटीन:** दालें, पनीर, अंडे। दिन में 2.5L पानी पिएं।\n• **प्रश्न:** आपका मुख्य लक्ष्य क्या है (आयरन बढ़ाना, वजन कम करना या शुगर नियंत्रण)?"
    },
    "care_navigation": {
        "en": "Hello {user_name}! Care Navigation & Clinical Specialist Matching:\n\n• **General Physician:** For comprehensive reviews, acute fevers, respiratory infections, and primary checkups.\n• **Gynecologist (OB-GYN):** For menstrual variations, PCOS, pelvic pain, or pregnancy.\n• **Endocrinologist:** For thyroid, diabetes, or metabolic hormone evaluations.\n• **Cardiologist:** For blood pressure management and cardiovascular reviews.\n• **Preparation Checklist Questions:**\n  1. What city or locality are you searching for care in?\n  2. Are you seeking an in-person physical consultation or a video teleconsultation?\n  3. Do you have your recent lab reports ready to share with the doctor?",
        "te": "నమస్కారం {user_name}! వైద్య సేవల గైడ్ మరియు నిపుణుల ఎంపిక:\n\n• **గైనకాలజిస్ట్:** పీరియడ్స్, పిసిఒడి, ప్రెగ్నెన్సీ కొరకు.\n• **జనరల్ ఫిజీషియన్:** జ్వరం, నీరసం, సాధారణ తనిఖీలకు.\n• **ప్రశ్నలు:** మీరు ఏ నగరంలో వైద్యుడిని వెతుకుతున్నారు? ఆన్‌లైన్ కన్సల్టేషన్ కావాలా?",
        "hi": "नमस्ते {user_name}! विशेषज्ञ डॉक्टर मार्गदर्शन:\n\n• **प्रश्न:** आप किस शहर में डॉक्टर तलाश रहे हैं? क्या आपके पास पिछली रिपोर्ट मौजूद है?"
    },
    "timeline_history": {
        "en": "Hello {user_name}! Reviewing your Health Twin longitudinal history{profile_summary}:\n\n• All vital logs, diagnostic reports, and assessments are recorded in chronological order.\n• Multi-month tracking highlights subtle biological trends in BP, fasting glucose, and hemoglobin.\n• View the **Health Twin Timeline** tab for comparative diagnostic milestones.\n• **Questions for You:**\n  1. Would you like to compare recent blood pressure readings with last month?\n  2. Do you want to log new vitals today to keep your health trajectory accurate?",
        "te": "నమస్కారం {user_name}! మీ హెల్త్ ట్విన్ కాలక్రమ వివరాలు సురక్షితంగా రికార్డ్ చేయబడ్డాయి. టైమ్‌లైన్ ట్యాబ్ లో మార్పులను పరిశీలించండి.",
        "hi": "नमस्ते {user_name}! आपकी हेल्थ ट्विन समयरेखा सुरक्षित है। नियमित ट्रैकिंग से स्वास्थ्य सुधार का पता चलता है।"
    },
    "general_triage": {
        "en": "Hello {user_name}! I am your **SHE Twin AI Clinical Assistant**{profile_summary}.\n\nTell me about your specific health concern, symptom, or uploaded lab test. I can assist across specific domains including headaches, fevers, cough & cold, abdominal pain, blood pressure, women's hormones, diabetes, sleep, and lab reports.\n\n• **To help me evaluate your symptoms, please share:**\n  1. What is the primary symptom or discomfort you are feeling today?\n  2. How many days has it been present, and is it getting better or worse?\n  3. Are there any accompanying symptoms like fever, nausea, or dizziness?",
        "te": "నమస్కారం {user_name}! నేను మీ **SHE Twin AI క్లినికల్ సహాయకుడిని**.\n\nమీరు ఎదుర్కొంటున్న ఏదైనా లక్షణం (తలనొప్పి, జ్వరం, దగ్గు, కడుపునొప్పి, ఎసిడిటీ, అలసట లేదా ల్యాబ్ రిపోర్టులు) గురించి అడగండి. ఖచ్చితమైన విశ్లేషణ అందిస్తాను.\n\n• **నాకు తెలియజేయండి:** మీ ప్రధాన లక్షణం ఏమిటి? ఎన్ని రోజులుగా ఉంది? ఇతర సమస్యలు ఏమైనా ఉన్నాయా?",
        "hi": "नमस्ते {user_name}! मैं आपका **SHE Twin AI क्लिनिकल सहायक** हूँ।\n\nसिरदर्द, बुखार, खांसी, पेट दर्द, एसिडिटी, कमजोरी या लैब रिपोर्ट से जुड़ा कोई भी प्रश्न पूछें।\n\n• **कृपया बताएं:** मुख्य लक्षण क्या है? यह कितने दिनों से है? क्या साथ में बुखार या उल्टी है?"
    }
}

# Domain-specific, highly differentiated suggested follow-ups
FOLLOW_UP_QUESTIONS_MAP: Dict[str, Dict[str, List[str]]] = {
    "headache_migraine": {
        "en": [
            "It is throbbing and on one side of my head",
            "What natural remedies relieve tension headaches?",
            "When should I be concerned about a headache?"
        ],
        "te": [
            "తలనొప్పి ఒకవైపు దడదడలాడుతూ ఉంది",
            "తలనొప్పి తగ్గడానికి సహజ చిట్కాలు ఏమిటి?",
            "తలనొప్పి ఎప్పుడు ప్రమాదకరం కావచ్చు?"
        ],
        "hi": [
            "सिरदर्द एक तरफा और तेज टीस वाला है",
            "तनाव वाले सिरदर्द के घरेलू उपाय क्या हैं?",
            "सिरदर्द के खतरे के लक्षण क्या हैं?"
        ]
    },
    "dizziness_vertigo": {
        "en": [
            "The room feels like it is spinning around me",
            "Dizziness happens mainly when I stand up quickly",
            "Can low blood pressure or dehydration cause dizziness?"
        ],
        "te": [
            "లేచినప్పుడు మాత్రమే తలతిరుగుతోంది",
            "రక్తపోటు తగ్గడం వల్ల తలతిరుగుతుందా?",
            "తలతిరగడం తగ్గడానికి తక్షణ చర్యలు ఏమిటి?"
        ],
        "hi": [
            "अचानक खड़े होने पर चक्कर आते हैं",
            "क्या पानी की कमी या लो बीपी से चक्कर आ सकते हैं?",
            "चक्कर आने पर क्या प्राथमिक उपचार करें?"
        ]
    },
    "fever_infection": {
        "en": [
            "My body temperature measured around 101-102°F",
            "How many days can a viral fever safely last?",
            "What diet and fluids support fever recovery?"
        ],
        "te": [
            "ఉష్ణోగ్రత 101-102 డిగ్రీల వరకు నమోదైంది",
            "వైరల్ జ్వరం ఎన్ని రోజులు ఉంటుంది?",
            "జ్వరంలో ఏ ఆహారం మరియు ద్రవాలు మంచివి?"
        ],
        "hi": [
            "मेरा बुखार 101-102°F के करीब है",
            "वायरल बुखार में क्या खाना चाहिए?",
            "बुखार में डॉक्टर के पास कब जाना चाहिए?"
        ]
    },
    "breathing_wheezing": {
        "en": [
            "I hear a wheezing sound when breathing out",
            "Breathlessness gets worse with walking or stairs",
            "Safe sitting positions to ease breathing"
        ],
        "te": [
            "శ్వాస వదిలినప్పుడు గురక శబ్దం వస్తోంది",
            "ఆయాసం తగ్గడానికి సరైన భంగిమ ఏమిటి?",
            "శ్వాస సమస్యలకు ఎప్పుడు అత్యవసర చికిత్స అవసరం?"
        ],
        "hi": [
            "सांस लेने पर सीने से सीटी जैसी आवाज आती है",
            "चलने पर सांस फूलने लगती है",
            "सांस लेने में आराम के लिए क्या करें?"
        ]
    },
    "respiratory_cough_cold": {
        "en": [
            "My cough is dry and tickling in the throat",
            "I have thick yellow/green phlegm with cough",
            "Best home remedies for persistent cough and congestion"
        ],
        "te": [
            "నాకు పొడి దగ్గు మరియు గొంతులో గిలిగింతలు ఉన్నాయి",
            "కఫం వస్తోంది, ఉపశమనం ఎలా?",
            "దగ్గు మరియు జలుబుకు ఉత్తమ ఇంటి చిట్కాలు"
        ],
        "hi": [
            "मेरी खांसी सूखी है और गले में खराश है",
            "खांसी में गाढ़ा बलगम आ रहा है",
            "खांसी और जुकाम के लिए सबसे अच्छे घरेलू उपाय"
        ]
    },
    "nausea_vomiting": {
        "en": [
            "I have had 2-3 vomiting episodes today",
            "How to sip ORS without triggering more vomiting?",
            "What bland foods are safe after nausea stops?"
        ],
        "te": [
            "ఈరోజు 2-3 సార్లు వాంతులు అయ్యాయి",
            "వాంతులు ఆగిన తర్వాత ఏ ఆహారం తీసుకోవాలి?",
            "డీహైడ్రేషన్ నివారించడానికి ORS ఎలా త్రాగాలి?"
        ],
        "hi": [
            "आज 2-3 बार उल्टी हो चुकी है",
            "उल्टी रोकने के लिए ORS कैसे पिएं?",
            "उल्टी के बाद कौन सा हल्का खाना सुरक्षित है?"
        ]
    },
    "diarrhea_loose_motion": {
        "en": [
            "Loose motions have happened 4-5 times today",
            "What is the correct way to prepare and drink ORS?",
            "Safe foods on the BRAT diet for quick recovery"
        ],
        "te": [
            "ఈరోజు 4-5 సార్లు విరేచనాలు అయ్యాయి",
            "ORS ద్రావణం సరిగ్గా ఎలా తయారు చేయాలి?",
            "విరేచనాలు తగ్గేందుకు ఏ ఆహారం తినాలి?"
        ],
        "hi": [
            "दिन में 4-5 बार पतले दस्त हुए हैं",
            "ORS का सही घोल कैसे तैयार करें?",
            "दस्त में जल्दी आराम के लिए क्या खाना चाहिए?"
        ]
    },
    "constipation_bowel": {
        "en": [
            "I have not had a bowel movement in 3 days",
            "Natural high-fiber foods that relieve constipation",
            "Does warm water and isabgol husk help?"
        ],
        "te": [
            "3 రోజులుగా విసర్జన సాఫీగా కాలేదు",
            "మలబద్ధకం తగ్గించే పీచు పదార్థాలు ఏవి?",
            "గోరువెచ్చని నీరు మరియు ఇసబ్‌గోల్ ఎలా వాడాలి?"
        ],
        "hi": [
            "3 दिनों से पेट साफ नहीं हुआ है",
            "कब्ज दूर करने वाले प्राकृतिक फाइबर युक्त आहार",
            "क्या ईसबगोल की भूसी और गुनगुना पानी मदद करता है?"
        ]
    },
    "digestive_abdominal": {
        "en": [
            "Pain is in upper stomach with burning acid reflux",
            "Discomfort happens right after eating heavy or spicy meals",
            "Which foods reduce stomach gas and bloating?"
        ],
        "te": [
            "పై కడుపులో మంట మరియు నొప్పిగా ఉంది",
            "కారం లేదా నూనె ఆహారం తిన్న వెంటనే నొప్పి వస్తోంది",
            "కడుపుబ్బరం మరియు గ్యాస్ తగ్గించే ఆహారాలు"
        ],
        "hi": [
            "पेट के ऊपरी हिस्से में जलन और दर्द है",
            "मसालेदार खाना खाने के बाद तकलीफ बढ़ती है",
            "गैस और पेट फूलना कम करने के आसान उपाय"
        ]
    },
    "uti_urinary_burning": {
        "en": [
            "Sharp burning sensation while passing urine",
            "Feeling frequent urge to pee every 30 minutes",
            "How much water and coconut water should I drink?"
        ],
        "te": [
            "మూత్రవిసర్జన సమయంలో తీవ్రమైన మంట ఉంది",
            "ప్రతి అరగంటకు మూత్రం వస్తున్నట్లు అనిపిస్తోంది",
            "యూరినరీ ఇన్ఫెక్షన్ లో ఎంత నీరు త్రాగాలి?"
        ],
        "hi": [
            "पेशाब करते समय तेज जलन महसूस होती है",
            "हर 30 मिनट में पेशाब जाने की इच्छा होती है",
            "UTI में कितना पानी और तरल पदार्थ पीना चाहिए?"
        ]
    },
    "cardiovascular_bp": {
        "en": [
            "My latest blood pressure reading was 140/90 mmHg",
            "What lifestyle changes naturally lower blood pressure?",
            "When do palpitations or chest tightness require ER care?"
        ],
        "te": [
            "నా తాజా BP రీడింగ్ 140/90 వచ్చింది",
            "రక్తపోటు తగ్గించడానికి సహజ జీవనశైలి మార్పులు",
            "గుండె దడ లేదా ఛాతీ బరువు ఎప్పుడు ప్రమాదకరం?"
        ],
        "hi": [
            "मेरा ब्लड प्रेशर 140/90 आया है",
            "ब्लड प्रेशर को प्राकृतिक रूप से कैसे नियंत्रित करें?",
            "सीने में भारीपन पर कब तुरंत डॉक्टर से मिलना चाहिए?"
        ]
    },
    "diabetes_metabolic": {
        "en": [
            "Fasting glucose came back at 128 mg/dL",
            "What are the best low-glycemic foods for breakfast?",
            "Symptoms of hypoglycemia (low blood sugar) to watch for"
        ],
        "te": [
            "పరగడుపున షుగర్ 128 mg/dL వచ్చింది",
            "షుగర్ నియంత్రణకు ఉత్తమ అల్పాహారం ఏమిటి?",
            "షుగర్ లెవెల్స్ పడిపోతే (హైపోగ్లైసీమియా) ఏం చేయాలి?"
        ],
        "hi": [
            "खाली पेट शुगर 128 mg/dL आई है",
            "शुगर कंट्रोल के लिए सबसे अच्छा नाश्ता क्या है?",
            "लो ब्लड शुगर (Hypoglycemia) के लक्षण क्या हैं?"
        ]
    },
    "fatigue_weakness_sleep": {
        "en": [
            "Fatigue persists even after 8 hours of sleep",
            "Which lab tests check for hidden causes of tiredness?",
            "Top iron-rich vegetarian foods to boost hemoglobin"
        ],
        "te": [
            "8 గంటలు నిద్రపోయినా నీరసంగానే ఉంటోంది",
            "అలసటకు ఏ రక్త పరీక్షలు చేయించుకోవాలి?",
            "హీమోగ్లోబిన్ పెంచే ఉత్తమ శాకాహారాలు"
        ],
        "hi": [
            "8 घंटे सोने के बाद भी दिनभर थकान रहती है",
            "लगातार कमजोरी के लिए कौन सी खून की जांच कराएं?",
            "हीमोग्लोबिन तेजी से बढ़ाने वाले शाकाहारी आहार"
        ]
    },
    "sleep_insomnia": {
        "en": [
            "I take over 2 hours just to fall asleep",
            "I wake up frequently around 3 AM and cannot sleep",
            "Effective bedtime routines and relaxation techniques"
        ],
        "te": [
            "పడుకున్నా 2 గంటల వరకు నిద్ర పట్టడం లేదు",
            "రాత్రి వేళల్లో పదే పదే మెలకువ వస్తోంది",
            "సుఖ నిద్రకు సమర్థవంతమైన రాత్రి అలవాట్లు"
        ],
        "hi": [
            "बिस्तर पर जाने के बाद 2 घंटे तक नींद नहीं आती",
            "रात में बार-बार नींद खुल जाती है",
            "अच्छी नींद के लिए सोने से पहले क्या करें?"
        ]
    },
    "musculoskeletal_joint_back": {
        "en": [
            "Pain is in lower back and worse after sitting",
            "Pain shoots down my left buttock and leg (sciatica)",
            "Safe stretches and sleeping posture for lower back pain"
        ],
        "te": [
            "నడుము నొప్పి కూర్చున్నప్పుడు ఎక్కువవుతోంది",
            "నొప్పి కాలిలోకి పాకుతోంది (సయాటికా)",
            "నడుము నొప్పికి సురక్షితమైన స్ట్రెచింగ్ వ్యాయామాలు"
        ],
        "hi": [
            "दर्द कमर के निचले हिस्से में बैठने पर बढ़ता है",
            "दर्द पैर में नीचे तक जा रहा है (साइटिका)",
            "कमर दर्द में सोने की सही मुद्रा और खिंचाव वाले व्यायाम"
        ]
    },
    "knee_joint_arthritis": {
        "en": [
            "Knee pain and crackling sound when using stairs",
            "Morning joint stiffness that lasts over 30 minutes",
            "Low-impact exercises that protect knee cartilage"
        ],
        "te": [
            "మెట్లు ఎక్కినప్పుడు మోకాళ్ళలో నొప్పి మరియు శబ్దం వస్తోంది",
            "ఉదయం లేచినప్పుడు కీళ్ళు బిగుసుకుపోతున్నాయి",
            "మోకాళ్ళ బలానికి సురక్షితమైన వ్యాయామాలు"
        ],
        "hi": [
            "सीढ़ियां चढ़ने पर घुटनों में दर्द और कट-कट की आवाज",
            "सुबह उठने पर जोड़ों में 30 मिनट से ज्यादा अकड़न",
            "घुटनों के कार्टिलेज को सुरक्षित रखने वाले हल्के व्यायाम"
        ]
    },
    "muscle_body_pain": {
        "en": [
            "Full body aches started along with a feverish feeling",
            "Muscles feel sore and heavy throughout the day",
            "Does electrolyte imbalance or Vitamin D cause muscle aches?"
        ],
        "te": [
            "జ్వరంతో పాటు ఒళ్ళంతా నొప్పులుగా ఉంది",
            "కండరాలు బిగుసుకుపోయి భారంగా ఉన్నాయి",
            "విటమిన్ డి లోపం వల్ల ఒంటి నొప్పులు వస్తాయా?"
        ],
        "hi": [
            "बुखार के साथ पूरे बदन में तेज दर्द है",
            "मांसपेशियां भारी और थकी हुई लग रही हैं",
            "क्या विटामिन डी या इलेक्ट्रोलाइट्स की कमी से बदन दर्द होता है?"
        ]
    },
    "skin_dermatology": {
        "en": [
            "The rash is itchy and has raised red bumps",
            "Rash appeared after using a new cosmetic or detergent",
            "Safe soothing creams or compresses for allergic itch"
        ],
        "te": [
            "దద్దుర్లు ఎర్రగా ఉబ్బి విపరీతమైన దురద పెడుతున్నాయి",
            "కొత్త సబ్బు లేదా క్రీమ్ వాడిన తర్వాత వచ్చింది",
            "దురద తగ్గడానికి సురక్షితమైన లేపనాలు"
        ],
        "hi": [
            "चकत्तों में बहुत खुजली और लाल दाने हैं",
            "कोई नया साबुन या क्रीम लगाने के बाद यह हुआ",
            "एलर्जी की खुजली शांत करने के लिए क्या लगाएं?"
        ]
    },
    "acne_skincare": {
        "en": [
            "Deep painful pimples appear along jawline before periods",
            "What gentle skincare routine clears acne without drying?",
            "Does diet and dairy trigger acne breakouts?"
        ],
        "te": [
            "పీరియడ్స్ కు ముందు దవడల వద్ద గడ్డల్లాంటి మొటిమలు వస్తున్నాయి",
            "మొటిమలు తగ్గడానికి సరైన స్కిన్ కేర్ రొటీన్",
            "ఆహారంలో మార్పులతో మొటిమలు తగ్గుతాయా?"
        ],
        "hi": [
            "पीरियड्स से पहले जबड़े पर दर्दनाक मुहांसे निकलते हैं",
            "मुहांसों के लिए सौम्य स्किनकेयर रूटीन क्या हो?",
            "क्या ज्यादा दूध या मीठा खाने से मुहांसे बढ़ते हैं?"
        ]
    },
    "hair_fall_loss": {
        "en": [
            "Hair is falling out heavily when washing or combing",
            "What ferritin level is required for healthy hair regrowth?",
            "Effective dietary habits and oils to reduce hair fall"
        ],
        "te": [
            "దువ్వుకున్నప్పుడు జుట్టు గుత్తులుగా రాలుతోంది",
            "జుట్టు తిరిగి పెరగడానికి ఫెర్రిటిన్ ఎంత ఉండాలి?",
            "జుట్టు రాలడం తగ్గించే ఉత్తమ పోషకాహారం"
        ],
        "hi": [
            "बाल धोते या कंघी करते समय बहुत ज्यादा झड़ रहे हैं",
            "बालों के स्वास्थ्य के लिए फेरिटिन का स्तर कितना होना चाहिए?",
            "बालों का झड़ना रोकने के लिए घरेलू आहार और तेल"
        ]
    },
    "eye_vision_pain": {
        "en": [
            "Eyes feel dry, gritty, and tired after screen work",
            "There is redness and watery discharge from one eye",
            "When does red eye or vision blur require an eye doctor?"
        ],
        "te": [
            "స్క్రీన్ చూసిన తర్వాత కళ్ళు పొడిబారి నొప్పెడుతున్నాయి",
            "ఒక కన్ను ఎర్రబడి నీరు కారుతోంది",
            "కంటి వైద్యుడిని ఎప్పుడు కలవాలి?"
        ],
        "hi": [
            "स्क्रीन देखने के बाद आंखों में सूखापन और जलन होती है",
            "आंख लाल है और पानी आ रहा है",
            "आंखों के डॉक्टर के पास कब जाना जरूरी है?"
        ]
    },
    "ear_pain_infection": {
        "en": [
            "Throbbing ear ache that started after a head cold",
            "Ear feels blocked with muffled hearing",
            "Safe home relief for ear pain without putting drops"
        ],
        "te": [
            "జలుబు తగ్గిన తర్వాత చెవిలో తీవ్రమైన నొప్పి వచ్చింది",
            "చెవి దిబ్బడ వేసి వినికిడి మందగించింది",
            "చెవి నొప్పి తగ్గడానికి సురక్షితమైన జాగ్రత్తలు"
        ],
        "hi": [
            "जुकाम के बाद कान में तेज दर्द शुरू हुआ है",
            "कान बंद लग रहा है और आवाज कम आ रही है",
            "कान दर्द में बिना ड्रॉप्स डाले क्या राहत मिल सकती है?"
        ]
    },
    "dental_toothache": {
        "en": [
            "Sharp pain when drinking hot or cold water",
            "Constant throbbing toothache with mild gum swelling",
            "Temporary home relief until I can see a dentist"
        ],
        "te": [
            "చల్లని నీరు త్రాగినప్పుడు పంటిలో తీవ్రమైన నొప్పి వస్తోంది",
            "చిగుళ్ళలో వాపుతో పంటి నొప్పి ఉంటోంది",
            "డెంటిస్ట్ ను కలిసే వరకు పంటి నొప్పికి తాత్కాలిక ఉపశమనం"
        ],
        "hi": [
            "ठंडा या गर्म पानी पीने पर दांत में तेज झनझनाहट होती है",
            "दांत में लगातार टीस और मसूड़ों में सूजन है",
            "डेंटिस्ट के पास जाने तक दांत दर्द के घरेलू उपाय"
        ]
    },
    "mental_health_anxiety": {
        "en": [
            "Heart races and I feel sudden panic or restlessness",
            "How does the 4-7-8 breathing technique work?",
            "Simple daily grounding habits to lower nervous tension"
        ],
        "te": [
            "గుండె దడ మరియు ఆకస్మిక ఆందోళనగా ఉంటోంది",
            "4-7-8 శ్వాస వ్యాయామం ఎలా చేయాలి?",
            "ఆందోళన తగ్గించడానికి సాధారణ రోజువారీ పద్ధతులు"
        ],
        "hi": [
            "दिल की धड़कन तेज हो जाती है और बेचैनी लगती है",
            "4-7-8 ब्रीदिंग तकनीक कैसे काम करती है?",
            "घबराहट और तनाव को तुरंत शांत करने के उपाय"
        ]
    },
    "depression_mood": {
        "en": [
            "I have felt empty and exhausted for over 2 weeks",
            "Small realistic steps to rebuild daily momentum",
            "How can I connect with professional mental health support?"
        ],
        "te": [
            "2 వారాలకు పైగా నిరాశగా మరియు అలసటగా ఉంది",
            "రోజూ చిన్నచిన్న మార్పులతో ఎలా ముందడుగు వేయాలి?",
            "నిపుణుల మానసిక ఆరోగ్య సహాయం ఎలా పొందాలి?"
        ],
        "hi": [
            "2 सप्ताह से ज्यादा समय से मन उदास और थका हुआ है",
            "दैनिक जीवन में सकारात्मक बदलाव के छोटे कदम",
            "काउंसलर या मनोवैज्ञानिक से कैसे संपर्क करें?"
        ]
    },
    "male_health_prostate": {
        "en": [
            "Urinary stream feels weak with frequent night trips",
            "Ways to naturally optimize energy and stamina",
            "At what age is regular PSA screening recommended?"
        ],
        "te": [
            "రాత్రి వేళ తరచూ మూత్రం కోసం లేవాల్సి వస్తోంది",
            "స్టామినా మరియు శక్తిని సహజంగా ఎలా పెంచుకోవాలి?",
            "ప్రోస్టేట్ PSA పరీక్ష ఏ వయస్సులో చేయించుకోవాలి?"
        ],
        "hi": [
            "रात में बार-बार पेशाब जाना पड़ता है और धार कमजोर है",
            "शारीरिक स्टैमिना बढ़ाने के प्राकृतिक उपाय",
            "प्रोस्टेट PSA जांच किस उम्र में करानी चाहिए?"
        ]
    },
    "postpartum_recovery": {
        "en": [
            "How long should lochia (postpartum bleeding) normally last?",
            "Safe methods to relieve breastfeeding engorgement & soreness",
            "C-section incision recovery and gentle abdominal exercises"
        ],
        "te": [
            "ప్రసవం తర్వాత రక్తస్రావం ఎన్ని రోజులు ఉంటుంది?",
            "రొమ్ము నొప్పి మరియు పాలు సరిగ్గా రావడానికి చిట్కాలు",
            "సిజేరియన్ ఆపరేషన్ తర్వాత గాయం త్వరగా మానడానికి జాగ్రత్తలు"
        ],
        "hi": [
            "डिलीवरी के बाद ब्लीडिंग सामान्यतः कितने दिन तक होती है?",
            "स्तनों में दर्द और सूजन कम करने के उपाय",
            "सिजेरियन डिलीवरी के बाद टांकों की देखभाल कैसे करें?"
        ]
    },
    "teen_health": {
        "en": [
            "Is having irregular cycles normal during the first 2 years?",
            "Effective non-medicine ways to ease school-day period cramps",
            "Dietary tips to treat teen fatigue and boost hemoglobin"
        ],
        "te": [
            "మొదటి 2 ఏళ్ళు పీరియడ్స్ సరిగ్గా రాకపోవడం సాధారణమేనా?",
            "స్కూల్ సమయంలో కడుపునొప్పి తగ్గడానికి సులభమైన ఉపాయాలు",
            "టీనేజ్ లో రక్తహీనత మరియు అలసట తగ్గించే ఆహారాలు"
        ],
        "hi": [
            "क्या पहले दो सालों में पीरियड्स का अनियमित होना सामान्य है?",
            "पीरियड्स के असहनीय दर्द से राहत पाने के घरेलू उपाय",
            "किशोरियों में खून की कमी (एनीमिया) दूर करने वाले आहार"
        ]
    },
    "family_ally_care": {
        "en": [
            "How to create a restful recovery space for a new mother",
            "Caregiver checklist for monitoring surgical recovery at home",
            "When should family members call emergency services for red flags?"
        ],
        "te": [
            "ప్రసవానంతర తల్లికి ఎలాంటి విశ్రాంతి మరియు పోషకాహారం ఇవ్వాలి?",
            "ఇంటి వద్ద రోగిని చూసుకునేటప్పుడు పాటించాల్సిన చెక్‌లిస్ట్",
            "ఏ లక్షణాలు కనిపిస్తే వెంటనే ఆసుపత్రికి తీసుకెళ్ళాలి?"
        ],
        "hi": [
            "नई मां के शारीरिक और मानसिक आराम का ध्यान कैसे रखें?",
            "घर पर मरीज की देखभाल के लिए आवश्यक सावधानियां",
            "किन गंभीर लक्षणों में तुरंत डॉक्टर या अस्पताल जाना चाहिए?"
        ]
    },
    "pregnancy_maternal": {
        "en": [
            "How to accurately track fetal kicks in third trimester?",
            "Safe natural remedies for morning nausea in first trimester",
            "What warning signs require immediate maternity triage?"
        ],
        "te": [
            "మూడవ త్రైమాసికంలో కిక్స్ కౌంట్ ఎలా లెక్కించాలి?",
            "గర్భధారణ వికారం తగ్గడానికి సహజ పద్ధతులు",
            "ప్రసవానికి ముందు గమనించాల్సిన ప్రమాద సంకేతాలు"
        ],
        "hi": [
            "तीसरी तिमाही में बच्चे की हलचल कैसे गिनें?",
            "गर्भावस्था में उल्टी और जी मिचलाने के घरेलू उपाय",
            "गर्भावस्था के दौरान खतरे के संकेत क्या हैं?"
        ]
    },
    "menopause_perimenopause": {
        "en": [
            "Hot flashes happen multiple times during the day and night",
            "How does nutrition protect bone density during menopause?",
            "Managing sleep and mood swings during perimenopause"
        ],
        "te": [
            "పగలు మరియు రాత్రి వేడి ఆవిర్లు తరచూ వస్తున్నాయి",
            "మెనోపాజ్ లో ఎముకల పటుత్వానికి ఎలాంటి ఆహారం తీసుకోవాలి?",
            "మూడ్ స్వింగ్స్ మరియు నిద్రలేమిని ఎలా నియంత్రించాలి?"
        ],
        "hi": [
            "दिन और रात में बार-बार अचानक तेज गर्मी लगती है",
            "मेनोपॉज में हड्डियों की मजबूती के लिए क्या खाएं?",
            "चिड़चिड़ापन और नींद की समस्या को कैसे संभालें?"
        ]
    },
    "womens_health_pcos_cycle": {
        "en": [
            "My period has been delayed by more than 10 days",
            "Severe menstrual cramps with lower back ache",
            "Diet and lifestyle tips that help manage PCOS naturally"
        ],
        "te": [
            "పీరియడ్స్ 10 రోజులకు పైగా ఆలస్యమయ్యాయి",
            "తీవ్రమైన కడుపునొప్పి మరియు నడుము నొప్పి",
            "PCOS ను సహజంగా అదుపులో ఉంచే డైట్ చిట్కాలు"
        ],
        "hi": [
            "पीरियड्स 10 दिन से ज्यादा लेट हो गए हैं",
            "मासिक धर्म के दौरान असहनीय पेट और कमर दर्द",
            "PCOS को प्राकृतिक रूप से नियंत्रित करने के उपाय"
        ]
    },
    "report_explainer": {
        "en": [
            "My Hemoglobin is 11.2 g/dL - is this mildly anemic?",
            "What does an elevated TSH (Thyroid) test level mean?",
            "How can I improve my HDL and lower bad LDL cholesterol?"
        ],
        "te": [
            "నా హీమోగ్లోబిన్ 11.2 g/dL వచ్చింది - రక్తహీనత ఉందా?",
            "TSH థైరాయిడ్ ఎక్కువగా ఉంటే ఏమవుతుంది?",
            "మంచి కొలెస్ట్రాల్ (HDL) ను ఎలా పెంచుకోవాలి?"
        ],
        "hi": [
            "मेरा हीमोग्लोबिन 11.2 g/dL आया है, क्या यह कम है?",
            "थायरॉइड (TSH) अधिक आने का क्या मतलब है?",
            "खराब कोलेस्ट्रॉल (LDL) को कैसे कम करें?"
        ]
    },
    "nutrition_diet": {
        "en": [
            "Top vegetarian sources of high quality daily protein",
            "How to pair iron foods with Vitamin C for absorption",
            "Healthy meal plans for sustained energy without glucose crashes"
        ],
        "te": [
            "రోజూ అవసరమైన ప్రోటీన్ కోసం ఉత్తమ శాకాహారాలు",
            "ఐరన్ సరిగ్గా ఒంటపట్టడానికి విటమిన్ సి ఎలా కలపాలి?",
            "రోజంతా శక్తినిచ్చే సమతుల్య భోజన ప్రణాళిక"
        ],
        "hi": [
            "शाकाहारी भोजन में उच्च प्रोटीन के बेहतरीन स्रोत",
            "आयरन के बेहतर अवशोषण के लिए विटामिन सी कैसे लें?",
            "ऊर्जा बनाए रखने के लिए संतुलित डाइट प्लान"
        ]
    },
    "care_navigation": {
        "en": [
            "Find top verified gynecologists in my city",
            "What tests and questions should I prepare for the doctor?",
            "When should I choose in-person visit over teleconsultation?"
        ],
        "te": [
            "నా నగరంలో అనుభవజ్ఞులైన గైనకాలజిస్ట్‌లను చూపించండి",
            "డాక్టర్ వద్దకు వెళ్లే ముందు ఏ రిపోర్టులు తీసుకెళ్ళాలి?",
            "ఆన్‌లైన్ కన్సల్టేషన్ ఎప్పుడు ఎంచుకోవాలి?"
        ],
        "hi": [
            "मेरे शहर में अच्छे स्त्री रोग विशेषज्ञ की तलाश करें",
            "डॉक्टर के पास जाने से पहले क्या तैयारी करें?",
            "ऑनलाइन परामर्श कब लेना चाहिए?"
        ]
    },
    "timeline_history": {
        "en": [
            "Show my blood pressure trend over the last 30 days",
            "Compare my recent lab tests with my Digital Health Twin baseline",
            "Set a routine health observation reminder"
        ],
        "te": [
            "గత 30 రోజుల నా రక్తపోటు మార్పులను చూపించండి",
            "నా తాజా పరీక్షలను హెల్త్ ట్విన్ తో పోల్చండి",
            "ఆరోగ్య తనిఖీ రిమైండర్ సెట్ చేయండి"
        ],
        "hi": [
            "पिछले 30 दिनों का मेरा ब्लड प्रेशर ट्रेंड दिखाएं",
            "मेरी हालिया जांच को हेल्थ ट्विन बेसलाइन से मिलाएं",
            "स्वास्थ्य जांच का रिमाइंडर सेट करें"
        ]
    },
    "general_triage": {
        "en": [
            "Evaluate headache, fever, or physical pain symptoms",
            "Help me understand a lab test result or blood report",
            "Personalized daily nutrition, hydration, and sleep tips"
        ],
        "te": [
            "తలనొప్పి, జ్వరం లేదా శారీరక నొప్పులను విశ్లేషించండి",
            "ల్యాబ్ పరీక్ష ఫలితాలను అర్థం చేసుకోవడంలో సహాయపడండి",
            "రోజువారీ పోషకాహారం, నీరు మరియు నిద్ర సూచనలు"
        ],
        "hi": [
            "सिरदर्द, बुखार या शारीरिक दर्द के लक्षणों का विश्लेषण करें",
            "लैब टेस्ट रिपोर्ट या ब्लड टेस्ट को समझने में मदद करें",
            "दैनिक पोषण, पर्याप्त पानी और बेहतर नींद के सुझाव"
        ]
    }
}


def _call_gemini_api(prompt: str, user_name: str, language: str) -> Optional[Dict[str, Any]]:
    """Optionally queries Gemini if GEMINI_API_KEY is configured in settings."""
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        return None

    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        system_instruction = (
            f"You are SHE Twin AI, a compassionate clinical educational assistant for women's and family health. "
            f"The user name is {user_name}. Respond in language: {language} (use English if en, Telugu if te, Hindi if hi, Kannada if kn, Tamil if ta). "
            f"Provide an educational clinical analysis, ask 2-3 specific diagnostic triage questions to clarify the problem, and suggest next steps. "
            f"At the very end of your response, output a JSON block with key 'followUpQuestions' containing 3 distinct, actionable follow-up questions tailored strictly to this specific condition."
        )

        payload = {
            "contents": [
                {"role": "user", "parts": [{"text": f"{system_instruction}\n\nUser message: {prompt}"}]}
            ],
            "generationConfig": {
                "temperature": 0.4,
                "maxOutputTokens": 600
            }
        }

        with httpx.Client(timeout=10.0) as client:
            resp = client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                candidate_text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                if candidate_text:
                    # Extract optional JSON followUpQuestions if present
                    follow_ups = []
                    json_match = re.search(r"\{.*\"followUpQuestions\".*\}", candidate_text, re.DOTALL)
                    clean_text = candidate_text
                    if json_match:
                        try:
                            parsed_json = json.loads(json_match.group(0))
                            follow_ups = parsed_json.get("followUpQuestions", [])
                            clean_text = candidate_text.replace(json_match.group(0), "").strip()
                        except Exception:
                            pass

                    return {
                        "content": clean_text,
                        "followUps": follow_ups if follow_ups else None
                    }
    except Exception:
        pass
    return None


def generate_health_assistant_response(
    message: str,
    user_name: str = "User",
    language: str = "en",
    user_context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    lang = language.lower() if language and language.lower() in ["en", "te", "hi", "kn", "ta"] else "en"
    disclaimer = DISCLAIMER_MAP.get(lang, DISCLAIMER_MAP["en"])
    msg_low = message.lower()

    # 1. Emergency Red-Flag Interception
    if any(w in msg_low for w in EMERGENCY_WORDS):
        emergency_content = {
            "en": f"🚨 EMERGENCY MEDICAL ALERT for {user_name}:\nThe symptoms you described may require immediate medical attention. Please call National Emergency Services (112 or 108 in India) or visit the nearest hospital Emergency Room right away. Do not wait for AI responses.",
            "te": f"🚨 అత్యవసర వైద్య హెచ్చరిక ({user_name}):\nమీరు పేర్కొన్న లక్షణాలకు తక్షణ వైద్య సహాయం అవసరం కావచ్చు. దయచేసి వెంటనే 112 లేదా 108 కు కాల్ చేయండి లేదా సమీపంలోని ఆసుపత్రి ఎమర్జెన్సీ విభాగానికి వెళ్ళండి.",
            "hi": f"🚨 आपातकालीन चिकित्सा चेतावनी ({user_name}):\nआपके द्वारा बताए गए लक्षणों के लिए तत्काल आपातकालीन चिकित्सा की आवश्यकता हो सकती है। कृपया तुरंत 112 या 108 पर कॉल करें या नजदीकी अस्पताल के आपातकालीन कक्ष में जाएं।",
            "kn": f"🚨 ತುರ್ತು ವೈದ್ಯಕೀಯ ಎಚ್ಚರಿಕೆ ({user_name}):\nನೀವು ವಿವರಿಸಿದ ರೋಗಲಕ್ಷಣಗಳಿಗೆ ತಕ್ಷಣದ ವೈದ್ಯಕೀಯ ಗಮನ ಅಗತ್ಯವಿರಬಹುದು. ದయವಿಟ್ಟು ತಕ್ಷಣ 112 ಅಥವಾ 108 ಗೆ ಕರೆ ಮಾಡಿ ಅಥವಾ ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆಗೆ ಭೇಟಿ ನೀಡಿ.",
            "ta": f"🚨 அவசர மருத்துவ எச்சரிக்கை ({user_name}):\nநீங்கள் விவரித்த அறிகுறிகளுக்கு உடனடி அவசர சிகிச்சை தேவைப்படலாம். தயவுசெய்து உடனடியாக 112 அல்லது 108 ஐ அழைக்கவும் அல்லது அருகிலுள்ள அவசர சிகிச்சைப் பிரிவுக்குச் செல்லவும்."
        }
        return {
            "id": f"msg_emg_{int(datetime.now(timezone.utc).timestamp())}",
            "sender": "assistant",
            "agentType": "emergency",
            "content": emergency_content.get(lang, emergency_content["en"]) + disclaimer,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "suggestedFollowUps": [
                "Call 112 / 108 Emergency Helpline",
                "Find Nearest 24/7 Hospital Emergency Room",
                "View Emergency Contacts in Health Twin"
            ]
        }

    # Extract user profile and active life stage
    profile_summary = ""
    active_stage = None
    if user_context:
        active_stage = user_context.get("life_stage")
        hp = user_context.get("healthProfile")
        stage_str = f", Stage: {active_stage}" if active_stage else ""
        if hp:
            profile_summary = f" (Health Twin: {hp.get('bloodGroup', 'B+')}, Age {hp.get('age', 28)}, BMI {hp.get('bmi', 22.0)}{stage_str})"
        elif active_stage:
            profile_summary = f" (Life Stage: {active_stage})"

    # Optional Gemini live reasoning if API key configured
    gemini_result = _call_gemini_api(message, user_name, lang)
    if gemini_result and gemini_result.get("content"):
        follow_ups = gemini_result.get("followUps")
        if not follow_ups:
            # Fall back to domain follow-ups
            detected = detect_agent_type(message, life_stage=active_stage)
            fu_dict = FOLLOW_UP_QUESTIONS_MAP.get(detected, FOLLOW_UP_QUESTIONS_MAP["general_triage"])
            follow_ups = fu_dict.get(lang, fu_dict.get("en", []))
        return {
            "id": f"msg_gemini_{int(datetime.now(timezone.utc).timestamp())}",
            "sender": "assistant",
            "agentType": "gemini_clinical",
            "content": gemini_result["content"] + disclaimer,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "suggestedFollowUps": follow_ups
        }

    # Deterministic Multi-Domain Clinical Intelligence with Life Stage Awareness
    agent_type = detect_agent_type(message, life_stage=active_stage)
    agent_dict = RESPONSES_BY_AGENT.get(agent_type, RESPONSES_BY_AGENT["general_triage"])
    raw_content = agent_dict.get(lang, agent_dict.get("en", ""))
    formatted_content = raw_content.replace("{user_name}", user_name).replace("{profile_summary}", profile_summary) + disclaimer

    follow_ups_dict = FOLLOW_UP_QUESTIONS_MAP.get(agent_type, FOLLOW_UP_QUESTIONS_MAP["general_triage"])
    suggested_follow_ups = follow_ups_dict.get(lang, follow_ups_dict.get("en", []))

    return {
        "id": f"msg_{agent_type}_{int(datetime.now(timezone.utc).timestamp())}",
        "sender": "assistant",
        "agentType": agent_type,
        "content": formatted_content,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "suggestedFollowUps": suggested_follow_ups
    }
