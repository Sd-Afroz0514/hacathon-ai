from typing import Optional
from pydantic import BaseModel, Field

class UserLocationCreate(BaseModel):
    city: str = Field(..., min_length=2, max_length=100)
    state: str = Field(..., min_length=2, max_length=100)
    pincode: str = Field(..., min_length=4, max_length=20)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    isPrimary: Optional[bool] = True

class UserLocationOut(BaseModel):
    id: str
    userId: str
    city: str
    state: str
    pincode: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    isPrimary: bool
    createdAt: Optional[str] = None
