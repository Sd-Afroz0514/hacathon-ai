import React, { useState, useEffect } from 'react';
import { UserCheck, Star, Video, MapPin, CheckSquare, X, ShieldCheck } from 'lucide-react';
import { apiService, CareNavigationData, MatchedCareProvider } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

interface CareNavigatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  specialty?: string;
  userCity?: string;
}

export const CareNavigatorModal: React.FC<CareNavigatorModalProps> = ({
  isOpen,
  onClose,
  specialty,
  userCity,
}) => {
  const { info } = useToast();
  const { t } = useLanguage();
  const [data, setData] = useState<CareNavigationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'providers' | 'checklist'>('providers');

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      apiService.getCareNavigation(specialty, userCity).then((res) => {
        setLoading(false);
        if (res.data) {
          setData(res.data);
        }
      });
    }
  }, [isOpen, specialty, userCity]);

  if (!isOpen) return null;

  const handleBookConsult = (provider: MatchedCareProvider) => {
    info('Teleconsult Routing', `Connecting to ${provider.name} (${provider.hospital})...`);
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

        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800 mb-4">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{t('care.title', 'Verified Doctor Care Navigation')}</h3>
            <p className="text-xs text-slate-400">
              {t('care.matchedFor', 'Matched for')} <strong className="text-teal-300">{data?.recommended_specialty || specialty || 'Specialist'}</strong> {t('care.inCity', 'in')} <strong className="text-slate-200">{data?.user_city || userCity || 'Your Area'}</strong>
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-4 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('providers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'providers'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t('care.tabDoctors', 'Matched Doctors')} ({data?.matched_providers.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('checklist')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'checklist'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t('care.tabChecklist', 'Appointment Preparation Checklist')}
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">Locating verified specialists and hospital tiers...</div>
        ) : activeTab === 'providers' ? (
          <div className="space-y-3">
            {data?.matched_providers.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 hover:border-slate-600 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">{doc.name}</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-700 text-[10px] text-slate-300 border border-slate-600">
                      {doc.tier}
                    </span>
                  </div>

                  <div className="text-teal-400 font-medium">{doc.specialty}</div>
                  <div className="text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    <span>{doc.hospital}, {doc.city} ({doc.distance})</span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-400 text-[11px] pt-1">
                    <span className="flex items-center gap-1 text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      {doc.rating}
                    </span>
                    <span>• {doc.experience} exp</span>
                    <span>• {doc.languages.join(', ')}</span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center gap-2 shrink-0">
                  {doc.teleconsult_available && (
                    <button
                      onClick={() => handleBookConsult(doc)}
                      className="w-full py-2 px-3 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>{t('care.teleconsult', 'Teleconsult')}</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleBookConsult(doc)}
                    className="w-full py-2 px-3 rounded-lg border border-slate-700 bg-slate-850 hover:bg-slate-700 text-slate-200 font-medium text-xs transition-colors"
                  >
                    {t('care.inClinic', 'In-Clinic Visit')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-xs text-teal-300 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <span>{t('care.checklistNotice', 'Bring these materials to optimize your doctor consultation and diagnosis accuracy:')}</span>
            </div>

            <div className="space-y-2.5">
              {data?.appointment_prep_checklist.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 flex items-start gap-3 text-xs text-slate-200"
                >
                  <CheckSquare className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 pt-3 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 rounded-xl border border-slate-700 text-xs font-medium text-slate-300 hover:bg-slate-800"
          >
            {t('care.close', 'Close')}
          </button>
        </div>
      </div>
    </div>
  );
};
