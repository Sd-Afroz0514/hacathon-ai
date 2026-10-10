import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, Text
from database import Base

class ConfirmedLabResult(Base):
    __tablename__ = "confirmed_lab_results"

    id = Column(String, primary_key=True, default=lambda: f"lab_{uuid.uuid4().hex[:12]}")
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    report_id = Column(String, ForeignKey("medical_reports.id", ondelete="SET NULL"), nullable=True, index=True)
    test_name = Column(String(150), nullable=False)
    category = Column(String(100), default="Hematology")
    value = Column(String(50), nullable=False)
    numeric_value = Column(Float, nullable=True)
    unit = Column(String(50), nullable=False)
    reference_range = Column(String(100), nullable=True)
    status = Column(String(30), default="normal") # 'normal', 'low', 'high', 'critical'
    is_user_confirmed = Column(Boolean, default=True)
    user_notes = Column(Text, nullable=True)
    test_date = Column(String(20), nullable=False) # YYYY-MM-DD
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
