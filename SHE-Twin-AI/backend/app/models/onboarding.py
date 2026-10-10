import uuid
import json
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from database import Base

class OnboardingResponse(Base):
    __tablename__ = "onboarding_responses"

    id = Column(String, primary_key=True, default=lambda: f"onb_{uuid.uuid4().hex[:12]}")
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    life_stage_mode = Column(String(50), nullable=False)
    responses_json = Column(Text, default="{}")
    completed_steps_json = Column(Text, default="[]")
    is_completed = Column(String(20), default="completed") # 'in_progress', 'completed'
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    @property
    def responses(self):
        try:
            return json.loads(self.responses_json or "{}")
        except Exception:
            return {}

    @responses.setter
    def responses(self, val):
        self.responses_json = json.dumps(val or {})

    @property
    def completed_steps(self):
        try:
            return json.loads(self.completed_steps_json or "[]")
        except Exception:
            return []

    @completed_steps.setter
    def completed_steps(self, val):
        self.completed_steps_json = json.dumps(val or [])
