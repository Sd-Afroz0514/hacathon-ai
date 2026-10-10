from typing import Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from app.models.user import User
from app.models.life_stage import UserLifeStage
from app.schemas.life_stage import LifeStageUpdate, LifeStageOut
from app.core.deps import get_current_user

router = APIRouter(prefix="/lifestage", tags=["Life-Stage Health Mode"])

VALID_LIFE_STAGES = [
    "Teen / Young Women",
    "Reproductive Health",
    "Pregnancy",
    "Postpartum",
    "Menopause",
    "My Health",
    "Family Ally"
]

@router.get("", response_model=LifeStageOut)
def get_user_life_stage(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ls = db.query(UserLifeStage).filter(UserLifeStage.user_id == current_user.id).first()
    if not ls:
        ls = UserLifeStage(user_id=current_user.id, current_mode="My Health")
        db.add(ls)
        db.commit()
        db.refresh(ls)

    return LifeStageOut(
        id=ls.id,
        userId=ls.user_id,
        currentMode=ls.current_mode,
        startedAt=ls.started_at.isoformat() if ls.started_at else "",
        notes=ls.notes,
        metadata=ls.metadata_dict,
        updatedAt=ls.updated_at.isoformat() if ls.updated_at else ""
    )

@router.put("", response_model=LifeStageOut)
def update_user_life_stage(
    req: LifeStageUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if req.mode not in VALID_LIFE_STAGES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid life-stage mode '{req.mode}'. Valid modes: {', '.join(VALID_LIFE_STAGES)}"
        )

    ls = db.query(UserLifeStage).filter(UserLifeStage.user_id == current_user.id).first()
    if not ls:
        ls = UserLifeStage(
            user_id=current_user.id,
            current_mode=req.mode,
            notes=req.notes
        )
        if req.metadata:
            ls.metadata_dict = req.metadata
        db.add(ls)
    else:
        ls.current_mode = req.mode
        if req.notes is not None:
            ls.notes = req.notes
        if req.metadata is not None:
            ls.metadata_dict = req.metadata
        ls.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(ls)

    return LifeStageOut(
        id=ls.id,
        userId=ls.user_id,
        currentMode=ls.current_mode,
        startedAt=ls.started_at.isoformat() if ls.started_at else "",
        notes=ls.notes,
        metadata=ls.metadata_dict,
        updatedAt=ls.updated_at.isoformat() if ls.updated_at else ""
    )
