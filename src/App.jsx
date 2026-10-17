import React, { useState } from 'react';
import { useApp } from './context/AppContext';
import Header from './components/Header';
import ScannerView from './views/ScannerView';
import ControlView from './views/ControlView';
import TicketStudioView from './views/TicketStudioView';
import AuditLogsView from './views/AuditLogsView';
import LoginModal from './views/LoginModal';
import { QrCode, LayoutDashboard, Cpu, Sparkles } from 'lucide-react';
import RaceSimulatorModal from './views/RaceSimulatorModal';

export default function App() {
  const { 
    activeTab, 
    setActiveTab, 
    isLoginModalOpen, 
    setIsLoginModalOpen,
    isLoading 
  } = useApp();

  const [isRaceLabOpen, setIsRaceLabOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080C14] flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-[#00E676] border-t-transparent rounded-full animate-spin mb-4" />
        <div className="font-black text-xl tracking-tight">EntryX</div>
        <div className="text-xs text-slate-400 uppercase tracking-widest mt-1">One Ticket. One Entry.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080C14] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Main Navigation */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 pb-16 md:pb-6">
        {activeTab === 'scanner' && <ScannerView />}
        {activeTab === 'control' && <ControlView onNavigate={setActiveTab} />}
        {activeTab === 'tickets' && <TicketStudioView onNavigateToScanner={() => setActiveTab('scanner')} />}
        {activeTab === 'audit' && <AuditLogsView />}
      </main>

      {/* Global Quick Action Bar (Floating bottom pill for quick switching) */}
      <aside aria-label="Quick Actions" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 bg-[#0B0F19]/90 backdrop-blur-xl border border-slate-700/80 rounded-full px-3 py-1.5 shadow-2xl flex items-center gap-1.5">
        <button
          onClick={() => setActiveTab('scanner')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'scanner'
              ? 'bg-[#00E676] text-black shadow-lg shadow-[#00E676]/30'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <QrCode className="w-3.5 h-3.5" />
          <span>Scanner</span>
        </button>

        <button
          onClick={() => setActiveTab('control')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'control'
              ? 'bg-[#00E676] text-black shadow-lg shadow-[#00E676]/30'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-3.5 h-3.5" />
          <span>Control</span>
        </button>

        <span className="w-px h-4 bg-slate-700 mx-1" />

        <button
          onClick={() => setIsRaceLabOpen(true)}
          className="px-3 py-1.5 rounded-full text-xs font-bold text-indigo-300 bg-indigo-950/80 border border-indigo-700/60 hover:bg-indigo-900 transition-colors flex items-center gap-1.5"
          title="Simulate simultaneous scans to verify atomic single-entry"
        >
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <span>Race Lab</span>
        </button>
      </aside>

      {/* PIN Login Dialog */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {/* Concurrency Simulator Modal */}
      <RaceSimulatorModal
        isOpen={isRaceLabOpen}
        onClose={() => setIsRaceLabOpen(false)}
      />
    </div>
  );
}
