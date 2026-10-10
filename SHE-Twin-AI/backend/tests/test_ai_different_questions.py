import pytest
from app.services.ai_assistant import generate_health_assistant_response, detect_agent_type

def test_different_problems_yield_different_ai_questions():
    problems = [
        "I have a severe throbbing headache and light sensitivity",
        "My child has high fever 102 with chills",
        "I am having burning sensation while passing urine and frequent urination",
        "Severe stomach pain with acid reflux and bloating",
        "Lower back ache radiating down my leg with sciatica",
        "The room is spinning around and I feel very dizzy",
        "Itchy red rash with bumps on my arms",
        "Fasting blood sugar is 145 mg/dL with frequent thirst",
        "Can you explain my low hemoglobin and ferritin report?",
        "My periods are delayed by 2 weeks with severe cramps",
    ]

    all_follow_ups = []
    agent_types = set()

    for p in problems:
        res = generate_health_assistant_response(p, user_name="Priya", language="en")
        agent_type = res["agentType"]
        follow_ups = res["suggestedFollowUps"]

        assert agent_type != "general_triage", f"Problem '{p}' should not fall into general_triage"
        assert len(follow_ups) > 0, f"Expected follow-up questions for '{p}'"

        agent_types.add(agent_type)
        all_follow_ups.append(tuple(follow_ups))

    # Ensure all 10 problems were identified into distinct specialized agents
    assert len(agent_types) == 10, f"Expected 10 distinct agents, got {len(agent_types)}"

    # Ensure no two problems received identical follow-up AI questions
    assert len(set(all_follow_ups)) == 10, "Each problem must have unique follow-up questions"

def test_multilingual_distinct_questions():
    # Telugu
    res_te_headache = generate_health_assistant_response("నాకు తలనొప్పిగా ఉంది", user_name="ప్రియ", language="te")
    res_te_fever = generate_health_assistant_response("నాకు తీవ్రమైన జ్వరం వచ్చింది", user_name="ప్రియ", language="te")
    assert res_te_headache["agentType"] == "headache_migraine"
    assert res_te_fever["agentType"] == "fever_infection"
    assert res_te_headache["suggestedFollowUps"] != res_te_fever["suggestedFollowUps"]

    # Hindi
    res_hi_headache = generate_health_assistant_response("मुझे बहुत तेज सिरदर्द है", user_name="प्रिया", language="hi")
    res_hi_stomach = generate_health_assistant_response("मेरे पेट में तेज दर्द और गैस है", user_name="प्रिया", language="hi")
    assert res_hi_headache["agentType"] == "headache_migraine"
    assert res_hi_stomach["agentType"] == "digestive_abdominal"
    assert res_hi_headache["suggestedFollowUps"] != res_hi_stomach["suggestedFollowUps"]

def test_life_stage_symptoms_and_ai_questions():
    # 1. Pregnancy mode symptom inquiry
    res_preg = generate_health_assistant_response(
        "I am having nausea and back pain",
        user_name="Anita",
        language="en",
        user_context={"life_stage": "Pregnancy"}
    )
    assert res_preg["agentType"] == "pregnancy_maternal"
    assert "Pregnancy" in res_preg["content"]
    assert any("trimester" in q.lower() or "fetal" in q.lower() or "maternity" in q.lower() for q in res_preg["suggestedFollowUps"])

    # 2. Postpartum mode symptom inquiry
    res_pp = generate_health_assistant_response(
        "I am having bleeding and feeling exhausted after delivery",
        user_name="Anita",
        language="en",
        user_context={"life_stage": "Postpartum"}
    )
    assert res_pp["agentType"] == "postpartum_recovery"
    assert "Postpartum" in res_pp["content"]
    assert any("lochia" in q.lower() or "breastfeeding" in q.lower() or "c-section" in q.lower() for q in res_pp["suggestedFollowUps"])

    # 3. Teen health symptom inquiry
    res_teen = generate_health_assistant_response(
        "Severe cramps during school and acne",
        user_name="Diya",
        language="en",
        user_context={"life_stage": "Teen / Young Women"}
    )
    assert res_teen["agentType"] == "teen_health"
    assert "Teen" in res_teen["content"] or "Adolescent" in res_teen["content"]
    assert any("menarche" in q.lower() or "school" in q.lower() or "teen" in q.lower() for q in res_teen["suggestedFollowUps"])

    # 4. Menopause symptom inquiry
    res_meno = generate_health_assistant_response(
        "Having hot flashes and night sweats",
        user_name="Sunita",
        language="en",
        user_context={"life_stage": "Menopause"}
    )
    assert res_meno["agentType"] == "menopause_perimenopause"
    assert "Menopause" in res_meno["content"]
    assert any("flashes" in q.lower() or "bone" in q.lower() for q in res_meno["suggestedFollowUps"])

    # 5. Family Ally inquiry
    res_family = generate_health_assistant_response(
        "How can I support my daughter with recovery care?",
        user_name="Raj",
        language="en",
        user_context={"life_stage": "Family Ally"}
    )
    assert res_family["agentType"] == "family_ally_care"
    assert "Family Ally" in res_family["content"]

