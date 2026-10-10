import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from database import Base

class HealthReminder(Base):
    __tablename__ = "health_reminders"

    id = Column(String, primary_key=True, default=lambda: f"rem_{uuid.uuid4().hex[:12]}")
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    reminder_type = Column(String(50), default="Follow-up") # 'Follow-up', 'Lab Test', 'Cycle Check', 'Medication', 'Vaccination'
    description = Column(Text, nullable=True)
    due_date = Column(String(20), nullable=False) # YYYY-MM-DD
    is_completed = Column(Boolean, default=False)
    priority = Column(String(20), default="Medium") # 'Low', 'Medium', 'High'
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
