import uuid
import json
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(String, primary_key=True, default=lambda: f"doc_{uuid.uuid4().hex[:12]}")
    name = Column(String(100), nullable=False)
    title = Column(String(100), nullable=False)
    specialty = Column(String(100), nullable=False)
    experience_years = Column(Integer, default=10)
    qualification = Column(String(200), nullable=False)
    clinic_or_hospital = Column(String(200), nullable=False)
    location = Column(String(200), nullable=False)
    rating = Column(Float, default=4.9)
    review_count = Column(Integer, default=100)
    consultation_fee = Column(String(50), default="₹800")
    available_days_json = Column(Text, default='["Mon", "Tue", "Thu", "Fri", "Sat"]')
    available_time_slot = Column(String(100), default="10:00 AM - 02:00 PM")
    phone = Column(String(50), nullable=True)
    email = Column(String(100), nullable=True)
    is_demo_listing = Column(Boolean, default=True)

    @property
    def available_days(self):
        try:
            return json.loads(self.available_days_json or "[]")
        except Exception:
            return []

    @available_days.setter
    def available_days(self, val):
        self.available_days_json = json.dumps(val or [])

class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(String, primary_key=True, default=lambda: f"apt_{uuid.uuid4().hex[:12]}")
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    doctor_id = Column(String, nullable=False)
    doctor_name = Column(String(100), nullable=False)
    specialty = Column(String(100), nullable=False)
    patient_name = Column(String(100), nullable=False)
    preferred_date = Column(String(20), nullable=False)
    preferred_time = Column(String(50), nullable=False)
    reason_for_visit = Column(Text, nullable=False)
    status = Column(String(30), default="Confirmed")
    booked_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    is_demo_booking = Column(Boolean, default=False)
