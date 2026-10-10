import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  Sparkles,
  X,
  MapPin,
  LogOut,
  UserCheck,
  Settings,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useHealth } from '../../context/HealthContext';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSelector } from '../LanguageSelector';
import { LocationSelectorModal } from '../LocationSelectorModal';
import { LifeStageSelector } from '../LifeStageSelector';
import { apiService, UserLocationData } from '../../services/api';

interface TopBarProps {
  onOpenMobileMenu: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenMobileMenu }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isDemoMode, toggleDemoMode, switchGender, logout } = useAuth();
  const { healthTwin } = useHealth();
  const { success } = useToast();
  const { t } = useLanguage();

  const isMale = user?.gender === 'Male' || healthTwin?.gender === 'Male';
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocationData | null>(null);
  const [currentLifeStage, setCurrentLifeStage] = useState<string>('My Health');
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiService.getLocation().then((res) => {
      if (res.data) setUserLocation(res.data);
    });
    apiService.getLifeStage().then((res) => {
      if (res.data) setCurrentLifeStage(res.data.currentMode);
    });
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setProfileDropdownOpen(false);
    logout();
    success(t('common.success', 'Signed Out'), t('nav.logout', 'You have been safely logged out of SHE Twin AI.'));
    navigate('/login');
  };

  const getPageTitle = (pathname: string) => {
    switch (pathname) {
      case '/dashboard':
        return {
          title: t('page.dashboard.title', 'Dashboard'),
          subtitle: t('page.dashboard.subtitle', 'Overview of your health metrics and active insights')
        };
      case '/health-twin':
        return {
          title: t('page.healthTwin.title', 'My Digital Health Twin'),
          subtitle: t('page.healthTwin.subtitle', '360° health profile, parameters, and historical vitals')
        };
      case '/reports':
        return {
          title: t('page.reports.title', 'Medical Report Analyzer'),
          subtitle: t('page.reports.subtitle', 'Upload diagnostics for automated structured parameter extraction')
        };
      case '/assistant':
        return {
          title: t('page.assistant.title', 'AI Health Assistant'),
          subtitle: t('page.assistant.subtitle', 'Conversational assistant for medical terminology and wellness queries')
        };
      case '/womens-health':
      case '/male-health':
        if (isMale) {
          return {
            title: 'Male Health & Wellness Tracker',
            subtitle: 'Track vitality, prostate wellness, physical stamina, and metabolic fitness',
          };
        }
        return {
          title: t('page.womensHealth.title', "Women's Health & Cycle Tracker"),
          subtitle: t('page.womensHealth.subtitle', 'Log cycles, monitor symptoms, and review hormonal wellness'),
        };
      case '/family-health':
        return {
          title: t('page.family.title', 'Family Health Profiles'),
          subtitle: t('page.family.subtitle', 'Separate medical summaries and emergency profiles for your family')
        };
      case '/doctors':
        return {
          title: t('page.doctors.title', 'Find Verified Doctors'),
          subtitle: t('page.doctors.subtitle', 'Search specialists, check credentials, and schedule consultations')
        };
      case '/settings':
        return {
          title: t('page.settings.title', 'Settings & Privacy Controls'),
          subtitle: t('page.settings.subtitle', 'Account preferences, security, consent, and data export')
        };
      default:
        return {
          title: t('brand.name', 'SHE Twin AI'),
          subtitle: t('brand.subtitle', 'Healthcare OS')
        };
    }
  };

  const { title, subtitle } = getPageTitle(location.pathname);

  const mockNotifications = [
    { id: 1, title: 'Report Analyzed', desc: 'CBC & Iron Panel processed successfully.', time: '10m ago', unread: true },
    { id: 2, title: 'Vitals Stable', desc: 'Blood pressure within optimal reference target.', time: '2h ago', unread: true },
    { id: 3, title: 'Cycle Reminder', desc: 'Predicted luteal phase window active.', time: '1d ago', unread: false },
  ];

  return (
    <>
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 shadow-sm">
        {/* Left: Mobile trigger & Page Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
            aria-label="Open sidebar navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate tracking-tight">
              {title}
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block truncate">{subtitle}</p>
          </div>
        </div>

        {/* Right: Location, Life Stage, Language, Demo indicator, Notifications, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Location Badge */}
          <button
            onClick={() => setLocationModalOpen(true)}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-medium transition"
            title="Set Care Location"
          >
            <MapPin className="w-3.5 h-3.5 text-teal-600" />
            <span>{userLocation?.city || 'Hyderabad'}</span>
          </button>

          {/* Life Stage Mode Switcher */}
          <div className="hidden sm:block">
            <LifeStageSelector
              currentStage={currentLifeStage}
              onStageChange={(stage) => setCurrentLifeStage(stage)}
            />
          </div>

          {/* Multilingual Selector */}
          <LanguageSelector />

          {/* Gender Mode Quick Switcher */}
          <button
            onClick={() => {
              const nextGender = isMale ? 'Female' : 'Male';
              switchGender(nextGender);
              success(
                'Health Mode Updated',
                nextGender === 'Male'
                  ? 'Switched to Male Health profile (Male Health active).'
                  : "Switched to Women's Health profile."
              );
            }}
            title="Click to toggle Male / Female health modes"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold border transition shadow-sm ${
              isMale
                ? 'bg-navy-900 text-teal-200 border-navy-700 hover:bg-navy-800'
                : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
            }`}
          >
            <span>{isMale ? '♂ Male Health' : "♀ Women's Health"}</span>
          </button>

          {/* Demo Mode pill */}
          <button
            onClick={toggleDemoMode}
            title={isDemoMode ? "Demo Mode is enabled. Click to toggle." : "Click to enable Demo Mode."}
            className={`hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition ${
              isDemoMode
                ? 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${isDemoMode ? 'text-teal-600' : 'text-slate-400'}`} />
            <span>{isDemoMode ? 'Demo Sandbox' : 'Live Mode'}</span>
          </button>

          {/* Notifications Popover */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 relative transition"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-teal-600 rounded-full ring-2 ring-white" />
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-card border border-slate-200 p-4 z-50 animate-in fade-in-50">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
                  <h4 className="text-sm font-bold text-slate-900">Notifications</h4>
                  <button
                    onClick={() => setNotificationsOpen(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="space-y-2.5">
                  {mockNotifications.map((n) => (
                    <div key={n.id} className="p-2.5 rounded-xl bg-slate-50/80 hover:bg-slate-100 transition border border-slate-100">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                        <span className="text-[10px] text-slate-400">{n.time}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{n.desc}</p>
                    </div>
                  ))}
                </div>
                <Link
                  to="/settings"
                  onClick={() => setNotificationsOpen(false)}
                  className="block text-center text-xs font-semibold text-teal-700 hover:text-teal-900 mt-3 pt-2 border-t border-slate-100"
                >
                  Notification Preferences →
                </Link>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-100 transition focus:outline-none focus:ring-2 focus:ring-teal-500/30"
              aria-label="User profile and account menu"
              aria-expanded={profileDropdownOpen}
              aria-haspopup="true"
            >
              <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-sm ring-2 ring-teal-500/20">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-card border border-slate-200 py-2 z-50 animate-in fade-in-50 slide-in-from-top-2 duration-150">
                {/* User Header */}
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {user?.name || 'Patient'}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {user?.email || 'demo@shetwin.ai'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[10px] font-medium text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                    <ShieldCheck className="w-3 h-3 text-teal-600" />
                    <span>{t('brand.activeSession', 'Active Session')}</span>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-1 text-xs">
                  <Link
                    to="/health-twin"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-teal-700 transition"
                  >
                    <UserCheck className="w-4 h-4 text-slate-400" />
                    <span>{t('nav.healthTwin', 'My Health Twin')}</span>
                  </Link>

                  <Link
                    to="/settings"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-teal-700 transition"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>{t('nav.settings', 'Settings & Privacy')}</span>
                  </Link>
                </div>

                {/* Logout Button */}
                <div className="pt-1 border-t border-slate-100 px-1">
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition disabled:opacity-50"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>{isLoggingOut ? t('nav.signingOut', 'Signing out...') : t('nav.logout', 'Sign Out / Logout')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Location Selector Modal */}
      <LocationSelectorModal
        isOpen={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
        onLocationUpdated={(loc) => setUserLocation(loc)}
      />
    </>
  );
};
