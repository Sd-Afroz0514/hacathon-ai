import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Search,
  Filter,
  Star,
  MapPin,
  Calendar,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useHealth } from '../context/HealthContext';
import { useLanguage } from '../context/LanguageContext';
import { Doctor } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { EmptyState } from '../components/common/EmptyState';
import { useAuth } from '../context/AuthContext';

export const DoctorsPage: React.FC = () => {
  const { doctors, appointments, bookDoctorAppointment, healthTwin } = useHealth();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('All');
  const [bookingDoctor, setBookingDoctor] = useState<Doctor | null>(null);

  // Booking Form State
  const [patientName, setPatientName] = useState(() => user?.name || healthTwin?.fullName || 'Patient');

  useEffect(() => {
    if (user?.name) {
      setPatientName(user.name);
    }
  }, [user]);

  const [preferredDate, setPreferredDate] = useState(new Date().toISOString().split('T')[0]);
  const [preferredTime, setPreferredTime] = useState('11:00 AM');
  const [reason, setReason] = useState('');
  const [isBooking, setIsBooking] = useState(false);

  const specialties = [
    'All',
    'Gynecologist & Obstetrician',
    'General Physician',
    'Endocrinologist',
    'Nutritionist & Dietitian',
    'Cardiologist',
  ];

  const filteredDoctors = doctors.filter((doc) => {
    const matchesSpec = selectedSpecialty === 'All' || doc.specialty === selectedSpecialty;
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      doc.name.toLowerCase().includes(q) ||
      doc.clinicOrHospital.toLowerCase().includes(q) ||
      doc.location.toLowerCase().includes(q) ||
      doc.specialty.toLowerCase().includes(q);
    return matchesSpec && matchesQuery;
  });

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingDoctor) return;
    setIsBooking(true);

    await bookDoctorAppointment({
      doctorId: bookingDoctor.id,
      doctorName: bookingDoctor.name,
      specialty: bookingDoctor.specialty,
      patientName,
      preferredDate,
      preferredTime,
      reasonForVisit: reason || 'Routine health review & Twin consultation',
    });

    setIsBooking(false);
    setBookingDoctor(null);
    setReason('');
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-navy-950 tracking-tight">
            {t('page.doctors.title', 'Find Verified Doctors')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {t('page.doctors.subtitle', 'Connect with board-certified gynecologists, physicians, endocrinologists, and dietitians.')}
          </p>
        </div>
      </div>

      {/* Demo Notice Banner */}
      <div className="p-3.5 bg-teal-50/70 border border-teal-200/80 rounded-2xl flex items-start gap-3 text-xs text-teal-950">
        <Sparkles className="w-4 h-4 text-teal-700 flex-shrink-0 mt-0.5" />
        <div>
          <strong>{t('doctors.noticeTitle', 'Directory Notice:')}</strong> {t('doctors.noticeText', 'Doctor profiles and appointment booking options displayed below are fictional sample listings designed for platform evaluation and demonstration.')}
        </div>
      </div>

      {/* 2. Search & Specialty Filters Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-soft">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by doctor name, clinic, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-teal-600 focus:ring-1 focus:ring-teal-100"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <Filter className="w-4 h-4 text-slate-400 flex-shrink-0 hidden sm:inline" />
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="text-xs bg-slate-50 rounded-xl border border-slate-200 py-2 px-3 font-semibold text-slate-700 focus:bg-white focus:border-teal-600"
          >
            {specialties.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Doctor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredDoctors.map((doc) => (
          <Card key={doc.id} className="hover:shadow-card transition duration-150 flex flex-col justify-between">
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-base flex-shrink-0 shadow-xs">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{doc.name}</h3>
                    <p className="text-xs font-semibold text-teal-700">{doc.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{doc.qualification}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-lg text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>{doc.rating}</span>
                  <span className="text-[10px] text-slate-400 font-normal">({doc.reviewCount})</span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{doc.clinicOrHospital}, {doc.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span>{doc.availableTimeSlot} ({doc.availableDays.join(', ')})</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 font-semibold">
                  <span className="text-slate-500">Consultation Fee</span>
                  <span className="text-teal-800 font-bold text-sm">{doc.consultationFee}</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2">
                <span className="text-[11px] text-slate-400">
                  {doc.experienceYears} Years Experience
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setBookingDoctor(doc)}
                  leftIcon={<Calendar className="w-3.5 h-3.5" />}
                >
                  Request Consultation
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredDoctors.length === 0 && (
          <div className="col-span-2">
            <EmptyState
              title="No Doctors Found"
              description="Try modifying your search keywords or specialty filter."
            />
          </div>
        )}
      </div>

      {/* 4. Active Appointments Section */}
      {appointments.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Your Consultation Requests ({appointments.length})</CardTitle>
            <CardDescription>Scheduled or pending appointment requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{apt.doctorName}</h4>
                      <Badge variant="teal" size="sm">{apt.specialty}</Badge>
                      <Badge variant="success" size="sm">{apt.status}</Badge>
                    </div>
                    <p className="text-slate-500">
                      📅 {apt.preferredDate} at {apt.preferredTime} • Patient: {apt.patientName}
                    </p>
                    <p className="text-slate-600 italic">Reason: {apt.reasonForVisit}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Booking Modal */}
      <Modal
        isOpen={!!bookingDoctor}
        onClose={() => setBookingDoctor(null)}
        title={`Request Appointment with ${bookingDoctor?.name || 'Doctor'}`}
        description={`${bookingDoctor?.specialty} • ${bookingDoctor?.clinicOrHospital}`}
        maxWidth="lg"
      >
        <form onSubmit={handleBookingSubmit} className="space-y-4">
          <Input
            label="Patient Name"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Preferred Date"
              type="date"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              required
            />
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                Preferred Time Slot
              </label>
              <select
                value={preferredTime}
                onChange={(e) => setPreferredTime(e.target.value)}
                className="w-full bg-white rounded-xl border border-slate-300 py-2.5 px-3 text-sm text-slate-900"
              >
                <option value="10:00 AM">10:00 AM</option>
                <option value="11:30 AM">11:30 AM</option>
                <option value="02:00 PM">02:00 PM</option>
                <option value="04:30 PM">04:30 PM</option>
                <option value="06:00 PM">06:00 PM</option>
              </select>
            </div>
          </div>

          <Input
            label="Reason for Consultation / Symptoms"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. PCOS follow-up, blood report review, iron deficiency advice"
            required
          />

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setBookingDoctor(null)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isBooking}
            >
              Confirm Consultation Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
