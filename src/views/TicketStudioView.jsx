import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import QRCode from 'qrcode';
import { 
  Ticket, 
  Plus, 
  QrCode, 
  CheckCircle2, 
  ShieldAlert, 
  Film, 
  Download, 
  Search, 
  RotateCcw,
  Sparkles,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';

export default function TicketStudioView({ onNavigateToScanner }) {
  const { selectedTheater, selectedShow, refreshAnalytics } = useApp();

  const [tickets, setTickets] = useState([]);
  const [filterProvider, setFilterProvider] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [newSeats, setNewSeats] = useState('D14, D15');
  const [newCustomer, setNewCustomer] = useState('Arun Prakash');
  const [newProvider, setNewProvider] = useState('BOOKMYSHOW');
  const [copied, setCopied] = useState(false);

  // Load tickets for current show
  const fetchTickets = async () => {
    try {
      const res = await api.getTickets(selectedTheater?.id, selectedShow?.id);
      if (res.tickets) {
        setTickets(res.tickets);
        if (res.tickets.length > 0 && !selectedTicket) {
          setSelectedTicket(res.tickets[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [selectedTheater?.id, selectedShow?.id]);

  // Render QR Code whenever selected ticket changes
  useEffect(() => {
    if (!selectedTicket) return;
    QRCode.toDataURL(selectedTicket.qrPayload || selectedTicket.bookingReference, {
      width: 320,
      margin: 2,
      color: {
        dark: '#080C14',
        light: '#FFFFFF'
      }
    }).then(url => {
      setQrDataUrl(url);
    }).catch(err => {
      console.error(err);
    });
  }, [selectedTicket]);

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      const seatArr = newSeats.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
      await api.createTicket({
        provider: newProvider,
        theaterId: selectedTheater?.id,
        showId: selectedShow?.id,
        customerName: newCustomer || 'Patron',
        seats: seatArr.length > 0 ? seatArr : ['E10'],
        category: 'PREMIERE'
      });
      setIsCreatingTicket(false);
      await fetchTickets();
      await refreshAnalytics();
    } catch (err) {
      console.error(err);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Filtered tickets
  const filteredTickets = tickets.filter(t => {
    if (filterProvider !== 'ALL' && t.provider !== filterProvider) return false;
    if (filterStatus === 'REDEEMED' && !t.isRedeemed) return false;
    if (filterStatus === 'UNREDEEMED' && t.isRedeemed) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchRef = t.bookingReference.toLowerCase().includes(q);
      const matchCustomer = t.customerName?.toLowerCase().includes(q);
      const matchSeats = t.seats?.some(s => s.toLowerCase().includes(q));
      if (!matchRef && !matchCustomer && !matchSeats) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#080C14] text-white p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Ticket className="w-6 h-6 text-[#00E676]" />
            <span>Ticket Inventory & QR Studio</span>
          </h1>
          <p className="text-xs text-slate-400">
            View live tickets, inspect BookMyShow cryptographic signatures, and generate test barcodes for camera scanning.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreatingTicket(prev => !prev)}
            className="px-4 py-2.5 bg-[#00E676] hover:bg-[#00c864] text-black font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Ticket</span>
          </button>
        </div>
      </div>

      {/* Creation Drawer (if active) */}
      {isCreatingTicket && (
        <form onSubmit={handleCreateTicket} className="bg-[#0B0F19] border border-[#00E676]/40 rounded-3xl p-5 shadow-2xl space-y-4 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#00E676]" />
              Generate Authorized Cinema Ticket
            </h3>
            <button
              type="button"
              onClick={() => setIsCreatingTicket(false)}
              className="text-slate-400 hover:text-white text-xs font-bold"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                Authorized Provider
              </label>
              <select
                value={newProvider}
                onChange={(e) => setNewProvider(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="BOOKMYSHOW">BookMyShow (BMS M-Ticket)</option>
                <option value="TICKETNEW">TicketNew (TNW Barcode)</option>
                <option value="BOX_OFFICE">Box Office (EntryX Direct)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                Seat Numbers (Comma separated)
              </label>
              <input
                type="text"
                value={newSeats}
                onChange={(e) => setNewSeats(e.target.value)}
                placeholder="e.g. F12, F13"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                Customer Name
              </label>
              <input
                type="text"
                value={newCustomer}
                onChange={(e) => setNewCustomer(e.target.value)}
                placeholder="Customer Name"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#00E676] text-black font-bold text-xs rounded-xl hover:bg-[#00c864]"
            >
              Sign & Issue Ticket
            </button>
          </div>
        </form>
      )}

      {/* Main Grid: Ticket List + Live QR Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Filterable Ticket List (2 cols on large screen) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0B0F19] border border-slate-800 rounded-2xl p-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Booking ID, Seat, Customer..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#00E676]"
              />
            </div>

            {/* Provider Filter */}
            <div className="flex items-center gap-1 text-xs">
              {['ALL', 'BOOKMYSHOW', 'TICKETNEW', 'BOX_OFFICE'].map((prov) => (
                <button
                  key={prov}
                  onClick={() => setFilterProvider(prov)}
                  className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-semibold transition-colors ${
                    filterProvider === prov
                      ? 'bg-slate-700 text-white border border-slate-600'
                      : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {prov === 'ALL' ? 'All Providers' : prov}
                </button>
              ))}
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 text-xs">
              {['ALL', 'UNREDEEMED', 'REDEEMED'].map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                    filterStatus === st
                      ? 'bg-[#00E676]/20 text-[#00E676] border border-[#00E676]/30'
                      : 'bg-slate-900/60 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Ticket Table */}
          <div className="bg-[#0B0F19] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Showing {filteredTickets.length} of {tickets.length} Tickets</span>
              <span>Click a ticket to view live QR</span>
            </div>

            <div className="divide-y divide-slate-800/80 max-h-[550px] overflow-y-auto">
              {filteredTickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={`p-4 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-slate-800/90 border-l-4 border-l-[#00E676]'
                        : 'bg-slate-900/40 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${
                        t.isRedeemed ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-[#00E676]/10 text-[#00E676] border border-[#00E676]/20'
                      }`}>
                        <Ticket className="w-4 h-4" />
                      </div>

                      <div>
                        <div className="font-bold text-white flex items-center gap-2">
                          <span className="font-mono text-sm">{t.bookingReference}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            t.provider === 'BOOKMYSHOW' ? 'bg-red-500/20 text-red-300' :
                            t.provider === 'TICKETNEW' ? 'bg-sky-500/20 text-sky-300' :
                            'bg-emerald-500/20 text-emerald-300'
                          }`}>
                            {t.provider}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Seats: <strong className="text-white font-mono">{t.seats.join(', ')}</strong> ({t.seatCategory}) • Patron: {t.customerName}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border ${
                        t.isRedeemed 
                          ? 'bg-red-500/20 border-red-500/40 text-red-400' 
                          : 'bg-[#00E676]/20 border-[#00E676]/40 text-[#00E676]'
                      }`}>
                        {t.isRedeemed ? 'ALREADY REDEEMED' : 'UNREDEEMED'}
                      </span>
                      {t.isRedeemed && (
                        <div className="text-[10px] text-slate-500 font-mono mt-1">
                          Admitted at {new Date(t.redeemedAt).toLocaleTimeString()}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Live QR Code Card */}
        <div>
          {selectedTicket ? (
            <div className="bg-[#0B0F19] border border-slate-800 rounded-3xl p-6 shadow-2xl sticky top-6 space-y-5 text-center">
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 font-mono">
                  Live QR Code for Camera Scanning
                </span>
                <h3 className="text-lg font-black text-white mt-1">
                  {selectedTicket.movieTitle}
                </h3>
                <div className="text-xs text-slate-400">
                  {selectedTicket.screenName} • {selectedTicket.showTime}
                </div>
              </div>

              {/* Real Rendered QR Code */}
              <div className="p-4 bg-white rounded-2xl shadow-xl inline-block max-w-[260px] mx-auto border-4 border-slate-700">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="Ticket QR" className="w-full h-auto rounded-lg" />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-xs">
                    Generating QR...
                  </div>
                )}
              </div>

              {/* Status Badge */}
              <div>
                <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
                  selectedTicket.isRedeemed 
                    ? 'bg-red-500/20 border-red-500/40 text-red-400' 
                    : 'bg-[#00E676]/20 border-[#00E676]/40 text-[#00E676]'
                }`}>
                  {selectedTicket.isRedeemed ? '🔴 STATUS: ALREADY REDEEMED' : '🟢 STATUS: READY FOR SCAN'}
                </span>
              </div>

              {/* Seats Info */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 text-left text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Booking Ref:</span>
                  <span className="font-mono font-bold text-white">{selectedTicket.bookingReference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Seats:</span>
                  <span className="font-mono font-bold text-[#00E676]">{selectedTicket.seats.join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Customer:</span>
                  <span className="text-slate-200">{selectedTicket.customerName}</span>
                </div>
                {selectedTicket.signature && (
                  <div className="flex justify-between pt-1 border-t border-slate-800 text-[10px]">
                    <span className="text-slate-400">HMAC-SHA256:</span>
                    <span className="font-mono text-slate-400 truncate max-w-[150px]">{selectedTicket.signature}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => copyToClipboard(selectedTicket.qrPayload || selectedTicket.bookingReference)}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#00E676]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied Payload!' : 'Copy Barcode Payload'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[#0B0F19] border border-slate-800 rounded-3xl p-12 text-center text-slate-500 text-xs">
              Select a ticket from the left to view QR code.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
