import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, ChevronRight, ChevronLeft, X } from 'lucide-react';
import { apiService, OnboardingQuestionData } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

interface AdaptiveOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  lifeStage: string;
  onCompleted?: () => void;
}

export const AdaptiveOnboardingModal: React.FC<AdaptiveOnboardingModalProps> = ({
  isOpen,
  onClose,
  lifeStage,
  onCompleted,
}) => {
  const { success, error } = useToast();
  const { t } = useLanguage();
  const [questions, setQuestions] = useState<OnboardingQuestionData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      apiService.getOnboardingQuestions(lifeStage).then((res) => {
        setLoading(false);
        if (res.data && res.data.length > 0) {
          setQuestions(res.data);
          setCurrentIndex(0);
        }
      });
    }
  }, [isOpen, lifeStage]);

  if (!isOpen) return null;

  const currentQ = questions[currentIndex];
  const progressPercent = questions.length > 0 ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;

  const handleSelectOption = (questionId: string, value: string, isMulti: boolean = false) => {
    if (isMulti) {
      const currentList: string[] = answers[questionId] || [];
      const updated = currentList.includes(value)
        ? currentList.filter((v) => v !== value)
        : [...currentList, value];
      setAnswers({ ...answers, [questionId]: updated });
    } else {
      setAnswers({ ...answers, [questionId]: value });
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const res = await apiService.submitOnboarding({
      lifeStageMode: lifeStage,
      responses: answers,
      completedSteps: questions.map((q) => q.id),
    });
    setSubmitting(false);
    if (res.success) {
      success(t('common.success', 'Profile Personalized'), 'Adaptive health profile personalized successfully!');
      if (onCompleted) onCompleted();
      onClose();
    } else {
      error(t('common.error', 'Failed to save'), res.error || 'Failed to save responses');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-xl rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          aria-label={t('common.close', 'Close')}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-teal-400 uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            {t('onboarding.subtitle', 'Adaptive Health Questionnaire')} • {lifeStage}
          </div>
          <h3 className="text-lg font-bold text-white">{t('onboarding.title', 'Personalize Your Digital Health Twin')}</h3>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-slate-800 h-2 rounded-full mb-6 overflow-hidden">
          <div
            className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">{t('onboarding.loading', 'Loading personalized question bank...')}</div>
        ) : currentQ ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Question {currentIndex + 1} of {questions.length}</span>
              <span className="bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-700">{currentQ.category}</span>
            </div>

            <h4 className="text-base font-semibold text-white leading-snug">{currentQ.title}</h4>
            {currentQ.description && (
              <p className="text-xs text-slate-400 -mt-2">{currentQ.description}</p>
            )}

            {/* Options */}
            <div className="space-y-2 pt-2">
              {currentQ.options?.map((opt) => {
                const isMulti = currentQ.type === 'multiselect';
                const isSelected = isMulti
                  ? ((answers[currentQ.id] as string[]) || []).includes(opt.value)
                  : answers[currentQ.id] === opt.value;

                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelectOption(currentQ.id, opt.value, isMulti)}
                    className={`w-full p-3 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-teal-500/10 border-teal-400 text-teal-200 font-medium'
                        : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-800 mt-6">
              <button
                type="button"
                onClick={handleBack}
                disabled={currentIndex === 0}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-700 text-xs font-medium text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="w-4 h-4" />
                {t('onboarding.prev', 'Previous')}
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={submitting}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 text-xs font-bold shadow-md shadow-teal-500/20 disabled:opacity-50"
              >
                <span>
                  {currentIndex === questions.length - 1
                    ? (submitting ? t('onboarding.saving', 'Saving...') : t('onboarding.complete', 'Complete Assessment'))
                    : t('onboarding.next', 'Next Question')}
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs">No questions configured for this stage.</div>
        )}
      </div>
    </div>
  );
};
