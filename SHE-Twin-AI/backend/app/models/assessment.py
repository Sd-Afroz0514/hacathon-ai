import uuid
import json
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, Float, DateTime, ForeignKey, Text
from database import Base

class SymptomAssessment(Base):
    __tablename__ = "symptom_assessments"

    id = Column(String, primary_key=True, default=lambda: f"symp_{uuid.uuid4().hex[:12]}")
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    life_stage_mode = Column(String(50), default="My Health")
    symptoms_json = Column(Text, default="[]") # List of { name, severity, duration, bodyPart }
    severity = Column(String(20), default="Mild") # 'Mild', 'Moderate', 'Severe'
    duration = Column(String(50), default="1-3 days")
    notes = Column(Text, nullable=True)
    has_emergency_flags = Column(Boolean, default=False)
    emergency_reasons_json = Column(Text, default="[]")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    @property
    def symptoms(self):
        try:
            return json.loads(self.symptoms_json or "[]")
        except Exception:
            return []

    @symptoms.setter
    def symptoms(self, val):
        self.symptoms_json = json.dumps(val or [])

    @property
    def emergency_reasons(self):
        try:
            return json.loads(self.emergency_reasons_json or "[]")
        except Exception:
            return []

    @emergency_reasons.setter
    def emergency_reasons(self, val):
        self.emergency_reasons_json = json.dumps(val or [])


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"

    id = Column(String, primary_key=True, default=lambda: f"risk_{uuid.uuid4().hex[:12]}")
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    screening_tier = Column(String(30), nullable=False) # 'Lower Concern', 'Medium Concern', 'High Concern'
    risk_category = Column(String(100), default="General Preventive Screening")
    risk_score = Column(Float, default=15.0) # 0 to 100
    is_emergency = Column(Boolean, default=False)
    emergency_action_recommended = Column(String(255), nullable=True)
    contributing_factors_json = Column(Text, default="[]")
    data_points_used_json = Column(Text, default="[]")
    recommended_next_steps_json = Column(Text, default="[]")
    suggested_specialty = Column(String(100), default="General Physician")
    disclaimer = Column(Text, default="Preliminary algorithmic wellness assessment. Not a clinical diagnosis.")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    @property
    def contributing_factors(self):
        try:
            return json.loads(self.contributing_factors_json or "[]")
        except Exception:
            return []

    @contributing_factors.setter
    def contributing_factors(self, val):
        self.contributing_factors_json = json.dumps(val or [])

    @property
    def data_points_used(self):
        try:
            return json.loads(self.data_points_used_json or "[]")
        except Exception:
            return []

    @data_points_used.setter
    def data_points_used(self, val):
        self.data_points_used_json = json.dumps(val or [])

    @property
    def recommended_next_steps(self):
        try:
            return json.loads(self.recommended_next_steps_json or "[]")
        except Exception:
            return []

    @recommended_next_steps.setter
    def recommended_next_steps(self, val):
        self.recommended_next_steps_json = json.dumps(val or [])
