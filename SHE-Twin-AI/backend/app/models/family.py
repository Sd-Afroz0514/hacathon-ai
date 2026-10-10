import uuid
import json
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base

class FamilyMember(Base):
    __tablename__ = "family_members"

    id = Column(String, primary_key=True, default=lambda: f"fam_{uuid.uuid4().hex[:12]}")
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    relationship_type = Column(String(50), nullable=False) # Mother, Father, Daughter, etc.
    age = Column(Integer, nullable=False)
    gender = Column(String(20), default="Female")
    blood_group = Column(String(10), default="B+")
    allergies_json = Column(Text, default="[]")
    chronic_conditions_json = Column(Text, default="[]")
    last_checkup_date = Column(String(20), nullable=True)
    notes = Column(Text, nullable=True)
    avatar_color = Column(String(50), default="bg-teal-600")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="family_members")

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
