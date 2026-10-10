import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import { VitalLogEntry } from '../../types';

interface HealthTrendChartProps {
  data: VitalLogEntry[];
}

export const HealthTrendChart: React.FC<HealthTrendChartProps> = ({ data }) => {
  const [metric, setMetric] = useState<'bp' | 'glucose' | 'weight' | 'heartRate'>('bp');

  const formattedData = data.map((entry) => ({
    date: entry.date.slice(5), // mm-dd
    fullDate: entry.date,
    systolic: entry.systolic,
    diastolic: entry.diastolic,
    glucose: entry.glucose,
    weight: entry.weight,
    heartRate: entry.heartRate,
    spo2: entry.spo2,
    bmi: entry.bmi,
  }));

  const renderChart = () => {
    switch (metric) {
      case 'bp':
        return (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis domain={[60, 140]} stroke="#94a3b8" fontSize={12} tickLine={false} unit=" mmHg" />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Line type="monotone" dataKey="systolic" name="Systolic BP" stroke="#0d9488" strokeWidth={2.5} dot={{ r: 4, fill: '#0d9488' }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="diastolic" name="Diastolic BP" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'glucose':
        return (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="glucoseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis domain={[60, 150]} stroke="#94a3b8" fontSize={12} tickLine={false} unit=" mg/dL" />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Area type="monotone" dataKey="glucose" name="Fasting Glucose" stroke="#0d9488" fillOpacity={1} fill="url(#glucoseGrad)" strokeWidth={2.5} />
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'weight':
        return (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis domain={['dataMin - 2', 'dataMax + 2']} stroke="#94a3b8" fontSize={12} tickLine={false} unit=" kg" />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Line type="monotone" dataKey="weight" name="Weight (kg)" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 4, fill: '#8b5cf6' }} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'heartRate':
        return (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} />
              <YAxis domain={[50, 110]} stroke="#94a3b8" fontSize={12} tickLine={false} unit=" bpm" />
              <Tooltip
                contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" />
              <Line type="monotone" dataKey="heartRate" name="Heart Rate (BPM)" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 4, fill: '#f43f5e' }} />
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl">
          <button
            onClick={() => setMetric('bp')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              metric === 'bp' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Blood Pressure
          </button>
          <button
            onClick={() => setMetric('glucose')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              metric === 'glucose' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Fasting Glucose
          </button>
          <button
            onClick={() => setMetric('weight')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              metric === 'weight' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Weight / BMI
          </button>
          <button
            onClick={() => setMetric('heartRate')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              metric === 'heartRate' ? 'bg-white text-teal-800 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Heart Rate
          </button>
        </div>
      </div>
      {renderChart()}
    </div>
  );
};
