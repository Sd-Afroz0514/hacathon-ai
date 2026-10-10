import json
import random
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from app.models.user import User
from app.models.family import FamilyMember
from app.schemas.family import FamilyMemberCreate, FamilyMemberUpdate, FamilyMemberOut
from app.core.deps import get_current_user

router = APIRouter(prefix="/family", tags=["Family Health Hub"])

AVATAR_COLORS = ["bg-teal-600", "bg-rose-500", "bg-indigo-500", "bg-amber-500", "bg-emerald-600", "bg-purple-600"]

def member_to_schema(m: FamilyMember) -> FamilyMemberOut:
    return FamilyMemberOut(
        id=m.id,
        primaryUserId=m.user_id,
        name=m.name,
        relationship=m.relationship_type,
        age=m.age,
        gender=m.gender,
        bloodGroup=m.blood_group,
        allergies=m.allergies,
        chronicConditions=m.chronic_conditions,
        lastCheckupDate=m.last_checkup_date,
        notes=m.notes,
        avatarColor=m.avatar_color
    )

@router.get("/members", response_model=List[FamilyMemberOut])
def list_family_members(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    members = db.query(FamilyMember).filter(
        FamilyMember.user_id == current_user.id
    ).order_by(FamilyMember.created_at.asc()).all()
    
    return [member_to_schema(m) for m in members]

@router.post("/members", response_model=FamilyMemberOut)
def create_family_member(
    entry: FamilyMemberCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    color = random.choice(AVATAR_COLORS)
    member = FamilyMember(
        user_id=current_user.id,
        name=entry.name,
        relationship_type=entry.relationship,
        age=entry.age,
        gender=entry.gender,
        blood_group=entry.bloodGroup,
        allergies_json=json.dumps(entry.allergies),
        chronic_conditions_json=json.dumps(entry.chronicConditions),
        last_checkup_date=entry.lastCheckupDate,
        notes=entry.notes,
        avatar_color=color
    )
    db.add(member)
    db.commit()
    db.refresh(member)

    return member_to_schema(member)

@router.put("/members/{member_id}", response_model=FamilyMemberOut)
def update_family_member(
    member_id: str,
    updates: FamilyMemberUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    member = db.query(FamilyMember).filter(
        FamilyMember.id == member_id,
        FamilyMember.user_id == current_user.id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Family member not found.")

    if updates.name is not None:
        member.name = updates.name
    if updates.relationship is not None:
        member.relationship_type = updates.relationship
    if updates.age is not None:
        member.age = updates.age
    if updates.gender is not None:
        member.gender = updates.gender
    if updates.bloodGroup is not None:
        member.blood_group = updates.bloodGroup
    if updates.allergies is not None:
        member.allergies = updates.allergies
    if updates.chronicConditions is not None:
        member.chronic_conditions = updates.chronicConditions
    if updates.lastCheckupDate is not None:
        member.last_checkup_date = updates.lastCheckupDate
    if updates.notes is not None:
        member.notes = updates.notes

    db.commit()
    db.refresh(member)
    return member_to_schema(member)

@router.delete("/members/{member_id}")
def delete_family_member(
    member_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    member = db.query(FamilyMember).filter(
        FamilyMember.id == member_id,
        FamilyMember.user_id == current_user.id
    ).first()
    if not member:
        raise HTTPException(status_code=404, detail="Family member not found.")
    
    db.delete(member)
    db.commit()
    return {"message": "Family member removed successfully"}
