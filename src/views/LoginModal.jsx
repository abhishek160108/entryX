import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import EntryXLogo from '../components/EntryXLogo';
import { Lock, UserCheck, Smartphone, Shield, Check } from 'lucide-react';

export default function LoginModal({ isOpen, onClose }) {
  const { theaters, selectedTheaterId, handleTheaterChange, setStaffUser, staffUser } = useApp();

  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handlePinDigit = (digit) => {
    if (pin.length < 4) {
      setPin(prev => prev + digit);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const handleSubmit = async (pinToVerify = pin) => {
    if (!pinToVerify || pinToVerify.length !== 4) {
      setError('Please enter a 4-digit PIN');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await api.login(pinToVerify, selectedTheaterId);
      if (res.success && res.staff) {
        setStaffUser(res.staff);
        setPin('');
        onClose();
      } else {
        setError(res.message || 'Invalid Staff PIN');
        setPin('');
      }
    } catch (e) {
      setError('Login connection failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickLogin = (quickPin) => {
    setPin(quickPin);
    handleSubmit(quickPin);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#0B0F19] border border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-5">
        <div className="flex justify-between items-center">
          <EntryXLogo variant="compact" size="sm" />
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs font-bold p-1"
          >
            ✕
          </button>
        </div>

        <div>
          <h2 className="text-lg font-black text-white">Staff Gate Authentication</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Enter your 4-digit usher PIN to activate gate validation
          </p>
        </div>

        {/* Theater Switcher */}
        <div className="text-left">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            Theater Location
          </label>
          <select
            value={selectedTheaterId}
            onChange={(e) => handleTheaterChange(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none"
          >
            {theaters.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.city})
              </option>
            ))}
          </select>
        </div>

        {/* PIN Indicators */}
        <div className="flex justify-center gap-3 my-2">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                pin.length > idx
                  ? 'bg-[#00E676] border-[#00E676] scale-110 shadow-[0_0_10px_#00E676]'
                  : 'bg-transparent border-slate-700'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="text-xs text-red-400 font-semibold bg-red-950/40 border border-red-900/50 py-1.5 px-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Numeric PIN Pad for Fast Mobile Entry */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[240px] mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handlePinDigit(String(digit))}
              className="h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 font-bold text-base text-white active:scale-95 transition-all shadow-sm"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleBackspace}
            className="h-12 rounded-2xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-400 active:scale-95 transition-all"
          >
            DEL
          </button>
          <button
            type="button"
            onClick={() => handlePinDigit('0')}
            className="h-12 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 font-bold text-base text-white active:scale-95 transition-all shadow-sm"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={pin.length !== 4 || isSubmitting}
            className="h-12 rounded-2xl bg-[#00E676] hover:bg-[#00c864] disabled:opacity-30 text-black font-bold text-xs flex items-center justify-center active:scale-95 transition-all shadow-lg shadow-[#00E676]/20"
          >
            OK
          </button>
        </div>

        {/* 1-Tap Quick Staff Switchers for Demo */}
        <div className="pt-3 border-t border-slate-800 text-left">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
            Quick Demo Accounts:
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => quickLogin('1234')}
              className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-[#00E676] text-left truncate"
            >
              <div className="font-bold text-slate-200">Karthik (PIN: 1234)</div>
              <div className="text-[9px] text-slate-400">Gate 1 Usher</div>
            </button>
            <button
              type="button"
              onClick={() => quickLogin('5678')}
              className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-[#00E676] text-left truncate"
            >
              <div className="font-bold text-slate-200">Priya (PIN: 5678)</div>
              <div className="text-[9px] text-slate-400">Gate 2 Usher</div>
            </button>
            <button
              type="button"
              onClick={() => quickLogin('2468')}
              className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-[#00E676] text-left truncate"
            >
              <div className="font-bold text-slate-200">Saravanan (PIN: 2468)</div>
              <div className="text-[9px] text-slate-400">Rohini Supervisor</div>
            </button>
            <button
              type="button"
              onClick={() => quickLogin('9999')}
              className="p-1.5 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-indigo-400 text-left truncate"
            >
              <div className="font-bold text-slate-200">Admin (PIN: 9999)</div>
              <div className="text-[9px] text-slate-400">Duty Manager</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
