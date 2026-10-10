from pydantic import BaseModel
from typing import List, Optional
from app.schemas.health_twin import HealthTwinProfileOut, VitalLogOut
from app.schemas.medical_report import MedicalReportOut
from app.schemas.cycle_log import CycleLogOut
from app.schemas.family import FamilyMemberOut

class DashboardSummaryOut(BaseModel):
    userFullName: str
    healthTwin: Optional[HealthTwinProfileOut] = None
    latestVitalsHistory: List[VitalLogOut] = []
    totalReports: int
    recentReports: List[MedicalReportOut] = []
    latestCycleLog: Optional[CycleLogOut] = None
    familyCount: int
    recentFamilyMembers: List[FamilyMemberOut] = []
