import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import { HealthProvider } from './context/HealthContext';
import { LanguageProvider } from './context/LanguageContext';

// Layouts
import { PublicLayout } from './layouts/PublicLayout';
import { AppLayout } from './layouts/AppLayout';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { HealthTwinPage } from './pages/HealthTwinPage';
import { ReportsPage } from './pages/ReportsPage';
import { AssistantPage } from './pages/AssistantPage';
import { WomensHealthPage } from './pages/WomensHealthPage';
import { FamilyHealthPage } from './pages/FamilyHealthPage';
import { DoctorsPage } from './pages/DoctorsPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <LanguageProvider>
          <HealthProvider>
            <Routes>
              {/* Public Layout Routes (Homepage & Authentication) */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<LandingPage />} />
                <Route path="/landing" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>

              {/* Authenticated Dashboard App Layout Routes */}
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/health-twin" element={<HealthTwinPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/assistant" element={<AssistantPage />} />
                <Route path="/womens-health" element={<WomensHealthPage />} />
                <Route path="/male-health" element={<WomensHealthPage />} />
                <Route path="/family-health" element={<FamilyHealthPage />} />
                <Route path="/doctors" element={<DoctorsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>

              {/* 404 Route */}
              <Route element={<PublicLayout />}>
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </HealthProvider>
        </LanguageProvider>
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
