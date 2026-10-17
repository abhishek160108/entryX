import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  MapPin, 
  User, 
  Film, 
  ArrowRight,
  Ticket
} from 'lucide-react';

export default function FullScreenScanModal({ result, onClose }) {
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    if (!result) return;
    setCountdown(5);

    // Auto-advance countdown
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [result, onClose]);

  if (!result) return null;

  const isSuccess = result.success && result.status === 'VALIDATED';
  const isDuplicate = result.status === 'DUPLICATE_ENTRY';
  const isWrongAuditorium = result.status === 'WRONG_SCREEN' || result.status === 'WRONG_SHOW' || result.status === 'WRONG_THEATER';
  const isSecurityAlert = result.status === 'TAMPERED_SIGNATURE' || result.status === 'UNVERIFIED_PROVIDER' || result.status === 'INVALID_TICKET';

  // Determine color scheme based on status
  let bgGradient = 'from-emerald-950 via-[#071611] to-[#040D0A]';
  let borderColor = 'border-[#00E676]';
  let accentTextColor = 'text-[#00E676]';
  let badgeBg = 'bg-[#00E676]/20 border-[#00E676]/40 text-[#00E676]';
  let iconGlow = 'glow-green';

  if (isDuplicate || result.status === 'TAMPERED_SIGNATURE' || result.status === 'INVALID_TICKET') {
    bgGradient = 'from-rose-950 via-[#1F070A] to-[#0D0405]';
    borderColor = 'border-red-500';
    accentTextColor = 'text-red-500';
    badgeBg = 'bg-red-500/20 border-red-500/40 text-red-400';
    iconGlow = 'glow-red';
  } else if (isWrongAuditorium || result.status === 'UNVERIFIED_PROVIDER') {
    bgGradient = 'from-amber-950 via-[#1A1005] to-[#0D0803]';
    borderColor = 'border-amber-500';
    accentTextColor = 'text-amber-400';
    badgeBg = 'bg-amber-500/20 border-amber-500/40 text-amber-300';
    iconGlow = '';
  }

  const details = result.ticketDetails || {};

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-between p-4 sm:p-6 bg-[#080C14]/95 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
      {/* Top Banner with Status Badge and Auto-dismiss timer */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full animate-ping bg-current" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-300">
            EntryX Validation Engine
          </span>
        </div>
        <button
          onClick={onClose}
          className="px-3 py-1.5 rounded-full bg-slate-800/80 text-xs font-mono text-slate-300 border border-slate-700 hover:bg-slate-700 transition-colors flex items-center gap-1.5"
        >
          <span>Tap to close ({countdown}s)</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Full-Screen Status Card */}
      <div className={`my-auto rounded-3xl p-6 sm:p-8 border-2 ${borderColor} bg-gradient-to-b ${bgGradient} shadow-2xl relative overflow-hidden text-center`}>
        {/* Subtle Watermark */}
        <div className="absolute right-4 top-4 opacity-10 pointer-events-none">
          <Ticket className="w-36 h-36" />
        </div>

        {/* Large Visual Icon */}
        <div className="flex justify-center mb-4">
          <div className={`p-4 rounded-full border-2 ${borderColor} ${iconGlow} bg-slate-900/60 inline-flex`}>
            {isSuccess && <CheckCircle2 className="w-16 h-16 sm:w-20 sm:h-20 text-[#00E676]" />}
            {isDuplicate && <ShieldAlert className="w-16 h-16 sm:w-20 sm:h-20 text-red-500 animate-bounce" />}
            {isSecurityAlert && !isDuplicate && <XCircle className="w-16 h-16 sm:w-20 sm:h-20 text-red-500" />}
            {isWrongAuditorium && <AlertTriangle className="w-16 h-16 sm:w-20 sm:h-20 text-amber-400" />}
          </div>
        </div>

        {/* Main Status Headline */}
        <h1 className={`text-2xl sm:text-4xl font-black tracking-tight mb-2 uppercase ${accentTextColor}`}>
          {result.title}
        </h1>

        <p className="text-slate-200 text-base sm:text-lg font-medium max-w-md mx-auto mb-6">
          {result.message}
        </p>

        {/* Highlighted Core Data: Seats or Warning */}
        {details.seats && details.seats.length > 0 && (
          <div className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-4 sm:p-5 max-w-lg mx-auto mb-5 backdrop-blur-sm shadow-inner">
            <div className="text-[11px] font-mono tracking-widest uppercase text-slate-400 mb-1">
              Authorized Seats ({details.seats.length} Person{details.seats.length > 1 ? 's' : ''})
            </div>
            <div className={`text-3xl sm:text-5xl font-black tracking-wider ${accentTextColor}`}>
              {details.seats.join(', ')}
            </div>
            {details.seatCategory && (
              <div className="mt-1 text-xs sm:text-sm font-semibold tracking-wider text-slate-300 uppercase">
                {details.seatCategory} Class
              </div>
            )}
          </div>
        )}

        {/* Specific Duplicate Alert Details */}
        {isDuplicate && (
          <div className="bg-red-950/80 border border-red-500/50 rounded-2xl p-4 max-w-lg mx-auto mb-5 text-left text-xs sm:text-sm space-y-1.5">
            <div className="font-bold text-red-400 flex items-center gap-1.5 text-sm">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Prior Redemption Record:</span>
            </div>
            <div className="text-slate-200">
              • First admitted: <strong className="text-white">{details.timeElapsed}</strong>
            </div>
            <div className="text-slate-200">
              • Scanned by: <strong className="text-white">{details.firstRedeemedBy}</strong>
            </div>
            <div className="text-slate-200">
              • Location: <strong className="text-white">{details.firstRedeemedGate}</strong>
            </div>
            <div className="text-red-300 font-semibold pt-1 border-t border-red-800/60 mt-1">
              DO NOT ADMIT. Please ask patron for proof of booking in their official app.
            </div>
          </div>
        )}

        {/* Wrong Screen / Wrong Show Details */}
        {isWrongAuditorium && (
          <div className="bg-amber-950/80 border border-amber-500/50 rounded-2xl p-4 max-w-lg mx-auto mb-5 text-left text-xs sm:text-sm space-y-1.5">
            <div className="font-bold text-amber-300 flex items-center gap-1.5 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Direct Patron to:</span>
            </div>
            {details.correctScreen && (
              <div className="text-slate-100">
                • Target Screen: <strong className="text-amber-300 text-base">{details.correctScreen}</strong>
              </div>
            )}
            {details.ticketShowTime && (
              <div className="text-slate-100">
                • Scheduled Time: <strong className="text-amber-300">{details.ticketShowTime}</strong> ({details.ticketShowDate})
              </div>
            )}
          </div>
        )}

        {/* Ticket Metadata Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-lg mx-auto text-left text-xs">
          {details.movieTitle && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5">
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <Film className="w-3 h-3 text-slate-400" /> Movie
              </div>
              <div className="font-bold text-slate-100 truncate">{details.movieTitle}</div>
            </div>
          )}

          {details.showTime && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5">
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" /> Show Time
              </div>
              <div className="font-bold text-slate-100">{details.showTime}</div>
            </div>
          )}

          {details.bookingReference && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5">
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <Ticket className="w-3 h-3 text-slate-400" /> Booking Ref
              </div>
              <div className="font-mono font-bold text-slate-100 truncate">{details.bookingReference}</div>
            </div>
          )}

          {details.provider && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-2.5">
              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                <User className="w-3 h-3 text-slate-400" /> Provider
              </div>
              <div className="font-bold text-slate-100">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                  details.provider === 'BOOKMYSHOW' ? 'bg-red-500/20 text-red-300' :
                  details.provider === 'TICKETNEW' ? 'bg-blue-500/20 text-blue-300' :
                  'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {details.provider}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Submessage advice */}
        {result.subMessage && (
          <p className="mt-4 text-xs text-slate-400 italic">
            {result.subMessage}
          </p>
        )}
      </div>

      {/* Large Bottom Action Button for Staff (Optimized for One-Handed Operation) */}
      <div className="mt-4">
        <button
          onClick={onClose}
          className={`w-full py-4 sm:py-5 px-6 rounded-2xl font-black text-lg sm:text-xl uppercase tracking-wider shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3 ${
            isSuccess
              ? 'bg-[#00E676] text-black hover:bg-[#00c864]'
              : isDuplicate
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-slate-700 text-white hover:bg-slate-600'
          }`}
        >
          <span>SCAN NEXT PATRON</span>
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
