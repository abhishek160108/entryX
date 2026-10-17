import React from 'react';
import EntryXLogo from './EntryXLogo';
import { useApp } from '../context/AppContext';
import { QrCode, LayoutDashboard, Ticket, Lock, Cpu, User, LogOut, ChevronDown } from 'lucide-react';

export default function Header() {
  const { 
    activeTab, 
    setActiveTab, 
    staffUser, 
    setIsLoginModalOpen, 
    selectedTheater 
  } = useApp();

  const navItems = [
    { id: 'scanner', label: 'EntryX Scanner', icon: QrCode, badge: 'Staff Mobile' },
    { id: 'control', label: 'EntryX Control', icon: LayoutDashboard, badge: 'Dashboard' },
    { id: 'tickets', label: 'Ticket Studio', icon: Ticket, badge: 'QR & Manifest' },
    { id: 'audit', label: 'Audit Ledger', icon: Lock, badge: 'Immutable' }
  ];

  return (
    <header className="bg-[#0B0F19] border-b border-slate-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Tagline */}
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setActiveTab('scanner')} 
              className="text-left flex items-center hover:opacity-90 transition-opacity"
            >
              <EntryXLogo variant="full" size="md" showTagline={true} />
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1.5 ml-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      isActive
                        ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#00E676]' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Area: Staff Identity & Quick Auth */}
          <div className="flex items-center gap-3">
            {staffUser ? (
              <div 
                onClick={() => setIsLoginModalOpen(true)}
                className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl px-3 py-1.5 cursor-pointer transition-colors"
                title="Click to switch staff or theater"
              >
                <div className="w-7 h-7 rounded-full bg-[#00E676]/20 border border-[#00E676]/40 flex items-center justify-center text-[#00E676] font-bold text-xs">
                  {staffUser.name.charAt(0)}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-white leading-tight truncate max-w-[120px]">
                    {staffUser.name}
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight">
                    {staffUser.assignedGate || 'Gate Usher'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </div>
            ) : (
              <button
                onClick={() => setIsLoginModalOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
              >
                <User className="w-3.5 h-3.5 text-[#00E676]" />
                <span>Staff Login</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800/80 overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`py-1.5 px-2.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-[#00E676]/20 text-[#00E676] border border-[#00E676]/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.id === 'scanner' ? 'Scanner' : item.id === 'control' ? 'Control' : item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
