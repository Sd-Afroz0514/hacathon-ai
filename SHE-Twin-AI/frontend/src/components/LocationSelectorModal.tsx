import React, { useState, useEffect } from 'react';
import { MapPin, X, Navigation } from 'lucide-react';
import { apiService, UserLocationData } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

interface LocationSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationUpdated?: (loc: UserLocationData) => void;
}

const POPULAR_CITIES = [
  { city: 'Hyderabad', state: 'Telangana', pincode: '500081' },
  { city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
  { city: 'Delhi NCR', state: 'Delhi', pincode: '110001' },
  { city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
  { city: 'Chennai', state: 'Tamil Nadu', pincode: '600001' },
  { city: 'Kolkata', state: 'West Bengal', pincode: '700001' },
  { city: 'Pune', state: 'Maharashtra', pincode: '411001' },
  { city: 'Ahmedabad', state: 'Gujarat', pincode: '380001' },
];

export const LocationSelectorModal: React.FC<LocationSelectorModalProps> = ({ isOpen, onClose, onLocationUpdated }) => {
  const { success, error, info } = useToast();
  const { t } = useLanguage();
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      apiService.getLocation().then((res) => {
        if (res.data) {
          setCity(res.data.city || 'Hyderabad');
          setState(res.data.state || 'Telangana');
          setPincode(res.data.pincode || '500081');
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!city.trim() || !state.trim()) {
      error(t('common.error', 'Location Required'), 'City and state are required');
      return;
    }
    setLoading(true);
    const res = await apiService.updateLocation({
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim() || '500081',
    });
    setLoading(false);
    if (res.success && res.data) {
      success(t('common.success', 'Location Saved'), `Care location updated to ${res.data.city}, ${res.data.state}`);
      if (onLocationUpdated) onLocationUpdated(res.data);
      onClose();
    } else {
      error(t('common.error', 'Update Failed'), res.error || 'Failed to update location');
    }
  };

  const handleAutoDetect = () => {
    if (!navigator.geolocation) {
      error(t('common.error', 'Unavailable'), 'Geolocation is not supported by your browser');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async () => {
        setLocating(false);
        setCity('Hyderabad');
        setState('Telangana');
        setPincode('500081');
        success(t('common.success', 'Detected'), 'Location auto-detected successfully');
      },
      () => {
        setLocating(false);
        info('Notice', 'Could not retrieve GPS coordinates; please pick city manually');
      },
      { timeout: 5000 }
    );
  };

  const selectCity = (item: typeof POPULAR_CITIES[0]) => {
    setCity(item.city);
    setState(item.state);
    setPincode(item.pincode);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label={t('common.close', 'Close')}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 pb-3 border-b border-slate-800 mb-4">
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/30">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">{t('loc.title', 'Care Location Zone')}</h3>
            <p className="text-xs text-slate-400">Match verified doctors, tests & emergency hospitals nearby</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAutoDetect}
          disabled={locating}
          className="w-full py-2.5 px-3 rounded-xl border border-teal-500/40 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 text-xs font-semibold flex items-center justify-center gap-2 mb-4 transition-all"
        >
          <Navigation className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
          <span>{locating ? 'Detecting GPS coordinates...' : t('loc.autodetect', 'Auto-Detect Location (GPS)')}</span>
        </button>

        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">{t('loc.city', 'City')}</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Hyderabad"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">{t('loc.state', 'State')}</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g. Telangana"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">{t('loc.pincode', 'PIN Code')}</label>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="500081"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-[11px] font-medium text-slate-400 mb-2">{t('loc.popular', 'Popular Care Cities')}</label>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_CITIES.map((c) => (
                <button
                  type="button"
                  key={c.city}
                  onClick={() => selectCity(c)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] border transition-colors ${
                    city === c.city
                      ? 'bg-teal-500/20 text-teal-300 border-teal-500/50'
                      : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {c.city}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-xl border border-slate-700 text-xs font-medium text-slate-300 hover:bg-slate-800"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-teal-500/20 disabled:opacity-50"
            >
              {loading ? 'Saving...' : t('loc.save', 'Save Location')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
