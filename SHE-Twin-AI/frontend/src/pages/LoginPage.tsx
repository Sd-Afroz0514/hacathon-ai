import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Eye, EyeOff, Lock, Mail, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gender, setGender] = useState<'Female' | 'Male'>('Female');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, loginAsDemo } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  const validate = () => {
    const errs: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = 'Please enter a valid email address';
    }
    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    const res = await login(email, password, gender);
    setIsSubmitting(false);

    if (res.success) {
      success('Welcome Back', 'Logged into your health dashboard. All metrics refreshed.');
      navigate('/dashboard');
    } else {
      setErrors({ general: res.error || 'Invalid credentials or service unavailable.' });
    }
  };

  const handleDemoLogin = (targetGender: 'Female' | 'Male') => {
    loginAsDemo(targetGender);
    if (targetGender === 'Male') {
      success('Demo Session Started', 'Logged in as Rahul Sharma (Male Profile - Male Health active).');
    } else {
      success('Demo Session Started', 'Logged in as Ananya Sharma (Female Profile).');
    }
    navigate('/dashboard');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-11 h-11 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-700/20 group-hover:scale-105 transition">
              <Activity className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-navy-950">SHE Twin AI</span>
          </Link>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Log in to your account</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Access your personalized Digital Health Twin and reports
          </p>
        </div>

        {/* Demo Fast-Login Card */}
        <div className="p-4 bg-teal-50/80 rounded-2xl border border-teal-200/90 text-center space-y-2.5">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-teal-900">
            <Sparkles className="w-4 h-4 text-teal-600" />
            <span>Instant Evaluation / Demo Access</span>
          </div>
          <p className="text-xs text-teal-700 leading-snug">
            Choose female or male profile to evaluate gender-adaptive health tracking:
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleDemoLogin('Female')}
              className="py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition shadow-sm flex items-center justify-center gap-1"
            >
              <span>Female (Ananya)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('Male')}
              className="py-2 px-3 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-semibold text-xs transition shadow-sm flex items-center justify-center gap-1"
            >
              <span>Male (Rahul)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Main Login Form */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-soft space-y-5">
          {errors.general && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Select Profile Gender
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGender('Female')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                    gender === 'Female'
                      ? 'bg-teal-50 border-teal-600 text-teal-800 ring-2 ring-teal-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  ♀ Female
                </button>
                <button
                  type="button"
                  onClick={() => setGender('Male')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                    gender === 'Male'
                      ? 'bg-teal-50 border-teal-600 text-teal-800 ring-2 ring-teal-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  ♂ Male
                </button>
              </div>
            </div>

            <Input
              label="Email Address"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              leftIcon={<Mail className="w-4 h-4" />}
              autoComplete="email"
            />

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Password
                </label>
              </div>
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="hover:text-slate-700 focus:outline-none"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isSubmitting}
            >
              Sign In
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-teal-700 hover:text-teal-900">
              Register now
            </Link>
          </div>
        </div>

        {/* Privacy footnote */}
        <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs text-center">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Encrypted patient authentication session</span>
        </div>
      </div>
    </div>
  );
};
