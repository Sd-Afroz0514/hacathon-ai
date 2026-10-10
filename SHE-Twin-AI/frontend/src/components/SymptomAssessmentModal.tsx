import React, { useState, useEffect, useMemo } from 'react';
import {
  Stethoscope,
  AlertTriangle,
  PhoneCall,
  X,
  ShieldAlert,
  Check,
  Sparkles,
  Baby,
  Heart,
  Activity,
  Shield,
  Users,
} from 'lucide-react';
import { apiService, SymptomItemData } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import {
  LIFE_STAGE_CONFIGS,
  getEffectiveModeConfig,
  normalizeModeKey,
  ModeQuestion,
} from '../config/lifeStageSymptoms';

interface SymptomAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  lifeStage: string;
  onAssessmentCompleted?: () => void;
}

export const SymptomAssessmentModal: React.FC<SymptomAssessmentModalProps> = ({
  isOpen,
  onClose,
  lifeStage,
  onAssessmentCompleted,
}) => {
  const { success, error } = useToast();
  const { t } = useLanguage();

  // Active Health Mode State (normalized)
  const [activeMode, setActiveMode] = useState<string>(normalizeModeKey(lifeStage || 'My Health'));
  const [supportedRelation, setSupportedRelation] = useState<string>('Mother');
  const [supportedMode, setSupportedMode] = useState<string>('Reproductive Health');

  // Mode-Specific Answers & Symptom Selections
  const [questionAnswers, setQuestionAnswers] = useState<Record<string, any>>({});
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState('');
  const [severity, setSeverity] = useState('Moderate');
  const [duration, setDuration] = useState('1-3 days');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [emergencyResult, setEmergencyResult] = useState<string[] | null>(null);

  // Synchronize when prop lifeStage changes
  useEffect(() => {
    if (lifeStage) {
      setActiveMode(normalizeModeKey(lifeStage));
      setSelectedSymptoms([]);
      setQuestionAnswers({});
      setCustomSymptom('');
      setEmergencyResult(null);
    }
  }, [lifeStage, isOpen]);

  // When activeMode changes, clear stale symptoms & questions
  const handleModeChange = (newMode: string) => {
    if (newMode === activeMode) return;
    setActiveMode(newMode);
    setSelectedSymptoms([]);
    setQuestionAnswers({});
    setCustomSymptom('');
    setEmergencyResult(null);
  };

  // Get effective configuration
  const config = useMemo(() => {
    return getEffectiveModeConfig(activeMode, supportedMode);
  }, [activeMode, supportedMode]);

  const isPregnancyActive = useMemo(() => {
    return config.modeId === 'Pregnancy' || (activeMode === 'Family Ally' && supportedMode.includes('Pregnancy'));
  }, [config.modeId, activeMode, supportedMode]);

  // Trimester computation for Pregnancy mode
  const pregnancyWeeks = useMemo(() => {
    if (isPregnancyActive) {
      const w = parseInt(questionAnswers['pregnancyWeeks']);
      return isNaN(w) ? 14 : w;
    }
    return 14;
  }, [isPregnancyActive, questionAnswers]);

  const pregnancyTrimester = useMemo(() => {
    if (pregnancyWeeks <= 13) {
      return {
        num: 1,
        label: t('pregnancy.trimester1', 'First Trimester (1-13 weeks)'),
        desc: t('pregnancy.t1Desc', 'First Trimester: Focus on early hydration, nausea care, antenatal baseline & safety.')
      };
    }
    if (pregnancyWeeks <= 27) {
      return {
        num: 2,
        label: t('pregnancy.trimester2', 'Second Trimester (14-27 weeks)'),
        desc: t('pregnancy.t2Desc', 'Second Trimester: Anatomic growth, fetal movement awareness, BP & lab screening.')
      };
    }
    return {
      num: 3,
      label: t('pregnancy.trimester3', 'Third Trimester (28-40+ weeks)'),
      desc: t('pregnancy.t3Desc', 'Third Trimester: Fetal movement monitoring, contraction checks, fluid integrity & pre-eclampsia vigilance.')
    };
  }, [pregnancyWeeks, t]);

  // Filter symptoms according to pregnancy week (if in pregnancy mode)
  const visibleSymptoms = useMemo(() => {
    if (!isPregnancyActive) {
      return config.symptoms;
    }
    return config.symptoms.filter((sym) => {
      if (sym.minWeeks && pregnancyWeeks < sym.minWeeks) return false;
      if (sym.maxWeeks && pregnancyWeeks > sym.maxWeeks) return false;
      return true;
    });
  }, [config, pregnancyWeeks, isPregnancyActive]);

  // Dynamic symptom-specific clinical questions triggered by user symptom selections
  const dynamicSymptomQuestions: ModeQuestion[] = useMemo(() => {
    const list: ModeQuestion[] = [];
    const symsLow = selectedSymptoms.map((s) => s.toLowerCase());

    if (symsLow.some((s) => s.includes('fever'))) {
      list.push({
        id: 'feverTemp',
        labelKey: 'question.fever.temp',
        defaultLabel: 'Highest measured temperature',
        type: 'select',
        options: [
          { value: 'under_100', labelKey: 'opt.fever.under100', defaultLabel: 'Below 100.4°F (Mild)' },
          { value: '100_102', labelKey: 'opt.fever.100_102', defaultLabel: '100.4°F - 102°F (Moderate)' },
          { value: 'over_102', labelKey: 'opt.fever.over102', defaultLabel: 'Over 102°F (High fever)' },
        ],
      });
      list.push({
        id: 'feverChills',
        labelKey: 'question.fever.chills',
        defaultLabel: 'Chills or shivering present?',
        type: 'select',
        options: [
          { value: 'none', labelKey: 'opt.chills.none', defaultLabel: 'No chills' },
          { value: 'mild', labelKey: 'opt.chills.mild', defaultLabel: 'Mild chills / feeling cold' },
          { value: 'severe', labelKey: 'opt.chills.severe', defaultLabel: 'Intense shivering / rigor' },
        ],
      });
    }

    if (symsLow.some((s) => s.includes('headache'))) {
      list.push({
        id: 'headacheType',
        labelKey: 'question.headache.type',
        defaultLabel: 'Headache characteristic',
        type: 'select',
        options: [
          { value: 'throbbing', labelKey: 'opt.headache.throbbing', defaultLabel: 'Throbbing / Pulsating on one side' },
          { value: 'tension', labelKey: 'opt.headache.tension', defaultLabel: 'Tight band across forehead (Tension)' },
          { value: 'sinus', labelKey: 'opt.headache.sinus', defaultLabel: 'Sinus pressure behind eyes/cheeks' },
        ],
      });
    }

    if (symsLow.some((s) => s.includes('cough'))) {
      list.push({
        id: 'coughNature',
        labelKey: 'question.cough.nature',
        defaultLabel: 'Cough presentation',
        type: 'select',
        options: [
          { value: 'dry', labelKey: 'opt.cough.dry', defaultLabel: 'Dry tickly cough' },
          { value: 'phlegm', labelKey: 'opt.cough.phlegm', defaultLabel: 'Productive with yellow/green phlegm' },
        ],
      });
    }

    if (symsLow.some((s) => s.includes('nausea') || s.includes('vomit'))) {
      list.push({
        id: 'vomitingFrequency',
        labelKey: 'question.nausea.retention',
        defaultLabel: 'Fluid intake & retention',
        type: 'select',
        options: [
          { value: 'retaining', labelKey: 'opt.vomit.retaining', defaultLabel: 'Able to keep fluids down' },
          { value: 'unable', labelKey: 'opt.vomit.unable', defaultLabel: 'Vomiting after every sip / unable to drink' },
        ],
      });
    }

    if (symsLow.some((s) => s.includes('dizziness'))) {
      list.push({
        id: 'dizzinessTrigger',
        labelKey: 'question.dizziness.trigger',
        defaultLabel: 'Dizziness sensation',
        type: 'select',
        options: [
          { value: 'standing', labelKey: 'opt.dizzy.standing', defaultLabel: 'Lightheaded when standing quickly' },
          { value: 'spinning', labelKey: 'opt.dizzy.spinning', defaultLabel: 'Room spinning around (Vertigo)' },
          { value: 'persistent', labelKey: 'opt.dizzy.persistent', defaultLabel: 'Constant unsteadiness' },
        ],
      });
    }

    if (symsLow.some((s) => s.includes('cramp') || s.includes('period pain') || s.includes('bleeding'))) {
      list.push({
        id: 'crampDisruption',
        labelKey: 'question.cramp.disruption',
        defaultLabel: 'Pain impact on daily activities',
        type: 'select',
        options: [
          { value: 'mild', labelKey: 'opt.cramp.mild', defaultLabel: 'Manageable without strong pain relief' },
          { value: 'moderate', labelKey: 'opt.cramp.moderate', defaultLabel: 'Requires painkillers / disrupts work' },
          { value: 'severe', labelKey: 'opt.cramp.severe', defaultLabel: 'Severe pain, bed rest needed' },
        ],
      });
    }

    if (symsLow.some((s) => s.includes('back pain'))) {
      list.push({
        id: 'backRadiation',
        labelKey: 'question.back.radiation',
        defaultLabel: 'Does back pain radiate down legs?',
        type: 'select',
        options: [
          { value: 'localized', labelKey: 'opt.back.loc', defaultLabel: 'Stays localized in lower back' },
          { value: 'radiating', labelKey: 'opt.back.rad', defaultLabel: 'Radiates into buttock or down leg' },
        ],
      });
    }

    return list;
  }, [selectedSymptoms]);

  // Combine mode-level questions with dynamically triggered symptom questions
  const visibleQuestions = useMemo(() => {
    const baseQuestions = config.questions.filter((q) => !q.condition || q.condition(questionAnswers));
    return [...baseQuestions, ...dynamicSymptomQuestions];
  }, [config.questions, dynamicSymptomQuestions, questionAnswers]);

  // Real-Time Red Flag Safety Check (Immediate Evaluation)
  const activeRedFlags = useMemo(() => {
    const flags: string[] = [];
    selectedSymptoms.forEach((symName) => {
      const found = config.symptoms.find((s) => s.name === symName);
      if (found?.isRedFlag && !flags.includes(symName)) {
        flags.push(symName);
      }
    });

    // Check emergency question answers (e.g. reduced fetal movement in questions)
    if (isPregnancyActive && (questionAnswers['fetalMovementStatus'] === 'reduced' || questionAnswers['fetalMovementStatus'] === 'none_today')) {
      const msg = t('symptom.fetalMovementReduced', 'Reduced or changed fetal movement');
      if (!flags.includes(msg)) {
        flags.push(msg);
      }
    }

    // Special mental health / crisis check in Postpartum
    if (selectedSymptoms.includes('Thoughts of self-harm or harming baby')) {
      if (!flags.includes('Thoughts of self-harm or harming baby')) {
        flags.push('Thoughts of self-harm or harming baby');
      }
    }

    // Direct check for general emergency keywords
    selectedSymptoms.forEach((s) => {
      const sLow = s.toLowerCase();
      if (
        sLow.includes('chest pain') ||
        sLow.includes('difficulty breathing') ||
        sLow.includes('vaginal bleeding') ||
        sLow.includes('fluid leakage') ||
        sLow.includes('leakage of fluid') ||
        sLow.includes('severe abdominal pain') ||
        sLow.includes('blurred vision') ||
        sLow.includes('sudden swelling')
      ) {
        if (!flags.includes(s)) {
          flags.push(s);
        }
      }
    });

    return flags;
  }, [selectedSymptoms, config, questionAnswers, isPregnancyActive, t]);

  if (!isOpen) return null;

  const toggleSymptom = (name: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customSymptom.trim() && !selectedSymptoms.includes(customSymptom.trim())) {
      setSelectedSymptoms([...selectedSymptoms, customSymptom.trim()]);
      setCustomSymptom('');
    }
  };

  const handleAnswerChange = (qId: string, val: any) => {
    setQuestionAnswers((prev) => ({
      ...prev,
      [qId]: val,
    }));
  };

  const handleSubmit = async () => {
    if (selectedSymptoms.length === 0) {
      error(t('common.error', 'Symptoms Required'), t('symptoms.selectSymptoms', 'Please select or enter at least one symptom'));
      return;
    }

    setSubmitting(true);
    const symptomItems: SymptomItemData[] = selectedSymptoms.map((name) => ({
      name,
      severity,
      duration,
    }));

    // Build structured questionnaire notes to attach
    const structuredNotesPayload = {
      mode: activeMode,
      supportedPersonRelation: activeMode === 'Family Ally' ? supportedRelation : undefined,
      supportedPersonMode: activeMode === 'Family Ally' ? supportedMode : undefined,
      answers: questionAnswers,
      userObservations: additionalNotes.trim() || undefined,
    };

    const effectiveModeName = activeMode === 'Family Ally' ? `Family Ally (${supportedMode})` : activeMode;

    const res = await apiService.recordSymptoms({
      lifeStageMode: effectiveModeName,
      symptoms: symptomItems,
      severity,
      duration,
      notes: JSON.stringify(structuredNotesPayload),
    });

    // Also trigger deterministic risk evaluation so the screening cards/reports immediately synchronize
    await apiService.evaluateRisk({
      lifeStageMode: effectiveModeName,
      symptoms: symptomItems,
    });

    setSubmitting(false);

    if (res.success && res.data) {
      if (res.data.hasEmergencyFlags || activeRedFlags.length > 0) {
        setEmergencyResult(res.data.emergencyReasons.length > 0 ? res.data.emergencyReasons : activeRedFlags);
      } else {
        success(t('common.success', 'Assessment Recorded'), 'Symptom assessment saved and evaluated by risk engine');
        if (onAssessmentCompleted) onAssessmentCompleted();
        onClose();
      }
    } else {
      error(t('common.error', 'Submission Failed'), res.error || 'Failed to submit symptom assessment');
    }
  };

  const getModeIcon = (mode: string) => {
    const norm = normalizeModeKey(mode);
    switch (norm) {
      case 'Teen / Young Women': return Sparkles;
      case 'Reproductive Health': return Heart;
      case 'Pregnancy': return Baby;
      case 'Postpartum': return Shield;
      case 'Menopause': return Activity;
      case 'Family Ally': return Users;
      default: return Stethoscope;
    }
  };

  const ActiveIcon = getModeIcon(activeMode);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          aria-label={t('common.close', 'Close')}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Emergency Red-Flag Dialog Screen */}
        {emergencyResult ? (
          <div className="p-6 bg-rose-500/10 border border-rose-500/40 rounded-3xl text-center space-y-5 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-rose-500/20 text-rose-400 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-rose-900/20">
              <ShieldAlert className="w-9 h-9" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-rose-400">
                {t('symptoms.emergencyAlert', 'Emergency Medical Alert')}
              </h3>
              <p className="text-xs sm:text-sm text-rose-200 mt-1.5 max-w-md mx-auto leading-relaxed">
                {t('symptoms.emergencyDesc', 'One or more reported symptoms indicate a potential acute clinical concern requiring prompt emergency care.')}
              </p>
            </div>

            <div className="bg-slate-950/80 border border-rose-500/30 rounded-2xl p-4 text-left space-y-2 text-xs text-rose-300">
              <div className="font-bold uppercase tracking-wider text-rose-400 text-[11px]">
                {t('symptoms.redFlagReasons', 'Reported Red-Flag Symptoms:')}
              </div>
              {emergencyResult.map((r, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-400 flex-shrink-0" />
                  <span className="font-medium">{r}</span>
                </div>
              ))}
            </div>

            {/* Postpartum Crisis Support Notice */}
            {emergencyResult.some((r) => r.toLowerCase().includes('self-harm') || r.toLowerCase().includes('harming baby')) && (
              <div className="p-3.5 bg-indigo-950/80 border border-indigo-500/40 rounded-2xl text-left text-xs text-indigo-200 space-y-1">
                <div className="font-bold text-indigo-300">💜 24x7 Supportive Mental Health Crisis Helpline</div>
                <p>Call Tele-MANAS: <strong>14416</strong> or Vandrevala Foundation: <strong>+91 9999 666 555</strong> for confidential, compassionate assistance.</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href="tel:112"
                className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-rose-900/40 transition"
              >
                <PhoneCall className="w-4 h-4" />
                <span>{t('symptoms.callEmergency', 'Call National Emergency Services (112 / 108)')}</span>
              </a>
              <button
                onClick={() => {
                  setEmergencyResult(null);
                  if (onAssessmentCompleted) onAssessmentCompleted();
                  onClose();
                }}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition"
              >
                {t('symptoms.closeEmergency', 'I Understand, Close Assessment')}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header with Active Mode Badge & Selector */}
            <div className="space-y-3 border-b border-slate-800 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
                    <ActiveIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                      {t('symptoms.title', 'Symptom Assessment & Triage')}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-teal-500/10 text-teal-300 border border-teal-500/20">
                        {t(config.nameKey, config.modeName)}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {t('symptoms.rulesDesc', 'Deterministic clinical triage')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mode Switcher Tabs for Easy Testing & Multi-Mode Interaction */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {Object.keys(LIFE_STAGE_CONFIGS).map((mKey) => {
                  const isCur = activeMode === mKey;
                  const ModeIcon = getModeIcon(mKey);
                  return (
                    <button
                      key={mKey}
                      type="button"
                      onClick={() => handleModeChange(mKey)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                        isCur
                          ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20 font-bold'
                          : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      <ModeIcon className="w-3.5 h-3.5" />
                      <span>{t(LIFE_STAGE_CONFIGS[mKey].nameKey, mKey)}</span>
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                {t(config.descriptionKey, config.defaultDescription)}
              </p>
            </div>

            {/* Family Ally Mode Persona Setup */}
            {activeMode === 'Family Ally' && (
              <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 space-y-3 text-xs">
                <div className="flex items-center gap-2 font-bold text-purple-300">
                  <Users className="w-4 h-4" />
                  <span>{t('familyAlly.setupTitle', 'Family Ally Support Configuration')}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      {t('question.family.relation', 'Who are you supporting?')}
                    </label>
                    <select
                      value={supportedRelation}
                      onChange={(e) => setSupportedRelation(e.target.value)}
                      className="w-full bg-slate-900 border border-purple-500/40 rounded-xl px-3 py-2 text-xs text-white focus:ring-1 focus:ring-purple-400"
                    >
                      {['Mother', 'Wife or Partner', 'Daughter', 'Sister', 'Friend', 'Other'].map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">
                      {t('question.family.mode', 'Which health mode applies to them?')}
                    </label>
                    <select
                      value={supportedMode}
                      onChange={(e) => {
                        setSupportedMode(e.target.value);
                        setSelectedSymptoms([]);
                        setQuestionAnswers({});
                      }}
                      className="w-full bg-slate-900 border border-purple-500/40 rounded-xl px-3 py-2 text-xs text-white focus:ring-1 focus:ring-purple-400"
                    >
                      {['Teen / Young Women', 'Reproductive Health', 'Pregnancy', 'Postpartum', 'Menopause', 'My Health'].map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Mode-Specific Questionnaire Fields */}
            {visibleQuestions.length > 0 && (
              <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                    {dynamicSymptomQuestions.length > 0
                      ? t('symptoms.clinicalClarifications', 'Problem-Specific Clinical Details')
                      : t('symptoms.modeSpecificQuestions', 'Mode-Specific Health Details')}
                  </span>
                  {isPregnancyActive && (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 self-start sm:self-auto">
                      {pregnancyTrimester.label}
                    </span>
                  )}
                </div>

                {isPregnancyActive && (
                  <p className="text-[11px] text-amber-200/80 bg-amber-950/30 border border-amber-500/20 rounded-xl px-3 py-1.5">
                    {pregnancyTrimester.desc}
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {visibleQuestions.map((q) => (
                    <div key={q.id} className={q.type === 'number' && isPregnancyActive ? 'sm:col-span-2' : ''}>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        {t(q.labelKey, q.defaultLabel)}
                      </label>
                      {q.type === 'select' ? (
                        <select
                          value={questionAnswers[q.id] || (q.options?.[0]?.value || '')}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                        >
                          {q.options?.map((opt: any) => (
                            <option key={opt.value} value={opt.value}>
                              {t(opt.labelKey, opt.defaultLabel)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="number"
                          min={q.min || 0}
                          max={q.max || 100}
                          value={questionAnswers[q.id] || ''}
                          onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                          placeholder={q.defaultPlaceholder || ''}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dynamic Symptom Checklist */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  {t('symptoms.selectSymptoms', 'Select Observed Symptoms')} ({selectedSymptoms.length} {t('symptoms.selected', 'selected')})
                </label>
                <span className="text-[11px] text-slate-500">
                  {visibleSymptoms.length} {t('symptoms.relevantAvailable', 'relevant options')}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {visibleSymptoms.map((sym) => {
                  const isChecked = selectedSymptoms.includes(sym.name);
                  return (
                    <button
                      key={sym.id}
                      type="button"
                      onClick={() => toggleSymptom(sym.name)}
                      className={`p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between gap-2 ${
                        isChecked
                          ? sym.isRedFlag
                            ? 'bg-rose-500/20 border-rose-500 text-rose-200 font-bold ring-1 ring-rose-500'
                            : 'bg-teal-500/20 border-teal-400 text-teal-200 font-bold ring-1 ring-teal-400'
                          : sym.isRedFlag
                          ? 'bg-slate-900/60 border-slate-800 text-rose-300/80 hover:border-rose-500/50 hover:bg-slate-800/60'
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {sym.isRedFlag && (
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                        )}
                        <span className="truncate">{t(sym.labelKey, sym.defaultLabel)}</span>
                      </div>
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 ${
                        isChecked
                          ? sym.isRedFlag
                            ? 'bg-rose-500 border-rose-500 text-white'
                            : 'bg-teal-500 border-teal-500 text-slate-950 font-bold'
                          : 'border-slate-700 bg-slate-950'
                      }`}>
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Add Custom Specific Symptom */}
              <form onSubmit={handleAddCustom} className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder={t('symptoms.otherPlaceholder', 'Other specific symptom...')}
                  value={customSymptom}
                  onChange={(e) => setCustomSymptom(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
                <button
                  type="submit"
                  disabled={!customSymptom.trim()}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-teal-400 border border-slate-700 rounded-xl text-xs font-semibold transition"
                >
                  {t('symptoms.add', '+ Add')}
                </button>
              </form>
            </div>

            {/* Immediate Red-Flag Warning Banner if any critical symptom is active */}
            {activeRedFlags.length > 0 && (
              <div className="p-4 bg-rose-500/15 border border-rose-500/60 rounded-2xl space-y-2 text-xs text-rose-200 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold text-rose-400 text-sm">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>{t('symptoms.urgentWarningNotice', 'Urgent Clinical Concern Flagged')}</span>
                </div>
                <p className="leading-relaxed">
                  {t('symptoms.urgentWarningText', 'One or more of your selected symptoms indicate an urgent acute clinical concern. Please proceed to immediate emergency assessment at the nearest maternity or hospital facility.')}
                </p>
                <div className="pt-1 flex items-center gap-2 font-bold text-rose-300">
                  <span>Emergency Helpline:</span>
                  <a href="tel:112" className="underline hover:text-white font-mono">112 / 108</a>
                </div>
              </div>
            )}

            {/* Severity & Duration Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t('symptoms.severity', 'Overall Severity')}
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                >
                  <option value="Mild">{t('symptoms.severity.mild', 'Mild (Noticeable but daily routine unaffected)')}</option>
                  <option value="Moderate">{t('symptoms.severity.moderate', 'Moderate (Disrupts work or sleep)')}</option>
                  <option value="Severe">{t('symptoms.severity.severe', 'Severe (Intense, requires urgent attention)')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  {t('symptoms.duration', 'Duration')}
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                >
                  <option value="< 24 hours">{t('symptoms.duration.less24h', 'Less than 24 hours')}</option>
                  <option value="1-3 days">{t('symptoms.duration.1to3d', '1 to 3 days')}</option>
                  <option value="1-2 weeks">{t('symptoms.duration.1to2w', '1 to 2 weeks')}</option>
                  <option value="Chronic (> 1 month)">{t('symptoms.duration.chronic', 'Chronic (Over a month)')}</option>
                </select>
              </div>
            </div>

            {/* Additional Observations Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {t('symptoms.observations', 'Additional Observations / Triggers (Optional)')}
              </label>
              <textarea
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder={t('symptoms.observationsPlaceholder', 'e.g. Occurs right before period starts; aggravated by coffee...')}
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
              >
                {t('symptoms.cancel', 'Cancel')}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  activeRedFlags.length > 0
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-900/30'
                    : 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-lg shadow-teal-500/20'
                }`}
              >
                {submitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>{t('symptoms.evaluating', 'Evaluating Clinical Rules...')}</span>
                  </>
                ) : (
                  <span>{t('symptoms.submit', 'Submit for Risk Screening')}</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
