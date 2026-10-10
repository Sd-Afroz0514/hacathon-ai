import os
import uuid
import json
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from database import get_db
from app.models.user import User
from app.models.medical_report import MedicalReport
from app.models.health_twin import HealthProfile
from app.schemas.medical_report import MedicalReportOut, LabTestItemSchema, ReportCompareOut
from app.services.report_parser import extract_text_from_file, analyze_medical_text
from app.core.config import settings
from app.core.deps import get_current_user

router = APIRouter(prefix="/reports", tags=["Medical Reports"])

def report_to_schema(r: MedicalReport) -> MedicalReportOut:
    test_items = [LabTestItemSchema(**t) for t in r.test_results]
    return MedicalReportOut(
        id=r.id,
        userId=r.user_id,
        fileName=r.file_name,
        fileSizeFormatted=r.file_size_formatted,
        fileType=r.file_type,
        uploadedAt=r.created_at.isoformat() if r.created_at else "",
        reportDate=r.report_date,
        labOrHospitalName=r.lab_or_hospital_name,
        reportCategory=r.report_category,
        status=r.status,
        doctorName=r.doctor_name,
        extractedTextPreview=r.extracted_text_preview,
        aiSummaryNotes=r.ai_summary_notes,
        keyInsights=r.key_insights,
        testResults=test_items,
        isDemoReport=r.is_demo_report
    )

@router.get("", response_model=List[MedicalReportOut])
def list_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    reports = db.query(MedicalReport).filter(
        MedicalReport.user_id == current_user.id
    ).order_by(MedicalReport.created_at.desc()).all()
    
    return [report_to_schema(r) for r in reports]

@router.get("/compare", response_model=ReportCompareOut)
def compare_reports(
    first_report_id: str,
    second_report_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    r1 = db.query(MedicalReport).filter(
        MedicalReport.id == first_report_id,
        MedicalReport.user_id == current_user.id
    ).first()
    r2 = db.query(MedicalReport).filter(
        MedicalReport.id == second_report_id,
        MedicalReport.user_id == current_user.id
    ).first()

    if not r1 or not r2:
        raise HTTPException(status_code=404, detail="One or both reports not found.")

    # Calculate parameter differences
    r1_tests = {t["testName"]: t for t in r1.test_results}
    r2_tests = {t["testName"]: t for t in r2.test_results}
    
    common_params = set(r1_tests.keys()).intersection(set(r2_tests.keys()))
    differences = []
    for p in common_params:
        v1 = r1_tests[p].get("value")
        v2 = r2_tests[p].get("value")
        unit = r1_tests[p].get("unit", "")
        differences.append({
            "parameter": p,
            "reportA_value": v1,
            "reportB_value": v2,
            "unit": unit,
            "dateA": r1.report_date,
            "dateB": r2.report_date
        })

    return ReportCompareOut(
        reportA=report_to_schema(r1),
        reportB=report_to_schema(r2),
        parameterDifferences=differences
    )

@router.get("/{report_id}", response_model=MedicalReportOut)
def get_report(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = db.query(MedicalReport).filter(
        MedicalReport.id == report_id,
        MedicalReport.user_id == current_user.id
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    return report_to_schema(report)

@router.post("/upload", response_model=MedicalReportOut)
async def upload_medical_report(
    file: UploadFile = File(...),
    category: str = Form("Complete Blood Count (CBC)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Validate file extension
    ext = file.filename.split(".")[-1].lower() if file.filename and "." in file.filename else "pdf"
    if ext not in ["pdf", "png", "jpg", "jpeg"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload PDF, PNG, or JPEG files."
        )

    # Read and save file safely
    contents = await file.read()
    if len(contents) > 15 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File exceeds maximum allowed size of 15MB.")

    safe_filename = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)
    with open(file_path, "wb") as f:
        f.write(contents)

    file_size_kb = len(contents) / 1024
    if file_size_kb >= 1024:
        file_size_formatted = f"{(file_size_kb / 1024):.1f} MB"
    else:
        file_size_formatted = f"{int(file_size_kb)} KB"

    # Extract text using service
    extracted_text = extract_text_from_file(file_path, ext)

    # Analyze clinical parameters
    test_results, ai_summary, key_insights = analyze_medical_text(extracted_text, category, file.filename)

    today_str = datetime.now().strftime("%Y-%m-%d")

    report = MedicalReport(
        user_id=current_user.id,
        file_name=file.filename,
        file_path=file_path,
        file_size_formatted=file_size_formatted,
        file_type=ext if ext != "jpeg" else "jpg",
        report_date=today_str,
        lab_or_hospital_name="Apex Diagnostic Care & Research Center",
        report_category=category,
        status="analyzed",
        doctor_name="Dr. N. Kulkarni, MD Consultant",
        extracted_text_preview=extracted_text[:1200],
        ai_summary_notes=ai_summary,
        key_insights_json=json.dumps(key_insights),
        test_results_json=json.dumps(test_results),
        is_demo_report=False
    )
    db.add(report)

    # If any vital parameters were identified, update the HealthTwin cache
    twin = db.query(HealthProfile).filter(HealthProfile.user_id == current_user.id).first()
    if twin:
        for t in test_results:
            name_low = t["testName"].lower()
            try:
                val = float(t["value"])
                if "glucose" in name_low:
                    twin.glucose_mg_dl = int(val)
            except Exception:
                pass
        twin.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(report)

    return report_to_schema(report)

@router.delete("/{report_id}")
def delete_report(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    report = db.query(MedicalReport).filter(
        MedicalReport.id == report_id,
        MedicalReport.user_id == current_user.id
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    
    # Remove physical file if present
    if report.file_path and os.path.exists(report.file_path):
        try:
            os.remove(report.file_path)
        except Exception:
            pass

    db.delete(report)
    db.commit()
    return {"message": "Report deleted successfully"}
