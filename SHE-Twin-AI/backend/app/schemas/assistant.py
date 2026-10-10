from pydantic import BaseModel
from typing import List, Optional

class ChatMessageRequest(BaseModel):
    message: str
    language: Optional[str] = "en"

class ChatMessageResponse(BaseModel):
    id: str
    sender: str
    content: str
    timestamp: str
    language: Optional[str] = "en"
    agentType: Optional[str] = "general"
    isDemoSimulation: Optional[bool] = False
    suggestedFollowUps: Optional[List[str]] = []
    sources: Optional[List[str]] = []
