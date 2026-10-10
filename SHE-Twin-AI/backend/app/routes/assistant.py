from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from app.models.user import User
from app.models.health_twin import HealthProfile
from app.models.life_stage import UserLifeStage
from app.schemas.assistant import ChatMessageRequest, ChatMessageResponse
from app.services.ai_assistant import generate_health_assistant_response
from app.core.deps import get_current_user

router = APIRouter(prefix="/assistant", tags=["AI Health Assistant"])

@router.post("/chat", response_model=ChatMessageResponse)
def assistant_chat(
    req: ChatMessageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_first_name = current_user.name.split()[0] if current_user.name else "Patient"
    
    # Get life stage
    stage_rec = db.query(UserLifeStage).filter(UserLifeStage.user_id == current_user.id).first()
    active_stage = stage_rec.current_mode if stage_rec else "My Health"

    user_context = {
        "life_stage": active_stage
    }

    twin = db.query(HealthProfile).filter(HealthProfile.user_id == current_user.id).first()
    if twin:
        user_context["age"] = twin.age
        user_context["conditions"] = twin.chronic_conditions

    response_data = generate_health_assistant_response(
        message=req.message,
        user_name=user_first_name,
        language=req.language or "en",
        user_context=user_context
    )
    if "language" not in response_data:
        response_data["language"] = req.language or "en"

    return ChatMessageResponse(**response_data)
