import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { apiService } from '../services/api';
import { INITIAL_DEMO_USER, INITIAL_DEMO_MALE_USER } from '../services/demoData';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDemoMode: boolean;
  isNewAccount: boolean;
  setIsNewAccount: (isNew: boolean) => void;
  toggleDemoMode: () => void;
  switchGender: (gender: 'Female' | 'Male') => void;
  login: (email: string, pass: string, gender?: 'Female' | 'Male') => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, pass: string, gender?: 'Female' | 'Male') => Promise<{ success: boolean; error?: string }>;
  loginAsDemo: (gender?: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const loggedOut = localStorage.getItem('she_twin_logged_out');
      if (loggedOut === 'true') {
        return null;
      }
      const stored = localStorage.getItem('she_twin_user');
      if (stored) return JSON.parse(stored);
      return INITIAL_DEMO_USER;
    } catch {
      return null;
    }
  });

  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    const stored = localStorage.getItem('she_twin_demo_mode');
    return stored !== null ? stored === 'true' : true;
  });

  const [isNewAccount, setIsNewAccount] = useState<boolean>(() => {
    return localStorage.getItem('she_twin_is_new_account') === 'true';
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('she_twin_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('she_twin_user');
      localStorage.removeItem('she_twin_token');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('she_twin_demo_mode', isDemoMode.toString());
  }, [isDemoMode]);

  const toggleDemoMode = () => {
    setIsDemoMode((prev) => !prev);
  };

  const switchGender = (newGender: 'Female' | 'Male') => {
    setUser((prev) => {
      const updated: User = prev
        ? {
            ...prev,
            gender: newGender,
            name: prev.name.includes('Ananya') && newGender === 'Male'
              ? 'Rahul Sharma'
              : prev.name.includes('Rahul') && newGender === 'Female'
              ? 'Ananya Sharma'
              : prev.name,
          }
        : { ...INITIAL_DEMO_USER, gender: newGender };
      localStorage.setItem('she_twin_user', JSON.stringify(updated));
      return updated;
    });

    try {
      const storedTwin = localStorage.getItem('she_twin_health_twin');
      if (storedTwin) {
        const parsed = JSON.parse(storedTwin);
        parsed.gender = newGender;
        localStorage.setItem('she_twin_health_twin', JSON.stringify(parsed));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loginAsDemo = (genderInput?: unknown) => {
    localStorage.removeItem('she_twin_logged_out');
    localStorage.removeItem('she_twin_health_twin');
    localStorage.removeItem('she_twin_vitals_history');
    localStorage.setItem('she_twin_is_new_account', 'false');
    setIsNewAccount(false);
    const isMale = genderInput === 'Male';
    const demoUser = isMale ? INITIAL_DEMO_MALE_USER : INITIAL_DEMO_USER;
    setUser({ ...demoUser, isNewAccount: false });
    setIsDemoMode(true);
    localStorage.setItem('she_twin_token', isMale ? 'demo_token_she_twin_rahul' : 'demo_token_she_twin_ananya');
  };

  const login = async (email: string, pass: string, gender?: 'Female' | 'Male') => {
    setIsLoading(true);
    try {
      const res = await apiService.login(email, pass, gender);
      if (res.success && res.data) {
        localStorage.removeItem('she_twin_logged_out');
        localStorage.removeItem('she_twin_health_twin');
        localStorage.removeItem('she_twin_vitals_history');
        localStorage.setItem('she_twin_is_new_account', 'false');
        setIsNewAccount(false);
        setUser({ ...res.data.user, isNewAccount: false });
        localStorage.setItem('she_twin_token', res.data.token);
        setIsDemoMode(Boolean(res.isDemo));
        setIsLoading(false);
        return { success: true };
      }
      setIsLoading(false);
      return { success: false, error: res.error || 'Authentication failed' };
    } catch {
      setIsLoading(false);
      return { success: false, error: 'Network error or backend unreachable' };
    }
  };

  const register = async (name: string, email: string, pass: string, gender?: 'Female' | 'Male') => {
    setIsLoading(true);
    try {
      const res = await apiService.register(name, email, pass, gender || 'Female');
      if (res.success && res.data) {
        localStorage.removeItem('she_twin_logged_out');
        localStorage.removeItem('she_twin_health_twin');
        localStorage.removeItem('she_twin_vitals_history');
        localStorage.setItem('she_twin_is_new_account', 'true');
        setIsNewAccount(true);
        setUser({ ...res.data.user, isNewAccount: true });
        localStorage.setItem('she_twin_token', res.data.token);
        setIsDemoMode(Boolean(res.isDemo));
        setIsLoading(false);
        return { success: true };
      }
      setIsLoading(false);
      return { success: false, error: res.error || 'Registration failed' };
    } catch {
      setIsLoading(false);
      return { success: false, error: 'Network error during registration' };
    }
  };

  const logout = () => {
    setUser(null);
    setIsNewAccount(false);
    localStorage.removeItem('she_twin_user');
    localStorage.removeItem('she_twin_token');
    localStorage.removeItem('she_twin_health_twin');
    localStorage.removeItem('she_twin_vitals_history');
    localStorage.removeItem('she_twin_is_new_account');
    localStorage.setItem('she_twin_logged_out', 'true');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isDemoMode,
        isNewAccount,
        setIsNewAccount,
        toggleDemoMode,
        switchGender,
        login,
        register,
        loginAsDemo,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
