from pydantic import BaseModel, ConfigDict
from typing import List, Optional

class EmergencyContactSchema(BaseModel):
    name: str
    relationship: str
    phone: str

class LifestyleSchema(BaseModel):
    activityLevel: str
    sleepHoursPerDay: float
    dietType: str
    waterIntakeLiters: float

class LatestVitalsSchema(BaseModel):
    bloodPressureSystolic: int
    bloodPressureDiastolic: int
    heartRateBpm: int
    fastingGlucoseMgDl: int
    spo2Percentage: int
    temperatureCelsius: float
    recordedAt: str

class HealthTwinProfileOut(BaseModel):
    id: str
    userId: str
    fullName: str
    age: int
    gender: str
    bloodGroup: str
    heightCm: float
    weightKg: float
    bmi: float
    allergies: List[str]
    chronicConditions: List[str]
    currentMedications: List[str]
    emergencyContact: EmergencyContactSchema
    lifestyle: LifestyleSchema
    latestVitals: LatestVitalsSchema
    lastUpdated: str

class HealthTwinProfileUpdate(BaseModel):
    fullName: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    bloodGroup: Optional[str] = None
    heightCm: Optional[float] = None
    weightKg: Optional[float] = None
    bmi: Optional[float] = None
    allergies: Optional[List[str]] = None
    chronicConditions: Optional[List[str]] = None
    currentMedications: Optional[List[str]] = None
    emergencyContact: Optional[EmergencyContactSchema] = None
    lifestyle: Optional[LifestyleSchema] = None

class VitalLogCreate(BaseModel):
    date: str
    systolic: int
    diastolic: int
    glucose: int
    heartRate: int
    weight: float
    bmi: float
    spo2: int
    notes: Optional[str] = None

class VitalLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    date: str
    systolic: int
    diastolic: int
    glucose: int
    heartRate: int
    weight: float
    bmi: float
    spo2: int
    notes: Optional[str] = None
