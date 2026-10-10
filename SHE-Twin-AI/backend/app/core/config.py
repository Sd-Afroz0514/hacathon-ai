import os
from pathlib import Path
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent
PROJECT_ROOT = BASE_DIR.parent

# Load .env from backend or root directory
load_dotenv(BASE_DIR / ".env")
load_dotenv(PROJECT_ROOT / ".env")

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        case_sensitive=True,
        env_file=(str(BASE_DIR / ".env"), str(PROJECT_ROOT / ".env")),
        extra="ignore"
    )

    PROJECT_NAME: str = "SHE Twin AI Backend"
    API_V1_STR: str = "/api"
    APP_ENV: str = os.getenv("APP_ENV", "development")
    DEBUG: bool = os.getenv("DEBUG", "true").lower() in ("true", "1", "yes")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "she-twin-ai-super-secret-jwt-key-change-in-production-2026")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440")) # 24 hours

    
    # Database Configuration
    DATABASE_PATH: Path = PROJECT_ROOT / "database" / "she_twin.db"
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{DATABASE_PATH}")
    DIRECT_URL: Optional[str] = os.getenv("DIRECT_URL", None)
    
    # Optional Supabase API Credentials
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    
    # Upload storage
    UPLOAD_DIR: Path = PROJECT_ROOT / "database" / "uploads"
    
    # CORS
    CORS_ORIGINS: str = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"
    )
    
    @property
    def cors_origins_list(self) -> List[str]:
        if isinstance(self.CORS_ORIGINS, list):
            origins = list(self.CORS_ORIGINS)
        else:
            origins = [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
        for default_origin in [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]:
            if default_origin not in origins:
                origins.append(default_origin)
        return origins

    
    # Optional External AI Keys
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

    @staticmethod
    def _sanitize_uri(raw_url: str) -> str:
        url = raw_url.strip()
        if not url or url.startswith("sqlite"):
            return url
        # Automatically adapt standard postgresql / postgres URLs to use psycopg v3 driver
        if url.startswith("postgres://"):
            url = "postgresql+psycopg://" + url[len("postgres://"):]
        elif url.startswith("postgresql://"):
            url = "postgresql+psycopg://" + url[len("postgresql://"):]
        
        # Strip unsupported query parameters like pgbouncer=true which libpq/psycopg rejects
        if "?" in url:
            base, query = url.split("?", 1)
            params = [p for p in query.split("&") if not p.startswith("pgbouncer=")]
            url = f"{base}?{'&'.join(params)}" if params else base
        return url

    @property
    def get_sqlalchemy_database_uri(self) -> str:
        return self._sanitize_uri(self.DATABASE_URL)

    @property
    def get_sqlalchemy_direct_uri(self) -> str:
        if not self.DIRECT_URL:
            return self.get_sqlalchemy_database_uri
        return self._sanitize_uri(self.DIRECT_URL)


settings = Settings()

# Ensure local directories exist
os.makedirs(settings.DATABASE_PATH.parent, exist_ok=True)
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
