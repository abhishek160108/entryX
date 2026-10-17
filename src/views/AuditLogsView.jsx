import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Download, 
  RefreshCw, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Filter, 
  Database,
  Lock,
  Hash
} from 'lucide-react';

export default function AuditLogsView() {
  const { selectedTheater, selectedShow } = useApp();

  const [logs, setLogs] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAuditLogs({
        theaterId: selectedTheater?.id,
        status: filterStatus === 'ALL' ? undefined : filterStatus,
        limit: 150
      });
      if (res.logs) setLogs(res.logs);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedTheater?.id, filterStatus]);

  const handleVerifyLedger = async () => {
    setIsVerifying(true);
    try {
      const res = await api.verifyLedger();
      setVerificationResult(res.integrity);
    } catch (e) {
      console.error(e);
    } finally {
      setIsVerifying(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (logs.length === 0) return;

    const headers = ['Index', 'Timestamp', 'Booking Reference', 'Provider', 'Seats', 'Status', 'Staff Name', 'Gate', 'Reason', 'Device', 'Ledger Hash'];
    const rows = logs.map(l => [
      l.index,
      new Date(l.timestamp).toISOString(),
      l.bookingReference,
      l.provider,
      `"${l.seats.join(', ')}"`,
      l.status,
      `"${l.staffName}"`,
      `"${l.gate}"`,
      `"${l.reason}"`,
      `"${l.deviceInfo}"`,
      l.hash
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `entryx_audit_log_${selectedTheater?.code || 'tn'}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = logs.filter(l => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.bookingReference?.toLowerCase().includes(q) ||
      l.staffName?.toLowerCase().includes(q) ||
      l.gate?.toLowerCase().includes(q) ||
      l.reason?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen bg-[#080C14] text-white p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Lock className="w-6 h-6 text-[#00E676]" />
            <span>Immutable Security Audit Ledger</span>
          </h1>
          <p className="text-xs text-slate-400">
            Cryptographically hash-chained scan records protecting cinema distributor revenue and theater access integrity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Verify Integrity Button */}
          <button
            onClick={handleVerifyLedger}
            disabled={isVerifying}
            className="px-3.5 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 font-bold text-xs rounded-2xl border border-indigo-500/40 transition-colors flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>{isVerifying ? 'Verifying...' : 'Verify Cryptographic Integrity'}</span>
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-2xl border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Verification Notice Banner (if verified) */}
      {verificationResult && (
        <div className={`p-4 rounded-3xl border flex items-center justify-between text-xs animate-in slide-in-from-top-2 ${
          !verificationResult.tampered 
            ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300' 
            : 'bg-red-950/40 border-red-500/50 text-red-300'
        }`}>
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 shrink-0 text-[#00E676]" />
            <div>
              <div className="font-black text-sm uppercase">
                {!verificationResult.tampered ? 'LEDGER INTEGRITY VERIFIED (ZERO TAMPERING)' : 'CRITICAL INTEGRITY FAILURE: TAMPERING DETECTED'}
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5 font-mono">
                Validated {verificationResult.totalVerifiedBlocks} chained SHA-256 blocks from Genesis. Latest Hash: {verificationResult.latestHash?.substring(0, 24)}...
              </div>
            </div>
          </div>
          <button
            onClick={() => setVerificationResult(null)}
            className="text-slate-400 hover:text-white font-bold text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0B0F19] border border-slate-800 rounded-2xl p-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Booking Ref, Staff, Gate, Reason..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00E676]"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1 text-xs overflow-x-auto py-1">
          {['ALL', 'VALIDATED', 'DUPLICATE_BLOCKED', 'WRONG_SCREEN', 'WRONG_SHOW', 'UNVERIFIED_PROVIDER'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors ${
                filterStatus === status
                  ? 'bg-slate-700 text-white border border-slate-600'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-[#0B0F19] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
              <tr>
                <th className="py-3 px-4"># Block</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Booking Ref</th>
                <th className="py-3 px-4">Provider</th>
                <th className="py-3 px-4">Seats</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Gate & Usher</th>
                <th className="py-3 px-4">Reason / Details</th>
                <th className="py-3 px-4">SHA-256 Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-12 text-slate-500">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isSuccess = log.status === 'VALIDATED';
                  const isDup = log.status === 'DUPLICATE_BLOCKED';
                  const isWarn = log.status === 'WRONG_SCREEN' || log.status === 'WRONG_SHOW';

                  return (
                    <tr key={log.id} className="hover:bg-slate-900/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-400 font-bold">
                        #{log.index}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-white whitespace-nowrap">
                        {log.bookingReference}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          log.provider === 'BOOKMYSHOW' ? 'bg-red-500/20 text-red-300' :
                          log.provider === 'TICKETNEW' ? 'bg-sky-500/20 text-sky-300' :
                          'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {log.provider}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[#00E676] font-bold">
                        {log.seats?.join(', ') || '—'}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                          isSuccess ? 'bg-[#00E676]/10 border-[#00E676]/40 text-[#00E676]' :
                          isDup ? 'bg-red-500/20 border-red-500/40 text-red-400' :
                          'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-bold text-white">{log.staffName}</div>
                        <div className="text-[10px] text-slate-400">{log.gate}</div>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-slate-300" title={log.reason}>
                        {log.reason || '—'}
                      </td>
                      <td className="py-3 px-4 font-mono text-[10px] text-slate-400 max-w-[120px] truncate" title={log.hash}>
                        {log.hash?.substring(0, 16)}...
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
