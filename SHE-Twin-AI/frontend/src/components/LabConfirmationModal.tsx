import React, { useState } from 'react';
import { FileCheck, Check, X } from 'lucide-react';
import { apiService, ConfirmedLabItemData } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

interface LabConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportId?: string;
  reportFileName?: string;
  testDate?: string;
  initialItems: {
    testName: string;
    category?: string;
    value: string | number;
    unit?: string;
    referenceRange?: string;
    status?: string;
  }[];
  onConfirmed?: () => void;
}

export const LabConfirmationModal: React.FC<LabConfirmationModalProps> = ({
  isOpen,
  onClose,
  reportId,
  reportFileName,
  testDate,
  initialItems,
  onConfirmed,
}) => {
  const { success, error } = useToast();
  const { t } = useLanguage();
  const [items, setItems] = useState<ConfirmedLabItemData[]>(() =>
    initialItems.map((item) => {
      const strVal = String(item.value);
      return {
        testName: item.testName,
        category: item.category || 'Hematology',
        value: strVal,
        numericValue: parseFloat(strVal) || undefined,
        unit: item.unit || '',
        referenceRange: item.referenceRange || '',
        status: item.status || 'normal',
        userNotes: '',
      };
    })
  );
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleValueChange = (index: number, val: string) => {
    const updated = [...items];
    updated[index].value = val;
    updated[index].numericValue = parseFloat(val) || undefined;
    setItems(updated);
  };

  const handleNotesChange = (index: number, notes: string) => {
    const updated = [...items];
    updated[index].userNotes = notes;
    setItems(updated);
  };

  const handleConfirm = async () => {
    setSubmitting(true);
    const dateStr = testDate || new Date().toISOString().split('T')[0];
    const res = await apiService.confirmLabResults({
      reportId,
      testDate: dateStr,
      items,
    });
    setSubmitting(false);

    if (res.success) {
      success(t('common.success', 'Metrics Verified'), 'Lab metrics confirmed and saved to your Digital Health Twin!');
      if (onConfirmed) onConfirmed();
      onClose();
    } else {
      error(t('common.error', 'Failed to confirm'), res.error || 'Failed to confirm lab values');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          aria-label={t('common.close', 'Close')}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 pb-4 border-b border-slate-800 mb-4">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{t('lab.title', 'Review & Confirm Extracted Lab Metrics')}</h3>
            <p className="text-xs text-slate-400">
              {reportFileName ? `Report: ${reportFileName}` : t('lab.subtitle', 'Verify OCR values before saving to your clinical record')}
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="grid grid-cols-12 text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-3 pb-1">
            <div className="col-span-4">{t('lab.parameter', 'Test Parameter')}</div>
            <div className="col-span-3">{t('lab.extracted', 'Extracted Value & Unit')}</div>
            <div className="col-span-3">{t('lab.reference', 'Reference Range')}</div>
            <div className="col-span-2 text-right">{t('lab.status', 'Status')}</div>
          </div>

          {items.map((item, idx) => (
            <div
              key={idx}
              className="p-3 bg-slate-800/60 border border-slate-700/80 rounded-xl space-y-2 text-xs"
            >
              <div className="grid grid-cols-12 items-center gap-2">
                <div className="col-span-4 font-semibold text-white truncate">
                  {item.testName}
                  <div className="text-[10px] font-normal text-slate-400">{item.category}</div>
                </div>

                <div className="col-span-3 flex items-center gap-1.5">
                  <input
                    type="text"
                    value={item.value}
                    onChange={(e) => handleValueChange(idx, e.target.value)}
                    className="w-20 bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-white font-medium text-xs focus:border-teal-500 focus:outline-none"
                  />
                  <span className="text-slate-400 text-[11px] truncate">{item.unit}</span>
                </div>

                <div className="col-span-3 text-slate-400 text-[11px]">
                  {item.referenceRange || 'Standard reference'}
                </div>

                <div className="col-span-2 text-right">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                      item.status === 'normal'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>

              {/* User note optional */}
              <input
                type="text"
                value={item.userNotes || ''}
                onChange={(e) => handleNotesChange(idx, e.target.value)}
                placeholder={t('lab.notesPlaceholder', 'Add optional note (e.g. Fasting sample, verified on physical report)')}
                className="w-full bg-slate-900/60 border border-slate-700/50 rounded-lg px-2.5 py-1 text-[11px] text-slate-300 placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 text-xs font-medium text-slate-300 hover:bg-slate-800"
          >
            {t('common.cancel', 'Cancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-teal-500/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>{submitting ? t('lab.saving', 'Saving...') : t('lab.confirm', 'Confirm & Save to Health Twin')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
