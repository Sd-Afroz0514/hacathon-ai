from typing import List, Optional
from pydantic import BaseModel, Field

class ConfirmedLabItem(BaseModel):
    testName: str
    category: Optional[str] = "Hematology"
    value: str
    numericValue: Optional[float] = None
    unit: str
    referenceRange: Optional[str] = None
    status: Optional[str] = "normal"
    userNotes: Optional[str] = None
    testDate: Optional[str] = None

class ConfirmedLabBatchCreate(BaseModel):
    reportId: Optional[str] = None
    testDate: str
    items: List[ConfirmedLabItem]

class ConfirmedLabOut(BaseModel):
    id: str
    userId: str
    reportId: Optional[str] = None
    testName: str
    category: str
    value: str
    numericValue: Optional[float] = None
    unit: str
    referenceRange: Optional[str] = None
    status: str
    isUserConfirmed: bool
    userNotes: Optional[str] = None
    testDate: str
    createdAt: str
