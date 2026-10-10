from pydantic import BaseModel
from typing import List, Optional

class DoctorOut(BaseModel):
    id: str
    name: str
    title: str
    specialty: str
    experienceYears: int
    qualification: str
    clinicOrHospital: str
    location: str
    rating: float
    reviewCount: int
    consultationFee: str
    availableDays: List[str]
    availableTimeSlot: str
    phone: Optional[str] = None
    email: Optional[str] = None
    isDemoListing: Optional[bool] = True

class AppointmentCreate(BaseModel):
    doctorId: str
    doctorName: str
    specialty: str
    patientName: str
    preferredDate: str
    preferredTime: str
    reasonForVisit: str

class AppointmentOut(BaseModel):
    id: str
    doctorId: str
    doctorName: str
    specialty: str
    patientName: str
    preferredDate: str
    preferredTime: str
    reasonForVisit: str
    status: str
    bookedAt: str
    isDemoBooking: Optional[bool] = False
