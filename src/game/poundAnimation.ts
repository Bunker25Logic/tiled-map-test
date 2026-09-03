import type { Direction } from './types';

/**
 * Generates an animated SVG DOM node for the unarmed Pound ("Pancada com as Mãos") attack.
 * Uses pure SVG and CSS @keyframes for GPU-accelerated martial arts impact.
 */
export function createPoundElement(worldX: number, worldY: number, dir: Direction): HTMLDivElement {
  const container = document.createElement('div');
  container.className = 'pound-effect-node';
  container.style.left = `${worldX}px`;
  container.style.top = `${worldY}px`;

  let rotDeg = 0;
  if (dir === 'up') rotDeg = 180;
  else if (dir === 'left') rotDeg = 90;
  else if (dir === 'right') rotDeg = -90;

  container.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="-60 -60 120 120" width="96" height="96" style="transform: rotate(${rotDeg}deg);">
      <defs>
        <filter id="pGlow_${Date.now()}" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="pGradLeft_${Date.now()}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#fed7aa" />
          <stop offset="50%" stop-color="#f97316" />
          <stop offset="100%" stop-color="#c2410c" />
        </linearGradient>
        <linearGradient id="pGradRight_${Date.now()}" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#fed7aa" />
          <stop offset="50%" stop-color="#f97316" />
          <stop offset="100%" stop-color="#c2410c" />
        </linearGradient>
        <linearGradient id="pBurstGrad_${Date.now()}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="45%" stop-color="#fde047" />
          <stop offset="100%" stop-color="#ea580c" />
        </linearGradient>
      </defs>

      <style>
        @keyframes shockOut {
          0% { transform: scale(0.15); opacity: 0; stroke-width: 6px; }
          20% { opacity: 1; stroke-width: 4px; }
          100% { transform: scale(1.6); opacity: 0; stroke-width: 0.8px; }
        }
        @keyframes shockIn {
          0% { transform: scale(0.1); opacity: 0; stroke-width: 5px; }
          25% { opacity: 1; stroke-width: 3.5px; }
          100% { transform: scale(1.25); opacity: 0; stroke-width: 0.5px; }
        }
        @keyframes starBurst {
          0% { transform: scale(0) rotate(0deg); opacity: 0; }
          22% { transform: scale(1.2) rotate(15deg); opacity: 1; }
          45% { transform: scale(1.35) rotate(25deg); opacity: 0.85; }
          100% { transform: scale(1.7) rotate(45deg); opacity: 0; }
        }
        @keyframes fLeft {
          0% { transform: translate(-38px, -28px) rotate(-35deg) scale(1.3); opacity: 0; }
          15% { opacity: 1; }
          30% { transform: translate(-7px, 2px) rotate(-8deg) scale(1.05); opacity: 1; }
          50% { transform: translate(-10px, 0px) rotate(-12deg) scale(0.98); opacity: 0.9; }
          100% { transform: translate(-18px, -6px) rotate(-20deg) scale(0.8); opacity: 0; }
        }
        @keyframes fRight {
          0% { transform: translate(38px, -28px) rotate(35deg) scale(1.3); opacity: 0; }
          15% { opacity: 1; }
          30% { transform: translate(7px, 2px) rotate(8deg) scale(1.05); opacity: 1; }
          50% { transform: translate(10px, 0px) rotate(12deg) scale(0.98); opacity: 0.9; }
          100% { transform: translate(18px, -6px) rotate(20deg) scale(0.8); opacity: 0; }
        }
        @keyframes sparkRay {
          0% { transform: scale(0.2); opacity: 0; }
          25% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes dustCloud {
          0% { transform: scale(0.2); opacity: 0; }
          25% { opacity: 0.8; }
          100% { transform: scale(1.4); opacity: 0; }
        }

        .sw-out { animation: shockOut 0.38s cubic-bezier(0.1, 0.85, 0.25, 1) forwards; transform-origin: 0px 4px; }
        .sw-in  { animation: shockIn 0.35s cubic-bezier(0.1, 0.85, 0.25, 1) forwards; transform-origin: 0px 4px; }
        .s-burst { animation: starBurst 0.34s cubic-bezier(0.15, 0.85, 0.35, 1) forwards; transform-origin: 0px 2px; }
        .fl { animation: fLeft 0.36s cubic-bezier(0.12, 0.95, 0.2, 1) forwards; transform-origin: 0px 0px; }
        .fr { animation: fRight 0.36s cubic-bezier(0.12, 0.95, 0.2, 1) forwards; transform-origin: 0px 0px; }
        .sparks { animation: sparkRay 0.36s ease-out forwards; transform-origin: 0px 0px; }
        .dust { animation: dustCloud 0.38s ease-out forwards; transform-origin: 0px 0px; }
      </style>

      <!-- Shockwave Rings -->
      <ellipse class="sw-out" cx="0" cy="4" rx="34" ry="20" fill="none" stroke="#f59e0b" stroke-linecap="round" />
      <ellipse class="sw-in" cx="0" cy="4" rx="24" ry="14" fill="none" stroke="#ffffff" stroke-linecap="round" />

      <!-- Dust Impact Clouds -->
      <g class="dust" fill="#fed7aa" opacity="0.65">
        <circle cx="-28" cy="8" r="4.5" />
        <circle cx="-22" cy="14" r="3.5" />
        <circle cx="28" cy="8" r="4.5" />
        <circle cx="22" cy="14" r="3.5" />
        <circle cx="0" cy="18" r="5" />
        <circle cx="-10" cy="17" r="4" />
        <circle cx="10" cy="17" r="4" />
      </g>

      <!-- Kinetic Impact Starburst -->
      <g class="s-burst">
        <polygon points="0,-24 4,-8 20,-12 8,-2 24,6 7,7 12,22 0,10 -12,22 -7,7 -24,6 -8,-2 -20,-12 -4,-8" fill="url(#pBurstGrad_${Date.now()})" />
        <circle cx="0" cy="2" r="7" fill="#ffffff" />
      </g>

      <!-- Impact Sparks -->
      <g class="sparks" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round">
        <line x1="-12" y1="-14" x2="-22" y2="-24" />
        <line x1="12" y1="-14" x2="22" y2="-24" />
        <line x1="-18" y1="2" x2="-32" y2="4" />
        <line x1="18" y1="2" x2="32" y2="4" />
        <line x1="-14" y1="16" x2="-24" y2="26" />
        <line x1="14" y1="16" x2="24" y2="26" />
      </g>

      <!-- Left Fist Slam -->
      <g class="fl">
        <rect x="-24" y="-12" width="14" height="18" rx="4" fill="#9a3412" stroke="#431407" stroke-width="1.5" transform="rotate(-15 -17 -3)" />
        <path d="M-18,-8 C-20,-8 -22,-4 -22,2 C-22,8 -18,12 -12,12 C-6,12 -4,8 -4,2 C-4,-4 -8,-8 -18,-8 Z" fill="url(#pGradLeft_${Date.now()})" stroke="#7c2d12" stroke-width="1.6" />
        <ellipse cx="-5" cy="-4" rx="3.5" ry="2.8" fill="#fde047" stroke="#b45309" stroke-width="1" />
        <ellipse cx="-4" cy="1" rx="3.5" ry="2.8" fill="#fde047" stroke="#b45309" stroke-width="1" />
        <ellipse cx="-5" cy="6" rx="3.5" ry="2.8" fill="#fde047" stroke="#b45309" stroke-width="1" />
        <path d="M-14,6 C-14,9 -10,10 -7,8 C-5,7 -6,4 -9,3 Z" fill="#fdba74" stroke="#9a3412" stroke-width="1.2" />
      </g>

      <!-- Right Fist Slam -->
      <g class="fr">
        <rect x="10" y="-12" width="14" height="18" rx="4" fill="#9a3412" stroke="#431407" stroke-width="1.5" transform="rotate(15 17 -3)" />
        <path d="M18,-8 C20,-8 22,-4 22,2 C22,8 18,12 12,12 C6,12 4,8 4,2 C4,-4 8,-8 18,-8 Z" fill="url(#pGradRight_${Date.now()})" stroke="#7c2d12" stroke-width="1.6" />
        <ellipse cx="5" cy="-4" rx="3.5" ry="2.8" fill="#fde047" stroke="#b45309" stroke-width="1" />
        <ellipse cx="4" cy="1" rx="3.5" ry="2.8" fill="#fde047" stroke="#b45309" stroke-width="1" />
        <ellipse cx="5" cy="6" rx="3.5" ry="2.8" fill="#fde047" stroke="#b45309" stroke-width="1" />
        <path d="M14,6 C14,9 10,10 7,8 C5,7 6,4 9,3 Z" fill="#fdba74" stroke="#9a3412" stroke-width="1.2" />
      </g>
    </svg>
  `;

  return container;
}
