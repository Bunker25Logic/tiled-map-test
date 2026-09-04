import React from 'react';
import { useEffect, useState } from 'react';


/**
 * Forced landscape via CSS transform for iOS (e iOS Safari PWA).
 *
 * iOS ignores both manifest `orientation: landscape` and
 * `screen.orientation.lock()`. The only reliable cross-platform trick is
 * rotating the entire root element 90° with CSS when the device is portrait.
 *
 * This component:
 *  1. Detects portrait-mode on a mobile device.
 *  2. Applies a CSS class `.force-landscape` to <html> that rotates #root.
 *  3. On Android/Chrome it also tries screen.orientation.lock() as a bonus.
 */
export default function OrientationLockModal() {
  const [isPortraitMobile, setIsPortraitMobile] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const isMobile =
        /Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent) ||
        window.matchMedia('(pointer: coarse)').matches;
      const isPortrait = window.innerHeight > window.innerWidth;
      const shouldForce = isMobile && isPortrait;
      setIsPortraitMobile(shouldForce);

      // Apply/remove CSS class that does the CSS-transform rotation
      document.documentElement.classList.toggle('force-landscape', shouldForce);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    // Also try the API-based lock where it's supported (Android Chrome PWA)
    const tryApiLock = async () => {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const screenAny = screen as any;
        if (screenAny.orientation?.lock) {
          await screenAny.orientation.lock('landscape');
        }
      } catch {
        // Silently ignore — iOS throws, Android may allow
      }
    };
    tryApiLock();

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
      document.documentElement.classList.remove('force-landscape');
    };
  }, []);

  // No visual modal needed — the CSS transform handles it silently.
  // We only show a small hint the very first time (fades out in 3s).
  if (!isPortraitMobile) return null;

  return (
    <div style={overlayStyle}>
      <div style={cardStyle}>
        <div style={iconStyle}>↻</div>
        <p style={textStyle}>Girando automaticamente…</p>
      </div>
    </div>
  );
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 999999,
  background: '#06060f',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  animation: 'fadeOutOrientation 0.5s ease 1.5s forwards',
  pointerEvents: 'none',
};

const cardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 12,
};

const iconStyle: React.CSSProperties = {
  fontSize: 48,
  color: '#ffd700',
  animation: 'spinOrientation 1s linear',
};

const textStyle: React.CSSProperties = {
  fontSize: 14,
  color: 'rgba(200,210,255,0.7)',
  margin: 0,
};
