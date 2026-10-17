import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import RaceSimulatorModal from './RaceSimulatorModal';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Users, 
  Ticket, 
  Film, 
  Activity, 
  AlertTriangle, 
  Cpu, 
  RotateCcw, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Clock,
  Sparkles,
  Building,
  CheckCircle2,
  XCircle
} from 'lucide-react';

export default function ControlView({ onNavigate }) {
  const {
    theaters,
    selectedTheaterId,
    selectedTheater,
    handleTheaterChange,
    shows,
    selectedShowId,
    setSelectedShowId,
    selectedShow,
    analytics,
    refreshAnalytics
  } = useApp();

  const [liveLogs, setLiveLogs] = useState([]);
  const [isRaceModalOpen, setIsRaceModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [ledgerStatus, setLedgerStatus] = useState({ tampered: false, totalVerifiedBlocks: 0 });

  // Load audit logs and verify cryptographic ledger
  useEffect(() => {
    let isSubscribed = true;

    async function fetchDashboardData() {
      try {
        const [logsRes, verifyRes] = await Promise.all([
          api.getAuditLogs({ theaterId: selectedTheaterId, limit: 10 }),
          api.verifyLedger()
        ]);

        if (isSubscribed) {
          if (logsRes.logs) setLiveLogs(logsRes.logs);
          if (verifyRes.integrity) setLedgerStatus(verifyRes.integrity);
        }
      } catch (e) {
        console.error('Dashboard fetch error:', e);
      }
    }

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 4000); // Live poll every 4s

    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [selectedTheaterId, selectedShowId]);

  const handleResetShow = async () => {
    if (!window.confirm('Reset all ticket redemption statuses for this show back to unredeemed for demonstration?')) return;
    setIsResetting(true);
    try {
      await api.resetShow(selectedShowId);
      await refreshAnalytics();
      const logsRes = await api.getAuditLogs({ theaterId: selectedTheaterId, limit: 10 });
      if (logsRes.logs) setLiveLogs(logsRes.logs);
    } catch (e) {
      console.error(e);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080C14] text-white p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner: Theater Switcher & Tenant Isolation */}
      <div className="bg-[#0B0F19] border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00E676] animate-pulse" />
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              EntryX Control
            </h1>
            <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded-full border border-slate-700">
              Operations Hub
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Real-time multi-gate ticket validation, tenant isolation, and anti-duplicate enforcement.
          </p>
        </div>

        {/* Multi-Tenant Theater & Show Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Theater Dropdown */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-2xl px-3 py-1.5">
            <Building className="w-4 h-4 text-[#00E676] shrink-0" />
            <div className="text-left">
              <div className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">Active Tenant</div>
              <select
                value={selectedTheaterId}
                onChange={(e) => handleTheaterChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
              >
                {theaters.map((th) => (
                  <option key={th.id} value={th.id} className="bg-slate-900 text-white">
                    {th.name} ({th.city})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Show Dropdown */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-2xl px-3 py-1.5">
            <Film className="w-4 h-4 text-sky-400 shrink-0" />
            <div className="text-left">
              <div className="text-[9px] uppercase tracking-wider text-slate-400 font-mono">Active Show</div>
              <select
                value={selectedShowId}
                onChange={(e) => setSelectedShowId(e.target.value)}
                className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
              >
                {shows.map((s) => (
                  <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                    {s.movieTitle} - {s.showTime} ({s.screenName.split('-')[0].trim()})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Concurrency Lab Button */}
          <button
            onClick={() => setIsRaceModalOpen(true)}
            className="px-3.5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center gap-2 shrink-0"
          >
            <Cpu className="w-4 h-4" />
            <span>Race Simulator Lab</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Admitted Patrons */}
        <div className="bg-[#0B0F19] border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Gate Admitted</span>
            <div className="p-2 rounded-xl bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {analytics.redeemedTickets} <span className="text-sm font-normal text-slate-400">/ {analytics.totalTickets}</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>Turnout Rate</span>
            <span className="font-bold text-[#00E676]">{analytics.turnoutPercentage}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
            <div 
              className="bg-[#00E676] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, analytics.turnoutPercentage)}%` }}
            />
          </div>
        </div>

        {/* 2. DUPLICATES INTERCEPTED (The Core Metric) */}
        <div className="bg-[#0B0F19] border border-red-900/40 rounded-3xl p-5 shadow-lg relative overflow-hidden bg-gradient-to-br from-[#0B0F19] to-red-950/20">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-red-300">Duplicates Blocked</span>
            <div className="p-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-red-400">
            {analytics.duplicateAttemptsBlocked}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00E676]" />
            <span className="text-slate-300 font-medium">Zero double redemptions</span>
          </div>
        </div>

        {/* 3. Unverified / Tampered Intercepted */}
        <div className="bg-[#0B0F19] border border-amber-900/40 rounded-3xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">Fraud / Tampered QRs</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400">
            {analytics.unverifiedBlocked}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Strict provider verification active
          </div>
        </div>

        {/* 4. Ledger Cryptographic Integrity */}
        <div className="bg-[#0B0F19] border border-slate-800 rounded-3xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Audit Ledger</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <span>{ledgerStatus.tampered ? 'TAMPERED' : '100% VERIFIED'}</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 font-mono truncate">
            {ledgerStatus.totalVerifiedBlocks} Blocks Chained (SHA-256)
          </div>
        </div>
      </div>

      {/* Main Operations Split: Live Stream & Quick Control Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Real-Time Live Gate Scan Stream (2 cols on large screen) */}
        <div className="lg:col-span-2 bg-[#0B0F19] border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#00E676]" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                Live Gate Activity Feed
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00E676] animate-ping" />
              <span className="text-[11px] font-mono text-slate-400">Real-time Stream</span>
            </div>
          </div>

          <div className="mt-4 flex-1 space-y-2.5 overflow-y-auto max-h-[420px] pr-1">
            {liveLogs.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No gate scan events recorded yet for this session.
              </div>
            ) : (
              liveLogs.map((log) => {
                const isSuccess = log.status === 'VALIDATED';
                const isDup = log.status === 'DUPLICATE_BLOCKED';
                const isWrong = log.status === 'WRONG_SCREEN' || log.status === 'WRONG_SHOW';

                return (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800/80 flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${
                        isSuccess ? 'bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/30' :
                        isDup ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
                        'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                      }`}>
                        {isSuccess && <CheckCircle2 className="w-4 h-4" />}
                        {isDup && <ShieldAlert className="w-4 h-4" />}
                        {isWrong && <AlertTriangle className="w-4 h-4" />}
                        {!isSuccess && !isDup && !isWrong && <XCircle className="w-4 h-4" />}
                      </div>

                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          <span>{log.bookingReference}</span>
                          {log.seats && log.seats.length > 0 && (
                            <span className="text-[#00E676] font-mono">
                              ({log.seats.join(', ')})
                            </span>
                          )}
                          <span className="text-[10px] bg-slate-800 text-slate-400 font-mono px-1.5 py-0.5 rounded">
                            {log.provider}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                          <span>Staff: <strong className="text-slate-200">{log.staffName}</strong></span>
                          <span>•</span>
                          <span>Gate: <strong className="text-slate-200">{log.gate}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${
                        isSuccess ? 'bg-[#00E676]/10 border-[#00E676]/40 text-[#00E676]' :
                        isDup ? 'bg-red-500/20 border-red-500/40 text-red-400' :
                        'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      }`}>
                        {log.status}
                      </span>
                      <div className="text-[10px] text-slate-500 font-mono mt-1">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Operational Quick Actions & Screen Capacities */}
        <div className="space-y-4">
          {/* Quick Nav Tools */}
          <div className="bg-[#0B0F19] border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Operations Navigation
            </h3>

            <button
              onClick={() => onNavigate('scanner')}
              className="w-full p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-[#00E676] transition-all flex items-center justify-between text-left group"
            >
              <div>
                <div className="text-xs font-bold text-white group-hover:text-[#00E676]">
                  Open EntryX Scanner
                </div>
                <div className="text-[10px] text-slate-400">Staff mobile ticket scanner PWA</div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-[#00E676]" />
            </button>

            <button
              onClick={() => onNavigate('tickets')}
              className="w-full p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-sky-400 transition-all flex items-center justify-between text-left group"
            >
              <div>
                <div className="text-xs font-bold text-white group-hover:text-sky-400">
                  Ticket Inventory & QR Studio
                </div>
                <div className="text-[10px] text-slate-400">View QR codes, BookMyShow & TicketNew manifests</div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400" />
            </button>

            <button
              onClick={() => onNavigate('audit')}
              className="w-full p-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-400 transition-all flex items-center justify-between text-left group"
            >
              <div>
                <div className="text-xs font-bold text-white group-hover:text-indigo-400">
                  Immutable Audit Ledger
                </div>
                <div className="text-[10px] text-slate-400">Cryptographic hash chain & CSV export</div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-indigo-400" />
            </button>

            <button
              onClick={handleResetShow}
              disabled={isResetting}
              className="w-full p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/60 text-slate-300 hover:text-white transition-all flex items-center justify-between text-left text-xs font-bold"
            >
              <div className="flex items-center gap-2">
                <RotateCcw className={`w-3.5 h-3.5 text-amber-400 ${isResetting ? 'animate-spin' : ''}`} />
                <span>Reset Show Tickets (Demo)</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Unredeem all</span>
            </button>
          </div>

          {/* Screen Capacities List */}
          <div className="bg-[#0B0F19] border border-slate-800 rounded-3xl p-5 shadow-xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Screen Auditoriums ({selectedTheater?.screens?.length || 0})
            </h3>
            <div className="space-y-2.5">
              {selectedTheater?.screens?.map((scr) => (
                <div key={scr.id} className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
                  <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
                    <span>{scr.name}</span>
                    <span className="text-slate-400 font-mono">{scr.capacity} seats</span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Status: Active</span>
                    <span className="text-[#00E676] font-mono">Ready for Gates</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Race Simulator Modal */}
      <RaceSimulatorModal
        isOpen={isRaceModalOpen}
        onClose={() => setIsRaceModalOpen(false)}
      />
    </div>
  );
}
