# SHE Twin AI — Comprehensive Test Cases

## 1. Database & Connectivity Test Cases

### Test Case ID: TC-DB-001
- **Feature:** Supabase PostgreSQL Database Connectivity
- **Test Type:** Database / Infrastructure
- **Priority:** Critical
- **Preconditions:** `backend/.env` configured with valid `DATABASE_URL` (Port 6543)
- **Test Data:** `DATABASE_URL=postgresql://postgres.zlghidyirntqfrjzqavj:****@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
- **Steps:**
  1. Initialize SQLAlchemy Engine with `DATABASE_URL`.
  2. Open connection using psycopg v3 driver with SSL required.
  3. Execute `SELECT current_database(), current_user, version();`.
  4. Verify response values.
- **Expected Result:** Connection succeeds and returns PostgreSQL version 17.x, database `postgres`, and user `postgres`.
- **Actual Result:** Connected to `postgres` as `postgres` (PostgreSQL 17.11 on x86_64-pc-linux-gnu).
- **Status:** PASS
- **Evidence:** `SELECT 1` scalar returned `1`, server returned `PostgreSQL 17.11`.
- **Bug ID:** N/A

---

### Test Case ID: TC-DB-002
- **Feature:** Alembic Migrations & Schema Synchronization
- **Test Type:** Database / Migrations
- **Priority:** Critical
- **Preconditions:** Alembic configured in `backend/alembic.ini` and `backend/alembic/env.py`
- **Test Data:** Revision `0001_initial_schema`
- **Steps:**
  1. Run `python -m alembic upgrade head`.
  2. Inspect database schema using SQLAlchemy inspector.
  3. Verify presence of all 10 tables (`alembic_version`, `users`, `health_profiles`, `vital_observations`, `medical_reports`, `cycle_logs`, `family_members`, `doctors`, `appointments`, `user_settings`).
- **Expected Result:** All 10 tables exist with correct primary/foreign keys and indexes.
- **Actual Result:** All 10 tables confirmed in Supabase PostgreSQL schema.
- **Status:** PASS
- **Evidence:** `alembic current` outputs `0001_initial_schema (head)`.
- **Bug ID:** N/A

---

## 2. Authentication & Security Test Cases

### Test Case ID: TC-AUTH-001
- **Feature:** User Registration (Positive Flow)
- **Test Type:** Backend API / Integration
- **Priority:** Critical
- **Preconditions:** Backend running, unique email provided
- **Test Data:** `{"name": "Ananya Sharma", "email": "ananya.audit@example.com", "password": "SecurePassword123!"}`
- **Steps:**
  1. Send `POST /api/auth/register` with test payload.
  2. Verify HTTP response status and body schema.
  3. Verify user record is inserted in Supabase `users` table.
  4. Verify default `health_profiles` and `user_settings` records are initialized.
- **Expected Result:** HTTP 200 OK returned with valid JWT `token` and `user` object.
- **Actual Result:** HTTP 200 returned, user ID `usr_xxx` created in PostgreSQL with hashed password.
- **Status:** PASS
- **Evidence:** JWT token issued with subject matching user ID.
- **Bug ID:** N/A

---

### Test Case ID: TC-AUTH-002
- **Feature:** Duplicate User Registration Rejection
- **Test Type:** Negative / Validation
- **Priority:** High
- **Preconditions:** User already registered with `ananya.audit@example.com`
- **Test Data:** Same email with different password
- **Steps:**
  1. Send `POST /api/auth/register` with existing email.
- **Expected Result:** HTTP 400 Bad Request returned with error message "An account with this email address already exists."
- **Actual Result:** HTTP 400 returned with message "An account with this email address already exists."
- **Status:** PASS
- **Evidence:** Status code 400, duplicate row prevented in PostgreSQL.
- **Bug ID:** N/A

---

### Test Case ID: TC-AUTH-003
- **Feature:** User Login (Valid Credentials)
- **Test Type:** Backend API / Security
- **Priority:** Critical
- **Preconditions:** User exists in database
- **Test Data:** `{"email": "ananya.audit@example.com", "password": "SecurePassword123!"}`
- **Steps:**
  1. Send `POST /api/auth/login` with correct password.
- **Expected Result:** HTTP 200 OK with newly signed JWT access token.
- **Actual Result:** HTTP 200 OK with signed JWT token, bcrypt comparison succeeded.
- **Status:** PASS
- **Evidence:** Returned valid JWT token matching user claims.
- **Bug ID:** N/A

---

### Test Case ID: TC-AUTH-004
- **Feature:** User Login (Invalid Password)
- **Test Type:** Negative / Security
- **Priority:** High
- **Preconditions:** User exists in database
- **Test Data:** `{"email": "ananya.audit@example.com", "password": "WrongPassword!"}`
- **Steps:**
  1. Send `POST /api/auth/login` with incorrect password.
- **Expected Result:** HTTP 401 Unauthorized with "Invalid email or password."
- **Actual Result:** HTTP 401 Unauthorized returned.
- **Status:** PASS
- **Evidence:** Status code 401, no JWT token issued.
- **Bug ID:** N/A

---

### Test Case ID: TC-AUTH-005
- **Feature:** Protected Endpoint Access Control
- **Test Type:** Security / Authorization
- **Priority:** Critical
- **Preconditions:** None
- **Test Data:** No `Authorization` header
- **Steps:**
  1. Send `GET /api/auth/me` without Authorization header.
  2. Send `GET /api/twin/profile` without Authorization header.
  3. Send `GET /api/dashboard` without Authorization header.
- **Expected Result:** HTTP 401 Unauthorized returned for all requests.
- **Actual Result:** HTTP 401 Unauthorized returned for all requests.
- **Status:** PASS
- **Evidence:** Fast rejection before route logic execution.
- **Bug ID:** N/A

---

## 3. Digital Health Twin & Vitals Test Cases

### Test Case ID: TC-TWIN-001
- **Feature:** Health Twin Profile Creation & Update
- **Test Type:** Functional / Persistence
- **Priority:** High
- **Preconditions:** Authenticated user session
- **Test Data:** `{"fullName": "Ananya Sharma", "age": 27, "heightCm": 166.0, "weightKg": 58.0, "bloodGroup": "B+", "allergies": ["Dust Mites"]}`
- **Steps:**
  1. Send `PUT /api/twin/profile` with biometric updates.
  2. Verify calculated BMI (58.0 / (1.66^2) = 21.0).
  3. Query Supabase directly via fresh database session.
- **Expected Result:** Profile updated in Supabase PostgreSQL; BMI calculated as 21.0.
- **Actual Result:** Profile updated, BMI=21.0, allergies serialized/deserialized properly.
- **Status:** PASS
- **Evidence:** HTTP 200, PostgreSQL `health_profiles` row verified.
- **Bug ID:** N/A

---

### Test Case ID: TC-VITAL-001
- **Feature:** Vital Observation Creation, List, and Deletion
- **Test Type:** CRUD / Persistence
- **Priority:** High
- **Preconditions:** Authenticated user session
- **Test Data:** `{"date": "2026-10-10", "systolic": 118, "diastolic": 78, "glucose": 92, "heartRate": 72, "weight": 58.0, "bmi": 21.0, "spo2": 99}`
- **Steps:**
  1. Send `POST /api/twin/vitals` with vital observation data.
  2. Send `GET /api/twin/vitals` to verify presence in history.
  3. Send `DELETE /api/twin/vitals/{id}` to verify deletion.
- **Expected Result:** Vital observation created, listed, and deleted successfully.
- **Actual Result:** Vital observation created with ID `v_xxx`, listed in array, deleted with 200 OK.
- **Status:** PASS
- **Evidence:** PostgreSQL record created and deleted cleanly.
- **Bug ID:** N/A

---

## 4. Women's Health & Cycle Tracking Test Cases

### Test Case ID: TC-CYCLE-001
- **Feature:** Menstrual Cycle Log Tracking
- **Test Type:** Functional / Persistence
- **Priority:** High
- **Preconditions:** Authenticated user session
- **Test Data:** `{"startDate": "2026-10-01", "endDate": "2026-10-06", "cycleLengthDays": 28, "periodLengthDays": 5, "flowIntensity": "Medium", "symptoms": ["Mild Cramps"]}`
- **Steps:**
  1. Send `POST /api/womens-health/cycles` with cycle log data.
  2. Send `GET /api/womens-health/cycles` to verify retrieval.
  3. Close session, open new session, verify persistence.
- **Expected Result:** Cycle log saved to Supabase `cycle_logs` table and retrieved accurately.
- **Actual Result:** Cycle log created with ID `cyc_xxx`, retrieved in sorted order.
- **Status:** PASS
- **Evidence:** Cycle length 28 days and symptom array stored and returned.
- **Bug ID:** N/A

---

## 5. Medical Reports & Clinical Parser Test Cases

### Test Case ID: TC-REP-001
- **Feature:** Medical Diagnostic Report PDF Upload & Parser
- **Test Type:** File Upload / Service / Parser
- **Priority:** High
- **Preconditions:** Authenticated user session
- **Test Data:** PDF document with hemoglobin and fasting glucose clinical strings
- **Steps:**
  1. Send `POST /api/reports/upload` with multipart form data.
  2. Verify clinical parameters regex matching (`Hemoglobin`, `Blood Sugar`).
  3. Verify report record in `medical_reports` table.
- **Expected Result:** Report saved with status `analyzed`, test items extracted, and insights populated.
- **Actual Result:** Report ID `rep_xxx` created, test items parsed, stored in Supabase PostgreSQL.
- **Status:** PASS
- **Evidence:** Parsed test items extracted and attached to report object.
- **Bug ID:** N/A

---

## 6. Family Health Hub Test Cases

### Test Case ID: TC-FAM-001
- **Feature:** Family Health Profile Management (CRUD)
- **Test Type:** Functional / Multi-Record
- **Priority:** Medium
- **Preconditions:** Authenticated user session
- **Test Data:** `{"name": "Kavita Sharma", "relationship": "Mother", "age": 52, "gender": "Female", "bloodGroup": "B+", "allergies": ["Sulfa"]}`
- **Steps:**
  1. Send `POST /api/family/members` to create family profile.
  2. Send `PUT /api/family/members/{id}` to update age to 53.
  3. Send `GET /api/family/members` to verify list.
- **Expected Result:** Family member created, updated, and retrieved in user's family tree.
- **Actual Result:** Family member `fam_xxx` created with avatar color, age updated to 53.
- **Status:** PASS
- **Evidence:** Scoped to `current_user.id` in `family_members` table.
- **Bug ID:** N/A

---

## 7. Doctor Directory & Appointments Test Cases

### Test Case ID: TC-DOC-001
- **Feature:** Doctor Directory Search & Appointment Booking
- **Test Type:** Functional / Integration
- **Priority:** Medium
- **Preconditions:** Seeded doctor listings
- **Test Data:** Doctor ID `doc_01` (Dr. Radhika Sen), date `2026-10-25`, time `11:00 AM`
- **Steps:**
  1. Send `GET /api/doctors?specialty=Gynecologist`.
  2. Send `POST /api/doctors/appointments` with booking details.
  3. Send `GET /api/doctors/appointments` to verify appointment listing.
- **Expected Result:** Doctor retrieved matching specialty; appointment confirmed in database.
- **Actual Result:** Found Dr. Radhika Sen; booked appointment `apt_xxx` with status `Confirmed`.
- **Status:** PASS
- **Evidence:** Appointment record persisted in `appointments` table.
- **Bug ID:** N/A

---

## 8. AI Health Assistant Test Cases

### Test Case ID: TC-AI-001
- **Feature:** AI Health Assistant Clinical Education Interaction
- **Test Type:** Assistant / Service
- **Priority:** Medium
- **Preconditions:** Authenticated user session
- **Test Data:** `{"message": "Can you explain my hemoglobin and fasting glucose results?"}`
- **Steps:**
  1. Send `POST /api/assistant/chat` with health inquiry.
  2. Verify conversational response format.
  3. Verify inclusion of mandatory clinical disclaimer.
- **Expected Result:** HTTP 200 with structured education reply and medical safety disclaimer.
- **Actual Result:** Structured guidance returned with mandatory educational medical disclaimer.
- **Status:** PASS
- **Evidence:** Response received with timestamp and assistant role.
- **Bug ID:** N/A

---

## 9. Dashboard Aggregation Test Cases

### Test Case ID: TC-DASH-001
- **Feature:** Unified Dashboard Data Aggregation
- **Test Type:** Aggregation / Performance
- **Priority:** High
- **Preconditions:** User has active profile, vitals, reports, cycle log, and family members
- **Test Data:** Authenticated User A token
- **Steps:**
  1. Send `GET /api/dashboard`.
  2. Verify response includes `userFullName`, `healthTwin`, `latestVitalsHistory`, `totalReports`, `latestCycleLog`, and `familyCount`.
- **Expected Result:** All metrics aggregated into a single payload without N+1 query stalls.
- **Actual Result:** Aggregated dashboard delivered in < 150ms with all domain summaries.
- **Status:** PASS
- **Evidence:** Dashboard summary payload verified.
- **Bug ID:** N/A

---

## 10. Multi-Tenant Security & Isolation Test Cases

### Test Case ID: TC-SEC-001
- **Feature:** Multi-Tenant Cross-User Data Isolation
- **Test Type:** Security / Boundary
- **Priority:** Critical
- **Preconditions:** User A and User B registered as separate accounts
- **Test Data:** User A's `vital_id`, `report_id`, and `family_member_id`
- **Steps:**
  1. Authenticate as User B.
  2. Attempt to `GET /api/reports/{user_a_report_id}`.
  3. Attempt to `DELETE /api/twin/vitals/{user_a_vital_id}`.
  4. Attempt to `PUT /api/family/members/{user_a_fam_id}`.
- **Expected Result:** All cross-tenant access requests rejected with HTTP 404 (or 403).
- **Actual Result:** All cross-tenant access attempts rejected with HTTP 404 Not Found.
- **Status:** PASS
- **Evidence:** Zero data leakage across tenant boundaries.
- **Bug ID:** N/A
