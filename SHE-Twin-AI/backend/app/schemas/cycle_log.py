from pydantic import BaseModel
from typing import List, Optional

class CycleLogCreate(BaseModel):
    startDate: str
    endDate: Optional[str] = None
    cycleLengthDays: int = 28
    periodLengthDays: int = 5
    flowIntensity: str = "Medium"
    symptoms: List[str] = []
    mood: str = "Calm"
    notes: Optional[str] = None

class CycleLogOut(BaseModel):
    id: str
    startDate: str
    endDate: Optional[str] = None
    cycleLengthDays: int
    periodLengthDays: int
    flowIntensity: str
    symptoms: List[str]
    mood: str
    notes: Optional[str] = None
