import React, { useState } from 'react';
import {
  Plus,
  Lock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useHealth } from '../context/HealthContext';
import { useLanguage } from '../context/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';

export const WomensHealthPage: React.FC = () => {
  const { user } = useAuth();
  const { healthTwin, cycleLogs, addCycleLog } = useHealth();
  const { t } = useLanguage();

  const isMale = user?.gender === 'Male' || healthTwin?.gender === 'Male';

  const [isLogCycleOpen, setIsLogCycleOpen] = useState(false);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [cycleLength, setCycleLength] = useState('28');
  const [periodLength, setPeriodLength] = useState('5');
  const [flow, setFlow] = useState<'Light' | 'Medium' | 'Heavy' | 'Spotting'>('Medium');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>(
    isMale ? ['Optimal Vitality'] : ['Mild Cramps']
  );
  const [mood, setMood] = useState<'Happy' | 'Calm' | 'Energetic' | 'Tired' | 'Anxious' | 'Irritable' | 'Cramps/Pain'>('Calm');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const femaleSymptoms = [
    'Mild Cramps',
    'Severe Cramps',
    'Bloating',
    'Headache',
    'Acne / Breakouts',
    'Back Pain',
    'Fatigue',
    'Breast Tenderness',
    'Insomnia',
    'Food Cravings',
  ];

  const maleSymptoms = [
    'Optimal Vitality',
    'High Stamina',
    'Restful Recovery',
    'Mild Fatigue',
    'Muscle Soreness',
    'Lower Back Tension',
    'Stress Tension',
    'Disrupted Sleep',
    'Joint Stiffness',
    'Optimal Hydration',
  ];

  const availableSymptoms = isMale ? maleSymptoms : femaleSymptoms;

  const toggleSymptom = (sym: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(sym) ? prev.filter((s) => s !== sym) : [...prev, sym]
    );
  };

  const handleAddCycleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    await addCycleLog({
      startDate,
      cycleLengthDays: parseInt(cycleLength) || 28,
      periodLengthDays: parseInt(periodLength) || 5,
      flowIntensity: flow,
      symptoms: selectedSymptoms,
      mood,
      notes,
    });

    setIsSubmitting(false);
    setIsLogCycleOpen(false);
    setNotes('');
  };

  const latestCycle = cycleLogs[0];

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-navy-950 tracking-tight">
              {isMale ? 'Male Health & Wellness Hub' : t('page.womensHealth.title', "Women's Health & Cycle Hub")}
            </h2>
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
              isMale
                ? 'bg-teal-50 text-teal-800 border-teal-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              <Lock className="w-3 h-3" /> {t('brand.safetyTitle', 'Private & Encrypted')}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            {isMale
              ? 'Log vitality checks, monitor hormonal wellness, prostate health, and record physical stamina safely.'
              : t('page.womensHealth.subtitle', 'Log menstrual cycles, track hormonal changes, and record personal wellness notes safely.')}
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsLogCycleOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          className={isMale ? 'bg-teal-600 hover:bg-teal-700 border-teal-600' : 'bg-rose-600 hover:bg-rose-700 border-rose-600'}
        >
          {isMale ? 'Log Male Health Check' : t('womensHealth.logCycle', 'Log Cycle Entry')}
        </Button>
      </div>

      {/* 2. Phase / Status Overview Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Current Stage */}
        <div className="lg:col-span-2">
          <Card className={`border-t-4 ${isMale ? 'border-t-teal-600' : 'border-t-rose-500'}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg">
                  {isMale ? 'Current Male Health Status' : 'Current Cycle Status'}
                </CardTitle>
                <CardDescription>
                  {isMale
                    ? 'Based on vitality index and physical recovery tracking'
                    : `Based on your logged ${latestCycle?.cycleLengthDays || 29}-day rhythm`}
                </CardDescription>
              </div>
              <Badge variant={isMale ? 'teal' : 'danger'} size="md">
                {isMale ? 'Optimal Vitality' : 'Luteal Phase'}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-6">
              {isMale ? (
                <>
                  {/* Male Readiness Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">Physical Readiness: 85%</span>
                      <span className="text-teal-700 font-semibold">Prostate & Stamina Check: Optimal</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
                      <div className="bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-700 h-full rounded-full w-[85%]" />
                    </div>
                    <div className="grid grid-cols-4 text-[10px] text-slate-500 font-medium pt-1 text-center">
                      <div>Vitality: Stable</div>
                      <div>Prostate: Healthy</div>
                      <div>Endurance: High</div>
                      <div className="text-teal-700 font-bold">Recovery: Rested</div>
                    </div>
                  </div>

                  {/* Male Guidance */}
                  <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 space-y-2 text-xs text-teal-950">
                    <div className="flex items-center gap-1.5 font-bold text-teal-900">
                      <Sparkles className="w-4 h-4 text-teal-600" />
                      <span>Vitality Guidance & Self-Care</span>
                    </div>
                    <p className="leading-relaxed">
                      Maintain cardiovascular and metabolic vitality through balanced nutrition, zinc-rich foods (pumpkin seeds, lentils, whole grains), regular resistance training, and 7-8 hours of sleep to support natural testosterone and hormone regulation.
                    </p>
                  </div>

                  {/* Logged Status in this check */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block uppercase">Stamina Index</span>
                      <span className="text-sm font-bold text-slate-800">{latestCycle?.flowIntensity || 'High'}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block uppercase">Primary Mood</span>
                      <span className="text-sm font-bold text-slate-800">{latestCycle?.mood || 'Calm'}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block uppercase">Check Frequency</span>
                      <span className="text-sm font-bold text-slate-800">Weekly Log</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Cycle Day Bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">Day 21 of {latestCycle?.cycleLengthDays || 29}</span>
                      <span className="text-rose-700 font-semibold">Estimated Next Cycle: ~8 Days</span>
                    </div>
                    <div className="w-full bg-slate-100 h-3.5 rounded-full overflow-hidden p-0.5 border border-slate-200">
                      <div className="bg-gradient-to-r from-teal-500 via-purple-500 to-rose-500 h-full rounded-full w-[72%]" />
                    </div>
                    <div className="grid grid-cols-4 text-[10px] text-slate-400 font-medium pt-1 text-center">
                      <div>Menstrual (1-5)</div>
                      <div>Follicular (6-13)</div>
                      <div>Ovulation (14-16)</div>
                      <div className="text-rose-600 font-bold">Luteal (17-29)</div>
                    </div>
                  </div>

                  {/* Phase Insight */}
                  <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200/80 space-y-2 text-xs text-rose-950">
                    <div className="flex items-center gap-1.5 font-bold text-rose-900">
                      <Sparkles className="w-4 h-4 text-rose-600" />
                      <span>Phase Guidance & Self-Care</span>
                    </div>
                    <p className="leading-relaxed">
                      During the luteal phase, progesterone peaks then gradually decreases. You might notice subtle energy dips or mood shifts. Prioritize complex carbs, magnesium-rich foods (dark leafy greens, seeds), and hydration.
                    </p>
                  </div>

                  {/* Logged Vitals in this cycle */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block uppercase">Recorded Flow</span>
                      <span className="text-sm font-bold text-slate-800">{latestCycle?.flowIntensity || 'Medium'}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block uppercase">Primary Mood</span>
                      <span className="text-sm font-bold text-slate-800">{latestCycle?.mood || 'Calm'}</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 block uppercase">Avg Period Length</span>
                      <span className="text-sm font-bold text-slate-800">{latestCycle?.periodLengthDays || 5} Days</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Privacy Notice */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Lock className="w-4 h-4 text-teal-600" /> Privacy & Safety Notice
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                {isMale
                  ? 'Male health, stamina, and endocrine observations are stored securely in encrypted client-side partitions.'
                  : 'Reproductive health data is stored strictly in client-controlled encrypted partitions.'}
              </p>
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <span className="font-bold text-slate-800">Medical Notice:</span>
                <p className="text-[11px] text-slate-500">
                  {isMale
                    ? 'Wellness metrics and vitality logs are wellness references for educational awareness and lifestyle tracking.'
                    : 'Cycle timelines are calendar calculations and educational references only. They must not be used as guaranteed birth control or clinical fertility diagnoses.'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 3. History Log Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">
              {isMale ? 'Male Health & Vitality Log History' : 'Cycle History Log'}
            </CardTitle>
            <CardDescription>
              {isMale
                ? 'Previous wellness checkups and stamina records'
                : 'Previous menstrual records and symptom logs'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] text-slate-400 uppercase bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-3.5 py-2.5">Date</th>
                  <th className="px-3.5 py-2.5">{isMale ? 'Stamina / Focus' : 'Cycle Length'}</th>
                  <th className="px-3.5 py-2.5">{isMale ? 'Recovery Target' : 'Period Duration'}</th>
                  <th className="px-3.5 py-2.5">{isMale ? 'Vitality Level' : 'Flow'}</th>
                  <th className="px-3.5 py-2.5">Mood</th>
                  <th className="px-3.5 py-2.5">Symptoms / Notes</th>
                  <th className="px-3.5 py-2.5">User Observations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cycleLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3.5 py-6 text-center text-slate-400">
                      {isMale
                        ? 'Nil - No male health check logs recorded yet.'
                        : 'Nil - No menstrual cycle records logged yet.'}
                    </td>
                  </tr>
                ) : (
                  cycleLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition">
                      <td className="px-3.5 py-2.5 font-bold text-slate-800">{log.startDate}</td>
                      <td className="px-3.5 py-2.5 font-mono text-teal-800">
                        {isMale ? `${log.cycleLengthDays} / 30 Target` : `${log.cycleLengthDays} Days`}
                      </td>
                      <td className="px-3.5 py-2.5">
                        {isMale ? `${log.periodLengthDays}h Rest` : `${log.periodLengthDays} Days`}
                      </td>
                      <td className="px-3.5 py-2.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          isMale
                            ? 'bg-teal-50 text-teal-800'
                            : 'bg-rose-50 text-rose-700'
                        }`}>
                          {log.flowIntensity}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5 font-medium">{log.mood}</td>
                      <td className="px-3.5 py-2.5">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {log.symptoms.map((s, idx) => (
                            <span key={idx} className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px]">
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3.5 py-2.5 text-slate-500 max-w-xs truncate">{log.notes || 'Nil'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal: Log Cycle / Male Health Entry */}
      <Modal
        isOpen={isLogCycleOpen}
        onClose={() => setIsLogCycleOpen(false)}
        title={isMale ? 'Log Male Health & Vitality Check' : 'Log Menstrual Cycle & Symptoms'}
        description={isMale
          ? 'Record your physical stamina, recovery notes, and wellness indicators.'
          : 'Record your latest cycle dates and physical observations.'}
      >
        <form onSubmit={handleAddCycleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label={isMale ? 'Check Date' : 'Cycle Start Date'}
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
            <Input
              label={isMale ? 'Vitality Score (1-30)' : 'Cycle Length (Days)'}
              type="number"
              value={cycleLength}
              onChange={(e) => setCycleLength(e.target.value)}
              required
            />
            <Input
              label={isMale ? 'Sleep Recovery (Hours)' : 'Period Duration (Days)'}
              type="number"
              value={periodLength}
              onChange={(e) => setPeriodLength(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                {isMale ? 'Physical Stamina Level' : 'Flow Intensity'}
              </label>
              <select
                value={flow}
                onChange={(e) => setFlow(e.target.value as any)}
                className="w-full bg-white rounded-xl border border-slate-300 py-2.5 px-3 text-sm text-slate-900 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              >
                <option value="Light">{isMale ? 'Moderate' : 'Light'}</option>
                <option value="Medium">{isMale ? 'Normal' : 'Medium'}</option>
                <option value="Heavy">{isMale ? 'High' : 'Heavy'}</option>
                <option value="Spotting">{isMale ? 'Low' : 'Spotting'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Mood / Energy State
              </label>
              <select
                value={mood}
                onChange={(e) => setMood(e.target.value as any)}
                className="w-full bg-white rounded-xl border border-slate-300 py-2.5 px-3 text-sm text-slate-900 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              >
                <option value="Happy">Happy</option>
                <option value="Calm">Calm</option>
                <option value="Energetic">Energetic</option>
                <option value="Tired">Tired</option>
                <option value="Anxious">Anxious</option>
                <option value="Irritable">Irritable</option>
                <option value="Cramps/Pain">{isMale ? 'Sore / Stiff' : 'Cramps / Pain'}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
              Select Observed Symptoms & Status
            </label>
            <div className="flex flex-wrap gap-1.5">
              {availableSymptoms.map((sym) => {
                const isSelected = selectedSymptoms.includes(sym);
                return (
                  <button
                    type="button"
                    key={sym}
                    onClick={() => toggleSymptom(sym)}
                    className={`text-xs px-3 py-1.5 rounded-xl border transition ${
                      isSelected
                        ? isMale
                          ? 'bg-teal-600 text-white border-teal-600 font-semibold shadow-xs'
                          : 'bg-rose-600 text-white border-rose-600 font-semibold shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {sym}
                  </button>
                );
              })}
            </div>
          </div>

          <Input
            label="Personal Notes (Optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={isMale ? 'e.g. 45 min strength workout, felt energetic.' : 'e.g. Took warm tea, rested in the afternoon.'}
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsLogCycleOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              className={isMale ? 'bg-teal-600 hover:bg-teal-700 border-teal-600' : 'bg-rose-600 hover:bg-rose-700 border-rose-600'}
            >
              {isMale ? 'Save Male Health Check' : 'Save Cycle Log'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
