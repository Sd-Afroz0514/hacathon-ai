from pydantic import BaseModel
from typing import List, Optional

class FamilyMemberCreate(BaseModel):
    name: str
    relationship: str
    age: int
    gender: str = "Female"
    bloodGroup: str = "B+"
    allergies: List[str] = []
    chronicConditions: List[str] = []
    lastCheckupDate: Optional[str] = None
    notes: Optional[str] = None

class FamilyMemberUpdate(BaseModel):
    name: Optional[str] = None
    relationship: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    bloodGroup: Optional[str] = None
    allergies: Optional[List[str]] = None
    chronicConditions: Optional[List[str]] = None
    lastCheckupDate: Optional[str] = None
    notes: Optional[str] = None

class FamilyMemberOut(BaseModel):
    id: str
    primaryUserId: str
    name: str
    relationship: str
    age: int
    gender: str
    bloodGroup: str
    allergies: List[str]
    chronicConditions: List[str]
    lastCheckupDate: Optional[str] = None
    notes: Optional[str] = None
    avatarColor: str
