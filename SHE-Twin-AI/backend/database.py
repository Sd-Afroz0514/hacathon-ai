from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

db_uri = settings.get_sqlalchemy_database_uri

is_sqlite = db_uri.startswith("sqlite")
is_postgres = "postgres" in db_uri or "psycopg" in db_uri

engine_kwargs = {
    "echo": False,
}

if is_sqlite:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
elif is_postgres:
    # Optimized for Supabase Transaction Pooler (Port 6543 / PgBouncer) & Session Pooler (Port 5432)
    # Disabling prepared statements in psycopg avoids 'prepared statement already exists / does not exist' in PgBouncer transaction mode
    engine_kwargs["connect_args"] = {
        "prepare_threshold": None,
        "sslmode": "require"
    }
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_recycle"] = 300
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20

engine = create_engine(
    db_uri,
    **engine_kwargs
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
