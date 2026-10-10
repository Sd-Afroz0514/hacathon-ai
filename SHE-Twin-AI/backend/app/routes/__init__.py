from app.routes.auth import router as auth_router
from app.routes.health_twin import router as health_twin_router
from app.routes.dashboard import router as dashboard_router
from app.routes.reports import router as reports_router
from app.routes.assistant import router as assistant_router
from app.routes.womens_health import router as womens_health_router
from app.routes.family import router as family_router
from app.routes.doctors import router as doctors_router
from app.routes.settings import router as settings_router

# Additive Feature Routers
from app.routes.location import router as location_router
from app.routes.life_stage import router as life_stage_router
from app.routes.onboarding import router as onboarding_router
from app.routes.assessment import router as assessment_router
from app.routes.confirmed_lab import router as confirmed_lab_router
from app.routes.care_navigation import router as care_navigation_router
from app.routes.timeline import router as timeline_router

__all__ = [
    "auth_router",
    "health_twin_router",
    "dashboard_router",
    "reports_router",
    "assistant_router",
    "womens_health_router",
    "family_router",
    "doctors_router",
    "settings_router",
    "location_router",
    "life_stage_router",
    "onboarding_router",
    "assessment_router",
    "confirmed_lab_router",
    "care_navigation_router",
    "timeline_router"
]
