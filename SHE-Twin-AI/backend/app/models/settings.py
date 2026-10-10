from sqlalchemy import Column, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class UserSettings(Base):
    __tablename__ = "user_settings"

    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True, index=True)
    email_notifications = Column(Boolean, default=True)
    sms_notifications = Column(Boolean, default=False)
    menstrual_cycle_reminders = Column(Boolean, default=True)
    medication_reminders = Column(Boolean, default=True)
    data_sharing_for_research = Column(Boolean, default=False)
    two_factor_auth_enabled = Column(Boolean, default=False)
    theme = Column(String(20), default="light")
    language = Column(String(50), default="English (US)")

    user = relationship("User", back_populates="settings")
