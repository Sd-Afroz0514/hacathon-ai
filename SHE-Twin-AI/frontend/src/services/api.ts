import {
  User,
  HealthTwinProfile,
  VitalLogEntry,
  MedicalReport,
  CycleLog,
  FamilyMember,
  Doctor,
  AppointmentRequest,
  UserSettings,
  ChatMessage,
} from '../types';

import {
  INITIAL_DEMO_USER,
  INITIAL_DEMO_MALE_USER,
  INITIAL_DEMO_HEALTH_TWIN,
  INITIAL_DEMO_VITALS_HISTORY,
  INITIAL_DEMO_REPORTS,
  INITIAL_DEMO_CYCLE_LOGS,
  INITIAL_DEMO_FAMILY_MEMBERS,
  DEMO_DOCTORS,
  INITIAL_DEMO_APPOINTMENTS,
  INITIAL_USER_SETTINGS,
} from './demoData';

const envApiUrl = import.meta.env.VITE_API_BASE_URL;

// Determine API Base URL dynamically:
// - In production / deployed access (not on dev ports 5173/3000):
//   Use external production URL if explicitly provided (e.g. separate backend service),
//   otherwise use same-origin '/api' (unified single-service deployment).
// - In local frontend dev (ports 5173 or 3000):
//   Fallback to local backend at 'http://localhost:8000/api'.
const resolveApiBaseUrl = (): string => {
  if (typeof window !== 'undefined' && window.location) {
    const isDevPort = window.location.port === '5173' || window.location.port === '3000';
    if (!isDevPort) {
      if (
        envApiUrl &&
        /^https?:\/\//i.test(envApiUrl) &&
        !envApiUrl.includes('localhost') &&
        !envApiUrl.includes('127.0.0.1')
      ) {
        return envApiUrl;
      }
      return '/api';
    }
  }
  return envApiUrl || 'http://localhost:8000/api';
};

export const API_BASE_URL = resolveApiBaseUrl().replace(/\/+$/, '');




function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('she_twin_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token && !token.startsWith('demo_')) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

// Helper for local storage simulation in demo mode
function getStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(`she_twin_${key}`);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(`she_twin_${key}`, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to persist ${key} in localStorage`, err);
  }
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  isDemo?: boolean;
}

export const apiService = {
  // Check if real backend is reachable
  async pingBackend(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const rootUrl = API_BASE_URL.replace(/\/api\/?$/, '');
      const healthUrl = rootUrl ? `${rootUrl}/health` : '/health';
      const res = await fetch(healthUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      return res.ok;
    } catch {
      return false;
    }
  },

  // Auth Endpoints
  async login(email: string, _password: string, gender?: 'Female' | 'Male'): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: _password }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          if (gender) data.user.gender = gender;
          data.user.isNewAccount = false;
          localStorage.setItem('she_twin_is_new_account', 'false');
          setStorage('user', data.user);
          const initialTwin: HealthTwinProfile = {
            ...INITIAL_DEMO_HEALTH_TWIN,
            id: `twin_${data.user.id}`,
            userId: data.user.id,
            fullName: data.user.name,
            gender: gender || data.user.gender || 'Female',
          };
          setStorage('health_twin', initialTwin);
          setStorage('vitals_history', []);
        }
        return { success: true, data };
      } else {
        const errData = await res.json().catch(() => ({}));
        return { success: false, error: errData.detail || 'Invalid email or password.' };
      }
    } catch {
      // Backend not reachable; fallback to demo mode
    }

    const isMale = gender === 'Male' || email.toLowerCase().includes('rahul') || email.toLowerCase().includes('male');
    const baseUser = isMale ? INITIAL_DEMO_MALE_USER : INITIAL_DEMO_USER;
    const user: User = {
      ...baseUser,
      email: email || baseUser.email,
      gender: isMale ? 'Male' : 'Female',
      isNewAccount: false,
    };
    localStorage.setItem('she_twin_is_new_account', 'false');
    const initialTwin: HealthTwinProfile = {
      ...INITIAL_DEMO_HEALTH_TWIN,
      id: `twin_${user.id}`,
      userId: user.id,
      fullName: user.name,
      gender: user.gender || 'Female',
    };
    setStorage('user', user);
    setStorage('health_twin', initialTwin);
    setStorage('vitals_history', []);

    return {
      success: true,
      isDemo: true,
      data: { user, token: 'demo_jwt_token_sample_she_twin' },
    };
  },

  async register(name: string, email: string, _password: string, gender: 'Female' | 'Male' = 'Female'): Promise<ApiResponse<{ user: User; token: string }>> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password: _password }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          data.user.gender = gender;
          data.user.isNewAccount = true;
          localStorage.setItem('she_twin_is_new_account', 'true');
          setStorage('user', data.user);
          const initialTwin: HealthTwinProfile = {
            ...INITIAL_DEMO_HEALTH_TWIN,
            id: `twin_${data.user.id}`,
            userId: data.user.id,
            fullName: data.user.name,
            gender: gender,
          };
          setStorage('health_twin', initialTwin);
          setStorage('vitals_history', []);
        }
        return { success: true, data };
      } else {
        const errData = await res.json().catch(() => ({}));
        return { success: false, error: errData.detail || 'Registration failed.' };
      }
    } catch {
      // Fallback to demo
    }

    const user: User = {
      id: `usr_${Date.now()}`,
      name: name || (gender === 'Male' ? 'Rahul Sharma' : 'Healthcare Patient'),
      email: email || 'patient@example.com',
      gender: gender,
      role: 'patient',
      createdAt: new Date().toISOString(),
      isDemoUser: true,
      isNewAccount: true,
    };
    localStorage.setItem('she_twin_is_new_account', 'true');
    const customTwin: HealthTwinProfile = {
      ...INITIAL_DEMO_HEALTH_TWIN,
      id: `twin_${user.id}`,
      userId: user.id,
      fullName: user.name,
      gender: gender,
    };
    setStorage('user', user);
    setStorage('health_twin', customTwin);
    setStorage('vitals_history', []);

    return {
      success: true,
      isDemo: true,
      data: { user, token: 'demo_jwt_token_sample_she_twin' },
    };
  },

  async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      }
    } catch {
      // Fallback
    }
    return { success: true, data: INITIAL_DEMO_USER, isDemo: true };
  },

  // Health Twin Endpoints
  async getHealthTwin(): Promise<ApiResponse<HealthTwinProfile>> {
    const currentUser = getStorage<User | null>('user', null);
    try {
      const token = localStorage.getItem('she_twin_token');
      if (token && !token.startsWith('demo_')) {
        const res = await fetch(`${API_BASE_URL}/twin/profile`, {
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const data: HealthTwinProfile = await res.json();
          if (currentUser?.name && data.fullName !== currentUser.name && currentUser.id !== 'usr_demo_01') {
            data.fullName = currentUser.name;
          }
          return { success: true, data };
        }
      }
    } catch {
      // Fallback
    }

    const defaultTwin: HealthTwinProfile = currentUser?.name
      ? { ...INITIAL_DEMO_HEALTH_TWIN, fullName: currentUser.name, gender: currentUser.gender || INITIAL_DEMO_HEALTH_TWIN.gender }
      : INITIAL_DEMO_HEALTH_TWIN;
    const data = getStorage<HealthTwinProfile>('health_twin', defaultTwin);
    if (currentUser?.name && data.fullName !== currentUser.name && currentUser.id !== 'usr_demo_01') {
      data.fullName = currentUser.name;
    }
    if (currentUser?.gender && data.gender !== currentUser.gender) {
      data.gender = currentUser.gender;
    }
    return { success: true, data, isDemo: true };
  },

  async updateHealthTwin(profile: Partial<HealthTwinProfile>): Promise<ApiResponse<HealthTwinProfile>> {
    try {
      const token = localStorage.getItem('she_twin_token');
      if (token && !token.startsWith('demo_')) {
        const res = await fetch(`${API_BASE_URL}/twin/profile`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(profile),
        });
        if (res.ok) {
          const data = await res.json();
          return { success: true, data };
        }
      }
    } catch {
      // Fallback
    }

    const current = getStorage<HealthTwinProfile>('health_twin', INITIAL_DEMO_HEALTH_TWIN);
    const updated: HealthTwinProfile = {
      ...current,
      ...profile,
      lastUpdated: new Date().toISOString(),
    };
    setStorage('health_twin', updated);
    return { success: true, data: updated, isDemo: true };
  },

  async getVitalsHistory(): Promise<ApiResponse<VitalLogEntry[]>> {
    try {
      const token = localStorage.getItem('she_twin_token');
      if (token && !token.startsWith('demo_')) {
        const res = await fetch(`${API_BASE_URL}/twin/vitals`, {
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          return { success: true, data };
        }
      }
    } catch {
      // Fallback
    }

    const data = getStorage<VitalLogEntry[]>('vitals_history', INITIAL_DEMO_VITALS_HISTORY);
    return { success: true, data, isDemo: true };
  },

  async addVitalLog(entry: Omit<VitalLogEntry, 'id'>): Promise<ApiResponse<VitalLogEntry>> {
    try {
      const token = localStorage.getItem('she_twin_token');
      if (token && !token.startsWith('demo_')) {
        const res = await fetch(`${API_BASE_URL}/twin/vitals`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(entry),
        });
        if (res.ok) {
          const data = await res.json();
          return { success: true, data };
        }
      }
    } catch {
      // Fallback
    }

    const history = getStorage<VitalLogEntry[]>('vitals_history', INITIAL_DEMO_VITALS_HISTORY);
    const newEntry: VitalLogEntry = {
      ...entry,
      id: `v_${Date.now()}`,
    };
    const updatedHistory = [...history, newEntry];
    setStorage('vitals_history', updatedHistory);

    const currentTwin = getStorage<HealthTwinProfile>('health_twin', INITIAL_DEMO_HEALTH_TWIN);
    const updatedTwin: HealthTwinProfile = {
      ...currentTwin,
      weightKg: entry.weight || currentTwin.weightKg,
      bmi: entry.bmi || currentTwin.bmi,
      latestVitals: {
        bloodPressureSystolic: entry.systolic,
        bloodPressureDiastolic: entry.diastolic,
        heartRateBpm: entry.heartRate,
        fastingGlucoseMgDl: entry.glucose,
        spo2Percentage: entry.spo2,
        temperatureCelsius: currentTwin.latestVitals.temperatureCelsius,
        recordedAt: new Date().toISOString(),
      },
      lastUpdated: new Date().toISOString(),
    };
    setStorage('health_twin', updatedTwin);

    return { success: true, data: newEntry, isDemo: true };
  },

  // Medical Reports Endpoints
  async getReports(): Promise<ApiResponse<MedicalReport[]>> {
    try {
      const token = localStorage.getItem('she_twin_token');
      if (token && !token.startsWith('demo_')) {
        const res = await fetch(`${API_BASE_URL}/reports`, {
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          return { success: true, data };
        }
      }
    } catch {
      // Fallback
    }

    const reports = getStorage<MedicalReport[]>('reports', INITIAL_DEMO_REPORTS);
    return { success: true, data: reports, isDemo: true };
  },

  async getReportById(id: string): Promise<ApiResponse<MedicalReport>> {
    try {
      const token = localStorage.getItem('she_twin_token');
      if (token && !token.startsWith('demo_')) {
        const res = await fetch(`${API_BASE_URL}/reports/${id}`, {
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          return { success: true, data };
        }
      }
    } catch {
      // Fallback
    }

    const reports = getStorage<MedicalReport[]>('reports', INITIAL_DEMO_REPORTS);
    const found = reports.find((r) => r.id === id);
    if (found) {
      return { success: true, data: found, isDemo: true };
    }
    return { success: false, error: 'Report not found' };
  },

  async uploadReport(file: File, category: string): Promise<ApiResponse<MedicalReport>> {
    try {
      const token = localStorage.getItem('she_twin_token');
      if (token && !token.startsWith('demo_')) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('category', category);
        const res = await fetch(`${API_BASE_URL}/reports/upload`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });
        if (res.ok) {
          const data = await res.json();
          return { success: true, data };
        }
      }
    } catch {
      // Fallback
    }

    const fileSizeFormatted = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    const newReport: MedicalReport = {
      id: `rep_${Date.now()}`,
      userId: 'usr_demo_01',
      fileName: file.name,
      fileSizeFormatted: fileSizeFormatted === '0.0 MB' ? `${Math.round(file.size / 1024)} KB` : fileSizeFormatted,
      fileType: file.name.endsWith('.png') ? 'png' : file.name.endsWith('.jpg') ? 'jpg' : 'pdf',
      uploadedAt: new Date().toISOString(),
      reportDate: new Date().toISOString().split('T')[0],
      labOrHospitalName: 'City Healthcare Diagnostic Lab',
      reportCategory: (category as any) || 'Complete Blood Count (CBC)',
      status: 'analyzed',
      doctorName: 'Dr. A. Verma, MD Consultant',
      extractedTextPreview: `[PARSED TEXT from ${file.name}]\nPATIENT: Ananya Sharma | AGE: 26 | GENDER: Female\nDIAGNOSTIC TEST SUMMARY:\n- Fasting Blood Sugar: 94 mg/dL\n- Hemoglobin: 12.1 g/dL\n- Total Cholesterol: 168 mg/dL\n- Vitamin D (25-OH): 32 ng/mL`,
      aiSummaryNotes: `Diagnostic Analysis for ${file.name}: Parameters extracted reflect stable baseline. Key blood markers show adequate hemoglobin recovery and optimal glycemic control.`,
      keyInsights: [
        'Extracted parameters are within safe clinical reference ranges.',
        'Digital Health Twin profile automatically updated with latest lab measurements.',
        'Recommended next routine checkup in 6 months.',
      ],
      testResults: [
        { id: `t_${Date.now()}_1`, testName: 'Fasting Blood Glucose', category: 'Biochemistry', value: 94, unit: 'mg/dL', referenceRange: '70 - 100', status: 'normal', explanation: 'Optimal fasting baseline' },
        { id: `t_${Date.now()}_2`, testName: 'Hemoglobin', category: 'Hematology', value: 12.1, unit: 'g/dL', referenceRange: '12.0 - 15.5', status: 'normal', explanation: 'Healthy female reference range' },
        { id: `t_${Date.now()}_3`, testName: 'Total Cholesterol', category: 'Lipid Profile', value: 168, unit: 'mg/dL', referenceRange: '< 200', status: 'normal', explanation: 'Desirable cardiovascular metric' },
        { id: `t_${Date.now()}_4`, testName: 'Vitamin D3 (25-OH)', category: 'Vitamins', value: 32, unit: 'ng/mL', referenceRange: '30 - 100', status: 'normal', explanation: 'Sufficient vitamin D stores' },
      ],
      isDemoReport: true,
    };

    const currentReports = getStorage<MedicalReport[]>('reports', INITIAL_DEMO_REPORTS);
    const updated = [newReport, ...currentReports];
    setStorage('reports', updated);

    return { success: true, data: newReport, isDemo: true };
  },

  async deleteReport(id: string): Promise<ApiResponse<boolean>> {
    try {
      const token = localStorage.getItem('she_twin_token');
      if (token && !token.startsWith('demo_')) {
        const res = await fetch(`${API_BASE_URL}/reports/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          return { success: true, data: true };
        }
      }
    } catch {
      // Fallback
    }

    const currentReports = getStorage<MedicalReport[]>('reports', INITIAL_DEMO_REPORTS);
    const filtered = currentReports.filter((r) => r.id !== id);
    setStorage('reports', filtered);
    return { success: true, data: true, isDemo: true };
  },

  // AI Assistant Endpoints
  async sendAssistantMessage(userPrompt: string, language: string = 'en'): Promise<ApiResponse<ChatMessage>> {
    try {
      const token = localStorage.getItem('she_twin_token');
      if (token && !token.startsWith('demo_')) {
        const res = await fetch(`${API_BASE_URL}/assistant/chat`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ message: userPrompt, language }),
        });
        if (res.ok) {
          const data = await res.json();
          return { success: true, data };
        }
      }
    } catch {
      // Fallback
    }

    const promptLower = userPrompt.toLowerCase();
    let responseText = '';
    let suggestedFollowUps: string[] = [];
    let sources = ['Educational Health Twin Knowledge Base', 'Standard Clinical Guidelines Reference'];

    if (promptLower.includes('anemia') || promptLower.includes('iron') || promptLower.includes('hemoglobin')) {
      responseText = `Based on your recent lab reports, your Hemoglobin has improved to **11.8 g/dL** (close to the 12.0 g/dL target), with Ferritin at **22 ng/mL**.\n\n### Key Nutritional Suggestions:\n- **Iron-rich foods**: Spinach, lentils, chickpeas, pumpkin seeds, and fortified cereals.\n- **Vitamin C pairing**: Consume citrus fruits, amla, or bell peppers alongside iron-rich meals to boost non-heme iron absorption.\n- **Avoid inhibitors**: Refrain from drinking tea or coffee within 1 hour before or after your iron supplements.\n\n*Note: This is educational information. Please review changes with your treating physician.*`;
      suggestedFollowUps = ['What are signs of low ferritin?', 'How does vitamin C help iron absorption?', 'Recommended iron-rich meal ideas'];
    } else if (promptLower.includes('pcos') || promptLower.includes('period') || promptLower.includes('cycle') || promptLower.includes('cramp')) {
      responseText = `Managing PCOS and menstrual regularity involves a multi-faceted lifestyle approach:\n\n1. **Glycemic Balance**: Low glycemic index (GI) complex carbohydrates help prevent insulin spikes that can stimulate excess androgen production.\n2. **Regular Movement**: 30 minutes of moderate aerobic exercise or strength training improves insulin sensitivity.\n3. **Anti-inflammatory Foods**: Incorporate omega-3 fatty acids (flaxseeds, walnuts, chia seeds) and leafy greens.\n4. **Hydration & Sleep**: Maintain 7-8 hours of regular sleep to support circadian rhythm and hormonal homeostasis.\n\n*Note: Always consult your gynecologist or endocrinologist for personalized hormone management.*`;
      suggestedFollowUps = ['What foods help soothe period cramps?', 'How to track ovulation in irregular cycles?', 'Best exercises for PCOS'];
    } else {
      responseText = `Hello! I am the **SHE Twin AI Health Assistant**.\n\nI can help you understand your uploaded lab reports, explain medical terms, provide nutrition and wellness tips, or track your Health Twin parameters.\n\n*Disclaimer: I provide general health and wellness information for educational purposes and cannot replace professional medical diagnosis or prescription.*`;
      suggestedFollowUps = ['Explain my latest CBC report', 'How can I improve my sleep quality?', 'What tests should I get for an annual checkup?'];
    }

    const assistantMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'assistant',
      content: responseText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isDemoSimulation: true,
      suggestedFollowUps,
      sources,
    };

    return { success: true, data: assistantMessage, isDemo: true };
  },

  // Women's Health Endpoints
  async getCycleLogs(): Promise<ApiResponse<CycleLog[]>> {
    try {
      const token = localStorage.getItem('she_twin_token');
      if (token && !token.startsWith('demo_')) {
        const res = await fetch(`${API_BASE_URL}/womens-health/cycles`, {
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          return { success: true, data };
        }
      }
    } catch {
      // Fallback
    }

    const data = getStorage<CycleLog[]>('cycle_logs', INITIAL_DEMO_CYCLE_LOGS);
    return { success: true, data, isDemo: true };
  },

  async addCycleLog(log: Omit<CycleLog, 'id'>): Promise<ApiResponse<CycleLog>> {
    try {
      const token = localStorage.getItem('she_twin_token');
      if (token && !token.startsWith('demo_')) {
        const res = await fetch(`${API_BASE_URL}/womens-health/cycles`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(log),
        });
        if (res.ok) {
          const data = await res.json();
          return { success: true, data };
        }
      }
    } catch {
      // Fallback
    }

    const logs = getStorage<CycleLog[]>('cycle_logs', INITIAL_DEMO_CYCLE_LOGS);
    const newLog: CycleLog = {
      ...log,
      id: `cyc_${Date.now()}`,
    };
    const updated = [newLog, ...logs];
    setStorage('cycle_logs', updated);
    return { success: true, data: newLog, isDemo: true };
  },

  // Family Health Endpoints
  async getFamilyMembers(): Promise<ApiResponse<FamilyMember[]>> {
    try {
      const token = localStorage.getItem('she_twin_token');
      if (token && !token.startsWith('demo_')) {
        const res = await fetch(`${API_BASE_URL}/family/members`, {
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          return { success: true, data };
        }
      }
    } catch {
      // Fallback
    }

    const data = getStorage<FamilyMember[]>('family_members', INITIAL_DEMO_FAMILY_MEMBERS);
    return { success: true, data, isDemo: true };
  },

  async addFamilyMember(member: Omit<FamilyMember, 'id' | 'primaryUserId' | 'avatarColor'>): Promise<ApiResponse<FamilyMember>> {
    try {
      const token = localStorage.getItem('she_twin_token');
      if (token && !token.startsWith('demo_')) {
        const res = await fetch(`${API_BASE_URL}/family/members`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(member),
        });
        if (res.ok) {
          const data = await res.json();
          return { success: true, data };
        }
      }
    } catch {
      // Fallback
    }

    const colors = ['bg-teal-600', 'bg-rose-500', 'bg-indigo-500', 'bg-amber-500', 'bg-emerald-600', 'bg-purple-600'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const members = getStorage<FamilyMember[]>('family_members', INITIAL_DEMO_FAMILY_MEMBERS);
    const newMember: FamilyMember = {
      ...member,
      id: `fam_${Date.now()}`,
      primaryUserId: 'usr_demo_01',
      avatarColor: randomColor,
    };
    const updated = [...members, newMember];
    setStorage('family_members', updated);
    return { success: true, data: newMember, isDemo: true };
  },

  async updateFamilyMember(id: string, updates: Partial<FamilyMember>): Promise<ApiResponse<FamilyMember>> {
    try {
      const token = localStorage.getItem('she_twin_token');
      if (token && !token.startsWith('demo_')) {
        const res = await fetch(`${API_BASE_URL}/family/members/${id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(updates),
        });
        if (res.ok) {
          const data = await res.json();
          return { success: true, data };
        }
      }
    } catch {
      // Fallback
    }

    const members = getStorage<FamilyMember[]>('family_members', INITIAL_DEMO_FAMILY_MEMBERS);
    const updated = members.map((m) => (m.id === id ? { ...m, ...updates } : m));
    setStorage('family_members', updated);
    const target = updated.find((m) => m.id === id);
    return { success: true, data: target, isDemo: true };
  },

  async deleteFamilyMember(id: string): Promise<ApiResponse<boolean>> {
    try {
      const token = localStorage.getItem('she_twin_token');
      if (token && !token.startsWith('demo_')) {
        const res = await fetch(`${API_BASE_URL}/family/members/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          return { success: true, data: true };
        }
      }
    } catch {
      // Fallback
    }

    const members = getStorage<FamilyMember[]>('family_members', INITIAL_DEMO_FAMILY_MEMBERS);
    const updated = members.filter((m) => m.id !== id);
    setStorage('family_members', updated);
    return { success: true, data: true, isDemo: true };
  },

  // Doctor Search & Booking
  async getDoctors(query?: string, specialty?: string): Promise<ApiResponse<Doctor[]>> {
    try {
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (specialty) params.append('specialty', specialty);

      const res = await fetch(`${API_BASE_URL}/doctors?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      }
    } catch {
      // Fallback
    }

    let list = DEMO_DOCTORS;
    if (specialty && specialty !== 'All' && specialty !== 'All Specialties') {
      list = list.filter((d) => d.specialty === specialty);
    }
    if (query && query.trim() !== '') {
      const q = query.toLowerCase();
      list = list.filter((d) => d.name.toLowerCase().includes(q) || d.location.toLowerCase().includes(q) || d.specialty.toLowerCase().includes(q));
    }
    return { success: true, data: list, isDemo: true };
  },

  async bookAppointment(request: Omit<AppointmentRequest, 'id' | 'status' | 'bookedAt' | 'isDemoBooking'>): Promise<ApiResponse<AppointmentRequest>> {
    try {
      const token = localStorage.getItem('she_twin_token');
      if (token && !token.startsWith('demo_')) {
        const res = await fetch(`${API_BASE_URL}/doctors/appointments`, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(request),
        });
        if (res.ok) {
          const data = await res.json();
          return { success: true, data };
        }
      }
    } catch {
      // Fallback
    }

    const appointments = getStorage<AppointmentRequest[]>('appointments', INITIAL_DEMO_APPOINTMENTS);
    const newAppt: AppointmentRequest = {
      ...request,
      id: `apt_${Date.now()}`,
      status: 'Confirmed',
      bookedAt: new Date().toISOString(),
      isDemoBooking: true,
    };
    const updated = [newAppt, ...appointments];
    setStorage('appointments', updated);
    return { success: true, data: newAppt, isDemo: true };
  },

  async getAppointments(): Promise<ApiResponse<AppointmentRequest[]>> {
    try {
      const token = localStorage.getItem('she_twin_token');
      if (token && !token.startsWith('demo_')) {
        const res = await fetch(`${API_BASE_URL}/doctors/appointments`, {
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          return { success: true, data };
        }
      }
    } catch {
      // Fallback
    }

    const data = getStorage<AppointmentRequest[]>('appointments', INITIAL_DEMO_APPOINTMENTS);
    return { success: true, data, isDemo: true };
  },

  // Settings
  async getSettings(): Promise<ApiResponse<UserSettings>> {
    try {
      const token = localStorage.getItem('she_twin_token');
      if (token && !token.startsWith('demo_')) {
        const res = await fetch(`${API_BASE_URL}/settings`, {
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          return { success: true, data };
        }
      }
    } catch {
      // Fallback
    }

    const data = getStorage<UserSettings>('settings', INITIAL_USER_SETTINGS);
    return { success: true, data, isDemo: true };
  },

  async updateSettings(settings: Partial<UserSettings>): Promise<ApiResponse<UserSettings>> {
    try {
      const token = localStorage.getItem('she_twin_token');
      if (token && !token.startsWith('demo_')) {
        const res = await fetch(`${API_BASE_URL}/settings`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(settings),
        });
        if (res.ok) {
          const data = await res.json();
          return { success: true, data };
        }
      }
    } catch {
      // Fallback
    }

    const current = getStorage<UserSettings>('settings', INITIAL_USER_SETTINGS);
    const updated = { ...current, ...settings };
    setStorage('settings', updated);
    return { success: true, data: updated, isDemo: true };
  },

  // === ADDITIVE FEATURES APIS ===

  // 1. Location Management
  async getLocation(): Promise<ApiResponse<UserLocationData>> {
    try {
      const res = await fetch(`${API_BASE_URL}/location`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      }
    } catch {
      // Fallback
    }
    const data = getStorage<UserLocationData>('user_location', {
      id: 'loc_demo',
      userId: 'usr_demo_01',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500081',
      isPrimary: true
    });
    return { success: true, data, isDemo: true };
  },

  async updateLocation(loc: { city: string; state: string; pincode: string; latitude?: number; longitude?: number }): Promise<ApiResponse<UserLocationData>> {
    try {
      const res = await fetch(`${API_BASE_URL}/location`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(loc),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      }
    } catch {
      // Fallback
    }
    const updated: UserLocationData = {
      id: `loc_${Date.now()}`,
      userId: 'usr_demo_01',
      ...loc,
      isPrimary: true
    };
    setStorage('user_location', updated);
    return { success: true, data: updated, isDemo: true };
  },

  // 2. Life-Stage Health Modes
  async getLifeStage(): Promise<ApiResponse<LifeStageData>> {
    try {
      const res = await fetch(`${API_BASE_URL}/lifestage`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      }
    } catch {
      // Fallback
    }
    const data = getStorage<LifeStageData>('user_lifestage', {
      id: 'ls_demo',
      userId: 'usr_demo_01',
      currentMode: 'My Health'
    });
    return { success: true, data, isDemo: true };
  },

  async updateLifeStage(mode: string, notes?: string, metadata?: Record<string, any>): Promise<ApiResponse<LifeStageData>> {
    try {
      const res = await fetch(`${API_BASE_URL}/lifestage`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ mode, notes, metadata }),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      }
    } catch {
      // Fallback
    }
    const updated: LifeStageData = {
      id: `ls_${Date.now()}`,
      userId: 'usr_demo_01',
      currentMode: mode,
      notes,
      metadata
    };
    setStorage('user_lifestage', updated);
    return { success: true, data: updated, isDemo: true };
  },

  // 3. Smart Adaptive Onboarding
  async getOnboardingQuestions(lifeStage?: string): Promise<ApiResponse<OnboardingQuestionData[]>> {
    try {
      const url = lifeStage ? `${API_BASE_URL}/onboarding/questions?life_stage=${encodeURIComponent(lifeStage)}` : `${API_BASE_URL}/onboarding/questions`;
      const res = await fetch(url, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      }
    } catch {
      // Fallback
    }
    return {
      success: true,
      data: [
        { id: 'q1', title: 'What is your primary wellness focus?', type: 'select', category: 'General', options: [{ label: 'Energy & Metabolism', value: 'metabolic' }, { label: 'Preventive Screening', value: 'preventive' }] }
      ],
      isDemo: true
    };
  },

  async submitOnboarding(payload: { lifeStageMode: string; responses: Record<string, any>; completedSteps?: string[] }): Promise<ApiResponse<OnboardingResponseData>> {
    try {
      const res = await fetch(`${API_BASE_URL}/onboarding/submit`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      }
    } catch {
      // Fallback
    }
    const resData: OnboardingResponseData = {
      id: `onb_${Date.now()}`,
      userId: 'usr_demo_01',
      lifeStageMode: payload.lifeStageMode,
      responses: payload.responses,
      completedSteps: payload.completedSteps || ['step_1'],
      isCompleted: 'completed'
    };
    setStorage('user_onboarding', resData);
    return { success: true, data: resData, isDemo: true };
  },

  // 4. Symptom Assessment & Emergency Red Flags
  async recordSymptoms(payload: { lifeStageMode?: string; symptoms: SymptomItemData[]; severity?: string; duration?: string; notes?: string }): Promise<ApiResponse<SymptomAssessmentData>> {
    try {
      const res = await fetch(`${API_BASE_URL}/assessments/symptoms`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      }
    } catch {
      // Fallback
    }
    const isEmergency = payload.symptoms.some(s => s.name.toLowerCase().includes('chest pain') || s.name.toLowerCase().includes('bleeding'));
    const dummy: SymptomAssessmentData = {
      id: `symp_${Date.now()}`,
      userId: 'usr_demo_01',
      lifeStageMode: payload.lifeStageMode || 'My Health',
      symptoms: payload.symptoms,
      severity: payload.severity || 'Mild',
      duration: payload.duration || '1-3 days',
      notes: payload.notes,
      hasEmergencyFlags: isEmergency,
      emergencyReasons: isEmergency ? ['Emergency Red Flag Keyword Detected'] : [],
      createdAt: new Date().toISOString()
    };
    return { success: true, data: dummy, isDemo: true };
  },

  // 5. Deterministic Risk Engine Evaluation
  async evaluateRisk(payload?: { lifeStageMode?: string; symptoms?: SymptomItemData[] }): Promise<ApiResponse<RiskAssessmentData>> {
    try {
      const res = await fetch(`${API_BASE_URL}/assessments/evaluate-risk`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload || {}),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      }
    } catch {
      // Fallback
    }
    const dummy: RiskAssessmentData = {
      id: `risk_${Date.now()}`,
      userId: 'usr_demo_01',
      screeningTier: 'Medium Concern',
      riskCategory: 'Iron Deficiency & Metabolic Wellness',
      riskScore: 38.5,
      isEmergency: false,
      contributingFactors: ['Hemoglobin slightly below reference threshold (11.8 g/dL)', 'Reported occasional fatigue'],
      dataPointsUsed: ['Health Twin Vitals', 'Confirmed CBC Lab Panel'],
      recommendedNextSteps: ['Consult a General Physician / Gynecologist', 'Maintain dietary iron and Vitamin C intake', 'Repeat CBC in 3 months'],
      suggestedSpecialty: 'Obstetrics & Gynecology (OB-GYN)',
      disclaimer: 'Preliminary algorithmic screening for wellness guidance. Not a clinical diagnosis.',
      createdAt: new Date().toISOString()
    };
    return { success: true, data: dummy, isDemo: true };
  },

  async getLatestRisk(): Promise<ApiResponse<RiskAssessmentData>> {
    try {
      const res = await fetch(`${API_BASE_URL}/assessments/latest-risk`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      }
    } catch {
      // Fallback
    }
    return this.evaluateRisk();
  },

  // 6. Confirmed Lab Results Verification
  async confirmLabResults(payload: { reportId?: string; testDate: string; items: ConfirmedLabItemData[] }): Promise<ApiResponse<ConfirmedLabData[]>> {
    try {
      const res = await fetch(`${API_BASE_URL}/labs/confirm`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      }
    } catch {
      // Fallback
    }
    const savedList: ConfirmedLabData[] = payload.items.map((item, idx) => ({
      id: `lab_${Date.now()}_${idx}`,
      userId: 'usr_demo_01',
      reportId: payload.reportId,
      testName: item.testName,
      category: item.category || 'Hematology',
      value: item.value,
      numericValue: item.numericValue,
      unit: item.unit,
      referenceRange: item.referenceRange,
      status: item.status || 'normal',
      isUserConfirmed: true,
      userNotes: item.userNotes,
      testDate: item.testDate || payload.testDate,
      createdAt: new Date().toISOString()
    }));
    const existing = getStorage<ConfirmedLabData[]>('confirmed_labs', []);
    setStorage('confirmed_labs', [...savedList, ...existing]);
    return { success: true, data: savedList, isDemo: true };
  },

  async getConfirmedLabs(): Promise<ApiResponse<ConfirmedLabData[]>> {
    try {
      const res = await fetch(`${API_BASE_URL}/labs/confirmed`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      }
    } catch {
      // Fallback
    }
    const data = getStorage<ConfirmedLabData[]>('confirmed_labs', [
      {
        id: 'lab_init_1',
        userId: 'usr_demo_01',
        testName: 'Hemoglobin (Hb)',
        category: 'Hematology',
        value: '11.8',
        numericValue: 11.8,
        unit: 'g/dL',
        referenceRange: '12.0 - 15.5',
        status: 'low',
        isUserConfirmed: true,
        testDate: '2026-10-05',
        createdAt: '2026-10-05T10:00:00Z'
      }
    ]);
    return { success: true, data, isDemo: true };
  },

  // 7. Care Navigation & Doctor Specialty Matching
  async getCareNavigation(specialtyFilter?: string, cityFilter?: string): Promise<ApiResponse<CareNavigationData>> {
    try {
      const params = new URLSearchParams();
      if (specialtyFilter) params.append('specialty_filter', specialtyFilter);
      if (cityFilter) params.append('city_filter', cityFilter);
      const res = await fetch(`${API_BASE_URL}/doctors/care-navigation?${params.toString()}`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      }
    } catch {
      // Fallback
    }
    return {
      success: true,
      data: {
        user_city: cityFilter || 'Hyderabad',
        recommended_specialty: specialtyFilter || 'Obstetrics & Gynecology (OB-GYN)',
        is_emergency: false,
        emergency_helpline: null,
        matched_providers: [
          {
            id: 'doc-1',
            name: 'Dr. Sunita Rao, MD, DGO',
            specialty: 'Obstetrics & Gynecology (OB-GYN)',
            hospital: 'Apollo Cradle & Women\'s Hospital',
            tier: 'Tier 1 Comprehensive Care',
            city: 'Hyderabad',
            state: 'Telangana',
            distance: '2.4 km',
            rating: 4.9,
            teleconsult_available: true,
            languages: ['English', 'Telugu', 'Hindi'],
            experience: '18 years',
            focus_areas: ['PCOS', 'High-Risk Pregnancy', 'Hormonal Balance'],
            relevance_score: 95
          }
        ],
        appointment_prep_checklist: [
          'Bring your digital lab reports downloaded from SHE Twin AI',
          'List down duration and severity of key symptoms tracked',
          'Record your last menstrual period (LMP) date and cycle length',
          'Note all current vitamins and prescriptions'
        ]
      },
      isDemo: true
    };
  },

  // 8. Health Twin Timeline & Reminders
  async getHealthTimeline(): Promise<ApiResponse<{ totalEvents: number; events: TimelineEventData[] }>> {
    try {
      const res = await fetch(`${API_BASE_URL}/twin/timeline`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      }
    } catch {
      // Fallback
    }
    return {
      success: true,
      data: {
        totalEvents: 2,
        events: [
          {
            id: 'evt_1',
            type: 'medical_report',
            title: 'Report Uploaded: CBC_Iron_Panel_Oct2026.pdf',
            category: 'Complete Blood Count (CBC)',
            date: '2026-10-05',
            badge: 'Analyzed',
            badgeColor: 'indigo',
            summary: 'Mild microcytic anemia showing positive recovery compared to previous 3-month labs.'
          },
          {
            id: 'evt_2',
            type: 'lab_result',
            title: 'Verified Metric: Hemoglobin (Hb) (11.8 g/dL)',
            category: 'Hematology',
            date: '2026-10-05',
            badge: 'LOW',
            badgeColor: 'rose',
            summary: 'Reference: 12.0 - 15.5 g/dL'
          }
        ]
      },
      isDemo: true
    };
  },

  async getReminders(): Promise<ApiResponse<HealthReminderData[]>> {
    try {
      const res = await fetch(`${API_BASE_URL}/twin/reminders`, { headers: getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      }
    } catch {
      // Fallback
    }
    const data = getStorage<HealthReminderData[]>('health_reminders', [
      {
        id: 'rem_1',
        userId: 'usr_demo_01',
        title: 'Quarterly Iron & Ferritin Checkup',
        reminderType: 'Lab Test',
        description: 'Follow-up on microcytic anemia recovery',
        dueDate: '2026-11-15',
        isCompleted: false,
        priority: 'High'
      }
    ]);
    return { success: true, data, isDemo: true };
  },

  async createReminder(payload: { title: string; reminderType?: string; description?: string; dueDate: string; priority?: string }): Promise<ApiResponse<HealthReminderData>> {
    try {
      const res = await fetch(`${API_BASE_URL}/twin/reminders`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      }
    } catch {
      // Fallback
    }
    const rems = getStorage<HealthReminderData[]>('health_reminders', []);
    const newRem: HealthReminderData = {
      id: `rem_${Date.now()}`,
      userId: 'usr_demo_01',
      title: payload.title,
      reminderType: payload.reminderType || 'Follow-up',
      description: payload.description,
      dueDate: payload.dueDate,
      isCompleted: false,
      priority: payload.priority || 'Medium',
      createdAt: new Date().toISOString()
    };
    setStorage('health_reminders', [newRem, ...rems]);
    return { success: true, data: newRem, isDemo: true };
  },

  async toggleReminder(id: string): Promise<ApiResponse<HealthReminderData>> {
    try {
      const res = await fetch(`${API_BASE_URL}/twin/reminders/${id}/toggle`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        return { success: true, data };
      }
    } catch {
      // Fallback
    }
    const rems = getStorage<HealthReminderData[]>('health_reminders', []);
    const updated = rems.map(r => r.id === id ? { ...r, isCompleted: !r.isCompleted } : r);
    setStorage('health_reminders', updated);
    const target = updated.find(r => r.id === id);
    return { success: true, data: target, isDemo: true };
  },

  // Reset demo storage to fresh defaults
  resetDemoData(): void {
    localStorage.removeItem('she_twin_health_twin');
    localStorage.removeItem('she_twin_vitals_history');
    localStorage.removeItem('she_twin_reports');
    localStorage.removeItem('she_twin_cycle_logs');
    localStorage.removeItem('she_twin_family_members');
    localStorage.removeItem('she_twin_appointments');
    localStorage.removeItem('she_twin_settings');
    localStorage.removeItem('she_twin_user_location');
    localStorage.removeItem('she_twin_user_lifestage');
    localStorage.removeItem('she_twin_user_onboarding');
    localStorage.removeItem('she_twin_confirmed_labs');
    localStorage.removeItem('she_twin_health_reminders');
  },
};

// === ADDITIVE INTERFACES ===
export interface UserLocationData {
  id: string;
  userId: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  isPrimary?: boolean;
}

export interface LifeStageData {
  id: string;
  userId: string;
  currentMode: string;
  startedAt?: string;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface OnboardingQuestionData {
  id: string;
  title: string;
  description?: string;
  type: string;
  category: string;
  options?: { label: string; value: string }[];
}

export interface OnboardingResponseData {
  id: string;
  userId: string;
  lifeStageMode: string;
  responses: Record<string, any>;
  completedSteps: string[];
  isCompleted: string;
}

export interface SymptomItemData {
  name: string;
  severity: string;
  duration: string;
  bodyPart?: string;
}

export interface SymptomAssessmentData {
  id: string;
  userId: string;
  lifeStageMode: string;
  symptoms: SymptomItemData[];
  severity: string;
  duration: string;
  notes?: string;
  hasEmergencyFlags: boolean;
  emergencyReasons: string[];
  createdAt: string;
}

export interface RiskAssessmentData {
  id: string;
  userId: string;
  screeningTier: string;
  riskCategory: string;
  riskScore: number;
  isEmergency: boolean;
  emergencyActionRecommended?: string;
  contributingFactors: string[];
  dataPointsUsed: string[];
  recommendedNextSteps: string[];
  suggestedSpecialty: string;
  disclaimer: string;
  createdAt: string;
}

export interface ConfirmedLabItemData {
  testName: string;
  category?: string;
  value: string;
  numericValue?: number;
  unit: string;
  referenceRange?: string;
  status?: string;
  userNotes?: string;
  testDate?: string;
}

export interface ConfirmedLabData {
  id: string;
  userId: string;
  reportId?: string;
  testName: string;
  category: string;
  value: string;
  numericValue?: number;
  unit: string;
  referenceRange?: string;
  status: string;
  isUserConfirmed: boolean;
  userNotes?: string;
  testDate: string;
  createdAt: string;
}

export interface MatchedCareProvider {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  tier: string;
  city: string;
  state: string;
  distance: string;
  rating: number;
  teleconsult_available: boolean;
  languages: string[];
  experience: string;
  focus_areas: string[];
  relevance_score?: number;
}

export interface CareNavigationData {
  user_city: string;
  recommended_specialty: string;
  is_emergency: boolean;
  emergency_helpline?: string | null;
  matched_providers: MatchedCareProvider[];
  appointment_prep_checklist: string[];
}

export interface TimelineEventData {
  id: string;
  type: string;
  title: string;
  category?: string;
  date: string;
  badge: string;
  badgeColor: string;
  summary?: string;
}

export interface HealthReminderData {
  id: string;
  userId: string;
  title: string;
  reminderType: string;
  description?: string;
  dueDate: string;
  isCompleted: boolean;
  priority: string;
  createdAt?: string;
}

