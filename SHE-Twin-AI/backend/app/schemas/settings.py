from pydantic import BaseModel
from typing import Optional

class UserSettingsUpdate(BaseModel):
    emailNotifications: Optional[bool] = None
    smsNotifications: Optional[bool] = None
    menstrualCycleReminders: Optional[bool] = None
    medicationReminders: Optional[bool] = None
    dataSharingForResearch: Optional[bool] = None
    twoFactorAuthEnabled: Optional[bool] = None
    theme: Optional[str] = None
    language: Optional[str] = None

class UserSettingsOut(BaseModel):
    emailNotifications: bool
    smsNotifications: bool
    menstrualCycleReminders: bool
    medicationReminders: bool
    dataSharingForResearch: bool
    twoFactorAuthEnabled: bool
    theme: str
    language: str
