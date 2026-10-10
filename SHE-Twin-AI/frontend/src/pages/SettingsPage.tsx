import React, { useState } from 'react';
import {
  Shield,
  Bell,
  Lock,
  Download,
  RotateCcw,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useHealth } from '../context/HealthContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const { healthTwin, reports, vitalsHistory, cycleLogs, familyMembers, resetToDemoDefaults } = useHealth();
  const { t } = useLanguage();
  const { success, info } = useToast();

  // Notification Toggles
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [cycleReminders, setCycleReminders] = useState(true);
  const [medReminders, setMedReminders] = useState(true);
  const [researchDataShare, setResearchDataShare] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(false);

  // Password Change
  const [currPass, setCurrPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [passError, setPassError] = useState('');
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);

  // Modals
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    if (!currPass) {
      setPassError('Current password is required');
      return;
    }
    if (newPass.length < 6) {
      setPassError('New password must be at least 6 characters');
      return;
    }
    if (newPass !== confirmPass) {
      setPassError('New passwords do not match');
      return;
    }

    setIsUpdatingPass(true);
    setTimeout(() => {
      setIsUpdatingPass(false);
      setCurrPass('');
      setNewPass('');
      setConfirmPass('');
      success('Password Updated', 'Your security credentials have been updated.');
    }, 600);
  };

  const handleExportData = () => {
    const fullExport = {
      exportDate: new Date().toISOString(),
      platform: 'SHE Twin AI',
      userProfile: user,
      healthTwinProfile: healthTwin,
      vitalsHistory,
      reportsSummary: reports,
      cycleLogs,
      familyProfiles: familyMembers,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullExport, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `SHE_Twin_Health_Data_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    success('Data Exported', 'Full Health Twin and diagnostic JSON archive downloaded.');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 1. Page Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-navy-950 tracking-tight">
          {t('page.settings.title', 'Settings & Privacy Controls')}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          {t('page.settings.subtitle', 'Manage your account security, notification alerts, consent policies, and data portability.')}
        </p>
      </div>

      {/* 2. Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-4 h-4 text-teal-600" /> Notifications & Health Alerts
          </CardTitle>
          <CardDescription>Configure how and when you receive reminders</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm divide-y divide-slate-100">
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="font-semibold text-slate-800">Email Diagnostic Summaries</p>
              <p className="text-xs text-slate-500">Receive analysis reports when new medical documents are uploaded.</p>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => {
                setEmailAlerts(e.target.checked);
                info('Preference Saved', 'Email notification preference updated.');
              }}
              className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <div>
              <p className="font-semibold text-slate-800">Menstrual Cycle Reminders</p>
              <p className="text-xs text-slate-500">Get phase guidance 2-3 days before predicted cycle transitions.</p>
            </div>
            <input
              type="checkbox"
              checked={cycleReminders}
              onChange={(e) => {
                setCycleReminders(e.target.checked);
                info('Preference Saved', 'Cycle reminder preference updated.');
              }}
              className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <div>
              <p className="font-semibold text-slate-800">Medication & Vitals Reminders</p>
              <p className="text-xs text-slate-500">Scheduled reminders for daily iron/vitamin supplements.</p>
            </div>
            <input
              type="checkbox"
              checked={medReminders}
              onChange={(e) => {
                setMedReminders(e.target.checked);
                info('Preference Saved', 'Medication reminder preference updated.');
              }}
              className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* 3. Security & Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="w-4 h-4 text-teal-600" /> Account Security & Password
          </CardTitle>
          <CardDescription>Update your authentication credentials</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-md">
            {passError && (
              <p className="text-xs font-semibold text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">
                {passError}
              </p>
            )}

            <Input
              label="Current Password"
              type={showPass ? 'text' : 'password'}
              value={currPass}
              onChange={(e) => setCurrPass(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Input
              label="New Password"
              type={showPass ? 'text' : 'password'}
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Input
              label="Confirm New Password"
              type={showPass ? 'text' : 'password'}
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              placeholder="••••••••"
              required
            />

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
              >
                {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPass ? 'Hide' : 'Show'} Password</span>
              </button>

              <Button type="submit" variant="primary" size="sm" isLoading={isUpdatingPass}>
                Update Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 4. Privacy & Consent Policies */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4 text-teal-600" /> Privacy & Consent Controls
          </CardTitle>
          <CardDescription>Manage how your personal health data is isolated</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm divide-y divide-slate-100">
          <div className="flex items-center justify-between pt-2">
            <div>
              <p className="font-semibold text-slate-800">De-identified Research Contribution</p>
              <p className="text-xs text-slate-500">Contribute anonymized lab test aggregates for women's health medical research.</p>
            </div>
            <input
              type="checkbox"
              checked={researchDataShare}
              onChange={(e) => {
                setResearchDataShare(e.target.checked);
                info('Consent Updated', `Research data sharing ${e.target.checked ? 'enabled' : 'disabled'}.`);
              }}
              className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center justify-between pt-4">
            <div>
              <p className="font-semibold text-slate-800">Two-Factor Authentication (2FA)</p>
              <p className="text-xs text-slate-500">Require an authenticator code when signing into your health portal.</p>
            </div>
            <input
              type="checkbox"
              checked={twoFactorAuth}
              onChange={(e) => {
                setTwoFactorAuth(e.target.checked);
                info('2FA Updated', `Two-factor authentication ${e.target.checked ? 'activated' : 'deactivated'}.`);
              }}
              className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* 5. Data Portability & Danger Zone */}
      <Card className="border-rose-100">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-rose-700">
            <Download className="w-4 h-4" /> Data Portability & Sandbox Actions
          </CardTitle>
          <CardDescription>Export records or reset test data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <p className="font-bold text-slate-800">Export Complete Health Records (JSON)</p>
              <p className="text-xs text-slate-500">Download your full Digital Health Twin, vitals history, and extracted reports.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportData}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Export JSON Archive
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl bg-amber-50/70 border border-amber-200">
            <div>
              <p className="font-bold text-amber-900">Restore Original Demo Data</p>
              <p className="text-xs text-amber-700">Revert any changes and restore the default sample health profile and reports.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsResetConfirmOpen(true)}
              leftIcon={<RotateCcw className="w-4 h-4" />}
              className="border-amber-300 text-amber-900 hover:bg-amber-100"
            >
              Reset Demo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={() => {
          resetToDemoDefaults();
          setIsResetConfirmOpen(false);
        }}
        title="Reset Demo Data"
        message="Are you sure you want to reset all records back to original demo values? Any newly added measurements or reports will be cleared."
        confirmText="Reset to Defaults"
        variant="warning"
      />
    </div>
  );
};
