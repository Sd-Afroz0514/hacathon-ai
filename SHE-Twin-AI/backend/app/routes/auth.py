from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from app.models.user import User
from app.models.health_twin import HealthProfile
from app.models.settings import UserSettings
from app.schemas.user import UserRegister, UserLogin, UserOut, TokenOut
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenOut)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    # Check duplicate email
    existing_user = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )
    
    # Create user
    user = User(
        name=user_in.name,
        email=user_in.email.lower(),
        hashed_password=get_password_hash(user_in.password),
        role="patient",
        is_demo_user=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Initialize associated HealthProfile
    twin_gender = getattr(user_in, 'gender', 'Female') or 'Female'
    twin = HealthProfile(
        user_id=user.id,
        full_name=user.name,
        age=0,
        gender=twin_gender,
        blood_group="Nil",
        height_cm=0.0,
        weight_kg=0.0,
        bmi=0.0,
        bp_systolic=0,
        bp_diastolic=0,
        heart_rate_bpm=0,
        glucose_mg_dl=0,
        spo2_pct=0
    )
    db.add(twin)

    # Initialize UserSettings
    user_settings = UserSettings(user_id=user.id)
    db.add(user_settings)
    db.commit()

    token = create_access_token(user.id)
    user_out = UserOut.model_validate(user)
    user_out.isNewAccount = True
    return TokenOut(token=token, user=user_out)

@router.post("/login", response_model=TokenOut)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email.lower()).first()
    if not user or not verify_password(login_in.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )
    
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Account disabled.")
        
    token = create_access_token(user.id)
    user_out = UserOut.model_validate(user)
    user_out.isNewAccount = False
    return TokenOut(token=token, user=user_out)

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    return {"message": "Successfully logged out"}
