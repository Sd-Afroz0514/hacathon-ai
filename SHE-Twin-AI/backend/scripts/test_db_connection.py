import sys
import os
from pathlib import Path

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from sqlalchemy import text, inspect
from app.core.config import settings
from database import engine, Base

def mask_connection_string(uri: str) -> str:
    """Masks password and sensitive tokens in database URI for safe logging."""
    if "@" in uri:
        prefix, host_part = uri.split("@", 1)
        if ":" in prefix:
            user_part, _ = prefix.rsplit(":", 1)
            return f"{user_part}:****@{host_part}"
    return uri

def test_database_connection():
    masked_uri = mask_connection_string(settings.DATABASE_URL)
    dialect_name = engine.dialect.name
    print("=" * 80)
    print("SHE TWIN AI — DATABASE CONNECTIVITY DIAGNOSTIC")
    print("=" * 80)
    print(f"Target Dialect : {dialect_name.upper()}")
    print(f"Configured URI : {masked_uri}")
    print("-" * 80)

    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1")).scalar()
            assert result == 1, "Expected SELECT 1 to return 1"

            # Check database version / backend info
            if dialect_name == "postgresql":
                version = connection.execute(text("SELECT version();")).scalar()
                current_db = connection.execute(text("SELECT current_database();")).scalar()
                current_user = connection.execute(text("SELECT current_user;")).scalar()
                print(f"[OK] PostgreSQL Connected Successfully!")
                print(f"     Database : {current_db}")
                print(f"     User     : {current_user}")
                print(f"     Server   : {version.split(',')[0] if version else 'PostgreSQL'}")
            else:
                print(f"[OK] SQLite Connected Successfully!")
                print(f"     Path     : {settings.DATABASE_PATH}")

            # Inspect existing tables
            inspector = inspect(connection)
            tables = inspector.get_table_names()
            print("-" * 80)
            print(f"Existing Tables in Database ({len(tables)}):")
            for t in sorted(tables):
                print(f"  - {t}")

            if len(tables) == 0:
                print("  (No tables found. Tables will be created automatically on FastAPI startup or via migrations).")

        print("=" * 80)
        print("DATABASE STATUS: HEALTHY & READY")
        print("=" * 80)
        return True

    except Exception as e:
        print("=" * 80)
        print(f"[ERROR] Database Connection Failed!")
        print(f"Details : {type(e).__name__}: {str(e)}")
        print("=" * 80)
        print("\nTroubleshooting Tips:")
        print("1. Verify your DATABASE_URL in backend/.env has the correct URL-encoded password.")
        print("   If your password has special characters (e.g. '@', '#', '%'), URL-encode them (e.g. '@' -> '%40').")
        print("2. If using Supabase transaction pooler (port 6543), verify the connection string format:")
        print("   postgresql+psycopg://postgres.<PROJECT-REF>:<PASSWORD>@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true")
        print("3. Check that your Supabase project is active and not paused in the Supabase dashboard.")
        print("4. Check your network or firewall allows outbound traffic to port 6543 / 5432.")
        return False

if __name__ == "__main__":
    success = test_database_connection()
    sys.exit(0 if success else 1)
