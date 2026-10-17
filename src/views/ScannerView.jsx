import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../utils/api';
import { soundEffects } from '../components/SoundEffects';
import FullScreenScanModal from '../components/FullScreenScanModal';
import { 
  Camera, 
  Flashlight, 
  RefreshCw, 
  Volume2, 
  VolumeX, 
  Search, 
  CheckCircle, 
  AlertCircle, 
  ShieldAlert, 
  Film, 
  MapPin, 
  Sparkles,
  Zap,
  RotateCcw,
  History,
  Info
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

export default function ScannerView() {
  const {
    selectedTheater,
    selectedScreen,
    selectedShow,
    staffUser,
    isMuted,
    toggleSound,
    recordScanResult,
    refreshAnalytics,
    analytics
  } = useApp();

  const [scanResult, setScanResult] = useState(null);
  const [isScanningActive, setIsScanningActive] = useState(true);
  const [manualCode, setManualCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [torchOn, setTorchOn] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const [showHistory, setShowHistory] = useState(false);
  const [recentLocalHistory, setRecentLocalHistory] = useState([]);

  const qrReaderRef = useRef(null);
  const scannerInstanceRef = useRef(null);

  // Initialize html5-qrcode
  useEffect(() => {
    let isMounted = true;
    const scannerId = 'entryx-camera-viewfinder';

    async function startScanner() {
      try {
        setCameraError(null);
        if (!document.getElementById(scannerId)) return;

        // Clean up previous scanner if exists
        if (scannerInstanceRef.current) {
          try {
            await scannerInstanceRef.current.stop();
          } catch {
            // ignore
          }
        }

        const html5QrCode = new Html5Qrcode(scannerId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.DATA_MATRIX
          ],
          verbose: false
        });

        scannerInstanceRef.current = html5QrCode;

        const config = {
          fps: 15,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1.0
        };

        await html5QrCode.start(
          { facingMode: facingMode },
          config,
          (decodedText) => {
            if (isMounted) {
              handleBarcodeScanned(decodedText);
            }
          },
          (errorMessage) => {
            // standard frame-by-frame parse miss, silent
          }
        );
      } catch (err) {
        console.warn('Camera start error (simulation mode active):', err);
        if (isMounted) {
          setCameraError(
            err.message || 'Camera permission denied or camera unavailable in current environment.'
          );
        }
      }
    }

    startScanner();

    return () => {
      isMounted = false;
      if (scannerInstanceRef.current) {
        try {
          scannerInstanceRef.current.stop().catch(() => {});
        } catch {
          // ignore
        }
      }
    };
  }, [facingMode]);

  // Handle scanned code (from camera, test buttons, or manual entry)
  const handleBarcodeScanned = async (payload) => {
    if (isProcessing || !payload) return;
    setIsProcessing(true);

    try {
      // Pause scanner while modal is active
      if (scannerInstanceRef.current) {
        try {
          scannerInstanceRef.current.pause(true);
        } catch {
          // ignore
        }
      }

      const res = await api.redeemTicket({
        rawPayload: payload,
        activeShowId: selectedShow?.id,
        activeScreenId: selectedScreen?.id,
        staffUser: staffUser || {
          id: 'staff-mobile',
          name: 'Gate Usher',
          assignedGate: 'Gate 1'
        },
        theaterId: selectedTheater?.id,
        deviceInfo: 'EntryX Scanner (Android PWA)'
      });

      // Play corresponding sound and haptic vibration
      if (res.success && res.status === 'VALIDATED') {
        soundEffects.playSuccess();
      } else if (res.status === 'DUPLICATE_ENTRY') {
        soundEffects.playDuplicate();
      } else {
        soundEffects.playWarning();
      }

      setScanResult(res);
      recordScanResult(res);
      setRecentLocalHistory(prev => [res, ...prev.slice(0, 14)]);
      refreshAnalytics();

    } catch (err) {
      console.error('Redemption error:', err);
      soundEffects.playWarning();
      setScanResult({
        success: false,
        status: 'NETWORK_ERROR',
        title: 'NETWORK TIMEOUT',
        message: 'Could not connect to EntryX server. Please verify Wi-Fi / LTE connection.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseModal = () => {
    setScanResult(null);
    if (scannerInstanceRef.current) {
      try {
        scannerInstanceRef.current.resume();
      } catch {
        // ignore
      }
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleBarcodeScanned(manualCode.trim());
    setManualCode('');
  };

  const toggleCameraFacing = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const toggleTorch = async () => {
    if (scannerInstanceRef.current) {
      try {
        const next = !torchOn;
        await scannerInstanceRef.current.applyVideoConstraints({
          advanced: [{ torch: next }]
        });
        setTorchOn(next);
      } catch (e) {
        console.log('Torch not supported on this device', e);
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#080C14] text-white">
      {/* Scanner Header with Active Show / Audi Badge */}
      <div className="bg-[#0B0F19] border-b border-slate-800/80 px-4 py-3 sticky top-0 z-30 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00E676] animate-pulse" />
            <h2 className="font-black text-sm tracking-wide text-white uppercase">
              EntryX Scanner
            </h2>
            <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-2 py-0.5 rounded-full border border-slate-700">
              {staffUser?.assignedGate || 'Gate 1'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Toggle */}
            <button
              onClick={toggleSound}
              className={`p-2 rounded-xl border transition-colors ${
                isMuted
                  ? 'bg-slate-800/80 border-slate-700 text-slate-400'
                  : 'bg-[#00E676]/10 border-[#00E676]/30 text-[#00E676]'
              }`}
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* History Toggle */}
            <button
              onClick={() => setShowHistory(prev => !prev)}
              className={`p-2 rounded-xl border transition-colors ${
                showHistory 
                  ? 'bg-sky-500/20 border-sky-500/40 text-sky-400' 
                  : 'bg-slate-800/80 border-slate-700 text-slate-300'
              }`}
              title="Recent Scans"
            >
              <History className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Current Active Show Lock Bar */}
        <div className="mt-2 flex items-center justify-between text-xs bg-slate-900/90 rounded-xl px-3 py-2 border border-slate-800">
          <div className="flex items-center gap-2 truncate">
            <Film className="w-3.5 h-3.5 text-[#00E676] shrink-0" />
            <span className="font-bold text-slate-100 truncate">
              {selectedShow ? selectedShow.movieTitle : 'Select Show'}
            </span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-300 shrink-0 font-medium">
              {selectedShow?.showTime || '06:45 PM'}
            </span>
          </div>

          <div className="shrink-0 pl-2 text-right">
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-800/50">
              {selectedScreen ? selectedScreen.name.split('-')[0].trim() : 'Audi 1'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div className="flex-1 flex flex-col p-4 max-w-lg mx-auto w-full">
        {/* Camera Viewfinder Card */}
        <div className="relative rounded-3xl overflow-hidden bg-black border-2 border-slate-800 aspect-square w-full shadow-2xl flex flex-col items-center justify-center">
          {/* HTML5 QR Code Target Container */}
          <div id="entryx-camera-viewfinder" className="w-full h-full object-cover" />

          {/* Fallback & Helper when camera is initializing or in simulation mode */}
          {cameraError && (
            <div className="absolute inset-0 bg-[#080C14]/90 p-6 flex flex-col items-center justify-center text-center z-10">
              <Camera className="w-12 h-12 text-slate-500 mb-2" />
              <div className="text-sm font-bold text-slate-200 mb-1">Interactive Simulation Active</div>
              <p className="text-xs text-slate-400 mb-4 max-w-xs">
                Webcam is optional. You can use the instant 1-tap test buttons below or enter booking codes manually!
              </p>
              <button
                onClick={() => handleBarcodeScanned('WXBMS78911')}
                className="px-4 py-2 bg-[#00E676] text-black font-bold text-xs rounded-xl shadow-lg hover:bg-[#00c864]"
              >
                Scan Valid BookMyShow Ticket
              </button>
            </div>
          )}

          {/* Scanner Overlay Graphics: Targeting Reticle & Laser */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Darkened Vignette */}
            <div className="w-64 h-64 border-2 border-dashed border-[#00E676]/40 rounded-2xl relative">
              {/* Four Glowing Corner Brackets */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-[#00E676] rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-[#00E676] rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-[#00E676] rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-[#00E676] rounded-br-lg" />

              {/* Animated Cinema Scanline Laser */}
              <div className="absolute left-2 right-2 h-0.5 bg-gradient-to-r from-transparent via-[#00E676] to-transparent shadow-[0_0_15px_#00E676] animate-scan-laser" />
            </div>
          </div>

          {/* Camera Controls Floating Overlay */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-auto">
            <button
              onClick={toggleCameraFacing}
              className="p-2.5 bg-black/60 backdrop-blur-md rounded-full border border-white/20 text-white hover:bg-black/80 transition-colors"
              title="Flip Camera"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <div className="text-[11px] font-mono font-semibold bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/20 text-slate-300">
              Align QR Code Inside Box
            </div>

            <button
              onClick={toggleTorch}
              className={`p-2.5 bg-black/60 backdrop-blur-md rounded-full border border-white/20 text-white hover:bg-black/80 transition-colors ${
                torchOn ? 'bg-amber-500/80 text-black border-amber-400' : ''
              }`}
              title="Flashlight"
            >
              <Flashlight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Gate Admission Counter Bar */}
        <div className="mt-4 bg-[#0F172A] border border-slate-800 rounded-2xl p-3.5">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00E676]" />
              Gate Admitted Patrons
            </span>
            <span className="font-mono font-bold text-white">
              {analytics.redeemedTickets} / {analytics.totalTickets} ({analytics.turnoutPercentage}%)
            </span>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-[#00E676] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, analytics.turnoutPercentage)}%` }}
            />
          </div>
        </div>

        {/* Fast Manual Ticket ID Search Form */}
        <form onSubmit={handleManualSubmit} className="mt-3 flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              placeholder="Enter Booking ID (e.g. WXBMS78910)"
              className="w-full bg-[#0F172A] border border-slate-800 rounded-xl px-3.5 py-3 text-xs sm:text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#00E676]"
            />
          </div>
          <button
            type="submit"
            disabled={!manualCode.trim() || isProcessing}
            className="px-4 bg-[#00E676] text-black font-bold text-xs rounded-xl shadow-md hover:bg-[#00c864] disabled:opacity-40 transition-all flex items-center gap-1.5 shrink-0"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Verify</span>
          </button>
        </form>

        {/* 1-Tap Rapid Test Codes Bar (Essential for thorough evaluation & live testing) */}
        <div className="mt-5 border-t border-slate-800/80 pt-4">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              1-Tap Scenario Testing
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Tap any scenario to test</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-left">
            {/* 1. Valid BookMyShow */}
            <button
              onClick={() => handleBarcodeScanned('WXBMS78911')}
              disabled={isProcessing}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-[#00E676]/60 transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#00E676] mb-0.5">
                <CheckCircle className="w-3 h-3" />
                <span>Valid BookMyShow</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">WXBMS78911 (Seats F5-F7)</div>
            </button>

            {/* 2. DUPLICATE SCAN TEST (The Core Promise) */}
            <button
              onClick={() => handleBarcodeScanned('WXBMS78910')}
              disabled={isProcessing}
              className="p-2.5 rounded-xl bg-red-950/30 border border-red-900/50 hover:border-red-500 transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-red-400 mb-0.5">
                <ShieldAlert className="w-3 h-3" />
                <span>Duplicate Scan Test</span>
              </div>
              <div className="text-[10px] text-red-300/80 font-mono">WXBMS78910 (Double Entry)</div>
            </button>

            {/* 3. Valid TicketNew */}
            <button
              onClick={() => handleBarcodeScanned('TNW994012A')}
              disabled={isProcessing}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-400/60 transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400 mb-0.5">
                <CheckCircle className="w-3 h-3" />
                <span>TicketNew Ticket</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">TNW994012A (Seats G10-G11)</div>
            </button>

            {/* 4. Cross Screen / Wrong Audi */}
            <button
              onClick={() => handleBarcodeScanned('WXBMS-WRONG-AUDI')}
              disabled={isProcessing}
              className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-900/50 hover:border-amber-400 transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-0.5">
                <AlertCircle className="w-3 h-3" />
                <span>Wrong Screen Test</span>
              </div>
              <div className="text-[10px] text-amber-300/80 font-mono">Audi 2 Ticket at Audi 1</div>
            </button>

            {/* 5. Wrong Show Time */}
            <button
              onClick={() => handleBarcodeScanned('WXBMS-LATE-NIGHT')}
              disabled={isProcessing}
              className="p-2.5 rounded-xl bg-amber-950/30 border border-amber-900/50 hover:border-amber-400 transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 mb-0.5">
                <AlertCircle className="w-3 h-3" />
                <span>Wrong Show Time</span>
              </div>
              <div className="text-[10px] text-amber-300/80 font-mono">10:15 PM ticket at 06:45 PM</div>
            </button>

            {/* 6. Unverified / Tampered Barcode */}
            <button
              onClick={() => handleBarcodeScanned('FAKE_UNAUTHORIZED_BARCODE_PAYLOAD_99')}
              disabled={isProcessing}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-red-400/60 transition-all active:scale-[0.98]"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 mb-0.5">
                <AlertCircle className="w-3 h-3 text-red-400" />
                <span>Unverified Barcode</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono">External / Untrusted QR</div>
            </button>
          </div>
        </div>

        {/* Recent Scans History Drawer (if toggled) */}
        {showHistory && (
          <div className="mt-4 bg-[#0F172A] border border-slate-800 rounded-2xl p-4 animate-in slide-in-from-bottom-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-[#00E676]" />
                Recent Gate Scans (This Shift)
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">{recentLocalHistory.length} logs</span>
            </div>

            {recentLocalHistory.length === 0 ? (
              <div className="text-xs text-slate-500 text-center py-4">
                No scans recorded on this device yet.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {recentLocalHistory.map((item, idx) => (
                  <div 
                    key={idx}
                    className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-900/80 border border-slate-800"
                  >
                    <div>
                      <div className="font-bold text-slate-200">
                        {item.ticketDetails?.seats?.join(', ') || item.ticketDetails?.bookingReference || 'Scan Attempt'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {item.ticketDetails?.movieTitle || item.title}
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      item.status === 'VALIDATED' ? 'bg-[#00E676]/20 text-[#00E676]' :
                      item.status === 'DUPLICATE_ENTRY' ? 'bg-red-500/20 text-red-400' :
                      'bg-amber-500/20 text-amber-300'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Full-Screen Scan Result Modal */}
      {scanResult && (
        <FullScreenScanModal
          result={scanResult}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
