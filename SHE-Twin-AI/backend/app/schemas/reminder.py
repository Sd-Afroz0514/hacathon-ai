from typing import Optional
from pydantic import BaseModel, Field

class HealthReminderCreate(BaseModel):
    title: str = Field(..., min_length=2, max_length=200)
    reminderType: Optional[str] = "Follow-up"
    description: Optional[str] = None
    dueDate: str = Field(..., description="YYYY-MM-DD")
    priority: Optional[str] = "Medium"

class HealthReminderOut(BaseModel):
    id: str
    userId: str
    title: str
    reminderType: str
    description: Optional[str] = None
    dueDate: str
    isCompleted: bool
    priority: str
    createdAt: Optional[str] = None
