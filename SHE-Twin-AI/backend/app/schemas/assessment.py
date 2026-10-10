from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class SymptomItem(BaseModel):
    name: str
    severity: str = "Mild" # 'Mild', 'Moderate', 'Severe'
    duration: str = "1-3 days"
    bodyPart: Optional[str] = None

class SymptomAssessmentCreate(BaseModel):
    lifeStageMode: Optional[str] = "My Health"
    symptoms: List[SymptomItem]
    severity: Optional[str] = "Mild"
    duration: Optional[str] = "1-3 days"
    notes: Optional[str] = None

class SymptomAssessmentOut(BaseModel):
    id: str
    userId: str
    lifeStageMode: str
    symptoms: List[SymptomItem]
    severity: str
    duration: str
    notes: Optional[str] = None
    hasEmergencyFlags: bool
    emergencyReasons: List[str]
    createdAt: str

class RiskAssessmentOut(BaseModel):
    id: str
    userId: str
    screeningTier: str # 'Lower Concern', 'Medium Concern', 'High Concern'
    riskCategory: str
    riskScore: float
    isEmergency: bool
    emergencyActionRecommended: Optional[str] = None
    contributingFactors: List[str]
    dataPointsUsed: List[str]
    recommendedNextSteps: List[str]
    suggestedSpecialty: str
    disclaimer: str
    createdAt: str

class RiskEvaluationRequest(BaseModel):
    lifeStageMode: Optional[str] = "My Health"
    symptoms: Optional[List[SymptomItem]] = None
    includeConfirmedLabs: bool = True
    includeVitals: bool = True
