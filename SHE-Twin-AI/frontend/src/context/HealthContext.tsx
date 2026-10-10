import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  HealthTwinProfile,
  VitalLogEntry,
  MedicalReport,
  CycleLog,
  FamilyMember,
  Doctor,
  AppointmentRequest,
} from '../types';
import { apiService } from '../services/api';
import { useToast } from './ToastContext';
import { useAuth } from './AuthContext';

interface HealthContextType {
  healthTwin: HealthTwinProfile | null;
  vitalsHistory: VitalLogEntry[];
  reports: MedicalReport[];
  cycleLogs: CycleLog[];
  familyMembers: FamilyMember[];
  doctors: Doctor[];
  appointments: AppointmentRequest[];
  isLoading: boolean;
  updateHealthTwin: (updates: Partial<HealthTwinProfile>) => Promise<boolean>;
  addVitalLog: (entry: Omit<VitalLogEntry, 'id'>) => Promise<boolean>;
  uploadReport: (file: File, category: string) => Promise<MedicalReport | null>;
  deleteReport: (id: string) => Promise<boolean>;
  addCycleLog: (log: Omit<CycleLog, 'id'>) => Promise<boolean>;
  addFamilyMember: (member: Omit<FamilyMember, 'id' | 'primaryUserId' | 'avatarColor'>) => Promise<boolean>;
  updateFamilyMember: (id: string, updates: Partial<FamilyMember>) => Promise<boolean>;
  deleteFamilyMember: (id: string) => Promise<boolean>;
  bookDoctorAppointment: (req: Omit<AppointmentRequest, 'id' | 'status' | 'bookedAt' | 'isDemoBooking'>) => Promise<boolean>;
  refreshAllData: () => Promise<void>;
  resetToDemoDefaults: () => void;
}

const HealthContext = createContext<HealthContextType | undefined>(undefined);

export const HealthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { success, error } = useToast();
  const { user } = useAuth();
  const [healthTwin, setHealthTwin] = useState<HealthTwinProfile | null>(null);
  const [vitalsHistory, setVitalsHistory] = useState<VitalLogEntry[]>([]);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [cycleLogs, setCycleLogs] = useState<CycleLog[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [twinRes, vitalsRes, reportsRes, cycleRes, famRes, docRes, aptRes] = await Promise.all([
        apiService.getHealthTwin(),
        apiService.getVitalsHistory(),
        apiService.getReports(),
        apiService.getCycleLogs(),
        apiService.getFamilyMembers(),
        apiService.getDoctors(),
        apiService.getAppointments(),
      ]);

      if (twinRes.data) {
        if (user?.name && twinRes.data.fullName !== user.name && user.id !== 'usr_demo_01') {
          twinRes.data.fullName = user.name;
        }
        setHealthTwin(twinRes.data);
      }
      if (vitalsRes.data) setVitalsHistory(vitalsRes.data);
      if (reportsRes.data) setReports(reportsRes.data);
      if (cycleRes.data) setCycleLogs(cycleRes.data);
      if (famRes.data) setFamilyMembers(famRes.data);
      if (docRes.data) setDoctors(docRes.data);
      if (aptRes.data) setAppointments(aptRes.data);
    } catch (err) {
      console.error('Failed to load health data', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAllData();
  }, [user, refreshAllData]);


  const updateHealthTwin = async (updates: Partial<HealthTwinProfile>): Promise<boolean> => {
    try {
      const res = await apiService.updateHealthTwin(updates);
      if (res.success && res.data) {
        setHealthTwin(res.data);
        success('Health Twin Updated', 'Profile measurements and conditions successfully synchronized.');
        return true;
      }
      error('Update Failed', res.error || 'Could not update Health Twin.');
      return false;
    } catch {
      error('Error', 'An unexpected error occurred while saving.');
      return false;
    }
  };

  const addVitalLog = async (entry: Omit<VitalLogEntry, 'id'>): Promise<boolean> => {
    try {
      const res = await apiService.addVitalLog(entry);
      if (res.success && res.data) {
        setVitalsHistory((prev) => [...prev, res.data!]);
        // Update local twin vitals as well
        if (healthTwin) {
          setHealthTwin({
            ...healthTwin,
            weightKg: entry.weight || healthTwin.weightKg,
            bmi: entry.bmi || healthTwin.bmi,
            latestVitals: {
              bloodPressureSystolic: entry.systolic,
              bloodPressureDiastolic: entry.diastolic,
              heartRateBpm: entry.heartRate,
              fastingGlucoseMgDl: entry.glucose,
              spo2Percentage: entry.spo2,
              temperatureCelsius: healthTwin.latestVitals.temperatureCelsius,
              recordedAt: new Date().toISOString(),
            },
            lastUpdated: new Date().toISOString(),
          });
        }
        success('Vitals Logged', 'New health metrics recorded into your trend history.');
        return true;
      }
      return false;
    } catch {
      error('Error', 'Failed to log vitals.');
      return false;
    }
  };

  const uploadReport = async (file: File, category: string): Promise<MedicalReport | null> => {
    try {
      const res = await apiService.uploadReport(file, category);
      if (res.success && res.data) {
        setReports((prev) => [res.data!, ...prev]);
        success('Report Analyzed', `${file.name} processed and laboratory parameters structured.`);
        return res.data;
      }
      error('Upload Failed', res.error || 'Could not process medical report.');
      return null;
    } catch {
      error('Upload Error', 'Failed to upload and analyze document.');
      return null;
    }
  };

  const deleteReport = async (id: string): Promise<boolean> => {
    try {
      const res = await apiService.deleteReport(id);
      if (res.success) {
        setReports((prev) => prev.filter((r) => r.id !== id));
        success('Report Removed', 'The medical document has been removed from your history.');
        return true;
      }
      return false;
    } catch {
      error('Error', 'Could not delete report.');
      return false;
    }
  };

  const addCycleLog = async (log: Omit<CycleLog, 'id'>): Promise<boolean> => {
    try {
      const res = await apiService.addCycleLog(log);
      if (res.success && res.data) {
        setCycleLogs((prev) => [res.data!, ...prev]);
        success('Cycle Logged', 'Menstrual and symptom record saved securely.');
        return true;
      }
      return false;
    } catch {
      error('Error', 'Could not record cycle entry.');
      return false;
    }
  };

  const addFamilyMember = async (member: Omit<FamilyMember, 'id' | 'primaryUserId' | 'avatarColor'>): Promise<boolean> => {
    try {
      const res = await apiService.addFamilyMember(member);
      if (res.success && res.data) {
        setFamilyMembers((prev) => [...prev, res.data!]);
        success('Member Added', `${member.name}'s profile has been created.`);
        return true;
      }
      return false;
    } catch {
      error('Error', 'Could not add family profile.');
      return false;
    }
  };

  const updateFamilyMember = async (id: string, updates: Partial<FamilyMember>): Promise<boolean> => {
    try {
      const res = await apiService.updateFamilyMember(id, updates);
      if (res.success && res.data) {
        setFamilyMembers((prev) => prev.map((m) => (m.id === id ? res.data! : m)));
        success('Member Updated', 'Family member details updated.');
        return true;
      }
      return false;
    } catch {
      error('Error', 'Could not update member.');
      return false;
    }
  };

  const deleteFamilyMember = async (id: string): Promise<boolean> => {
    try {
      const res = await apiService.deleteFamilyMember(id);
      if (res.success) {
        setFamilyMembers((prev) => prev.filter((m) => m.id !== id));
        success('Member Removed', 'Family profile deleted.');
        return true;
      }
      return false;
    } catch {
      error('Error', 'Could not remove member.');
      return false;
    }
  };

  const bookDoctorAppointment = async (req: Omit<AppointmentRequest, 'id' | 'status' | 'bookedAt' | 'isDemoBooking'>): Promise<boolean> => {
    try {
      const res = await apiService.bookAppointment(req);
      if (res.success && res.data) {
        setAppointments((prev) => [res.data!, ...prev]);
        success('Consultation Requested', `Appointment requested with ${req.doctorName} for ${req.preferredDate}.`);
        return true;
      }
      return false;
    } catch {
      error('Error', 'Failed to request appointment.');
      return false;
    }
  };

  const resetToDemoDefaults = () => {
    apiService.resetDemoData();
    refreshAllData();
    success('Reset Complete', 'Fictional demo data restored to original initial states.');
  };

  return (
    <HealthContext.Provider
      value={{
        healthTwin,
        vitalsHistory,
        reports,
        cycleLogs,
        familyMembers,
        doctors,
        appointments,
        isLoading,
        updateHealthTwin,
        addVitalLog,
        uploadReport,
        deleteReport,
        addCycleLog,
        addFamilyMember,
        updateFamilyMember,
        deleteFamilyMember,
        bookDoctorAppointment,
        refreshAllData,
        resetToDemoDefaults,
      }}
    >
      {children}
    </HealthContext.Provider>
  );
};

export const useHealth = () => {
  const context = useContext(HealthContext);
  if (!context) {
    throw new Error('useHealth must be used within a HealthProvider');
  }
  return context;
};
