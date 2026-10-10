import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base

class VitalObservation(Base):
    __tablename__ = "vital_observations"

    id = Column(String, primary_key=True, default=lambda: f"v_{uuid.uuid4().hex[:12]}")
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(String(20), nullable=False) # YYYY-MM-DD
    systolic = Column(Integer, nullable=False)
    diastolic = Column(Integer, nullable=False)
    glucose = Column(Integer, nullable=False)
    heart_rate = Column(Integer, nullable=False)
    weight = Column(Float, nullable=False)
    bmi = Column(Float, nullable=False)
    spo2 = Column(Integer, default=99)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="vitals")
