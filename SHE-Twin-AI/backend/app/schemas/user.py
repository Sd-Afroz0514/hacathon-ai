from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    gender: Optional[str] = "Female"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    email: str
    role: str
    isDemoUser: Optional[bool] = False
    isNewAccount: Optional[bool] = False
    createdAt: Optional[datetime] = None

class TokenOut(BaseModel):
    token: str
    user: UserOut

class PasswordChangeRequest(BaseModel):
    currentPassword: str
    newPassword: str
