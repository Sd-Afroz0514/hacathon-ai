import json
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from app.models.user import User
from app.models.cycle_log import CycleLog
from app.schemas.cycle_log import CycleLogCreate, CycleLogOut
from app.core.deps import get_current_user

router = APIRouter(prefix="/womens-health", tags=["Women's Health"])

@router.get("/cycles", response_model=List[CycleLogOut])
def get_cycle_logs(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    logs = db.query(CycleLog).filter(
        CycleLog.user_id == current_user.id
    ).order_by(CycleLog.start_date.desc()).all()
    
    return [
        CycleLogOut(
            id=l.id,
            startDate=l.start_date,
            endDate=l.end_date,
            cycleLengthDays=l.cycle_length_days,
            periodLengthDays=l.period_length_days,
            flowIntensity=l.flow_intensity,
            symptoms=l.symptoms,
            mood=l.mood,
            notes=l.notes
        )
        for l in logs
    ]

@router.post("/cycles", response_model=CycleLogOut)
def create_cycle_log(
    entry: CycleLogCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cycle = CycleLog(
        user_id=current_user.id,
        start_date=entry.startDate,
        end_date=entry.endDate,
        cycle_length_days=entry.cycleLengthDays,
        period_length_days=entry.periodLengthDays,
        flow_intensity=entry.flowIntensity,
        symptoms_json=json.dumps(entry.symptoms),
        mood=entry.mood,
        notes=entry.notes
    )
    db.add(cycle)
    db.commit()
    db.refresh(cycle)

    return CycleLogOut(
        id=cycle.id,
        startDate=cycle.start_date,
        endDate=cycle.end_date,
        cycleLengthDays=cycle.cycle_length_days,
        periodLengthDays=cycle.period_length_days,
        flowIntensity=cycle.flow_intensity,
        symptoms=cycle.symptoms,
        mood=cycle.mood,
        notes=cycle.notes
    )

@router.delete("/cycles/{cycle_id}")
def delete_cycle_log(
    cycle_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cycle = db.query(CycleLog).filter(
        CycleLog.id == cycle_id,
        CycleLog.user_id == current_user.id
    ).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Cycle entry not found.")
    
    db.delete(cycle)
    db.commit()
    return {"message": "Cycle log deleted successfully"}
