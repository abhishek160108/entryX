import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../utils/api';
import { soundEffects } from '../components/SoundEffects';

const AppContext = createContext();

export function AppProvider({ children }) {
  // Navigation: 'scanner' (EntryX Scanner) | 'control' (EntryX Control) | 'tickets' (Ticket Studio) | 'audit' (Audit Logs) | 'race' (Race Lab)
  const [activeTab, setActiveTab] = useState('scanner');
  
  // Theater, Screen & Show Context
  const [theaters, setTheaters] = useState([]);
  const [selectedTheaterId, setSelectedTheaterId] = useState('');
  const [selectedScreenId, setSelectedScreenId] = useState('');
  const [shows, setShows] = useState([]);
  const [selectedShowId, setSelectedShowId] = useState('');
  
  // Staff Auth
  const [staffUser, setStaffUser] = useState(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Sound & Hardware
  const [isMuted, setIsMuted] = useState(false);

  // Live Analytics & Logs
  const [analytics, setAnalytics] = useState({
    totalTickets: 0,
    redeemedTickets: 0,
    pendingTickets: 0,
    turnoutPercentage: 0,
    duplicateAttemptsBlocked: 0,
    unverifiedBlocked: 0,
    wrongShowBlocked: 0,
    scansLastHour: 0
  });
  
  const [recentLocalScans, setRecentLocalScans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial theaters & shows
  const loadInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      const thRes = await api.getTheaters();
      if (thRes.theaters && thRes.theaters.length > 0) {
        setTheaters(thRes.theaters);
        const defaultTh = thRes.theaters[0];
        setSelectedTheaterId(defaultTh.id);
        
        if (defaultTh.screens && defaultTh.screens.length > 0) {
          setSelectedScreenId(defaultTh.screens[0].id);
        }

        const showRes = await api.getShows(defaultTh.id);
        if (showRes.shows && showRes.shows.length > 0) {
          setShows(showRes.shows);
          setSelectedShowId(showRes.shows[0].id);
        }

        // Set default staff for smooth immediate testing
        const staffRes = await api.getStaff(defaultTh.id);
        if (staffRes.staff && staffRes.staff.length > 0) {
          setStaffUser(staffRes.staff[0]);
        }

        const statsRes = await api.getAnalytics(defaultTh.id, showRes.shows?.[0]?.id);
        if (statsRes.analytics) {
          setAnalytics(statsRes.analytics);
        }
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // When theater changes, refresh screens and shows
  const handleTheaterChange = async (theaterId) => {
    setSelectedTheaterId(theaterId);
    const th = theaters.find(t => t.id === theaterId);
    if (th && th.screens && th.screens.length > 0) {
      setSelectedScreenId(th.screens[0].id);
    }

    try {
      const showRes = await api.getShows(theaterId);
      if (showRes.shows && showRes.shows.length > 0) {
        setShows(showRes.shows);
        setSelectedShowId(showRes.shows[0].id);
      } else {
        setShows([]);
        setSelectedShowId('');
      }

      const statsRes = await api.getAnalytics(theaterId);
      if (statsRes.analytics) {
        setAnalytics(statsRes.analytics);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Refresh analytics
  const refreshAnalytics = useCallback(async () => {
    if (!selectedTheaterId) return;
    try {
      const statsRes = await api.getAnalytics(selectedTheaterId, selectedShowId);
      if (statsRes.analytics) {
        setAnalytics(statsRes.analytics);
      }
    } catch (e) {
      console.error(e);
    }
  }, [selectedTheaterId, selectedShowId]);

  // Record a scan result locally
  const recordScanResult = (result) => {
    setRecentLocalScans(prev => [result, ...prev.slice(0, 19)]);
    refreshAnalytics();
  };

  const toggleSound = () => {
    const next = soundEffects.toggleMute();
    setIsMuted(next);
  };

  const selectedTheater = theaters.find(t => t.id === selectedTheaterId) || null;
  const selectedScreen = selectedTheater?.screens?.find(s => s.id === selectedScreenId) || null;
  const selectedShow = shows.find(s => s.id === selectedShowId) || null;

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        theaters,
        selectedTheaterId,
        selectedTheater,
        handleTheaterChange,
        screens: selectedTheater?.screens || [],
        selectedScreenId,
        setSelectedScreenId,
        selectedScreen,
        shows,
        selectedShowId,
        setSelectedShowId,
        selectedShow,
        staffUser,
        setStaffUser,
        isLoginModalOpen,
        setIsLoginModalOpen,
        isMuted,
        toggleSound,
        analytics,
        refreshAnalytics,
        recentLocalScans,
        recordScanResult,
        isLoading
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
