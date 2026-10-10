# 🌸 SHE Twin AI — Personalized Health Twin & Multilingual Clinical Assistant

[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6.svg?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Supabase-4169E1.svg?logo=postgresql&logoColor=white)](https://supabase.com/)
[![Tests](https://img.shields.io/badge/Pytest-31%2F31%20Passed-success.svg)](https://docs.pytest.org/)

**SHE Twin AI** is a personalized digital health platform and virtual healthcare companion specifically designed for women and families across every chapter of life. By unifying continuous biometric tracking (**Digital Health Twin**), trimester and age-specific adaptive clinical modes, an intelligent **36-domain multilingual AI Assistant**, automated laboratory report analysis, and care navigation, SHE Twin AI bridges the gap between medical records and real-world everyday health decisions.

---

## 📑 Table of Contents

- [Vision & Key Innovations](#-vision--key-innovations)
- [System Architecture](#-system-architecture)
- [Core Features & Modules](#-core-features--modules)
  - [1. Digital Health Twin Engine](#1-digital-health-twin-engine)
  - [2. Life-Stage Adaptive Healthcare](#2-life-stage-adaptive-healthcare)
  - [3. Intelligent AI Clinical Assistant](#3-intelligent-ai-clinical-assistant)
  - [4. Dynamic Symptom Assessment & Triage](#4-dynamic-symptom-assessment--triage)
  - [5. Lab Report Parser & OCR Explainer](#5-lab-report-parser--ocr-explainer)
  - [6. Care Navigation & Doctor Consultations](#6-care-navigation--doctor-consultations)
  - [7. Family Ally & Longitudinal Health Timeline](#7-family-ally--longitudinal-health-timeline)
- [Project Directory Structure](#-project-directory-structure)
- [Quick Start Guide](#-quick-start-guide)
  - [Option A: One-Click Launch (Windows)](#option-a-one-click-launch-windows)
  - [Option B: Manual Step-by-Step Launch](#option-b-manual-step-by-step-launch)
- [Environment Configuration](#-environment-configuration)
- [API Reference Guide](#-api-reference-guide)
- [Automated Testing & Verification](#-automated-testing--verification)
- [Security, Privacy & Clinical Disclaimers](#-security-privacy--clinical-disclaimers)

---

## 💡 Vision & Key Innovations

Women's health needs shift dynamically across life stages—from adolescent menstrual maturation to reproductive years, pregnancy, postpartum healing, and the menopausal transition. Standard healthcare apps treat health as static and ask repetitive generic questions.

**SHE Twin AI changes this through four pillars:**
1. **Adaptive Life-Stage Context**: AI prompts, symptoms, risk thresholds, and diagnostic triage questions automatically recalibrate based on whether the user is in *Teen*, *Reproductive*, *Pregnancy*, *Postpartum*, *Menopause*, *My Health*, or *Family Ally* mode.
2. **Distinct Clinical Inquiry**: Replaced generic fallback questions with **36 condition-specific diagnostic inquiry paths** (e.g., distinguishing migraine vs tension headaches, hyperemesis gravidarum vs morning sickness, lochia vs postpartum hemorrhage).
3. **Multilingual Access**: Full diagnostic reasoning, red-flag triage, and follow-ups available in **English, Telugu (తెలుగు), Hindi (हिन्दी), Kannada (ಕನ್ನಡ), and Tamil (தமிழ்)**.
4. **Digital Health Twin Continuity**: Longitudinal baseline tracking for blood pressure, fasting glucose, hemoglobin, and vital trends that compare against personalized baselines rather than generic population averages.

---

## 🏛 System Architecture

```
+-----------------------------------------------------------------------------------------+
|                                 React 18 + TypeScript Frontend                          |
|  - LifeStageSelector  - SymptomAssessmentModal  - AssistantChat  - LabUploader          |
|  - DigitalTwinCard    - CycleTracker            - DoctorDirectory - FamilyTree          |
+--------------------------------------------+--------------------------------------------+
                                             | REST API (JSON / Bearer JWT)
                                             v
+-----------------------------------------------------------------------------------------+
|                                 FastAPI Backend Engine                                  |
|  * /api/auth           - User Auth, Password Hashing, JWT Session Issuance              |
|  * /api/twin           - Digital Health Twin Profile & Longitudinal Vitals              |
|  * /api/lifestage      - Active Stage Orchestrator (Teen, Pregnancy, Postpartum, etc.)  |
|  * /api/assistant      - 36-Domain Clinical Assistant (Word-Boundary + Gemini Fallback) |
|  * /api/assessments    - Dynamic Multi-Factor Clinical Risk Scoring                     |
|  * /api/reports        - Medical Lab Report Parser (CBC, TSH, Lipids, Glucose)          |
|  * /api/doctors        - Healthcare Directory & Appointment Scheduling                  |
|  * /api/family         - Family Ally Caregiver Hub & Hereditary Risk Tree               |
+--------------------------------------------+--------------------------------------------+
                                             |
                      +----------------------+----------------------+
                      | (Production / Pooler)                       | (Local Dev / Offline)
                      v                                             v
+------------------------------------------+  +------------------------------------------+
|   Supabase Managed PostgreSQL            |  |   Local SQLite Database Engine           |
|  - Port 6543: PgBouncer Transaction Pool |  |   Path: database/she_twin.db             |
|  - Port 5432: Direct Session (Alembic)   |  |   Zero-configuration local testing       |
+------------------------------------------+  +------------------------------------------+
```

---

## 🚀 Core Features & Modules

### 1. Digital Health Twin Engine
- **Biometric Profiles**: Tracks Blood Group, Age, Height, Weight, BMI, Chronic Conditions, and Allergies.
- **Vitals Monitoring**: Continuous time-series observation of Blood Pressure (Systolic/Diastolic), Fasting Glucose, Heart Rate, and Oxygen Saturation (SpO2).
- **Personalized Risk Scoring**: Compares new vitals against individual baselines to flag subtle physiological shifts before they become acute emergencies.

### 2. Life-Stage Adaptive Healthcare
SHE Twin AI dynamically adapts its entire interface, symptom checklists, and clinical rules across **7 distinct life stages**:

| Life Stage | Focus Areas | Tailored Features |
| :--- | :--- | :--- |
| **Teen / Young Women** | Menarche, pubertal development, cycle irregularity, academic wellbeing | Menarche age tracking, school-disruption assessment, teen acne & anemia prevention |
| **Reproductive Health** | Menstrual cycles, PCOS/PCOD, ovulation tracking, pelvic comfort | Cycle rhythm prediction, flow intensity logging, hormonal imbalance monitoring |
| **Pregnancy** | Antenatal milestones across Trimesters 1, 2, and 3 | Trimester-filtered symptoms, daily fetal kick tracking (target: 10 kicks/2 hrs), pre-eclampsia screening |
| **Postpartum** | The Fourth Trimester: maternal recovery, lactation, wound healing | Lochia bleeding timeline, C-section & perineal healing, mastitis checks, postpartum mental health (EPDS) |
| **Menopause** | Perimenopause and menopausal transition | Hot flash & night sweat severity, bone density/calcium nutrition, sleep & mood support |
| **My Health** | General adult health & preventative wellness | Comprehensive routine vitals, lab test analysis, diet and sleep optimization |
| **Family Ally** | Caregiver guidance for supporting family members | Post-operative home checklists, clinic preparation questions, red-flag emergency alarms |

### 3. Intelligent AI Clinical Assistant
- **36 Specialized Clinical Domains**: Covers headaches, dizziness, acidity/GERD, nausea, diarrhea, constipation, UTIs, fevers, cough/cold, asthma/wheezing, hypertension, diabetes, chest pain, back pain, joint arthritis, thyroid, anemia, sleep disorders, dermatology, acne, hair fall, dental pain, anxiety, depression, prostate health, and life-stage care.
- **Condition-Tailored Diagnostic Follow-Ups**: Every condition generates 3 distinct, non-duplicate follow-up questions to help users clarify their symptoms.
- **Multilingual Support**: Fully localized in English, Telugu, Hindi, Kannada, and Tamil.
- **Dual-Engine Architecture**: Uses high-speed, deterministic clinical guideline matching with optional integration with **Google Gemini 1.5 Flash** when a `GEMINI_API_KEY` is provided.
- **Emergency Interception**: Immediate red-flag detection triggers high-priority alerts with emergency helpline routing (112 / 108 in India).

### 4. Dynamic Symptom Assessment & Triage
- **Context-Sensitive Clinical Questions**: Selecting specific symptoms immediately reveals tailored clinical questions (e.g., selecting *Fever* asks for exact temperature and chills; selecting *Cough* asks whether it is dry or productive).
- **Red-Flag Warnings**: High-risk symptoms (e.g., vaginal bleeding during pregnancy, severe sudden chest pain, fluid leakage) immediately escalate risk status.
- **Actionable Guidance**: Generates personalized immediate care recommendations and suggests relevant clinical specialists.

### 5. Lab Report Parser & OCR Explainer
- **Automated Extraction**: Parses uploaded PDF and image lab reports for parameters including:
  - Complete Blood Count (CBC): Hemoglobin, WBC, Platelets, RBC
  - Thyroid Panel: TSH, Free T3, Free T4
  - Metabolic: Fasting Blood Sugar, HbA1c, Serum Creatinine
  - Lipid Profile: Total Cholesterol, LDL, HDL, Triglycerides
  - Vitamins: Vitamin D3, Vitamin B12, Serum Ferritin
- **Plain-Language Clarifications**: Translates complex clinical units into easily understandable educational summaries.

### 6. Care Navigation & Doctor Consultations
- **Verified Practitioner Directory**: Search verified Gynecologists, Obstetricians, Endocrinologists, General Physicians, and Pediatricians.
- **Teleconsultation & Clinic Appointments**: Real-time slot booking with appointment management and status tracking.

### 7. Family Ally & Longitudinal Health Timeline
- **Caregiver Collaboration**: Family members can track recovery schedules, log medication reminders, and monitor post-procedure progress.
- **Chronological Timeline**: Consolidates vitals, past symptoms, uploaded reports, and doctor visits into a unified health trajectory.

---

## 📂 Project Directory Structure

```
she win hackthon/
├── .vscode/
│   └── launch.json                      # VS Code launch & debugging configurations
└── SHE-Twin-AI/
    ├── run_project.bat                  # One-click Windows launch script
    ├── README.md                        # Project documentation (this file)
    ├── .env.example                     # Environment variables template
    │
    ├── backend/                         # FastAPI Python Backend
    │   ├── main.py                      # FastAPI application entrypoint & middleware
    │   ├── database.py                  # Database session factory (SQLite & PostgreSQL)
    │   ├── requirements.txt             # Python dependencies
    │   ├── alembic.ini                  # Alembic database migrations config
    │   ├── app/
    │   │   ├── core/                    # Security, JWT tokens, and settings config
    │   │   ├── models/                  # SQLAlchemy ORM database models
    │   │   │   ├── user.py              # User account & auth credentials
    │   │   │   ├── health_twin.py       # Health twin biometric profile & vital logs
    │   │   │   ├── life_stage.py        # Life-stage mode state & preferences
    │   │   │   ├── assessment.py        # Symptom assessment records & triage scores
    │   │   │   ├── medical_report.py    # Parsed lab reports & test parameters
    │   │   │   ├── womens_health.py     # Menstrual cycle tracking
    │   │   │   ├── doctor.py            # Practitioner directory & appointment bookings
    │   │   │   └── family.py            # Family members & care networks
    │   │   ├── schemas/                 # Pydantic v2 validation schemas
    │   │   ├── routes/                  # REST API route handlers
    │   │   │   ├── assistant.py         # AI Assistant chat endpoint
    │   │   │   ├── assessment.py        # Symptom triage & risk calculation
    │   │   │   ├── life_stage.py        # Life-stage mode switching
    │   │   │   ├── health_twin.py       # Digital twin biometrics & vitals history
    │   │   │   ├── reports.py           # Medical report upload & test parsing
    │   │   │   ├── doctors.py           # Doctors directory & booking
    │   │   │   ├── family.py            # Family member management
    │   │   │   └── auth.py              # User authentication & registration
    │   │   └── services/
    │   │       ├── ai_assistant.py      # 36-domain clinical intelligence & Gemini integration
    │   │       ├── clinical_rules.py    # Risk assessment & triage scoring rules
    │   │       └── report_parser.py     # Medical lab report parser & parameter normalizer
    │   ├── scripts/                     # Database migration & diagnostics utilities
    │   └── tests/                       # Automated Pytest suite
    │       ├── test_ai_different_questions.py  # Tests for AI question differentiation & life stages
    │       ├── test_life_stage_symptoms_dynamic.py # Tests for stage-specific symptoms
    │       ├── test_api.py              # Core API endpoint validation
    │       └── test_postgres_and_security.py # Security & multi-tenant isolation tests
    │
    └── frontend/                        # React 18 + TypeScript + Vite Frontend
        ├── index.html                   # HTML entrypoint
        ├── package.json                 # Node.js dependencies & scripts
        ├── vite.config.ts               # Vite bundler config
        ├── tsconfig.json                # TypeScript compiler config
        └── src/
            ├── App.tsx                  # Root application router & view controller
            ├── main.tsx                 # React DOM mount point
            ├── index.css                # Tailwind design system & styling
            ├── components/              # Modular UI components
            │   ├── common/              # Buttons, Cards, Badges, Modals, TopBar
            │   ├── SymptomAssessmentModal.tsx # Dynamic symptom triage dialog
            │   └── LifeStageSelector.tsx # Top-bar life-stage mode switcher
            ├── config/
            │   └── lifeStageSymptoms.ts # Stage symptom catalogs & dynamic triage questions
            ├── context/                 # React Context providers (Auth, Language, Toast)
            ├── pages/                   # Application views
            │   ├── DashboardPage.tsx    # Vitals overview, risk cards, quick actions
            │   ├── AssistantPage.tsx    # Stage-adaptive AI Assistant chat
            │   ├── HealthTwinPage.tsx   # Biometrics & longitudinal vitals
            │   ├── ReportsPage.tsx      # Lab reports explainer & upload
            │   ├── CyclesPage.tsx       # Menstrual & PCOS cycle tracking
            │   ├── DoctorsPage.tsx      # Verified physician directory & booking
            │   └── FamilyPage.tsx       # Family Ally hub & caregiver checklists
            ├── services/
            │   └── api.ts               # Centralized frontend API client
            └── translations/
                └── index.ts             # Multilingual localization dictionaries
```

---

## ⚡ Quick Start Guide

### Prerequisites
- **Python**: Version 3.10, 3.11, 3.12, 3.13, or 3.14
- **Node.js**: Version 18.x or 20.x+ (with `npm`)
- **Git** (optional)

---

### Option A: One-Click Launch (Windows)

The repository includes a ready-to-use launch script that starts both backend and frontend servers and opens your browser:

1. Open File Explorer and navigate to `SHE-Twin-AI`.
2. Double-click **`run_project.bat`**.
3. The script will automatically:
   - Launch the FastAPI Backend on `http://127.0.0.1:8000`
   - Launch the Vite React Frontend on `http://127.0.0.1:5173`
   - Open your browser to `http://127.0.0.1:5173/`

---

### Option B: Manual Step-by-Step Launch

#### 1. Backend Setup

Open a terminal or Windows PowerShell:

```powershell
# Navigate to backend directory
cd "c:\Users\sa787\OneDrive\Desktop\she win hackthon\SHE-Twin-AI\backend"

# (Optional) Create and activate virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install required Python packages
python -m pip install -r requirements.txt

# Start the FastAPI server
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

- **API Documentation**: Open [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) in your browser.

#### 2. Frontend Setup

Open a second terminal window:

```powershell
# Navigate to frontend directory
cd "c:\Users\sa787\OneDrive\Desktop\she win hackthon\SHE-Twin-AI\frontend"

# Install Node.js packages
npm install

# Start Vite development server
npm run dev -- --host 127.0.0.1 --port 5173
```

- **Web Application**: Open [http://127.0.0.1:5173/](http://127.0.0.1:5173/) in your browser.

---

## ⚙️ Environment Configuration

Create a `.env` file in `SHE-Twin-AI/backend/.env` (or copy from `.env.example`):

```ini
# ========================================================
# DATABASE CONFIGURATION
# ========================================================
# Option 1: Local SQLite (Default - zero setup required)
DATABASE_URL=sqlite:///../database/she_twin.db

# Option 2: Supabase Managed PostgreSQL (Production)
# DATABASE_URL=postgresql+psycopg://postgres.<PROJECT_REF>:<PASSWORD>@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
# DIRECT_URL=postgresql+psycopg://postgres.<PROJECT_REF>:<PASSWORD>@aws-0-ap-south-1.pooler.supabase.com:5432/postgres

# ========================================================
# SECURITY & AUTHENTICATION
# ========================================================
SECRET_KEY=she-twin-ai-super-secret-jwt-key-change-in-production-2026
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# ========================================================
# AI ASSISTANT CONFIGURATION
# ========================================================
# Optional: Add your Google Gemini API key for live LLM reasoning.
# If omitted, the high-speed deterministic 36-domain clinical engine runs seamlessly.
GEMINI_API_KEY=your_gemini_api_key_here

# ========================================================
# STORAGE & CORS
# ========================================================
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000
UPLOAD_DIR=../database/uploads
```

---

## 📡 API Reference Guide

Interactive OpenAPI documentation is available live at `http://127.0.0.1:8000/docs`.

### Key Endpoints

| Domain | Method | Endpoint | Description |
| :--- | :---: | :--- | :--- |
| **Auth** | `POST` | `/api/auth/register` | Register a new user account |
| **Auth** | `POST` | `/api/auth/login` | Authenticate user & return JWT Bearer token |
| **Auth** | `GET` | `/api/auth/me` | Fetch currently authenticated user profile |
| **Life Stage** | `GET` | `/api/lifestage` | Retrieve active user health mode (e.g., Pregnancy, Teen) |
| **Life Stage** | `PUT` | `/api/lifestage` | Switch active life stage with optional metadata/notes |
| **Assistant** | `POST` | `/api/assistant/chat` | Send message to AI Assistant; returns clinical guidance & follow-ups |
| **Assessments** | `POST` | `/api/assessments/evaluate-risk` | Submit symptoms & dynamic answers; returns calculated risk level |
| **Assessments** | `GET` | `/api/assessments/latest-risk` | Retrieve user's most recent clinical risk evaluation |
| **Health Twin** | `GET` | `/api/twin/profile` | Retrieve user's Digital Health Twin biometrics |
| **Health Twin** | `PUT` | `/api/twin/profile` | Update biometrics, chronic conditions, and emergency contact |
| **Health Twin** | `GET` | `/api/twin/vitals` | Retrieve chronological vitals history |
| **Health Twin** | `POST` | `/api/twin/vitals` | Log new vital observation (BP, glucose, heart rate, SpO2) |
| **Reports** | `POST` | `/api/reports/upload` | Upload PDF or image lab report for clinical parsing |
| **Reports** | `GET` | `/api/reports` | List uploaded reports with extracted test parameters |
| **Cycles** | `GET` | `/api/womens-health/cycles` | Retrieve menstrual cycle logs and symptoms |
| **Cycles** | `POST` | `/api/womens-health/cycles` | Log period start, end, flow intensity, and mood |
| **Doctors** | `GET` | `/api/doctors` | Search verified physicians by specialty and location |
| **Doctors** | `POST` | `/api/doctors/appointments` | Book doctor consultation slot |
| **Family** | `GET` | `/api/family/members` | Retrieve family health network profiles |
| **Family** | `POST` | `/api/family/members` | Add family member with health notes and blood group |

---

## 🧪 Automated Testing & Verification

The project includes an automated test suite verifying AI clinical reasoning, life-stage adaptation, API routes, database models, and multi-tenant isolation.

### Running Backend Tests

In PowerShell / Bash:

```powershell
cd "SHE-Twin-AI/backend"
$env:PYTHONPATH="."
pytest -v
```

**Results**: All **31 test cases pass** with zero failures:
- `test_ai_different_questions.py`: Validates that distinct conditions receive distinct diagnostic follow-ups, and verifies life-stage adaptation.
- `test_life_stage_symptoms_dynamic.py`: Validates trimester filtering, teen symptom sets, and dynamic triage questions.
- `test_api.py`: Validates authentication, health twin updates, and vitals history.
- `test_postgres_and_security.py`: Validates multi-tenant isolation and password hashing security.

### Running Frontend Type-Check & Build

```powershell
cd "SHE-Twin-AI/frontend"
npm run build
```

Compiles TypeScript (`tsc`) and bundles assets (`vite build`) with **0 errors**.

---

## 🔒 Security, Privacy & Clinical Disclaimers

### Security & Privacy
1. **Multi-Tenant Scoping**: All queries are strictly scoped to the authenticated `current_user.id` extracted from the validated JWT token.
2. **Password Cryptography**: Passwords are never stored in plaintext; they are hashed with salted **bcrypt**.
3. **Prepared Statements**: Safe SQL parametrization prevents SQL injection vulnerabilities across SQLite and PostgreSQL.
4. **File Validation**: Uploaded documents are restricted to permitted extensions (`.pdf`, `.png`, `.jpg`, `.jpeg`) with size limits.

### ⚠️ Medical Disclaimer
> **Important**: SHE Twin AI is an AI-powered health educational and decision-support assistant, **not a licensed medical doctor**. The guidance, risk classifications, and symptom insights generated by this application are for informational and self-monitoring purposes only. Always consult a qualified physician or healthcare provider for clinical diagnosis, prescriptions, or treatment plans. In case of a medical emergency, call national emergency services (**112** or **108** in India, **911** in the US) or visit the nearest emergency room immediately.

---

## 👥 Contributors & Hackathon Team

Developed with pride for the **SHE WIN Hackathon** to advance technological solutions in women's health and wellness.

*License: MIT License — Feel free to use, adapt, and build upon this platform.*
