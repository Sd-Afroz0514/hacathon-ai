# SHE Twin AI — Bug Audit & Resolution Report

## Summary of Defects & Enhancements

| Bug ID | Feature / Component | Severity | Root Cause | Status | Retest Result |
| :--- | :--- | :---: | :--- | :---: | :---: |
| **BUG-001** | Database URL / Psycopg3 | High | `psycopg` (v3) rejected `?pgbouncer=true` query option passed in standard Supabase transaction URLs. | **RESOLVED** | PASS (`test_db_connection.py` succeeds) |
| **BUG-002** | Health Twin API Router | Medium | Missing `DELETE /api/twin/vitals/{id}` endpoint in `health_twin.py`. | **RESOLVED** | PASS (`TC-VITAL-001` passed) |
| **BUG-003** | Test Suite Fixtures | Medium | Un-cleared `app.dependency_overrides` caused cross-test pollution in Pytest. | **RESOLVED** | PASS (All 11 pytest tests passed) |
| **BUG-004** | Frontend HealthContext | Low | `HealthContext` did not re-fetch upon user auth change without a hard reload. | **RESOLVED** | PASS (Frontend build & reactive sync verified) |

---

## Detailed Bug Reports

### Bug ID: BUG-001
- **Feature Affected:** Database Engine & Connection Pooling
- **Severity:** High
- **Reproduction Steps:**
  1. Set `DATABASE_URL` in `backend/.env` with `?pgbouncer=true`.
  2. Run `python scripts/test_db_connection.py`.
- **Expected Result:** Connection established via Transaction Pooler.
- **Actual Result:** `ProgrammingError: invalid connection option "pgbouncer"`.
- **Root Cause:** In psycopg v3, libpq treats query string arguments as connection parameters and throws an error on unrecognized flags like `pgbouncer`.
- **Fix Applied:** Implemented `_sanitize_uri()` in [backend/app/core/config.py](file:///c:/Users/sa787/OneDrive/Desktop/she%20win%20hackthon/SHE-Twin-AI/backend/app/core/config.py) to strip non-libpq query flags while applying transaction pooler settings in `engine_kwargs`.
- **Retest Result:** Connection and queries execute without errors.

---

### Bug ID: BUG-002
- **Feature Affected:** Health Twin Vital Observations Router
- **Severity:** Medium
- **Reproduction Steps:**
  1. Create a vital observation via `POST /api/twin/vitals`.
  2. Send `DELETE /api/twin/vitals/{vital_id}`.
- **Expected Result:** HTTP 200/204 with record deleted from database.
- **Actual Result:** HTTP 405 Method Not Allowed / 404.
- **Root Cause:** Route handler was omitted in original router definition.
- **Fix Applied:** Added `@router.delete("/vitals/{vital_id}")` with user-scoping in [backend/app/routes/health_twin.py](file:///c:/Users/sa787/OneDrive/Desktop/she%20win%20hackthon/SHE-Twin-AI/backend/app/routes/health_twin.py).
- **Retest Result:** Vital observations can be safely deleted by authorized owners.

---

### Bug ID: BUG-003
- **Feature Affected:** Pytest Automated Test Engine
- **Severity:** Medium
- **Reproduction Steps:**
  1. Run `python -m pytest tests/ -v`.
- **Expected Result:** All test modules execute independently.
- **Actual Result:** `OperationalError: no such table: users` in second test file due to retained fixture state.
- **Root Cause:** Global `app.dependency_overrides[get_db]` was assigned at import time rather than inside fixture lifecycle.
- **Fix Applied:** Scoped override into `setup_test_db()` fixture with `app.dependency_overrides.pop(get_db, None)` on teardown in [test_api.py](file:///c:/Users/sa787/OneDrive/Desktop/she%20win%20hackthon/SHE-Twin-AI/backend/tests/test_api.py) and [test_postgres_and_security.py](file:///c:/Users/sa787/OneDrive/Desktop/she%20win%20hackthon/SHE-Twin-AI/backend/tests/test_postgres_and_security.py).
- **Retest Result:** 11/11 tests pass synchronously in 4.38s.

---

### Bug ID: BUG-004
- **Feature Affected:** Frontend Health State Synchronization
- **Severity:** Low
- **Reproduction Steps:**
  1. Log in as User A, view dashboard.
  2. Log out and immediately log in as User B.
- **Expected Result:** `HealthContext` re-fetches data for User B automatically.
- **Actual Result:** State required manual page refresh to synchronize.
- **Root Cause:** `HealthContext.tsx` `useEffect` only depended on static `refreshAllData` callback.
- **Fix Applied:** Imported `useAuth` into [HealthContext.tsx](file:///c:/Users/sa787/OneDrive/Desktop/she%20win%20hackthon/SHE-Twin-AI/frontend/src/context/HealthContext.tsx) and added `user` to the effect dependency array.
- **Retest Result:** Data automatically synchronizes on user login.
