import React from 'react';

export default function EntryXLogo({
  variant = 'full', // 'full' | 'compact' | 'icon' | 'badge'
  size = 'md',     // 'sm' | 'md' | 'lg' | 'xl'
  showTagline = true,
  className = ''
}) {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
    xl: 'text-4xl'
  };

  const taglineSizes = {
    sm: 'text-[9px]',
    md: 'text-[11px]',
    lg: 'text-xs',
    xl: 'text-sm'
  };

  // The custom EntryX SVG Icon
  const SvgIcon = (
    <svg 
      className={`${iconSizes[size]} shrink-0 drop-shadow-[0_0_12px_rgba(0,230,118,0.35)]`} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logoGreen" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00FFA3" />
          <stop offset="100%" stopColor="#00E676" />
        </linearGradient>
        <linearGradient id="logoCyan" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
      </defs>

      {/* Ticket Base with Side Notches */}
      <path 
        d="M20 18 H80 A5 5 0 0 1 85 23 V42 A8 8 0 0 0 85 58 V77 A5 5 0 0 1 80 82 H20 A5 5 0 0 1 15 77 V58 A8 8 0 0 0 15 42 V23 A5 5 0 0 1 20 18 Z" 
        fill="#0F172A" 
        stroke="#334155" 
        strokeWidth="3.5" 
      />

      {/* Ticket Perforation */}
      <line x1="36" y1="20" x2="36" y2="80" stroke="#334155" strokeDasharray="3 3" strokeWidth="2" />

      {/* Scanner Alignment Brackets (Corner markers) */}
      <path d="M10 26 V12 H24" stroke="url(#logoCyan)" strokeWidth="3" strokeLinecap="round" />
      <path d="M76 12 H90 V26" stroke="url(#logoCyan)" strokeWidth="3" strokeLinecap="round" />
      <path d="M90 74 V88 H76" stroke="url(#logoCyan)" strokeWidth="3" strokeLinecap="round" />
      <path d="M24 88 H10 V74" stroke="url(#logoCyan)" strokeWidth="3" strokeLinecap="round" />

      {/* Stylized Checkmark intersecting into X */}
      <path 
        d="M44 50 L56 63 L78 35" 
        stroke="url(#logoGreen)" 
        strokeWidth="6" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      <path 
        d="M78 63 L65 48" 
        stroke="url(#logoGreen)" 
        strokeWidth="5" 
        strokeLinecap="round" 
      />

      {/* Center Reticle dot */}
      <circle cx="26" cy="50" r="3.5" fill="#38BDF8" />
    </svg>
  );

  if (variant === 'icon') {
    return <div className={`inline-flex items-center ${className}`}>{SvgIcon}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {SvgIcon}
      <div className="flex flex-col leading-none">
        <div className={`font-black tracking-tight text-white flex items-center ${textSizes[size]}`}>
          <span>Entry</span>
          <span className="text-[#00E676] ml-[1px]">X</span>
        </div>
        {showTagline && variant !== 'compact' && (
          <span className={`font-semibold tracking-wider uppercase text-slate-400 mt-0.5 ${taglineSizes[size]}`}>
            One Ticket. One Entry.
          </span>
        )}
      </div>
    </div>
  );
}
