import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UserCheck,
  FileSpreadsheet,
  BotMessageSquare,
  HeartHandshake,
  Users2,
  Stethoscope,
  Settings,
  LogOut,
  Activity,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useHealth } from '../../context/HealthContext';
import { useToast } from '../../context/ToastContext';
import { useLanguage } from '../../context/LanguageContext';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { user, logout } = useAuth();
  const { healthTwin } = useHealth();
  const { success } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const isMale = user?.gender === 'Male' || healthTwin?.gender === 'Male';

  const handleLogout = () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    logout();
    success(t('common.success', 'Signed Out'), t('nav.logout', 'You have been safely logged out.'));
    navigate('/login');
    if (onCloseMobile) onCloseMobile();
  };

  const navItems = [
    { label: t('nav.dashboard', 'Dashboard'), path: '/dashboard', icon: LayoutDashboard },
    { label: t('nav.healthTwin', 'My Health Twin'), path: '/health-twin', icon: UserCheck },
    { label: t('nav.reports', 'Medical Reports'), path: '/reports', icon: FileSpreadsheet },
    { label: t('nav.assistant', 'AI Health Assistant'), path: '/assistant', icon: BotMessageSquare },
    {
      label: isMale ? 'Male Health' : t('nav.womensHealth', "Women's Health"),
      path: isMale ? '/male-health' : '/womens-health',
      icon: HeartHandshake,
    },
    { label: t('nav.family', 'Family Health'), path: '/family-health', icon: Users2 },
    { label: t('nav.doctors', 'Find Doctors'), path: '/doctors', icon: Stethoscope },
    { label: t('nav.settings', 'Settings & Privacy'), path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-navy-950 text-slate-300 flex flex-col h-full border-r border-navy-800 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-navy-800/80 flex items-center justify-between">
        <Link
          to="/dashboard"
          onClick={onCloseMobile}
          className="flex items-center gap-2.5 group"
        >
          <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-900/40 group-hover:scale-105 transition">
            <Activity className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base text-white tracking-tight">{t('brand.name', 'SHE Twin')}</span>
              <span className="text-[10px] font-extrabold uppercase px-1 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">AI</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">{t('brand.subtitle', 'Healthcare OS')}</span>
          </div>
        </Link>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
          {t('nav.management', 'Health Management')}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-teal-600 text-white font-semibold shadow-sm'
                    : 'text-slate-300 hover:bg-navy-900 hover:text-white'
                }`
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Safety Notice Footer */}
      <div className="p-3 mx-3 mb-2 bg-navy-900/80 rounded-xl border border-navy-800">
        <div className="flex items-center gap-2 text-teal-400 text-xs font-semibold">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>{t('brand.safetyTitle', 'Patient Data Safe')}</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1 leading-snug">
          {t('brand.safetyDesc', 'Encrypted health records protected with granular consent controls.')}
        </p>
      </div>

      {/* User snippet & logout */}
      <div className="p-3 border-t border-navy-800 bg-navy-950/80">
        <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-navy-900/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-teal-700 text-teal-100 flex items-center justify-center font-bold text-xs flex-shrink-0 border border-teal-500/30">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{user?.name || 'Patient'}</p>
              <p className="text-[11px] text-slate-400 truncate">{user?.email || 'demo@shetwin.ai'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            title={t('nav.logout', 'Log out')}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-navy-800 rounded-lg transition disabled:opacity-50"
            aria-label={t('nav.logout', 'Log out')}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
