import json
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from database import get_db
from app.models.user import User
from app.models.doctor import Doctor, Appointment
from app.schemas.doctor import DoctorOut, AppointmentCreate, AppointmentOut
from app.core.deps import get_current_user

router = APIRouter(prefix="/doctors", tags=["Doctor Directory"])

INITIAL_DOCTORS_SEED = [
    {
        "id": "doc_01",
        "name": "Dr. Radhika Sen",
        "title": "Senior Consultant Gynecologist",
        "specialty": "Gynecologist & Obstetrician",
        "experience_years": 14,
        "qualification": "MBBS, MS (OBG), FMAS, Fellow in Reproductive Medicine",
        "clinic_or_hospital": "Lotus Women & Child Multispecialty Hospital",
        "location": "Indiranagar, Bengaluru",
        "rating": 4.9,
        "review_count": 312,
        "consultation_fee": "₹800",
        "available_days_json": json.dumps(["Mon", "Tue", "Thu", "Fri", "Sat"]),
        "available_time_slot": "10:00 AM - 02:00 PM, 05:00 PM - 07:30 PM",
        "phone": "+91 80 4912 3456",
        "email": "dr.radhika@lotushospitals.org",
        "is_demo_listing": True
    },
    {
        "id": "doc_02",
        "name": "Dr. Arvind Nambiar",
        "title": "Consultant Physician & Diabetologist",
        "specialty": "General Physician",
        "experience_years": 18,
        "qualification": "MBBS, MD (General Medicine), PG Dip. Diabetes (UK)",
        "clinic_or_hospital": "PrimeCare Health & Wellness Clinic",
        "location": "Koramangala, Bengaluru",
        "rating": 4.8,
        "review_count": 450,
        "consultation_fee": "₹700",
        "available_days_json": json.dumps(["Mon", "Wed", "Fri", "Sat"]),
        "available_time_slot": "09:30 AM - 01:30 PM",
        "phone": "+91 80 2555 8890",
        "email": "dr.nambiar@primecareclinic.in",
        "is_demo_listing": True
    },
    {
        "id": "doc_03",
        "name": "Dr. Meenakshi Sundaram",
        "title": "Consultant Endocrinologist",
        "specialty": "Endocrinologist",
        "experience_years": 12,
        "qualification": "MBBS, MD (Medicine), DM (Endocrinology)",
        "clinic_or_hospital": "Harmony Endocrinology & Thyroid Center",
        "location": "HSR Layout, Bengaluru",
        "rating": 4.9,
        "review_count": 220,
        "consultation_fee": "₹1000",
        "available_days_json": json.dumps(["Tue", "Thu", "Sat"]),
        "available_time_slot": "11:00 AM - 04:00 PM",
        "phone": "+91 80 6789 0123",
        "email": "contact@harmonyendocrine.com",
        "is_demo_listing": True
    },
    {
        "id": "doc_04",
        "name": "Dr. Sneha Pillai",
        "title": "Clinical Nutritionist & PCOS Health Specialist",
        "specialty": "Nutritionist & Dietitian",
        "experience_years": 9,
        "qualification": "M.Sc. Clinical Nutrition, RD, Certified Hormonal Health Coach",
        "clinic_or_hospital": "NutriBalance Holistic Health",
        "location": "Whitefield, Bengaluru (Online Available)",
        "rating": 4.9,
        "review_count": 180,
        "consultation_fee": "₹650",
        "available_days_json": json.dumps(["Mon", "Tue", "Wed", "Thu", "Fri"]),
        "available_time_slot": "10:00 AM - 06:00 PM",
        "phone": "+91 80 9123 4567",
        "email": "consult@nutribalancehealth.com",
        "is_demo_listing": True
    },
    {
        "id": "doc_05",
        "name": "Dr. Vikramaditya Rao",
        "title": "Cardiologist & Preventive Heart Care",
        "specialty": "Cardiologist",
        "experience_years": 20,
        "qualification": "MBBS, MD, DM (Cardiology), FACC",
        "clinic_or_hospital": "Apollo City Cardiology Center",
        "location": "Jayanagar, Bengaluru",
        "rating": 4.9,
        "review_count": 520,
        "consultation_fee": "₹1200",
        "available_days_json": json.dumps(["Mon", "Wed", "Fri"]),
        "available_time_slot": "02:00 PM - 06:00 PM",
        "phone": "+91 80 2663 1122",
        "email": "dr.rao@apollocardiac.in",
        "is_demo_listing": True
    }
]

def seed_doctors_if_empty(db: Session):
    count = db.query(Doctor).count()
    if count == 0:
        for item in INITIAL_DOCTORS_SEED:
            doc = Doctor(**item)
            db.add(doc)
        db.commit()

@router.get("", response_model=List[DoctorOut])
def list_doctors(
    query: Optional[str] = None,
    specialty: Optional[str] = None,
    db: Session = Depends(get_db)
):
    seed_doctors_if_empty(db)
    q = db.query(Doctor)
    if specialty and specialty != "All" and specialty != "All Specialties":
        q = q.filter(Doctor.specialty.ilike(f"%{specialty}%"))
    
    doctors = q.all()
    if query and query.strip():
        term = query.lower()
        doctors = [
            d for d in doctors
            if term in d.name.lower() or term in d.clinic_or_hospital.lower() or term in d.location.lower() or term in d.specialty.lower()
        ]

    return [
        DoctorOut(
            id=d.id,
            name=d.name,
            title=d.title,
            specialty=d.specialty,
            experienceYears=d.experience_years,
            qualification=d.qualification,
            clinicOrHospital=d.clinic_or_hospital,
            location=d.location,
            rating=d.rating,
            reviewCount=d.review_count,
            consultationFee=d.consultation_fee,
            availableDays=d.available_days,
            availableTimeSlot=d.available_time_slot,
            phone=d.phone,
            email=d.email,
            isDemoListing=d.is_demo_listing
        )
        for d in doctors
    ]

@router.get("/appointments", response_model=List[AppointmentOut])
def list_appointments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    apts = db.query(Appointment).filter(
        Appointment.user_id == current_user.id
    ).order_by(Appointment.booked_at.desc()).all()

    return [
        AppointmentOut(
            id=a.id,
            doctorId=a.doctor_id,
            doctorName=a.doctor_name,
            specialty=a.specialty,
            patientName=a.patient_name,
            preferredDate=a.preferred_date,
            preferredTime=a.preferred_time,
            reasonForVisit=a.reason_for_visit,
            status=a.status,
            bookedAt=a.booked_at.isoformat() if a.booked_at else "",
            isDemoBooking=a.is_demo_booking
        )
        for a in apts
    ]

@router.post("/appointments", response_model=AppointmentOut)
def book_appointment(
    req: AppointmentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    apt = Appointment(
        user_id=current_user.id,
        doctor_id=req.doctorId,
        doctor_name=req.doctorName,
        specialty=req.specialty,
        patient_name=req.patientName,
        preferred_date=req.preferredDate,
        preferred_time=req.preferredTime,
        reason_for_visit=req.reasonForVisit,
        status="Confirmed",
        is_demo_booking=True
    )
    db.add(apt)
    db.commit()
    db.refresh(apt)

    return AppointmentOut(
        id=apt.id,
        doctorId=apt.doctor_id,
        doctorName=apt.doctor_name,
        specialty=apt.specialty,
        patientName=apt.patient_name,
        preferredDate=apt.preferred_date,
        preferredTime=apt.preferred_time,
        reasonForVisit=apt.reason_for_visit,
        status=apt.status,
        bookedAt=apt.booked_at.isoformat() if apt.booked_at else "",
        isDemoBooking=apt.is_demo_booking
    )
