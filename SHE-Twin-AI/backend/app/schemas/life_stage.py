from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

class LifeStageUpdate(BaseModel):
    mode: str = Field(..., description="Selected Life-Stage Mode")
    notes: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class LifeStageOut(BaseModel):
    id: str
    userId: str
    currentMode: str
    startedAt: Optional[str] = None
    notes: Optional[str] = None
    metadata: Dict[str, Any] = {}
    updatedAt: Optional[str] = None
