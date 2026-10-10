import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  Heart,
  FileSpreadsheet,
  Plus,
  ArrowRight,
  TrendingUp,
  BotMessageSquare,
  Stethoscope,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useHealth } from '../context/HealthContext';
import { useLanguage } from '../context/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { HealthTrendChart } from '../components/charts/HealthTrendChart';
import { EmptyState } from '../components/common/EmptyState';
import { DashboardSkeleton } from '../components/common/LoadingSkeleton';

// Additive Feature Components
import { RiskCard } from '../components/RiskCard';
import { SymptomAssessmentModal } from '../components/SymptomAssessmentModal';
import { AdaptiveOnboardingModal } from '../components/AdaptiveOnboardingModal';
import { CareNavigatorModal } from '../components/CareNavigatorModal';
import { apiService, RiskAssessmentData } from '../services/api';

export const DashboardPage: React.FC = () => {
  const { user, isDemoMode, isNewAccount } = useAuth();
  const { t } = useLanguage();
  const {
    healthTwin,
    vitalsHistory,
    reports,
    cycleLogs,
    familyMembers,
    addVitalLog,
    isLoading,
  } = useHealth();

  const isMale = user?.gender === 'Male' || healthTwin?.gender === 'Male';
  const isFirstTimeUser = Boolean(isNewAccount || user?.isNewAccount);

  // Quick Log Vitals Modal State
  const [isLogVitalsOpen, setIsLogVitalsOpen] = useState(false);
  const [systolic, setSystolic] = useState('0');
  const [diastolic, setDiastolic] = useState('0');
  const [glucose, setGlucose] = useState('0');
  const [heartRate, setHeartRate] = useState('0');
  const [weight, setWeight] = useState('0');
  const [spo2, setSpo2] = useState('0');
  const [isSubmittingVitals, setIsSubmittingVitals] = useState(false);

  // Additive Feature State
  const [currentRisk, setCurrentRisk] = useState<RiskAssessmentData | null>(null);
  const [riskLoading, setRiskLoading] = useState(false);
  const [isSymptomModalOpen, setIsSymptomModalOpen] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [isCareNavigatorOpen, setIsCareNavigatorOpen] = useState(false);
  const [userLifeStage, setUserLifeStage] = useState('My Health');

  const fetchRiskAndStage = async () => {
    setRiskLoading(true);
    const [riskRes, stageRes] = await Promise.all([
      apiService.getLatestRisk(),
      apiService.getLifeStage(),
    ]);
    setRiskLoading(false);
    if (riskRes.data) setCurrentRisk(riskRes.data);
    if (stageRes.data) setUserLifeStage(stageRes.data.currentMode);
  };

  useEffect(() => {
    fetchRiskAndStage();
  }, []);

  const handleLogVitalsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingVitals(true);
    const weightNum = parseFloat(weight) || 58.5;
    const heightM = (healthTwin?.heightCm || 165) / 100;
    const calculatedBmi = parseFloat((weightNum / (heightM * heightM)).toFixed(1));

    await addVitalLog({
      date: new Date().toISOString().split('T')[0],
      systolic: parseInt(systolic) || 120,
      diastolic: parseInt(diastolic) || 80,
      glucose: parseInt(glucose) || 95,
      heartRate: parseInt(heartRate) || 75,
      weight: weightNum,
      bmi: calculatedBmi,
      spo2: parseInt(spo2) || 98,
      notes: 'Quick manual log from dashboard',
    });

    setIsSubmittingVitals(false);
    setIsLogVitalsOpen(false);
    fetchRiskAndStage();
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const latestCycle = cycleLogs[0];

  return (
    <div className="space-y-6">
      {/* 1. Header & Welcome Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-teal-800 via-teal-900 to-navy-950 text-white p-6 rounded-3xl shadow-card border border-teal-700/50">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-500/30 text-teal-200 border border-teal-400/40">
              {t('dashboard.healthMode', 'Health Mode')}: {userLifeStage}
            </span>
            {isFirstTimeUser && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/40 font-medium">
                ✨ Account Created
              </span>
            )}
            {isDemoMode && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                {user?.id === 'usr_demo_01'
                  ? t('dashboard.demoPatient', 'Demo Patient: Ananya Sharma')
                  : `Demo Mode: ${user?.name || 'Active'}`}
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            {isFirstTimeUser
              ? `${t('dashboard.welcomeFirstTime', 'Welcome')}, ${user?.name || healthTwin?.fullName || 'Patient'}`
              : `${t('dashboard.welcomeBack', 'Welcome back')}, ${user?.name || healthTwin?.fullName || 'Patient'}`}
          </h2>
          <p className="text-xs sm:text-sm text-teal-100/80 max-w-xl">
            {isFirstTimeUser
              ? 'Your account and Digital Health Twin have been created successfully. All baseline vitals are initialized and ready for personalized tracking.'
              : t('page.dashboard.subtitle', 'Your Health Twin vitals are synchronized with your latest diagnostic panels. Clinical risk screening active.')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="mint"
            size="sm"
            onClick={() => setIsSymptomModalOpen(true)}
            leftIcon={<Stethoscope className="w-4 h-4" />}
          >
            {t('dashboard.checkSymptoms', 'Check Symptoms')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOnboardingModalOpen(true)}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            {t('dashboard.profiling', 'Adaptive Profiling')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLogVitalsOpen(true)}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            {t('dashboard.logVitals', 'Log Vitals')}
          </Button>
        </div>
      </div>

      {/* 2. Deterministic Risk Engine Card */}
      <RiskCard
        risk={currentRisk}
        loading={riskLoading}
        onCheckSymptoms={() => setIsSymptomModalOpen(true)}
        onOpenCareNavigator={() => setIsCareNavigatorOpen(true)}
        onReevaluate={fetchRiskAndStage}
      />

      {/* 3. Top Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Blood Pressure */}
        <Card className="p-4 border-l-4 border-l-teal-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('dashboard.bloodPressure', 'Blood Pressure')}</span>
            <span className="p-1.5 rounded-xl bg-teal-50 text-teal-700">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {healthTwin?.latestVitals?.bloodPressureSystolic ?? 0} /{' '}
              {healthTwin?.latestVitals?.bloodPressureDiastolic ?? 0}
              <span className="text-xs font-normal text-slate-500 ml-1">mmHg</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <Badge variant={(healthTwin?.latestVitals?.bloodPressureSystolic || 0) > 0 ? "success" : "outline"} size="sm">
                {(healthTwin?.latestVitals?.bloodPressureSystolic || 0) > 0 ? "Optimal" : "0 - Baseline"}
              </Badge>
              <span className="text-[11px] text-slate-400">Target &lt; 120/80</span>
            </div>
          </div>
        </Card>

        {/* Metric 2: Fasting Blood Glucose */}
        <Card className="p-4 border-l-4 border-l-emerald-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('dashboard.glucose', 'Fasting Glucose')}</span>
            <span className="p-1.5 rounded-xl bg-emerald-50 text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {healthTwin?.latestVitals?.fastingGlucoseMgDl ?? 0}
              <span className="text-xs font-normal text-slate-500 ml-1">mg/dL</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <Badge variant={(healthTwin?.latestVitals?.fastingGlucoseMgDl || 0) > 0 ? "success" : "outline"} size="sm">
                {(healthTwin?.latestVitals?.fastingGlucoseMgDl || 0) > 0 ? "Normal" : "0 - Baseline"}
              </Badge>
              <span className="text-[11px] text-slate-400">70 - 99 mg/dL</span>
            </div>
          </div>
        </Card>

        {/* Metric 3: BMI & Weight */}
        <Card className="p-4 border-l-4 border-l-indigo-600">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">BMI / Weight</span>
            <span className="p-1.5 rounded-xl bg-indigo-50 text-indigo-700">
              <Heart className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {healthTwin?.bmi ?? 0}
              <span className="text-xs font-normal text-slate-500 ml-1">({healthTwin?.weightKg ?? 0} kg)</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <Badge variant={(healthTwin?.bmi || 0) > 0 ? "teal" : "outline"} size="sm">
                {(healthTwin?.bmi || 0) > 0 ? "Healthy Weight" : "0 - Baseline"}
              </Badge>
              <span className="text-[11px] text-slate-400">18.5 - 24.9</span>
            </div>
          </div>
        </Card>

        {/* Metric 4: Resting Heart Rate */}
        <Card className="p-4 border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('dashboard.heartRate', 'Heart Rate / SpO2')}</span>
            <span className="p-1.5 rounded-xl bg-rose-50 text-rose-600">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2">
            <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
              {healthTwin?.latestVitals?.heartRateBpm ?? 0}
              <span className="text-xs font-normal text-slate-500 ml-1">BPM</span>
              <span className="text-sm font-semibold text-teal-700 ml-2">
                {healthTwin?.latestVitals?.spo2Percentage ?? 0}%
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <Badge variant={(healthTwin?.latestVitals?.heartRateBpm || 0) > 0 ? "success" : "outline"} size="sm">
                {(healthTwin?.latestVitals?.heartRateBpm || 0) > 0 ? "Stable Pulse" : "0 - Baseline"}
              </Badge>
              <span className="text-[11px] text-slate-400">60 - 100 BPM</span>
            </div>
          </div>
        </Card>
      </div>

      {/* 4. Main Split: Health Trend Chart & Health Twin Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Recharts Trend History */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle>{t('dashboard.clinicalOverview', 'Longitudinal Health Trends')}</CardTitle>
                <CardDescription>
                  Multi-month parameter history logged from verified diagnostic reports and daily checks.
                </CardDescription>
              </div>
              <Link to="/health-twin">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  {t('dashboard.exploreTwin', 'View 360° Twin')}
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              {vitalsHistory.length > 0 ? (
                <HealthTrendChart data={vitalsHistory} />
              ) : (
                <EmptyState
                  title="No Vitals Recorded"
                  description="Log your daily blood pressure, glucose, or weight to generate longitudinal trend charts."
                  actionLabel="Log First Measurement"
                  onAction={() => setIsLogVitalsOpen(true)}
                />
              )}
            </CardContent>
          </Card>

          {/* Quick Actions & Next Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link to="/reports" className="block group">
              <Card className="p-4 hover:border-teal-500 hover:shadow-card transition duration-150 h-full">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-teal-800 transition">
                  {t('dashboard.uploadReport', 'Analyze Diagnostic')}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Upload PDF lab results for AI parameter breakdown.
                </p>
              </Card>
            </Link>

            <Link to="/assistant" className="block group">
              <Card className="p-4 hover:border-teal-500 hover:shadow-card transition duration-150 h-full">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                  <BotMessageSquare className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-800 transition">
                  {t('dashboard.askAi', 'Ask Health Assistant')}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Clarify medical terms in Telugu, Hindi, Tamil, Kannada, or English.
                </p>
              </Card>
            </Link>

            <button
              onClick={() => setIsCareNavigatorOpen(true)}
              className="block group text-left w-full"
            >
              <Card className="p-4 hover:border-teal-500 hover:shadow-card transition duration-150 h-full">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center mb-3 group-hover:scale-105 transition">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 group-hover:text-rose-800 transition">
                  {t('dashboard.findSpecialists', 'Care Navigation')}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Find matched specialists and tier-1 hospital care in your city.
                </p>
              </Card>
            </button>
          </div>
        </div>

        {/* Right 1 Col: Women's or Male Health & Reports Summary */}
        <div className="space-y-6">
          {/* Women's or Male Health Quick Card */}
          <Card className={`border-t-4 ${isMale ? 'border-t-teal-600' : 'border-t-rose-500'}`}>
            <CardHeader className="flex items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">
                  {isMale ? 'Male Health Status' : t('nav.womensHealth', "Women's Health Status")}
                </CardTitle>
                <CardDescription>
                  {isMale ? 'Vitality, stamina, and wellness tracking' : 'Hormonal and cycle tracking'}
                </CardDescription>
              </div>
              <Link
                to={isMale ? '/male-health' : '/womens-health'}
                className={`text-xs font-semibold ${isMale ? 'text-teal-700 hover:text-teal-900' : 'text-rose-700 hover:text-rose-900'}`}
              >
                Details →
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {isMale ? (
                <>
                  <div className="p-3 bg-teal-50/70 rounded-xl border border-teal-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">Vitality Index: High</span>
                      <span className="text-teal-700 font-semibold">Prostate & Stamina Check</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-teal-600 h-full w-[85%] rounded-full" />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                      <span>Status: Optimal Baseline</span>
                      <span>Readiness: 85%</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-slate-600 block mb-1.5">Tracked Male Wellness Indicators</span>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">Prostate: Optimal</span>
                      <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">Vitality: Normal</span>
                      <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">Recovery: Rested</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">Current Phase: Luteal</span>
                      <span className="text-rose-700 font-semibold">Day 21 of 29</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-full w-[72%] rounded-full" />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
                      <span>Last: Sep 18</span>
                      <span>Est. Next: Oct 17 (~8d)</span>
                    </div>
                  </div>

                  {latestCycle?.symptoms && latestCycle.symptoms.length > 0 && (
                    <div>
                      <span className="text-xs font-semibold text-slate-600 block mb-1.5">Logged Symptoms</span>
                      <div className="flex flex-wrap gap-1.5">
                        {latestCycle.symptoms.map((s, idx) => (
                          <span key={idx} className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Recent Medical Reports */}
          <Card>
            <CardHeader className="flex items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">{t('dashboard.recentReports', 'Recent Medical Reports')}</CardTitle>
                <CardDescription>{reports.length} documents archived</CardDescription>
              </div>
              <Link to="/reports" className="text-xs font-semibold text-teal-700 hover:text-teal-900">
                All Reports →
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {reports.slice(0, 2).map((rep) => (
                <div
                  key={rep.id}
                  className="p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition border border-slate-200/80 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="p-2 bg-teal-100/70 text-teal-800 rounded-lg flex-shrink-0">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-xs font-bold text-slate-900 truncate">{rep.fileName}</h5>
                        <p className="text-[11px] text-slate-500">{rep.labOrHospitalName}</p>
                      </div>
                    </div>
                    <Badge variant="success" size="sm">Analyzed</Badge>
                  </div>
                  {rep.keyInsights?.[0] && (
                    <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-100 leading-snug">
                      💡 {rep.keyInsights[0]}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Family Profiles Snippet */}
          <Card>
            <CardHeader className="flex items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">{t('nav.family', 'Family Health Hub')}</CardTitle>
                <CardDescription>{familyMembers.length} active family profiles</CardDescription>
              </div>
              <Link to="/family-health" className="text-xs font-semibold text-teal-700 hover:text-teal-900">
                Manage →
              </Link>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {familyMembers.slice(0, 3).map((member) => (
                <div key={member.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-full text-white flex items-center justify-center text-xs font-bold ${member.avatarColor}`}>
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{member.name}</p>
                      <p className="text-[10px] text-slate-400">{member.relationship} • {member.age} yrs • {member.bloodGroup}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {member.chronicConditions[0] || 'Healthy'}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Log Vitals Modal */}
      <Modal
        isOpen={isLogVitalsOpen}
        onClose={() => setIsLogVitalsOpen(false)}
        title={t('dashboard.logVitals', "Log Today's Health Measurements")}
        description="Enter your latest blood pressure, glucose, or weight to update your Health Twin."
      >
        <form onSubmit={handleLogVitalsSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Systolic BP (mmHg)"
              type="number"
              value={systolic}
              onChange={(e) => setSystolic(e.target.value)}
              placeholder="118"
              required
            />
            <Input
              label="Diastolic BP (mmHg)"
              type="number"
              value={diastolic}
              onChange={(e) => setDiastolic(e.target.value)}
              placeholder="78"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Fasting Glucose (mg/dL)"
              type="number"
              value={glucose}
              onChange={(e) => setGlucose(e.target.value)}
              placeholder="92"
            />
            <Input
              label="Heart Rate (BPM)"
              type="number"
              value={heartRate}
              onChange={(e) => setHeartRate(e.target.value)}
              placeholder="72"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Weight (kg)"
              type="number"
              step="0.1"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="58.5"
            />
            <Input
              label="Oxygen Saturation SpO2 (%)"
              type="number"
              value={spo2}
              onChange={(e) => setSpo2(e.target.value)}
              placeholder="99"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsLogVitalsOpen(false)}
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmittingVitals}
            >
              {t('common.save', 'Save Measurements')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Symptom Assessment Modal */}
      <SymptomAssessmentModal
        isOpen={isSymptomModalOpen}
        onClose={() => setIsSymptomModalOpen(false)}
        lifeStage={userLifeStage}
        onAssessmentCompleted={fetchRiskAndStage}
      />

      {/* Adaptive Onboarding Modal */}
      <AdaptiveOnboardingModal
        isOpen={isOnboardingModalOpen}
        onClose={() => setIsOnboardingModalOpen(false)}
        lifeStage={userLifeStage}
        onCompleted={fetchRiskAndStage}
      />

      {/* Care Navigator Modal */}
      <CareNavigatorModal
        isOpen={isCareNavigatorOpen}
        onClose={() => setIsCareNavigatorOpen(false)}
        specialty={currentRisk?.suggestedSpecialty}
      />
    </div>
  );
};
