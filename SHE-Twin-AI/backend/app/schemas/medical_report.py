from pydantic import BaseModel
from typing import List, Optional, Union

class LabTestItemSchema(BaseModel):
    id: str
    testName: str
    category: str
    value: Union[float, int, str]
    unit: str
    referenceRange: str
    status: str # normal, low, high, critical, indeterminate
    explanation: Optional[str] = None

class MedicalReportOut(BaseModel):
    id: str
    userId: str
    fileName: str
    fileSizeFormatted: str
    fileType: str
    uploadedAt: str
    reportDate: str
    labOrHospitalName: str
    reportCategory: str
    status: str
    doctorName: Optional[str] = None
    extractedTextPreview: Optional[str] = None
    aiSummaryNotes: Optional[str] = None
    keyInsights: List[str]
    testResults: List[LabTestItemSchema]
    isDemoReport: Optional[bool] = False

class ReportCompareOut(BaseModel):
    reportA: MedicalReportOut
    reportB: MedicalReportOut
    parameterDifferences: List[dict]
