import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
  HeartHandshake,
  BotMessageSquare,
  Users2,
  Stethoscope,
  Sparkles,
  CheckCircle2,
  Lock,
  ChevronRight,
  Database,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card, CardContent } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginAsDemo, isAuthenticated } = useAuth();

  const handleDemoLaunch = (targetGender?: 'Female' | 'Male') => {
    loginAsDemo(targetGender);
    navigate('/dashboard');
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-teal-50/60 via-mint-50/30 to-white pt-16 pb-20 lg:pt-24 lg:pb-32">
        {/* Subtle background glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-teal-200/30 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-100/80 text-teal-800 border border-teal-200 text-xs font-semibold shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Next-Gen AI Healthcare OS & Digital Health Twin</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-navy-950 tracking-tight leading-[1.15]">
              Your Health. <br />
              <span className="text-gradient">Your Twin.</span> Your Future.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Empowering proactive personalized healthcare with an intelligent Digital Health Twin, automated medical report understanding, dedicated women's hormonal health tracking, and family care management.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              {isAuthenticated ? (
                <Link to="/dashboard">
                  <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                    Open Your Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/register">
                    <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                      Create Free Account
                    </Button>
                  </Link>
                  <button
                    onClick={() => handleDemoLaunch('Female')}
                    className="inline-flex items-center gap-2 px-6 py-3.5 text-base font-semibold rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 shadow-sm transition active:scale-[0.98]"
                  >
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    <span>Explore Demo Sandbox</span>
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center justify-center gap-6 pt-4 text-xs font-medium text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600" /> No Credit Card Required
              </span>
              <span className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-teal-600" /> End-to-End Encrypted
              </span>
              <span className="flex items-center gap-1.5 hidden sm:flex">
                <ShieldCheck className="w-4 h-4 text-teal-600" /> ABDM / HIPAA Ready
              </span>
            </div>
          </div>

          {/* Prominent Dashboard Mockup / Preview */}
          <div className="mt-14 sm:mt-18 relative max-w-5xl mx-auto">
            <div className="rounded-2xl lg:rounded-3xl border border-slate-200/80 bg-white p-3 sm:p-5 shadow-elevated">
              <div className="rounded-xl lg:rounded-2xl bg-slate-900 overflow-hidden border border-slate-800">
                {/* Window Header */}
                <div className="bg-slate-950 px-4 py-3 flex items-center justify-between border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    <span className="text-xs font-mono text-slate-400 ml-2">she-twin.ai/dashboard</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] px-2 py-0.5 rounded bg-teal-900/60 text-teal-300 border border-teal-700/50">
                      Twin Sync: Optimal
                    </span>
                  </div>
                </div>

                {/* Dashboard Inner UI Preview */}
                <div className="p-4 sm:p-6 bg-slate-900 text-white grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Left Column: Health Twin Card */}
                  <div className="bg-slate-800/90 rounded-xl p-4 border border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">Health Twin Profile</span>
                      <span className="text-xs bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800">Normal BMI (21.5)</span>
                    </div>
                    <div className="flex items-center gap-3 pt-1">
                      <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center font-bold text-lg">AS</div>
                      <div>
                        <h4 className="font-bold text-sm text-white">Ananya Sharma</h4>
                        <p className="text-xs text-slate-400">26 yrs • Female • B+ Group</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700/60 text-xs">
                      <div className="bg-slate-900/80 p-2 rounded-lg">
                        <span className="text-slate-400 block text-[10px]">Blood Pressure</span>
                        <span className="font-bold text-teal-300">118 / 78 mmHg</span>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded-lg">
                        <span className="text-slate-400 block text-[10px]">Fasting Sugar</span>
                        <span className="font-bold text-teal-300">92 mg/dL</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle Column: Lab Insights */}
                  <div className="bg-slate-800/90 rounded-xl p-4 border border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">Latest Report Insights</span>
                      <span className="text-xs text-slate-400">CBC & Iron</span>
                    </div>
                    <div className="space-y-2 pt-1 text-xs">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80">
                        <span className="text-slate-300">Hemoglobin</span>
                        <span className="font-semibold text-teal-300">11.8 g/dL (Near Normal)</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80">
                        <span className="text-slate-300">Serum Ferritin</span>
                        <span className="font-semibold text-emerald-400">22 ng/mL (Optimal)</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80">
                        <span className="text-slate-300">TSH Level</span>
                        <span className="font-semibold text-emerald-400">2.1 uIU/mL (Normal)</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Women's Health & Cycle */}
                  <div className="bg-slate-800/90 rounded-xl p-4 border border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-teal-400 uppercase tracking-wider">Hormonal & Cycle Status</span>
                      <span className="text-xs bg-rose-950 text-rose-300 px-2 py-0.5 rounded border border-rose-800">Luteal Phase</span>
                    </div>
                    <div className="pt-1">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-400">Cycle Day 21 of 29</span>
                        <span className="text-rose-300 font-semibold">Next Period in ~8 days</span>
                      </div>
                      <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-teal-500 to-rose-500 h-full w-[72%]" />
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-900/80 p-2 rounded-lg">
                      💡 Energy dip expected. Prioritize magnesium-rich snacks and gentle stretching.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CORE FEATURES GRID */}
      <section id="features" className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <Badge variant="teal">Intelligent Capabilities</Badge>
            <h2 className="text-3xl font-extrabold text-navy-950 tracking-tight sm:text-4xl">
              Engineered for Complete Health Clarity
            </h2>
            <p className="text-slate-600 text-base">
              A cohesive healthcare platform that turns fragmented medical records into structured, actionable wellness insights.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <Card className="hover:shadow-card hover:-translate-y-1 transition duration-200">
              <CardContent className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-navy-950">Digital Health Twin</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  A dynamic, personalized health profile that aggregates user measurements, chronic conditions, lifestyle markers, and longitudinal vital trends.
                </p>
                <Link to="/health-twin" className="inline-flex items-center text-xs font-semibold text-teal-700 hover:text-teal-900">
                  Explore Health Twin <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="hover:shadow-card hover:-translate-y-1 transition duration-200">
              <CardContent className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-navy-950">Medical Report Analyzer</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Upload PDF or image lab reports (CBC, Lipid, Thyroid, HbA1c) to automatically extract test parameters, compare values against reference ranges, and view plain-language summaries.
                </p>
                <Link to="/reports" className="inline-flex items-center text-xs font-semibold text-teal-700 hover:text-teal-900">
                  Try Report Analyzer <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="hover:shadow-card hover:-translate-y-1 transition duration-200">
              <CardContent className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                  <HeartHandshake className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-navy-950">Women's Health & Cycle Hub</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Private menstrual cycle logging, symptom tracking, PCOS wellness suggestions, and mood logs designed specifically with privacy-first encryption.
                </p>
                <Link to="/womens-health" className="inline-flex items-center text-xs font-semibold text-rose-700 hover:text-rose-900">
                  View Cycle Hub <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="hover:shadow-card hover:-translate-y-1 transition duration-200">
              <CardContent className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                  <BotMessageSquare className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-navy-950">AI Health Assistant</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Interactive health knowledge assistant to ask questions about lab terminology, balanced diets, iron deficiency, and general wellness practices.
                </p>
                <Link to="/assistant" className="inline-flex items-center text-xs font-semibold text-indigo-700 hover:text-indigo-900">
                  Chat with Assistant <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card className="hover:shadow-card hover:-translate-y-1 transition duration-200">
              <CardContent className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                  <Users2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-navy-950">Family Health Profiles</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Maintain distinct, organized profiles for parents, children, or elderly family members with isolated medical histories and quick emergency information.
                </p>
                <Link to="/family-health" className="inline-flex items-center text-xs font-semibold text-teal-700 hover:text-teal-900">
                  Manage Family Care <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card className="hover:shadow-card hover:-translate-y-1 transition duration-200">
              <CardContent className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-navy-950">Verified Doctor Directory</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Search gynecologists, physicians, endocrinologists, and nutritionists by city and specialty, check clinical hours, and request consultations.
                </p>
                <Link to="/doctors" className="inline-flex items-center text-xs font-semibold text-teal-700 hover:text-teal-900">
                  Find Specialists <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 3. HOW IT WORKS WORKFLOW */}
      <section id="how-it-works" className="py-20 bg-slate-50 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <Badge variant="navy">Streamlined Workflow</Badge>
            <h2 className="text-3xl font-extrabold text-navy-950 tracking-tight sm:text-4xl">
              How SHE Twin AI Works
            </h2>
            <p className="text-slate-600 text-base">
              Four simple steps to transform raw medical tests into structured, personalized health intelligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-soft text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center mx-auto text-sm">
                1
              </div>
              <h4 className="font-bold text-slate-900 text-base">Create Health Twin</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Enter baseline vitals, age, blood group, allergies, and lifestyle habits into your secure digital profile.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-soft text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center mx-auto text-sm">
                2
              </div>
              <h4 className="font-bold text-slate-900 text-base">Upload Reports</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Drop your PDF or photo lab tests. The NLP pipeline extracts diagnostic parameters into structured tables.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-soft text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center mx-auto text-sm">
                3
              </div>
              <h4 className="font-bold text-slate-900 text-base">Track Trends</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Interactive charts illustrate your blood pressure, glucose, and hormonal patterns across weeks and months.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-soft text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center mx-auto text-sm">
                4
              </div>
              <h4 className="font-bold text-slate-900 text-base">Take Action</h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                Ask the AI assistant for dietary guidance, consult verified doctors, and share organized reports with specialists.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. MEDICAL REPORT ANALYZER SPOTLIGHT */}
      <section id="report-analyzer" className="py-20 bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Badge variant="teal">Report Intelligence</Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
                No More Confusing Lab Reports
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Blood tests and clinical reports shouldn't read like a foreign language. SHE Twin AI's report analyzer parses parameters like Hemoglobin, TSH, HbA1c, and Lipid profiles, comparing each reading with established clinical reference ranges.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900">Automated Reference Range Matching</h5>
                    <p className="text-xs text-slate-500">Flags low, normal, and elevated values with clear color indicators.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900">Historical Comparison</h5>
                    <p className="text-xs text-slate-500">Compare multiple reports side-by-side to observe improvement over time.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-1.5 rounded-lg bg-teal-50 text-teal-700 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900">Digital Health Twin Integration</h5>
                    <p className="text-xs text-slate-500">Automatically feeds verified diagnostic values into your active Twin profile.</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link to="/reports">
                  <Button variant="primary" size="md" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Upload a Test Report
                  </Button>
                </Link>
              </div>
            </div>

            {/* Visual Sample Card */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 shadow-card space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-teal-700" />
                  <span className="font-bold text-sm text-slate-900">Parsed Test Sample: Complete Blood Count</span>
                </div>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                  Analyzed
                </span>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-800">Hemoglobin (Hb)</p>
                    <p className="text-slate-400">Ref: 12.0 - 15.5 g/dL</p>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-amber-600 text-sm">11.8 g/dL</span>
                    <span className="block text-[10px] text-amber-700 font-semibold">Slightly Low</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-800">Total WBC Count</p>
                    <p className="text-slate-400">Ref: 4,000 - 11,000 /cu.mm</p>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-emerald-600 text-sm">6,800</span>
                    <span className="block text-[10px] text-emerald-700 font-semibold">Normal</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-800">Serum Ferritin</p>
                    <p className="text-slate-400">Ref: 20 - 200 ng/mL</p>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-emerald-600 text-sm">22 ng/mL</span>
                    <span className="block text-[10px] text-emerald-700 font-semibold">Normal</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-teal-50/80 border border-teal-100 text-xs text-teal-900 leading-relaxed">
                ✨ <strong>AI Clinical Summary:</strong> Hemoglobin has improved +1.4 g/dL over 90 days. Adequate iron absorption observed with continued dietary compliance.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PRIVACY & SECURITY SECTION */}
      <section id="security" className="py-20 bg-navy-950 text-white border-t border-navy-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <Badge variant="teal">Security Architecture</Badge>
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
              Your Health Data Is Your Sacred Property
            </h2>
            <p className="text-slate-400 text-base">
              Built from day one with strict medical data isolation, zero-knowledge privacy layers, and transparent patient consent.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-navy-900/80 p-6 rounded-2xl border border-navy-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-900/60 text-teal-300 flex items-center justify-center border border-teal-700/50">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-white">End-to-End Encryption</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                All health measurements, cycle details, and uploaded medical files are encrypted in transit via TLS 1.3 and at rest with AES-256 standards.
              </p>
            </div>

            <div className="bg-navy-900/80 p-6 rounded-2xl border border-navy-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-900/60 text-teal-300 flex items-center justify-center border border-teal-700/50">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-white">Zero Third-Party Ad Selling</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                We never monetize or sell personal diagnostic records or reproductive tracking to third-party ad networks or brokers.
              </p>
            </div>

            <div className="bg-navy-900/80 p-6 rounded-2xl border border-navy-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-900/60 text-teal-300 flex items-center justify-center border border-teal-700/50">
                <Database className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-white">Full Data Portability & Deletion</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Export your entire Health Twin history in JSON/CSV anytime, or permanently wipe your account and all records with one click.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CALL TO ACTION */}
      <section className="py-20 bg-gradient-to-r from-teal-700 via-teal-800 to-navy-900 text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to Take Control of Your Health Journey?
          </h2>
          <p className="text-teal-100 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Experience your personalized Digital Health Twin, analyze your tests with AI, and empower your family's care today.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link to="/register">
              <Button variant="secondary" size="lg" className="bg-white text-navy-950 hover:bg-slate-100 border-white shadow-lg">
                Create Free Account
              </Button>
            </Link>
            <button
              onClick={() => handleDemoLaunch('Female')}
              className="inline-flex items-center gap-2 px-6 py-3.5 text-base font-semibold rounded-xl bg-teal-900/80 hover:bg-teal-900 text-white border border-teal-600 shadow-sm transition"
            >
              <Sparkles className="w-4 h-4 text-teal-300" />
              <span>Launch Demo Mode</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
