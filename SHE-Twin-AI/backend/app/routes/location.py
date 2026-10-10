from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from app.models.user import User
from app.models.location import UserLocation
from app.schemas.location import UserLocationCreate, UserLocationOut
from app.core.deps import get_current_user

router = APIRouter(prefix="/location", tags=["Location Management"])

@router.get("", response_model=Optional[UserLocationOut])
def get_user_location(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    loc = db.query(UserLocation).filter(
        UserLocation.user_id == current_user.id,
        UserLocation.is_primary == True
    ).first()
    if not loc:
        loc = db.query(UserLocation).filter(UserLocation.user_id == current_user.id).first()
    
    if not loc:
        return None

    return UserLocationOut(
        id=loc.id,
        userId=loc.user_id,
        city=loc.city,
        state=loc.state,
        pincode=loc.pincode,
        latitude=loc.latitude,
        longitude=loc.longitude,
        isPrimary=loc.is_primary,
        createdAt=loc.created_at.isoformat() if loc.created_at else ""
    )

@router.put("", response_model=UserLocationOut)
def update_or_create_user_location(
    req: UserLocationCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    loc = db.query(UserLocation).filter(UserLocation.user_id == current_user.id).first()
    if not loc:
        loc = UserLocation(
            user_id=current_user.id,
            city=req.city.strip(),
            state=req.state.strip(),
            pincode=req.pincode.strip(),
            latitude=req.latitude,
            longitude=req.longitude,
            is_primary=req.isPrimary if req.isPrimary is not None else True
        )
        db.add(loc)
    else:
        loc.city = req.city.strip()
        loc.state = req.state.strip()
        loc.pincode = req.pincode.strip()
        if req.latitude is not None:
            loc.latitude = req.latitude
        if req.longitude is not None:
            loc.longitude = req.longitude
        if req.isPrimary is not None:
            loc.is_primary = req.isPrimary

    db.commit()
    db.refresh(loc)

    return UserLocationOut(
        id=loc.id,
        userId=loc.user_id,
        city=loc.city,
        state=loc.state,
        pincode=loc.pincode,
        latitude=loc.latitude,
        longitude=loc.longitude,
        isPrimary=loc.is_primary,
        createdAt=loc.created_at.isoformat() if loc.created_at else ""
    )
