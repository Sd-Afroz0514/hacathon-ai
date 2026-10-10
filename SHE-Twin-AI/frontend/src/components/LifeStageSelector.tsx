import React, { useState } from 'react';
import { Sparkles, Heart, Baby, Shield, Activity, Users, ChevronDown, Check } from 'lucide-react';
import { apiService } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

export interface LifeStageOption {
  id: string;
  name: string;
  icon: React.ElementType;
  badgeColor: string;
  description: string;
}

export const LIFE_STAGES: LifeStageOption[] = [
  {
    id: 'Teen / Young Women',
    name: 'Teen / Young Women',
    icon: Sparkles,
    badgeColor: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/30',
    description: 'Puberty, first cycles, hormonal skin care & academic wellness'
  },
  {
    id: 'Reproductive Health',
    name: 'Reproductive Health',
    icon: Heart,
    badgeColor: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
    description: 'Cycle regularisation, PCOS management & fertility planning'
  },
  {
    id: 'Pregnancy',
    name: 'Pregnancy',
    icon: Baby,
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    description: 'Trimester tracking, fetal growth milestones & antenatal checks'
  },
  {
    id: 'Postpartum',
    name: 'Postpartum',
    icon: Shield,
    badgeColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
    description: 'Fourth trimester healing, lactation nutrition & maternal mental health'
  },
  {
    id: 'Menopause',
    name: 'Menopause',
    icon: Activity,
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    description: 'Perimenopause, hot flash relief, bone density & cardiovascular protection'
  },
  {
    id: 'My Health',
    name: 'My Health',
    icon: Activity,
    badgeColor: 'text-teal-400 bg-teal-500/10 border-teal-500/30',
    description: 'General preventive wellness, lab screening & daily biometrics'
  },
  {
    id: 'Family Ally',
    name: 'Family Ally',
    icon: Users,
    badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
    description: 'Support records and reminders for daughters, mothers, and partners'
  }
];

interface LifeStageSelectorProps {
  currentStage: string;
  onStageChange: (newStage: string) => void;
}

export const LifeStageSelector: React.FC<LifeStageSelectorProps> = ({ currentStage, onStageChange }) => {
  const { success, error } = useToast();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const getStageName = (id: string, def: string) => {
    switch (id) {
      case 'Teen / Young Women':
        return t('lifestage.teen', def);
      case 'Reproductive Health':
        return t('lifestage.reproductive', def);
      case 'Pregnancy':
        return t('lifestage.pregnancy', def);
      case 'Postpartum':
        return t('lifestage.postpartum', def);
      case 'Menopause':
        return t('lifestage.menopause', def);
      case 'My Health':
        return t('lifestage.myhealth', def);
      case 'Family Ally':
        return t('lifestage.family', def);
      default:
        return def;
    }
  };

  const activeOption = LIFE_STAGES.find((s) => s.id === currentStage) || LIFE_STAGES[5];
  const Icon = activeOption.icon;

  const handleSelect = async (stage: LifeStageOption) => {
    if (stage.id === currentStage) {
      setIsOpen(false);
      return;
    }
    setUpdating(true);
    const res = await apiService.updateLifeStage(stage.id);
    setUpdating(false);
    if (res.success) {
      onStageChange(stage.id);
      success(t('common.success', 'Mode Changed'), `${t('lifestage.switch', 'Switched health mode to')} ${getStageName(stage.id, stage.name)}`);
      setIsOpen(false);
    } else {
      error(t('common.error', 'Failed to change mode'), res.error || 'Failed to update life stage');
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-sm ${activeOption.badgeColor}`}
      >
        <Icon className="w-4 h-4" />
        <span>{getStageName(activeOption.id, activeOption.name)}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-teal-400" />
                  {t('lifestage.title', 'Select Your Life-Stage Health Mode')}
                </h3>
                <p className="text-xs text-slate-400">
                  Customizes clinical risk rules, AI assistance, vital ranges, and questions
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {LIFE_STAGES.map((s) => {
                const StageIcon = s.icon;
                const isSelected = s.id === currentStage;
                return (
                  <button
                    key={s.id}
                    onClick={() => handleSelect(s)}
                    disabled={updating}
                    className={`p-3.5 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-slate-800/90 border-teal-400 ring-1 ring-teal-400 shadow-lg'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-lg border ${s.badgeColor}`}>
                          <StageIcon className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-white">{getStageName(s.id, s.name)}</span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-teal-400" />}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">{s.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
