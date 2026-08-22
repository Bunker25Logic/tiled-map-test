import { useEffect, useState } from 'react';

export default function OrientationLockModal() {
  const [isPortraitMobile, setIsPortraitMobile] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const isMobile =
        /Android|iPhone|iPad|iPod|Windows Phone/i.test(navigator.userAgent) ||
        window.matchMedia('(pointer: coarse)').matches;
      const isPortrait = window.innerHeight > window.innerWidth;
      setIsPortraitMobile(isMobile && isPortrait);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  const handleRequestLandscape = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      // Attempt screen orientation lock if supported by the browser
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const screenAny = screen as any;
      if (screenAny.orientation && screenAny.orientation.lock) {
        await screenAny.orientation.lock('landscape');
      }
    } catch {
      // Ignored if user interaction/browser forbids locking
    }
  };

  if (!isPortraitMobile) return null;

  return (
    <div className="orientation-modal-overlay">
      <div className="orientation-modal-card">
        <div className="orientation-icon-animated">🔄📱</div>
        <h2>Gire o Celular</h2>
        <p>Para jogar com a melhor visão e controles de toque, vire seu aparelho na horizontal (paisagem).</p>
        <button className="btn-orientation-fullscreen" onClick={handleRequestLandscape}>
          <span>🎮 Modo Paisagem / Tela Cheia</span>
        </button>
      </div>
    </div>
  );
}
