import React from 'react';
import { Sparkles, RotateCcw, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useHealth } from '../../context/HealthContext';

export const DemoBanner: React.FC = () => {
  const { isDemoMode } = useAuth();
  const { resetToDemoDefaults } = useHealth();

  if (!isDemoMode) return null;

  return (
    <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-navy-900 text-white text-xs px-4 py-2 flex flex-wrap items-center justify-between gap-2 shadow-sm border-b border-teal-700/50">
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-500/30 text-teal-200 border border-teal-400/40 text-[11px] font-semibold tracking-wide uppercase">
          <Sparkles className="w-3 h-3" /> Demo Mode Active
        </span>
        <span className="text-teal-100 hidden sm:inline">
          Interactive presentation sandbox. Records and measurements shown are fictional samples for evaluation.
        </span>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={resetToDemoDefaults}
          className="inline-flex items-center gap-1.5 text-teal-200 hover:text-white bg-teal-800/60 hover:bg-teal-700 px-2.5 py-1 rounded-lg transition text-xs border border-teal-600/40"
          title="Restore original demo sample records"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Demo Data</span>
        </button>
        <span className="inline-flex items-center gap-1 text-teal-300/80 text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5" /> Private Session
        </span>
      </div>
    </div>
  );
};
