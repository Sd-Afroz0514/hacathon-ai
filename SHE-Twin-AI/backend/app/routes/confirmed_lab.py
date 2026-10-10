from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from app.models.user import User
from app.models.confirmed_lab import ConfirmedLabResult
from app.schemas.confirmed_lab import (
    ConfirmedLabBatchCreate,
    ConfirmedLabOut
)
from app.core.deps import get_current_user

router = APIRouter(prefix="/labs", tags=["Confirmed Lab Results"])

@router.post("/confirm", response_model=List[ConfirmedLabOut])
def confirm_lab_results(
    req: ConfirmedLabBatchCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    saved_records = []
    for item in req.items:
        # Determine numeric value
        num_val = item.numericValue
        if num_val is None:
            try:
                # Strip units or extraneous text if present
                clean_str = item.value.split()[0].replace(",", "")
                num_val = float(clean_str)
            except Exception:
                num_val = None

        rec = ConfirmedLabResult(
            user_id=current_user.id,
            report_id=req.reportId,
            test_name=item.testName,
            category=item.category or "Hematology",
            value=item.value,
            numeric_value=num_val,
            unit=item.unit,
            reference_range=item.referenceRange,
            status=item.status or "normal",
            is_user_confirmed=True,
            user_notes=item.userNotes,
            test_date=item.testDate or req.testDate
        )
        db.add(rec)
        saved_records.append(rec)

    db.commit()
    for r in saved_records:
        db.refresh(r)

    return [
        ConfirmedLabOut(
            id=r.id,
            userId=r.user_id,
            reportId=r.report_id,
            testName=r.test_name,
            category=r.category,
            value=r.value,
            numericValue=r.numeric_value,
            unit=r.unit,
            referenceRange=r.reference_range,
            status=r.status,
            isUserConfirmed=r.is_user_confirmed,
            userNotes=r.user_notes,
            testDate=r.test_date,
            createdAt=r.created_at.isoformat() if r.created_at else ""
        ) for r in saved_records
    ]

@router.get("/confirmed", response_model=List[ConfirmedLabOut])
def get_user_confirmed_labs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    records = db.query(ConfirmedLabResult).filter(
        ConfirmedLabResult.user_id == current_user.id
    ).order_by(ConfirmedLabResult.created_at.desc()).all()

    return [
        ConfirmedLabOut(
            id=r.id,
            userId=r.user_id,
            reportId=r.report_id,
            testName=r.test_name,
            category=r.category,
            value=r.value,
            numericValue=r.numeric_value,
            unit=r.unit,
            referenceRange=r.reference_range,
            status=r.status,
            isUserConfirmed=r.is_user_confirmed,
            userNotes=r.user_notes,
            testDate=r.test_date,
            createdAt=r.created_at.isoformat() if r.created_at else ""
        ) for r in records
    ]
