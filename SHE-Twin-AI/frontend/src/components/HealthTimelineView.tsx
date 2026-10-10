import React, { useState, useEffect } from 'react';
import { Clock, Plus, CheckCircle2, Circle, Bell, Calendar, FileText, Activity, Stethoscope } from 'lucide-react';
import { apiService, TimelineEventData, HealthReminderData } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

export const HealthTimelineView: React.FC = () => {
  const { success, error } = useToast();
  const { t } = useLanguage();
  const [events, setEvents] = useState<TimelineEventData[]>([]);
  const [reminders, setReminders] = useState<HealthReminderData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState('Follow-up');
  const [newDate, setNewDate] = useState('');
  const [newPriority] = useState('Medium');

  const loadData = async () => {
    setLoading(true);
    const [timelineRes, remindersRes] = await Promise.all([
      apiService.getHealthTimeline(),
      apiService.getReminders(),
    ]);
    setLoading(false);
    if (timelineRes.data) {
      setEvents(timelineRes.data.events || []);
    }
    if (remindersRes.data) {
      setReminders(remindersRes.data || []);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleToggleReminder = async (id: string) => {
    const res = await apiService.toggleReminder(id);
    if (res.success) {
      setReminders((prev) =>
        prev.map((r) => (r.id === id ? { ...r, isCompleted: !r.isCompleted } : r))
      );
      success(t('common.success', 'Reminder Updated'), 'Reminder status toggled');
    }
  };

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDate) {
      error(t('common.error', 'Input required'), 'Please provide a title and due date');
      return;
    }
    const res = await apiService.createReminder({
      title: newTitle.trim(),
      reminderType: newType,
      dueDate: newDate,
      priority: newPriority,
    });
    if (res.success && res.data) {
      setReminders([res.data, ...reminders]);
      setNewTitle('');
      setNewDate('');
      setShowAddReminder(false);
      success(t('common.success', 'Reminder Added'), 'New health follow-up reminder created');
    } else {
      error(t('common.error', 'Failed to create'), 'Could not save reminder');
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'medical_report':
        return FileText;
      case 'lab_result':
        return Activity;
      case 'symptom_log':
        return Stethoscope;
      default:
        return Clock;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left 2 Cols: Unified Health Twin Timeline */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-400" />
            <h3 className="text-base font-bold text-white">{t('timeline.title', 'Digital Health Twin Timeline')}</h3>
          </div>
          <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
            {events.length} {t('timeline.historicalEvents', 'Historical Events')}
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400 text-xs">{t('timeline.loading', 'Loading health timeline...')}</div>
        ) : events.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
            {t('timeline.empty', 'No health activities logged yet. Upload a report or log symptoms to generate timeline events.')}
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-800 ml-4 pl-6 space-y-6">
            {events.map((ev) => {
              const eventType = (ev as any).eventType || ev.type;
              const eventDate = (ev as any).eventDate || ev.date;
              const eventDesc = (ev as any).description || ev.summary;
              const eventMetrics = (ev as any).metrics;
              const IconComponent = getEventIcon(eventType);
              return (
                <div key={ev.id} className="relative group">
                  <div className="absolute -left-[31px] top-1.5 w-6 h-6 rounded-full bg-slate-900 border-2 border-teal-500 flex items-center justify-center text-teal-400">
                    <IconComponent className="w-3 h-3" />
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all text-xs">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-sm text-white">{ev.title}</span>
                      <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {eventDate}
                      </span>
                    </div>

                    <p className="text-slate-300 text-xs leading-relaxed">{eventDesc}</p>

                    {eventMetrics && Object.keys(eventMetrics).length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-wrap gap-2">
                        {Object.entries(eventMetrics).map(([k, v]) => (
                          <span
                            key={k}
                            className="px-2 py-0.5 rounded-md bg-slate-800 text-[11px] text-teal-300 font-medium border border-slate-700"
                          >
                            {k}: {String(v)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Col: Preventive Reminders */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-teal-400" />
            <h3 className="text-base font-bold text-white">{t('reminders.title', 'Health & Care Reminders')}</h3>
          </div>
          <button
            onClick={() => setShowAddReminder(!showAddReminder)}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-700 text-teal-300 text-xs flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('reminders.add', 'Add')}</span>
          </button>
        </div>

        {/* Add reminder inline form */}
        {showAddReminder && (
          <form onSubmit={handleCreateReminder} className="p-4 rounded-2xl bg-slate-900 border border-teal-500/40 space-y-3 animate-in fade-in">
            <h4 className="text-xs font-bold text-white">{t('reminders.add', 'Create Reminder')}</h4>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Schedule TSH Follow-up Blood Test"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="Follow-up">Follow-up</option>
                  <option value="Medication">Medication</option>
                  <option value="Lab Test">Lab Test</option>
                  <option value="Annual Screening">Annual Screening</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">{t('reminders.dueDate', 'Due Date')}</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-1 text-xs text-white focus:outline-none focus:border-teal-500"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddReminder(false)}
                className="px-3 py-1 rounded-lg border border-slate-700 text-slate-300 text-xs"
              >
                {t('common.cancel', 'Cancel')}
              </button>
              <button
                type="submit"
                className="px-3 py-1 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs"
              >
                {t('common.save', 'Save')}
              </button>
            </div>
          </form>
        )}

        {/* Reminders list */}
        <div className="space-y-2">
          {reminders.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400">
              {t('reminders.empty', 'No pending health reminders. Stay proactive!')}
            </div>
          ) : (
            reminders.map((rem) => (
              <div
                key={rem.id}
                onClick={() => handleToggleReminder(rem.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 text-xs ${
                  rem.isCompleted
                    ? 'bg-slate-900/40 border-slate-800/60 text-slate-500 line-through'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 text-slate-200'
                }`}
              >
                <button type="button" className="mt-0.5 shrink-0">
                  {rem.isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-teal-500" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-500 hover:text-teal-400" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{rem.title}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                    <span>{rem.reminderType}</span>
                    <span>• Due: {rem.dueDate}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
