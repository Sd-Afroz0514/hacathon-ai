import uuid
import json
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from database import Base

class UserLifeStage(Base):
    __tablename__ = "user_life_stages"

    id = Column(String, primary_key=True, default=lambda: f"ls_{uuid.uuid4().hex[:12]}")
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    current_mode = Column(String(50), nullable=False, default="My Health")
    # 'Teen / Young Women', 'Reproductive Health', 'Pregnancy', 'Postpartum', 'Menopause', 'My Health', 'Family Ally'
    started_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    notes = Column(Text, nullable=True)
    metadata_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    @property
    def metadata_dict(self):
        try:
            return json.loads(self.metadata_json or "{}")
        except Exception:
            return {}

    @metadata_dict.setter
    def metadata_dict(self, val):
        self.metadata_json = json.dumps(val or {})
