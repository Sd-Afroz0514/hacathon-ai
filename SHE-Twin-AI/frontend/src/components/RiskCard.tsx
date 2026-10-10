import React from 'react';
import { ShieldAlert, ShieldCheck, AlertCircle, ArrowRight, UserCheck, RefreshCw } from 'lucide-react';
import { RiskAssessmentData } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

interface RiskCardProps {
  risk: RiskAssessmentData | null;
  onOpenCareNavigator?: () => void;
  onCheckSymptoms?: () => void;
  onReevaluate?: () => void;
  loading?: boolean;
}

export const RiskCard: React.FC<RiskCardProps> = ({
  risk,
  onOpenCareNavigator,
  onCheckSymptoms,
  onReevaluate,
  loading = false,
}) => {
  const { t } = useLanguage();

  if (!risk) {
    return (
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-white mb-1">{t('risk.title', 'Clinical Risk Screening')}</h4>
          <p className="text-xs text-slate-400">{t('risk.desc', 'Evaluate symptoms and lab metrics against deterministic clinical guidelines')}</p>
        </div>
        <button
          onClick={onCheckSymptoms}
          className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-teal-500/20"
        >
          {t('risk.evaluate', 'Evaluate Health Risk')}
        </button>
      </div>
    );
  }

  const isEmergency = risk.isEmergency;
  const tier = risk.screeningTier;

  const getTierLabel = (tName: string) => {
    switch (tName) {
      case 'Lower Concern':
        return t('risk.lower', 'Lower Concern');
      case 'Medium Concern':
        return t('risk.medium', 'Medium Concern');
      case 'High Concern':
        return t('risk.high', 'High Concern');
      default:
        return tName;
    }
  };

  const tierStyles = {
    'Lower Concern': {
      border: 'border-emerald-500/40 bg-emerald-500/5',
      badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      icon: ShieldCheck,
      iconColor: 'text-emerald-400',
    },
    'Medium Concern': {
      border: 'border-amber-500/40 bg-amber-500/5',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      icon: AlertCircle,
      iconColor: 'text-amber-400',
    },
    'High Concern': {
      border: 'border-rose-500/50 bg-rose-500/10',
      badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      icon: ShieldAlert,
      iconColor: 'text-rose-400',
    },
  }[tier] || {
    border: 'border-teal-500/40 bg-teal-500/5',
    badge: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    icon: ShieldCheck,
    iconColor: 'text-teal-400',
  };

  const Icon = tierStyles.icon;

  return (
    <div className={`rounded-2xl border p-5 transition-all shadow-lg ${tierStyles.border}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl border ${tierStyles.badge}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t('risk.level', 'Algorithmic Risk Level')}</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${tierStyles.badge}`}>
                {getTierLabel(tier)}
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-0.5">{risk.riskCategory}</h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onReevaluate && (
            <button
              onClick={onReevaluate}
              disabled={loading}
              title={t('risk.refresh', 'Refresh Assessment')}
              className="p-2 rounded-xl border border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
          {onCheckSymptoms && (
            <button
              onClick={onCheckSymptoms}
              className="px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
            >
              {t('risk.logSymptoms', 'Log Symptoms')}
            </button>
          )}
        </div>
      </div>

      {/* Emergency banner if applicable */}
      {isEmergency && (
        <div className="mt-4 p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-rose-200">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
            <span><strong>{t('symptoms.emergencyAlert', 'Emergency Alert')}:</strong> Acute clinical markers identified. Urgent care advised.</span>
          </div>
          <a
            href="tel:112"
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shrink-0 transition-colors"
          >
            {t('risk.callEmergency', 'Call 112 / 108')}
          </a>
        </div>
      )}

      {/* Grid: Contributing factors & Next steps */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs">
        <div>
          <div className="font-semibold text-slate-300 mb-1.5">{t('risk.factors', 'Contributing Factors & Lab Findings:')}</div>
          <ul className="space-y-1 text-slate-400">
            {risk.contributingFactors.map((factor, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-teal-400 mt-0.5">•</span>
                <span>{factor}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="font-semibold text-slate-300 mb-1.5">{t('risk.nextSteps', 'Recommended Next Steps:')}</div>
          <ul className="space-y-1 text-slate-400">
            {risk.recommendedNextSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-teal-400 mt-0.5">✓</span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer Care Navigation Link */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <UserCheck className="w-4 h-4 text-teal-400" />
          <span>{t('risk.matchedSpecialty', 'Matched Specialty:')} <strong className="text-slate-200">{risk.suggestedSpecialty}</strong></span>
        </div>

        {onOpenCareNavigator && (
          <button
            onClick={onOpenCareNavigator}
            className="flex items-center gap-1.5 text-xs font-semibold text-teal-400 hover:text-teal-300 transition-colors"
          >
            <span>{t('risk.viewDoctors', 'View Verified Doctors in Your City')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
