import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Home, ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 rounded-3xl bg-teal-50 text-teal-700 flex items-center justify-center mb-6 shadow-sm border border-teal-100">
        <Activity className="w-8 h-8" />
      </div>
      <h1 className="text-4xl font-extrabold text-navy-950 tracking-tight">404</h1>
      <h2 className="text-lg font-bold text-slate-800 mt-2">Page Not Found</h2>
      <p className="text-sm text-slate-500 max-w-sm mt-1 leading-relaxed">
        The medical dashboard or resource page you requested does not exist or has been relocated.
      </p>
      <div className="flex items-center gap-3 mt-6">
        <Link to="/dashboard">
          <Button variant="primary" size="md" leftIcon={<Home className="w-4 h-4" />}>
            Go to Dashboard
          </Button>
        </Link>
        <Link to="/">
          <Button variant="outline" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Home Page
          </Button>
        </Link>
      </div>
    </div>
  );
};
