// TypeScript data definitions for SHE Twin AI

export type UserRole = 'patient' | 'doctor' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  gender?: 'Female' | 'Male' | 'Other';
  avatarUrl?: string;
  role: UserRole;
  createdAt: string;
  isDemoUser?: boolean;
  isNewAccount?: boolean;
}

export interface HealthTwinProfile {
  id: string;
  userId: string;
  fullName: string;
  age: number;
  gender: 'Female' | 'Male' | 'Other' | 'Prefer not to say';
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Unknown' | 'Nil';
  heightCm: number;
  weightKg: number;
  bmi: number;
  allergies: string[];
  chronicConditions: string[];
  currentMedications: string[];
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  lifestyle: {
    activityLevel: 'Sedentary' | 'Lightly Active' | 'Moderately Active' | 'Very Active' | 'Nil';
    sleepHoursPerDay: number;
    dietType: 'Non-Vegetarian' | 'Vegetarian' | 'Vegan' | 'Pescatarian' | 'Other' | 'Nil';
    waterIntakeLiters: number;
  };
  latestVitals: {
    bloodPressureSystolic: number;
    bloodPressureDiastolic: number;
    heartRateBpm: number;
    fastingGlucoseMgDl: number;
    spo2Percentage: number;
    temperatureCelsius: number;
    recordedAt: string;
  };
  lastUpdated: string;
}

export interface VitalLogEntry {
  id: string;
  date: string;
  systolic: number;
  diastolic: number;
  heartRate: number;
  glucose: number;
  weight: number;
  bmi: number;
  spo2: number;
  notes?: string;
}

export interface LabTestItem {
  id: string;
  testName: string;
  category: string;
  value: number | string;
  unit: string;
  referenceRange: string;
  status: 'normal' | 'low' | 'high' | 'critical' | 'indeterminate';
  explanation?: string;
}

export interface MedicalReport {
  id: string;
  userId: string;
  fileName: string;
  fileSizeFormatted: string;
  fileType: 'pdf' | 'jpg' | 'png';
  uploadedAt: string;
  reportDate: string;
  labOrHospitalName: string;
  reportCategory: 'Complete Blood Count (CBC)' | 'Lipid Panel' | 'Thyroid Profile' | 'Blood Glucose / HbA1c' | 'Liver Function Test' | 'Hormonal Panel' | 'General Ultrasound' | 'Other';
  status: 'processing' | 'analyzed' | 'failed';
  doctorName?: string;
  extractedTextPreview?: string;
  aiSummaryNotes?: string;
  keyInsights: string[];
  testResults: LabTestItem[];
  isDemoReport?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  isDemoSimulation?: boolean;
  suggestedFollowUps?: string[];
  sources?: string[];
}

export interface CycleLog {
  id: string;
  startDate: string;
  endDate?: string;
  cycleLengthDays: number;
  periodLengthDays: number;
  flowIntensity: 'Light' | 'Medium' | 'Heavy' | 'Spotting';
  symptoms: string[];
  mood: 'Happy' | 'Calm' | 'Energetic' | 'Tired' | 'Anxious' | 'Irritable' | 'Cramps/Pain';
  notes?: string;
}

export interface FamilyMember {
  id: string;
  primaryUserId: string;
  name: string;
  relationship: 'Mother' | 'Father' | 'Daughter' | 'Son' | 'Sister' | 'Brother' | 'Spouse' | 'Grandmother' | 'Grandfather' | 'Other';
  age: number;
  gender: 'Female' | 'Male' | 'Other';
  bloodGroup: string;
  allergies: string[];
  chronicConditions: string[];
  lastCheckupDate?: string;
  notes?: string;
  avatarColor: string;
}

export interface Doctor {
  id: string;
  name: string;
  title: string;
  specialty: 'Gynecologist & Obstetrician' | 'General Physician' | 'Endocrinologist' | 'Cardiologist' | 'Dermatologist' | 'Nutritionist & Dietitian' | 'Pediatrician';
  experienceYears: number;
  qualification: string;
  clinicOrHospital: string;
  location: string;
  rating: number;
  reviewCount: number;
  consultationFee: string;
  availableDays: string[];
  availableTimeSlot: string;
  phone?: string;
  email?: string;
  isDemoListing?: boolean;
}

export interface AppointmentRequest {
  id: string;
  doctorId: string;
  doctorName: string;
  specialty: string;
  patientName: string;
  preferredDate: string;
  preferredTime: string;
  reasonForVisit: string;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  bookedAt: string;
  isDemoBooking?: boolean;
}

export interface UserSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  menstrualCycleReminders: boolean;
  medicationReminders: boolean;
  dataSharingForResearch: boolean;
  twoFactorAuthEnabled: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
}
