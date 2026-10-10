import React, { useState, useEffect } from 'react';
import {
  Activity,
  Edit3,
  Save,
  Plus,
  ShieldAlert,
  Footprints,
  Pill,
  FileCheck,
} from 'lucide-react';
import { useHealth } from '../context/HealthContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Input } from '../components/common/Input';
import { Modal } from '../components/common/Modal';
import { HealthTrendChart } from '../components/charts/HealthTrendChart';
import { HealthTimelineView } from '../components/HealthTimelineView';
import { apiService, ConfirmedLabData } from '../services/api';

export const HealthTwinPage: React.FC = () => {
  const { healthTwin, vitalsHistory, updateHealthTwin, addVitalLog } = useHealth();
  const { user, switchGender } = useAuth();
  const { t } = useLanguage();

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isLogVitalsOpen, setIsLogVitalsOpen] = useState(false);
  const [confirmedLabs, setConfirmedLabs] = useState<ConfirmedLabData[]>([]);

  useEffect(() => {
    apiService.getConfirmedLabs().then((res) => {
      if (res.data) setConfirmedLabs(res.data);
    });
  }, []);

  // Profile Edit State
  const [fullName, setFullName] = useState(healthTwin?.fullName || '');
  const [age, setAge] = useState(healthTwin?.age && healthTwin.age > 0 ? healthTwin.age.toString() : '');
  const [gender, setGender] = useState(healthTwin?.gender || 'Female');
  const [bloodGroup, setBloodGroup] = useState(healthTwin?.bloodGroup && healthTwin.bloodGroup !== 'Nil' ? healthTwin.bloodGroup : 'B+');
  const [heightCm, setHeightCm] = useState(healthTwin?.heightCm && healthTwin.heightCm > 0 ? healthTwin.heightCm.toString() : '');
  const [weightKg, setWeightKg] = useState(healthTwin?.weightKg && healthTwin.weightKg > 0 ? healthTwin.weightKg.toString() : '');
  const [allergiesText, setAllergiesText] = useState(healthTwin?.allergies.join(', ') || '');
  const [chronicText, setChronicText] = useState(healthTwin?.chronicConditions.join(', ') || '');
  const [medsText, setMedsText] = useState(healthTwin?.currentMedications.join(', ') || '');
  const [emergencyName, setEmergencyName] = useState(healthTwin?.emergencyContact.name !== 'Nil' ? healthTwin?.emergencyContact.name || '' : '');
  const [emergencyPhone, setEmergencyPhone] = useState(healthTwin?.emergencyContact.phone !== 'Nil' ? healthTwin?.emergencyContact.phone || '' : '');
  const [emergencyRelation, setEmergencyRelation] = useState(healthTwin?.emergencyContact.relationship !== 'Nil' ? healthTwin?.emergencyContact.relationship || '' : '');
  const [activityLevel, setActivityLevel] = useState(healthTwin?.lifestyle.activityLevel !== 'Nil' ? healthTwin?.lifestyle.activityLevel || 'Moderately Active' : 'Moderately Active');
  const [sleepHours, setSleepHours] = useState(healthTwin?.lifestyle.sleepHoursPerDay && healthTwin.lifestyle.sleepHoursPerDay > 0 ? healthTwin.lifestyle.sleepHoursPerDay.toString() : '');
  const [isSaving, setIsSaving] = useState(false);

  // New Vitals Log State
  const [logSystolic, setLogSystolic] = useState('0');
  const [logDiastolic, setLogDiastolic] = useState('0');
  const [logGlucose, setLogGlucose] = useState('0');
  const [logHeartRate, setLogHeartRate] = useState('0');
  const [logWeight, setLogWeight] = useState('0');
  const [logSpo2, setLogSpo2] = useState('0');
  const [isSavingVital, setIsSavingVital] = useState(false);

  useEffect(() => {
    if (healthTwin) {
      setFullName(healthTwin.fullName || '');
      setAge(healthTwin.age && healthTwin.age > 0 ? healthTwin.age.toString() : '');
      setGender(healthTwin.gender || 'Female');
      setBloodGroup(healthTwin.bloodGroup && healthTwin.bloodGroup !== 'Nil' ? healthTwin.bloodGroup : 'B+');
      setHeightCm(healthTwin.heightCm && healthTwin.heightCm > 0 ? healthTwin.heightCm.toString() : '');
      setWeightKg(healthTwin.weightKg && healthTwin.weightKg > 0 ? healthTwin.weightKg.toString() : '');
      setAllergiesText(healthTwin.allergies?.join(', ') || '');
      setChronicText(healthTwin.chronicConditions?.join(', ') || '');
      setMedsText(healthTwin.currentMedications?.join(', ') || '');
      setEmergencyName(healthTwin.emergencyContact?.name !== 'Nil' ? healthTwin.emergencyContact?.name || '' : '');
      setEmergencyPhone(healthTwin.emergencyContact?.phone !== 'Nil' ? healthTwin.emergencyContact?.phone || '' : '');
      setEmergencyRelation(healthTwin.emergencyContact?.relationship !== 'Nil' ? healthTwin.emergencyContact?.relationship || '' : '');
      setSleepHours(healthTwin.lifestyle?.sleepHoursPerDay && healthTwin.lifestyle.sleepHoursPerDay > 0 ? healthTwin.lifestyle.sleepHoursPerDay.toString() : '');
    }
  }, [healthTwin]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const h = parseFloat(heightCm) || 0;
    const w = parseFloat(weightKg) || 0;
    const calculatedBmi = h > 0 ? parseFloat((w / ((h / 100) * (h / 100))).toFixed(1)) : 0;

    if (gender === 'Male' || gender === 'Female') {
      switchGender(gender);
    }

    await updateHealthTwin({
      fullName,
      age: parseInt(age) || 0,
      gender: gender as any,
      bloodGroup: bloodGroup as any,
      heightCm: h,
      weightKg: w,
      bmi: calculatedBmi,
      allergies: allergiesText.split(',').map((s) => s.trim()).filter(Boolean),
      chronicConditions: chronicText.split(',').map((s) => s.trim()).filter(Boolean),
      currentMedications: medsText.split(',').map((s) => s.trim()).filter(Boolean),
      emergencyContact: {
        name: emergencyName || 'Nil',
        phone: emergencyPhone || 'Nil',
        relationship: emergencyRelation || 'Nil',
      },
      lifestyle: {
        activityLevel: activityLevel as any,
        sleepHoursPerDay: parseFloat(sleepHours) || 0,
        dietType: healthTwin?.lifestyle.dietType || 'Nil',
        waterIntakeLiters: healthTwin?.lifestyle.waterIntakeLiters || 0,
      },
    });

    setIsSaving(false);
    setIsEditingProfile(false);
  };

  const handleSaveVitalLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingVital(true);

    const w = parseFloat(logWeight) || (healthTwin?.weightKg || 58.5);
    const h = (healthTwin?.heightCm || 165) / 100;
    const bmi = parseFloat((w / (h * h)).toFixed(1));

    await addVitalLog({
      date: new Date().toISOString().split('T')[0],
      systolic: parseInt(logSystolic) || 120,
      diastolic: parseInt(logDiastolic) || 80,
      glucose: parseInt(logGlucose) || 95,
      heartRate: parseInt(logHeartRate) || 75,
      weight: w,
      bmi,
      spo2: parseInt(logSpo2) || 99,
      notes: 'Recorded via Health Twin profile page',
    });

    setIsSavingVital(false);
    setIsLogVitalsOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. Page Header & Transparent Disclaimer Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-soft flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-800 text-white flex items-center justify-center font-extrabold text-2xl shadow-md shadow-teal-700/20 flex-shrink-0">
            {(user?.name || healthTwin?.fullName || 'U').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {user?.name || healthTwin?.fullName || 'Patient'}
              </h2>
              <Badge variant="teal" size="sm">{t('page.healthTwin.title', 'Digital Health Twin')}</Badge>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              {healthTwin?.age && healthTwin.age > 0 ? `${healthTwin.age} ${t('health.yearsOld', 'years old')}` : 'Nil'} • {healthTwin?.gender || 'Nil'} • {t('health.bloodGroup', 'Blood Group')}: <span className="font-bold text-slate-700">{healthTwin?.bloodGroup && healthTwin.bloodGroup !== 'Unknown' && healthTwin.bloodGroup !== 'Nil' ? healthTwin.bloodGroup : 'Nil'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditingProfile(true)}
            leftIcon={<Edit3 className="w-4 h-4" />}
          >
            {t('healthTwin.edit', 'Edit Health Twin')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsLogVitalsOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            {t('dashboard.logVitals', 'Log New Vitals')}
          </Button>
        </div>
      </div>

      {/* Transparent Disclaimer Box */}
      <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 flex items-start gap-3 text-xs text-teal-950 leading-relaxed">
        <ShieldAlert className="w-5 h-5 text-teal-700 flex-shrink-0 mt-0.5" />
        <div>
          <strong>{t('healthTwin.noticeTitle', 'Platform Notice:')}</strong> {t('healthTwin.noticeText', 'The Digital Health Twin is an organized, personal health-information summary aggregating user-entered measurements, history, and uploaded lab results. It does not represent a scientifically validated simulation of the human body or a disease-prediction system.')}
        </div>
      </div>

      {/* 2. Key Biological Metrics & 360 Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Physical & Anthropometric */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-600" /> {t('dashboard.vitals', 'Physical Vitals')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
              <span className="text-slate-500 text-xs">{t('health.height', 'Height')}</span>
              <span className="font-bold text-slate-800">{healthTwin?.heightCm && healthTwin.heightCm > 0 ? `${healthTwin.heightCm} cm` : 'Nil'}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
              <span className="text-slate-500 text-xs">{t('health.weight', 'Weight')}</span>
              <span className="font-bold text-slate-800">{healthTwin?.weightKg && healthTwin.weightKg > 0 ? `${healthTwin.weightKg} kg` : 'Nil'}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
              <span className="text-slate-500 text-xs">{t('health.bmi', 'Body Mass Index (BMI)')}</span>
              <span className="font-bold text-teal-700">{healthTwin?.bmi && healthTwin.bmi > 0 ? `${healthTwin.bmi} (${t('health.normal', 'Normal')})` : 'Nil'}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
              <span className="text-slate-500 text-xs">{t('dashboard.bloodPressure', 'Latest Blood Pressure')}</span>
              <span className="font-bold text-slate-800">
                {healthTwin?.latestVitals?.bloodPressureSystolic && healthTwin.latestVitals.bloodPressureSystolic > 0
                  ? `${healthTwin.latestVitals.bloodPressureSystolic}/${healthTwin.latestVitals.bloodPressureDiastolic} mmHg`
                  : 'Nil'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
              <span className="text-slate-500 text-xs">{t('dashboard.glucose', 'Fasting Glucose')}</span>
              <span className="font-bold text-slate-800">
                {healthTwin?.latestVitals?.fastingGlucoseMgDl && healthTwin.latestVitals.fastingGlucoseMgDl > 0
                  ? `${healthTwin.latestVitals.fastingGlucoseMgDl} mg/dL`
                  : 'Nil'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Chronic Conditions & Allergies */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Pill className="w-4 h-4 text-teal-600" /> {t('health.conditionsMeds', 'Conditions & Medications')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                {t('health.activeConditions', 'Active Health Conditions')}
              </span>
              <div className="space-y-1.5">
                {healthTwin?.chronicConditions && healthTwin.chronicConditions.length > 0 ? (
                  healthTwin.chronicConditions.map((cond, idx) => (
                    <div key={idx} className="p-2 bg-amber-50 text-amber-900 text-xs rounded-lg border border-amber-200">
                      ⚠️ {cond}
                    </div>
                  ))
                ) : (
                  <div className="p-2 bg-slate-50 text-slate-500 text-xs rounded-lg border border-slate-200">
                    Nil
                  </div>
                )}
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                {t('health.currentMeds', 'Current Medications')}
              </span>
              <div className="space-y-1.5">
                {healthTwin?.currentMedications && healthTwin.currentMedications.length > 0 ? (
                  healthTwin.currentMedications.map((med, idx) => (
                    <div key={idx} className="p-2 bg-teal-50 text-teal-900 text-xs rounded-lg border border-teal-200">
                      💊 {med}
                    </div>
                  ))
                ) : (
                  <div className="p-2 bg-slate-50 text-slate-500 text-xs rounded-lg border border-slate-200">
                    Nil
                  </div>
                )}
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                {t('health.knownAllergies', 'Known Allergies')}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {healthTwin?.allergies && healthTwin.allergies.length > 0 ? (
                  healthTwin.allergies.map((allergy, idx) => (
                    <Badge key={idx} variant="danger" size="sm">
                      {allergy}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-slate-500">Nil</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lifestyle & Emergency Contact */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Footprints className="w-4 h-4 text-teal-600" /> {t('health.lifestyleSafety', 'Lifestyle & Safety')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
              <span className="text-slate-500 text-xs">{t('health.activityLevel', 'Activity Level')}</span>
              <span className="font-semibold text-slate-800 text-xs">
                {healthTwin?.lifestyle?.activityLevel && healthTwin.lifestyle.activityLevel !== 'Nil'
                  ? healthTwin.lifestyle.activityLevel
                  : 'Nil'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
              <span className="text-slate-500 text-xs">{t('health.dailySleep', 'Daily Sleep')}</span>
              <span className="font-semibold text-slate-800 text-xs">
                {healthTwin?.lifestyle?.sleepHoursPerDay && healthTwin.lifestyle.sleepHoursPerDay > 0
                  ? `${healthTwin.lifestyle.sleepHoursPerDay} ${t('health.hoursPerDay', 'Hours / Day')}`
                  : 'Nil'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
              <span className="text-slate-500 text-xs">{t('health.dietPreference', 'Diet Preference')}</span>
              <span className="font-semibold text-slate-800 text-xs">
                {healthTwin?.lifestyle?.dietType && healthTwin.lifestyle.dietType !== 'Nil'
                  ? healthTwin.lifestyle.dietType
                  : 'Nil'}
              </span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
              <span className="text-slate-500 text-xs">{t('health.waterIntake', 'Water Intake')}</span>
              <span className="font-semibold text-slate-800 text-xs">
                {healthTwin?.lifestyle?.waterIntakeLiters && healthTwin.lifestyle.waterIntakeLiters > 0
                  ? `${healthTwin.lifestyle.waterIntakeLiters} L / Day`
                  : 'Nil'}
              </span>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                {t('health.emergencyContact', 'Emergency Contact')}
              </span>
              <div className="p-2.5 bg-rose-50/60 rounded-xl border border-rose-100 text-xs space-y-0.5">
                {healthTwin?.emergencyContact?.name && healthTwin.emergencyContact.name !== 'Nil' ? (
                  <>
                    <p className="font-bold text-slate-900">{healthTwin.emergencyContact.name} ({healthTwin.emergencyContact.relationship})</p>
                    <p className="text-slate-600 font-mono">{healthTwin.emergencyContact.phone}</p>
                  </>
                ) : (
                  <p className="text-slate-500 font-semibold">Nil</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Longitudinal Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Longitudinal Vitals Timeline</CardTitle>
          <CardDescription>
            Historical record of blood pressure, fasting glucose, BMI, and heart rate measurements.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <HealthTrendChart data={vitalsHistory} />
        </CardContent>
      </Card>

      {/* 4. Measurement Log Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Recorded Measurement History</CardTitle>
            <CardDescription>All user-logged and report-extracted vital entries</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsLogVitalsOpen(true)} leftIcon={<Plus className="w-3.5 h-3.5" />}>
            Add Entry
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] text-slate-400 uppercase bg-slate-50/80 border-b border-slate-100">
                <tr>
                  <th className="px-3 py-2.5">Date</th>
                  <th className="px-3 py-2.5">Blood Pressure</th>
                  <th className="px-3 py-2.5">Fasting Glucose</th>
                  <th className="px-3 py-2.5">Weight / BMI</th>
                  <th className="px-3 py-2.5">Heart Rate / SpO2</th>
                  <th className="px-3 py-2.5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vitalsHistory.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-slate-400">
                      Nil - No vital measurements recorded yet.
                    </td>
                  </tr>
                ) : (
                  vitalsHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-3 py-2.5 font-semibold text-slate-800">{item.date}</td>
                      <td className="px-3 py-2.5 font-mono text-teal-800">{item.systolic} / {item.diastolic} mmHg</td>
                      <td className="px-3 py-2.5 font-mono text-emerald-800">{item.glucose} mg/dL</td>
                      <td className="px-3 py-2.5">{item.weight} kg ({item.bmi})</td>
                      <td className="px-3 py-2.5">{item.heartRate} bpm ({item.spo2}%)</td>
                      <td className="px-3 py-2.5 text-slate-500">{item.notes || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Confirmed Diagnostic Lab Results */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-teal-600" />
              Verified Diagnostic Lab Results
            </CardTitle>
            <CardDescription>Structured metrics extracted from clinical reports and verified by user</CardDescription>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
            {confirmedLabs.length} Confirmed Parameters
          </span>
        </CardHeader>
        <CardContent>
          {confirmedLabs.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              Nil - No confirmed diagnostic lab parameters yet. Upload a diagnostic report to extract and verify metrics.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="text-[11px] text-slate-400 uppercase bg-slate-50/80 border-b border-slate-100">
                  <tr>
                    <th className="px-3 py-2.5">Date</th>
                    <th className="px-3 py-2.5">Test Parameter</th>
                    <th className="px-3 py-2.5">Category</th>
                    <th className="px-3 py-2.5">Value & Unit</th>
                    <th className="px-3 py-2.5">Reference Range</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5">User Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {confirmedLabs.map((lab) => (
                    <tr key={lab.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-3 py-2.5 font-semibold text-slate-800">{lab.testDate}</td>
                      <td className="px-3 py-2.5 font-bold text-slate-900">{lab.testName}</td>
                      <td className="px-3 py-2.5 text-slate-500">{lab.category}</td>
                      <td className="px-3 py-2.5 font-mono text-teal-800 font-semibold">{lab.value} {lab.unit}</td>
                      <td className="px-3 py-2.5 text-slate-500">{lab.referenceRange || 'Standard reference'}</td>
                      <td className="px-3 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          lab.status === 'normal'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {lab.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-emerald-700 font-medium">✓ User Verified</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Health Twin Timeline & Follow-Up Reminders */}
      <HealthTimelineView />

      {/* Modal: Edit Health Twin Profile */}
      <Modal
        isOpen={isEditingProfile}
        onClose={() => setIsEditingProfile(false)}
        title="Edit Digital Health Twin Profile"
        description="Update your baseline biometric parameters and health history."
        maxWidth="2xl"
      >
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                required
              />
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                  Blood Group
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value as any)}
                  className="w-full bg-white rounded-xl border border-slate-300 py-2.5 px-3 text-sm text-slate-900 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                >
                  {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Height (cm)"
              type="number"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
              placeholder="165"
              required
            />
            <Input
              label="Weight (kg)"
              type="number"
              step="0.1"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
              placeholder="58.5"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full bg-white rounded-xl border border-slate-300 py-2.5 px-3 text-sm text-slate-900"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Activity Level
              </label>
              <select
                value={activityLevel}
                onChange={(e) => setActivityLevel(e.target.value as any)}
                className="w-full bg-white rounded-xl border border-slate-300 py-2.5 px-3 text-sm text-slate-900"
              >
                <option value="Sedentary">Sedentary</option>
                <option value="Lightly Active">Lightly Active</option>
                <option value="Moderately Active">Moderately Active</option>
                <option value="Very Active">Very Active</option>
              </select>
            </div>
            <Input
              label="Sleep (Hours/Day)"
              type="number"
              step="0.5"
              value={sleepHours}
              onChange={(e) => setSleepHours(e.target.value)}
            />
          </div>

          <Input
            label="Known Chronic Conditions (comma-separated)"
            value={chronicText}
            onChange={(e) => setChronicText(e.target.value)}
            placeholder="e.g. Mild Anemia, PCOS"
          />

          <Input
            label="Current Medications (comma-separated)"
            value={medsText}
            onChange={(e) => setMedsText(e.target.value)}
            placeholder="e.g. Iron supplement 100mg, Vitamin D3"
          />

          <Input
            label="Known Allergies (comma-separated)"
            value={allergiesText}
            onChange={(e) => setAllergiesText(e.target.value)}
            placeholder="e.g. Penicillin, Dust mites"
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
            <Input
              label="Emergency Contact Name"
              value={emergencyName}
              onChange={(e) => setEmergencyName(e.target.value)}
            />
            <Input
              label="Relationship"
              value={emergencyRelation}
              onChange={(e) => setEmergencyRelation(e.target.value)}
            />
            <Input
              label="Emergency Phone"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditingProfile(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSaving}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Profile Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Vitals Log */}
      <Modal
        isOpen={isLogVitalsOpen}
        onClose={() => setIsLogVitalsOpen(false)}
        title="Log Vital Signs"
        description="Add a new entry to your health history timeline."
      >
        <form onSubmit={handleSaveVitalLog} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Systolic BP (mmHg)"
              type="number"
              value={logSystolic}
              onChange={(e) => setLogSystolic(e.target.value)}
              placeholder="118"
              required
            />
            <Input
              label="Diastolic BP (mmHg)"
              type="number"
              value={logDiastolic}
              onChange={(e) => setLogDiastolic(e.target.value)}
              placeholder="78"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Fasting Blood Glucose (mg/dL)"
              type="number"
              value={logGlucose}
              onChange={(e) => setLogGlucose(e.target.value)}
              placeholder="92"
            />
            <Input
              label="Heart Rate (BPM)"
              type="number"
              value={logHeartRate}
              onChange={(e) => setLogHeartRate(e.target.value)}
              placeholder="72"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Weight (kg)"
              type="number"
              step="0.1"
              value={logWeight}
              onChange={(e) => setLogWeight(e.target.value)}
              placeholder="58.5"
            />
            <Input
              label="Oxygen Saturation SpO2 (%)"
              type="number"
              value={logSpo2}
              onChange={(e) => setLogSpo2(e.target.value)}
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
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSavingVital}
            >
              Add Vital Entry
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
