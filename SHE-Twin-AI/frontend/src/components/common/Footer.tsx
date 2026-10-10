import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Heart, Shield, Lock } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-navy-950 text-slate-300 border-t border-navy-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md">
                <Activity className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">SHE Twin AI</span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Empowering proactive personalized healthcare through AI-assisted Digital Health Twins, intelligent report analysis, and dedicated women’s health tracking.
            </p>
            <div className="flex items-center gap-3 text-xs text-slate-400 pt-2">
              <span className="inline-flex items-center gap-1 bg-navy-900 border border-navy-800 px-2.5 py-1 rounded-lg">
                <Shield className="w-3.5 h-3.5 text-teal-400" /> HIPAA / ABDM Compliant Architecture
              </span>
              <span className="inline-flex items-center gap-1 bg-navy-900 border border-navy-800 px-2.5 py-1 rounded-lg">
                <Lock className="w-3.5 h-3.5 text-teal-400" /> End-to-End Encrypted
              </span>
            </div>
          </div>

          {/* Quick Nav */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Platform</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><Link to="/dashboard" className="hover:text-teal-400 transition">Dashboard</Link></li>
              <li><Link to="/health-twin" className="hover:text-teal-400 transition">Digital Health Twin</Link></li>
              <li><Link to="/reports" className="hover:text-teal-400 transition">Medical Report Analyzer</Link></li>
              <li><Link to="/assistant" className="hover:text-teal-400 transition">AI Health Assistant</Link></li>
              <li><Link to="/womens-health" className="hover:text-teal-400 transition">Women's Health</Link></li>
              <li><Link to="/family-health" className="hover:text-teal-400 transition">Family Health Profiles</Link></li>
              <li><Link to="/doctors" className="hover:text-teal-400 transition">Find Verified Doctors</Link></li>
            </ul>
          </div>

          {/* Technology & Project */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Project & Tech</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><a href="#features" className="hover:text-teal-400 transition">Architecture Overview</a></li>
              <li><a href="#report-analyzer" className="hover:text-teal-400 transition">Lab OCR & NLP Engine</a></li>
              <li><a href="#security" className="hover:text-teal-400 transition">Privacy & Data Governance</a></li>
              <li><span className="text-slate-500">B.Tech CSE Capstone Project</span></li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Account & Help</h4>
            <ul className="space-y-2.5 text-sm text-slate-400">
              <li><Link to="/login" className="hover:text-teal-400 transition">Patient Login</Link></li>
              <li><Link to="/register" className="hover:text-teal-400 transition">Create Account</Link></li>
              <li><Link to="/settings" className="hover:text-teal-400 transition">Settings & Privacy</Link></li>
              <li><span className="text-slate-400">support@shetwin.ai</span></li>
            </ul>
          </div>
        </div>

        {/* Medical Disclaimer & Copyright */}
        <div className="mt-12 pt-8 border-t border-navy-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p className="max-w-2xl leading-relaxed text-slate-400">
            <strong>Medical Disclaimer:</strong> SHE Twin AI is an educational digital health management platform. It does not provide medical diagnoses, prescriptions, or emergency triage. Always consult qualified healthcare professionals regarding any medical condition.
          </p>
          <div className="flex items-center gap-2 text-slate-400 whitespace-nowrap">
            <span>© 2026 SHE Twin AI. Built with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
            <span>for Women's Healthcare.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
