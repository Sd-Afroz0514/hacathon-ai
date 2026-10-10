import uuid
import json
from datetime import datetime, timezone
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base

class MedicalReport(Base):
    __tablename__ = "medical_reports"

    id = Column(String, primary_key=True, default=lambda: f"rep_{uuid.uuid4().hex[:12]}")
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    file_name = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=True)
    file_size_formatted = Column(String(50), default="1.0 MB")
    file_type = Column(String(20), default="pdf")
    report_date = Column(String(20), nullable=False) # YYYY-MM-DD
    lab_or_hospital_name = Column(String(200), default="Diagnostic Healthcare Lab")
    report_category = Column(String(100), default="Complete Blood Count (CBC)")
    status = Column(String(50), default="analyzed") # processing, analyzed, failed
    doctor_name = Column(String(100), nullable=True)
    
    extracted_text_preview = Column(Text, nullable=True)
    ai_summary_notes = Column(Text, nullable=True)
    key_insights_json = Column(Text, default="[]")
    test_results_json = Column(Text, default="[]")
    is_demo_report = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="reports")

    @property
    def key_insights(self):
        try:
            return json.loads(self.key_insights_json or "[]")
        except Exception:
            return []

    @key_insights.setter
    def key_insights(self, val):
        self.key_insights_json = json.dumps(val or [])

    @property
    def test_results(self):
        try:
            return json.loads(self.test_results_json or "[]")
        except Exception:
            return []

    @test_results.setter
    def test_results(self, val):
        self.test_results_json = json.dumps(val or [])
