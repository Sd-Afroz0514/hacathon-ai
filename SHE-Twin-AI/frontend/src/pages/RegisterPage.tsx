import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Eye, EyeOff, Lock, Mail, User as UserIcon, Sparkles, ShieldCheck } from 'lucide-react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [gender, setGender] = useState<'Female' | 'Male'>('Female');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, loginAsDemo } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!name.trim()) errs.name = 'Full name is required';
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
    if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }
    if (!agreeTerms) {
      errs.terms = 'Please accept terms & privacy policy to continue';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    const res = await register(name, email, password, gender);
    setIsSubmitting(false);

    if (res.success) {
      success('Welcome!', `Welcome, ${name}! Your new account and Digital Health Twin are created.`);
      navigate('/dashboard');
    } else {
      setErrors({ general: res.error || 'Registration failed. Please try again.' });
    }
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
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Create your account</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Set up your personal Digital Health Twin today
          </p>
        </div>

        {/* Demo Option */}
        <div className="p-3 bg-teal-50/80 rounded-2xl border border-teal-200/90 text-center flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs text-teal-900 text-left">
            <Sparkles className="w-4 h-4 text-teal-600 flex-shrink-0" />
            <span className="font-semibold">Skip setup with Demo Mode:</span>
          </div>
          <button
            type="button"
            onClick={() => {
              loginAsDemo();
              success('Demo Loaded', 'Exploring as Ananya Sharma.');
              navigate('/dashboard');
            }}
            className="py-1.5 px-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition"
          >
            Launch Demo
          </button>
        </div>

        {/* Main Form */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-soft space-y-5">
          {errors.general && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name"
              type="text"
              placeholder="e.g. Dr. / Ms. Jane Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              leftIcon={<UserIcon className="w-4 h-4" />}
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="patient@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Biological Gender
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
              label="Create Password"
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
                  className="hover:text-slate-700"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />

            <Input
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <div className="pt-1">
              <label className="flex items-start gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-1 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                />
                <span className="text-xs text-slate-600 leading-tight">
                  I agree to the <span className="font-semibold text-teal-700">Terms of Service</span> and{' '}
                  <span className="font-semibold text-teal-700">Health Privacy Notice</span>.
                </span>
              </label>
              {errors.terms && <p className="text-xs text-rose-600 font-medium mt-1">{errors.terms}</p>}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              isLoading={isSubmitting}
            >
              Create Account
            </Button>
          </form>

          <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-teal-700 hover:text-teal-900">
              Log in
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-slate-400 text-xs text-center">
          <ShieldCheck className="w-4 h-4 text-teal-600" />
          <span>Patient data privacy and encryption guaranteed</span>
        </div>
      </div>
    </div>
  );
};
