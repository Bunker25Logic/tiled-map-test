import React from 'react';

interface InstallIconProps {
  size?: number;
  animated?: boolean;
}

export const InstallIcon: React.FC<InstallIconProps> = ({ size = 80, animated = true }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        filter: 'drop-shadow(0 0 12px rgba(255, 180, 0, 0.8))',
        animation: animated ? 'installIconPulse 2s ease-in-out infinite' : 'none',
      }}
    >
      <style>{`
        @keyframes installIconPulse {
          0%, 100% { transform: scale(1); filter: drop-shadow(0 0 12px rgba(255,180,0,0.8)); }
          50% { transform: scale(1.06); filter: drop-shadow(0 0 22px rgba(255,200,50,1)); }
        }
        @keyframes arrowBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(5px); }
        }
        @keyframes shimmer {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>

      {/* Background circle */}
      <circle cx="50" cy="50" r="48" fill="url(#bgGrad)" stroke="#c8a000" strokeWidth="2" />

      {/* Shield body */}
      <path
        d="M50 18 L72 28 L72 52 C72 65 61 74 50 80 C39 74 28 65 28 52 L28 28 Z"
        fill="url(#shieldGrad)"
        stroke="#e0b000"
        strokeWidth="1.5"
      />

      {/* Shield inner border */}
      <path
        d="M50 23 L67 31 L67 52 C67 62 58 70 50 75 C42 70 33 62 33 52 L33 31 Z"
        fill="none"
        stroke="#ffd700"
        strokeWidth="0.8"
        opacity="0.6"
      />

      {/* Download arrow - animated */}
      <g style={{ animation: animated ? 'arrowBounce 1.2s ease-in-out infinite' : 'none', transformOrigin: '50px 50px' }}>
        {/* Arrow shaft */}
        <rect x="47" y="35" width="6" height="18" rx="2" fill="#ffd700" />
        {/* Arrow head */}
        <path d="M39 51 L50 63 L61 51 Z" fill="#ffd700" />
      </g>

      {/* Base line */}
      <rect x="36" y="65" width="28" height="4" rx="2" fill="#ffd700" opacity="0.9" />

      {/* Corner ornaments */}
      <circle cx="28" cy="28" r="3" fill="#e0b000" />
      <circle cx="72" cy="28" r="3" fill="#e0b000" />

      {/* Sparkles */}
      <g style={{ animation: animated ? 'shimmer 1.8s ease-in-out infinite' : 'none' }}>
        <circle cx="18" cy="20" r="2" fill="#ffd700" opacity="0.8" />
        <circle cx="82" cy="20" r="1.5" fill="#ffd700" opacity="0.6" />
        <circle cx="15" cy="55" r="1.5" fill="#ffd700" opacity="0.7" />
        <circle cx="85" cy="45" r="2" fill="#ffd700" opacity="0.5" />
        <circle cx="22" cy="75" r="1" fill="#ffd700" opacity="0.6" />
        <circle cx="78" cy="72" r="1.5" fill="#ffd700" opacity="0.7" />
      </g>

      <defs>
        <radialGradient id="bgGrad" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#1a1a3e" />
          <stop offset="100%" stopColor="#0a0a18" />
        </radialGradient>
        <linearGradient id="shieldGrad" x1="50" y1="18" x2="50" y2="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3a3a6e" />
          <stop offset="50%" stopColor="#252550" />
          <stop offset="100%" stopColor="#1a1a3a" />
        </linearGradient>
      </defs>
    </svg>
  );
};
