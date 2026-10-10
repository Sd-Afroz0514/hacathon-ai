import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  Trash2,
  Columns,
  Sparkles,
  Download,
  Search,
} from 'lucide-react';
import { useHealth } from '../context/HealthContext';
import { useLanguage } from '../context/LanguageContext';
import { MedicalReport } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../context/ToastContext';
import { FileCheck } from 'lucide-react';
import { LabConfirmationModal } from '../components/LabConfirmationModal';

export const ReportsPage: React.FC = () => {
  const { reports, uploadReport, deleteReport } = useHealth();
  const { t } = useLanguage();
  const { info } = useToast();

  const [selectedReport, setSelectedReport] = useState<MedicalReport | null>(reports[0] || null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Complete Blood Count (CBC)');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [compareReportA, setCompareReportA] = useState<string>(reports[0]?.id || '');
  const [compareReportB, setCompareReportB] = useState<string>(reports[1]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    'Complete Blood Count (CBC)',
    'Lipid Panel',
    'Thyroid Profile',
    'Blood Glucose / HbA1c',
    'Liver Function Test',
    'Hormonal Panel',
    'Other',
  ];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await processUploadedFile(files[0]);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      await processUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const processUploadedFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(20);

    // Simulate analysis stages
    const timer1 = setTimeout(() => setUploadProgress(60), 400);
    const timer2 = setTimeout(() => setUploadProgress(90), 800);

    const created = await uploadReport(file, selectedCategory);
    clearTimeout(timer1);
    clearTimeout(timer2);
    setUploadProgress(100);

    setTimeout(() => {
      setIsUploading(false);
      setUploadProgress(0);
      if (created) {
        setSelectedReport(created);
      }
    }, 400);
  };

  const filteredReports = reports.filter((r) =>
    r.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.labOrHospitalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.reportCategory.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const reportA = reports.find((r) => r.id === compareReportA) || reports[0];
  const reportB = reports.find((r) => r.id === compareReportB) || reports[1];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'normal':
        return <Badge variant="success" size="sm">{t('health.normal', 'Normal')}</Badge>;
      case 'low':
        return <Badge variant="warning" size="sm">{t('health.low', 'Low')}</Badge>;
      case 'high':
        return <Badge variant="danger" size="sm">{t('health.high', 'High')}</Badge>;
      default:
        return <Badge variant="outline" size="sm">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-navy-950 tracking-tight">
            {t('page.reports.title', 'Medical Report Analyzer')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {t('page.reports.subtitle', 'Upload PDF or image diagnostic reports to automatically extract parameters and reference ranges.')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {reports.length >= 2 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCompareOpen(true)}
              leftIcon={<Columns className="w-4 h-4" />}
            >
              {t('reports.compare', 'Compare Reports')}
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            leftIcon={<UploadCloud className="w-4 h-4" />}
          >
            {t('dashboard.uploadReport', 'Upload Diagnostic')}
          </Button>
        </div>
      </div>

      {/* 2. Drag & Drop Upload Card */}
      <Card className="border-2 border-dashed border-teal-200 bg-teal-50/20 hover:bg-teal-50/40 transition">
        <CardContent
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="p-6 sm:p-8 text-center space-y-4"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
          />

          <div className="w-14 h-14 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center mx-auto shadow-sm">
            <UploadCloud className="w-7 h-7" />
          </div>

          <div>
            <h3 className="text-base font-bold text-slate-900">
              {t('reports.dropHere', 'Drop your medical report here, or')}{' '}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-teal-700 underline hover:text-teal-900"
              >
                {t('reports.browse', 'browse files')}
              </button>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {t('reports.supportFormats', 'Supports PDF, PNG, JPEG up to 15MB • CBC, Lipid Profiles, Thyroid (TSH), Glucose/HbA1c')}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg mx-auto">
            <span className="text-xs text-slate-500 font-semibold">{t('reports.category', 'Report Category')}:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs bg-white rounded-lg border border-slate-300 py-1.5 px-2.5 font-medium text-slate-700"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {isUploading && (
            <div className="max-w-md mx-auto space-y-2 pt-2">
              <div className="flex justify-between text-xs font-semibold text-teal-800">
                <span>{t('reports.extracting', 'OCR Extracting & Normalizing Parameters...')}</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-teal-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Main Split View: Report List & Detail Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1 Col: Report History List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Document Archives ({reports.length})
            </h3>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-white rounded-xl border border-slate-300 focus:border-teal-600 focus:ring-1 focus:ring-teal-100"
            />
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredReports.map((report) => {
              const isSelected = selectedReport?.id === report.id;
              return (
                <div
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                  className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                    isSelected
                      ? 'bg-teal-50/80 border-teal-500 shadow-sm'
                      : 'bg-white border-slate-200/80 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className={`p-2 rounded-xl flex-shrink-0 ${isSelected ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{report.fileName}</h4>
                        <p className="text-[11px] text-slate-500 truncate">{report.labOrHospitalName}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{report.reportDate} • {report.fileSizeFormatted}</p>
                      </div>
                    </div>
                    {report.isDemoReport && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-semibold flex-shrink-0">
                        Demo
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {filteredReports.length === 0 && (
              <EmptyState
                title="No reports match"
                description="Try another search query or upload a diagnostic document."
              />
            )}
          </div>
        </div>

        {/* Right 2 Cols: Active Report Structured Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {selectedReport ? (
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50/60">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{selectedReport.fileName}</CardTitle>
                    {selectedReport.isDemoReport && (
                      <Badge variant="navy" size="sm">Fictional Sample</Badge>
                    )}
                  </div>
                  <CardDescription>
                    {selectedReport.reportCategory} • {selectedReport.labOrHospitalName} • Date: {selectedReport.reportDate}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => info('Download triggered', `Exporting copy of ${selectedReport.fileName}`)}
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                  >
                    Export
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteTargetId(selectedReport.id)}
                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* AI Structured Summary */}
                {selectedReport.aiSummaryNotes && (
                  <div className="p-4 rounded-2xl bg-teal-50/80 border border-teal-100 text-xs text-teal-950 space-y-2">
                    <div className="flex items-center gap-1.5 font-bold text-teal-900">
                      <Sparkles className="w-4 h-4 text-teal-600" />
                      <span>AI Diagnostic Interpretation (Educational)</span>
                    </div>
                    <p className="leading-relaxed">{selectedReport.aiSummaryNotes}</p>
                    {selectedReport.keyInsights.length > 0 && (
                      <ul className="list-disc list-inside space-y-1 pt-1 text-teal-900 font-medium">
                        {selectedReport.keyInsights.map((insight, idx) => (
                          <li key={idx}>{insight}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                {/* Structured Lab Test Results Table */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Extracted Laboratory Parameters ({selectedReport.testResults.length} metrics)
                    </h4>
                    <Button
                      variant="mint"
                      size="sm"
                      onClick={() => setIsConfirmModalOpen(true)}
                      leftIcon={<FileCheck className="w-3.5 h-3.5" />}
                    >
                      Verify & Confirm Metrics
                    </Button>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[11px] text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-3.5 py-2.5">Test Parameter</th>
                          <th className="px-3.5 py-2.5">Category</th>
                          <th className="px-3.5 py-2.5">Reported Value</th>
                          <th className="px-3.5 py-2.5">Reference Target</th>
                          <th className="px-3.5 py-2.5">Status</th>
                          <th className="px-3.5 py-2.5">Clinical Note</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {selectedReport.testResults.map((test) => (
                          <tr key={test.id} className="hover:bg-slate-50/80 transition">
                            <td className="px-3.5 py-2.5 font-bold text-slate-900">{test.testName}</td>
                            <td className="px-3.5 py-2.5 text-slate-500">{test.category}</td>
                            <td className="px-3.5 py-2.5 font-mono font-bold text-slate-900">
                              {test.value} <span className="text-[11px] font-normal text-slate-500">{test.unit}</span>
                            </td>
                            <td className="px-3.5 py-2.5 font-mono text-slate-600">{test.referenceRange}</td>
                            <td className="px-3.5 py-2.5">{getStatusBadge(test.status)}</td>
                            <td className="px-3.5 py-2.5 text-slate-500">{test.explanation || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Extracted Raw OCR Preview Box */}
                {selectedReport.extractedTextPreview && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Extracted Text Stream Preview
                    </h4>
                    <pre className="p-3 bg-slate-900 text-slate-300 font-mono text-[11px] rounded-xl overflow-x-auto whitespace-pre-wrap max-h-32 border border-slate-800">
                      {selectedReport.extractedTextPreview}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <EmptyState
              title="No Report Selected"
              description="Choose a report from the left archives or upload a new medical document."
            />
          )}
        </div>
      </div>

      {/* Modal: Side-by-Side Compare Reports */}
      <Modal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        title="Compare Diagnostic Reports"
        description="Side-by-side progression analysis across dates."
        maxWidth="3xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Baseline Report (A)</label>
              <select
                value={compareReportA}
                onChange={(e) => setCompareReportA(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white"
              >
                {reports.map((r) => (
                  <option key={r.id} value={r.id}>{r.fileName} ({r.reportDate})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Comparison Report (B)</label>
              <select
                value={compareReportB}
                onChange={(e) => setCompareReportB(e.target.value)}
                className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white"
              >
                {reports.map((r) => (
                  <option key={r.id} value={r.id}>{r.fileName} ({r.reportDate})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <h5 className="font-bold text-teal-800">{reportA?.fileName}</h5>
              <p className="text-slate-500 text-[11px]">Date: {reportA?.reportDate}</p>
              <div className="space-y-1.5 pt-2 border-t border-slate-200">
                {reportA?.testResults.map((t) => (
                  <div key={t.id} className="flex justify-between">
                    <span className="text-slate-700">{t.testName}:</span>
                    <span className="font-mono font-bold text-slate-900">{t.value} {t.unit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <h5 className="font-bold text-teal-800">{reportB?.fileName}</h5>
              <p className="text-slate-500 text-[11px]">Date: {reportB?.reportDate}</p>
              <div className="space-y-1.5 pt-2 border-t border-slate-200">
                {reportB?.testResults.map((t) => (
                  <div key={t.id} className="flex justify-between">
                    <span className="text-slate-700">{t.testName}:</span>
                    <span className="font-mono font-bold text-slate-900">{t.value} {t.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={async () => {
          if (deleteTargetId) {
            await deleteReport(deleteTargetId);
            setDeleteTargetId(null);
            setSelectedReport(reports.find((r) => r.id !== deleteTargetId) || null);
          }
        }}
        title="Delete Medical Report"
        message="Are you sure you want to delete this report from your Health Twin history? This action cannot be undone."
        confirmText="Delete Document"
      />

      {/* Interactive Lab Values Confirmation Modal */}
      {selectedReport && (
        <LabConfirmationModal
          isOpen={isConfirmModalOpen}
          onClose={() => setIsConfirmModalOpen(false)}
          reportId={selectedReport.id}
          reportFileName={selectedReport.fileName}
          testDate={selectedReport.reportDate}
          initialItems={selectedReport.testResults.map((t) => ({
            testName: t.testName,
            category: t.category,
            value: t.value,
            unit: t.unit,
            referenceRange: t.referenceRange,
            status: t.status,
          }))}
        />
      )}
    </div>
  );
};
