import uuid
import json
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base

class HealthProfile(Base):
    __tablename__ = "health_profiles"

    id = Column(String, primary_key=True, default=lambda: f"twin_{uuid.uuid4().hex[:12]}")
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    full_name = Column(String(100), nullable=False)
    age = Column(Integer, default=26)
    gender = Column(String(20), default="Female")
    blood_group = Column(String(10), default="B+")
    height_cm = Column(Float, default=165.0)
    weight_kg = Column(Float, default=58.5)
    bmi = Column(Float, default=21.5)
    
    # Stored as JSON strings
    allergies_json = Column(Text, default="[]")
    chronic_conditions_json = Column(Text, default="[]")
    current_medications_json = Column(Text, default="[]")
    
    emergency_name = Column(String(100), default="Rajesh Sharma")
    emergency_phone = Column(String(50), default="+91 98765 43210")
    emergency_relationship = Column(String(50), default="Father")
    
    activity_level = Column(String(50), default="Moderately Active")
    sleep_hours = Column(Float, default=7.5)
    diet_type = Column(String(50), default="Vegetarian")
    water_intake_liters = Column(Float, default=2.4)
    
    # Latest Vitals summary cached
    bp_systolic = Column(Integer, default=118)
    bp_diastolic = Column(Integer, default=78)
    heart_rate_bpm = Column(Integer, default=72)
    glucose_mg_dl = Column(Integer, default=92)
    spo2_pct = Column(Integer, default=99)
    temperature_c = Column(Float, default=36.6)
    vitals_recorded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="health_twin")

    @property
    def allergies(self):
        try:
            return json.loads(self.allergies_json or "[]")
        except Exception:
            return []

    @allergies.setter
    def allergies(self, val):
        self.allergies_json = json.dumps(val or [])

    @property
    def chronic_conditions(self):
        try:
            return json.loads(self.chronic_conditions_json or "[]")
        except Exception:
            return []

    @chronic_conditions.setter
    def chronic_conditions(self, val):
        self.chronic_conditions_json = json.dumps(val or [])

    @property
    def current_medications(self):
        try:
            return json.loads(self.current_medications_json or "[]")
        except Exception:
            return []

    @current_medications.setter
    def current_medications(self, val):
        self.current_medications_json = json.dumps(val or [])
