from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class OnboardingQuestionOption(BaseModel):
    label: str
    value: str

class OnboardingQuestion(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    type: str # 'select', 'multiselect', 'text', 'number', 'boolean'
    options: Optional[List[OnboardingQuestionOption]] = None
    required: bool = False
    category: str

class OnboardingSubmitRequest(BaseModel):
    lifeStageMode: str
    responses: Dict[str, Any]
    completedSteps: List[str] = []

class OnboardingOut(BaseModel):
    id: str
    userId: str
    lifeStageMode: str
    responses: Dict[str, Any]
    completedSteps: List[str]
    isCompleted: str
    updatedAt: Optional[str] = None
