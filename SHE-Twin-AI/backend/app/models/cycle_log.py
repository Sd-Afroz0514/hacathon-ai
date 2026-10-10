import uuid
import json
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base

class CycleLog(Base):
    __tablename__ = "cycle_logs"

    id = Column(String, primary_key=True, default=lambda: f"cyc_{uuid.uuid4().hex[:12]}")
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    start_date = Column(String(20), nullable=False) # YYYY-MM-DD
    end_date = Column(String(20), nullable=True)
    cycle_length_days = Column(Integer, default=28)
    period_length_days = Column(Integer, default=5)
    flow_intensity = Column(String(30), default="Medium")
    symptoms_json = Column(Text, default="[]")
    mood = Column(String(50), default="Calm")
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="cycle_logs")

    @property
    def symptoms(self):
        try:
            return json.loads(self.symptoms_json or "[]")
        except Exception:
            return []

    @symptoms.setter
    def symptoms(self, val):
        self.symptoms_json = json.dumps(val or [])
