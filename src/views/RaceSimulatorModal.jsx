import React, { useState } from 'react';
import { api } from '../utils/api';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Zap, 
  Smartphone, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RotateCcw,
  Sparkles,
  Cpu
} from 'lucide-react';

export default function RaceSimulatorModal({ isOpen, onClose }) {
  const { selectedTheater, selectedShow, selectedScreen, refreshAnalytics } = useApp();
  
  const [ticketPayload, setTicketPayload] = useState('WXBMS78911');
  const [scannersCount, setScannersCount] = useState(3);
  const [isSimulating, setIsSimulating] = useState(false);
  const [raceResult, setRaceResult] = useState(null);

  if (!isOpen) return null;

  const handleRunRace = async () => {
    setIsSimulating(true);
    setRaceResult(null);

    try {
      const res = await api.simulateRace({
        rawPayload: ticketPayload,
        activeShowId: selectedShow?.id,
        activeScreenId: selectedScreen?.id,
        theaterId: selectedTheater?.id,
        scannersCount: Number(scannersCount)
      });
      setRaceResult(res);
      refreshAnalytics();
    } catch (err) {
      console.error('Race test error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleResetTicket = async () => {
    try {
      await api.resetShow(selectedShow?.id);
      setRaceResult(null);
      refreshAnalytics();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#0B0F19] border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>Atomic Concurrency Stress Lab</span>
                <span className="text-[10px] bg-[#00E676]/20 text-[#00E676] font-mono px-2 py-0.5 rounded-full border border-[#00E676]/40">
                  Zero Double-Spend Guarantee
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Tests simultaneous scans across multiple Android phones at the exact same millisecond.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* Configuration Section */}
        <div className="py-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Target Ticket (Booking Reference / QR Payload)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={ticketPayload}
                onChange={(e) => setTicketPayload(e.target.value)}
                placeholder="e.g. WXBMS78911"
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleResetTicket}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5"
                title="Reset this show's tickets to unredeemed state"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Tickets</span>
              </button>
            </div>
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setTicketPayload('WXBMS78911')}
                className="text-[10px] font-mono px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700"
              >
                BMS #78911 (Seats F5-F7)
              </button>
              <button
                type="button"
                onClick={() => setTicketPayload('TNW994012A')}
                className="text-[10px] font-mono px-2 py-1 rounded bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700"
              >
                TicketNew #994012A (Seats G10-G11)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Number of Simultaneous Phones Scanning Concurrently
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setScannersCount(num)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    scannersCount === num
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>{num} Phones</span>
                </button>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleRunRace}
            disabled={isSimulating}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isSimulating ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Acquiring Atomic Mutex Locks...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-current" />
                <span>Fire Simultaneous Scans (Test Mutex Lock)</span>
              </>
            )}
          </button>
        </div>

        {/* Live Race Test Output */}
        {raceResult && (
          <div className="mt-4 border-t border-slate-800 pt-4 space-y-4 animate-in slide-in-from-bottom-2">
            {/* Verdict Card */}
            <div className={`p-4 rounded-2xl border ${
              raceResult.atomicIntegrityMaintained
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                : 'bg-red-950/40 border-red-500/50 text-red-300'
            }`}>
              <div className="flex items-center gap-2 font-black text-sm uppercase tracking-wide">
                <ShieldCheck className="w-5 h-5 text-[#00E676]" />
                <span>{raceResult.summary}</span>
              </div>
              <div className="text-xs text-slate-300 mt-1">
                Simulated {raceResult.scannersCount} parallel gate devices hitting the atomic execution engine in parallel.
              </div>
            </div>

            {/* Individual Device Scan Results */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Device Execution Timings & Outcomes:
              </div>

              {raceResult.raceResults?.map((device) => {
                const isWon = device.result.success && device.result.status === 'VALIDATED';
                const isDuplicate = device.result.status === 'DUPLICATE_ENTRY';

                return (
                  <div
                    key={device.scannerIndex}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                      isWon
                        ? 'bg-[#00E676]/10 border-[#00E676]/40 text-slate-100'
                        : isDuplicate
                        ? 'bg-red-950/20 border-red-900/40 text-slate-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg ${
                        isWon ? 'bg-[#00E676]/20 text-[#00E676]' : 'bg-red-500/20 text-red-400'
                      }`}>
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold flex items-center gap-2">
                          <span>{device.scannerStaff}</span>
                          <span className="text-[10px] font-mono text-slate-400">({device.gate})</span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Processed in {device.durationMs}ms</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${
                        isWon
                          ? 'bg-[#00E676]/20 border-[#00E676]/40 text-[#00E676]'
                          : isDuplicate
                          ? 'bg-red-500/20 border-red-500/40 text-red-400'
                          : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      }`}>
                        {device.result.title || device.result.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span>Engine: EntryX Atomic Memory Queue Mutex</span>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white font-bold"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
