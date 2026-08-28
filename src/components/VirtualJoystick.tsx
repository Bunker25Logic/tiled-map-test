import { useEffect, useRef, useState, useCallback } from 'react';

interface VirtualJoystickProps {
  onMove: (vx: number, vy: number) => void;
  onEnd: () => void;
  onAttack: () => void;
  onEnterPortal?: () => void;
  hasPortalNearby?: boolean;
  onOpenInventory?: () => void;
}

export default function VirtualJoystick({
  onMove,
  onEnd,
  onAttack,
  onEnterPortal,
  hasPortalNearby,
  onOpenInventory,
}: VirtualJoystickProps) {
  const [joystickActive, setJoystickActive] = useState(false);
  const [joystickPos, setJoystickPos] = useState({ startX: 0, startY: 0, currentX: 0, currentY: 0 });
  const touchIdRef = useRef<number | null>(null);

  const radius = 45; // Max knob distance from center

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      // Only capture touches on the left half of the screen for the joystick
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.clientX < window.innerWidth * 0.45 && touchIdRef.current === null) {
          touchIdRef.current = touch.identifier;
          setJoystickPos({
            startX: touch.clientX,
            startY: touch.clientY,
            currentX: touch.clientX,
            currentY: touch.clientY,
          });
          setJoystickActive(true);
          break;
        }
      }
    },
    []
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (touchIdRef.current === null) return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === touchIdRef.current) {
          const dx = touch.clientX - joystickPos.startX;
          const dy = touch.clientY - joystickPos.startY;
          const dist = Math.hypot(dx, dy);

          const clampedDist = Math.min(dist, radius);
          const angle = Math.atan2(dy, dx);

          const curX = joystickPos.startX + Math.cos(angle) * clampedDist;
          const curY = joystickPos.startY + Math.sin(angle) * clampedDist;

          setJoystickPos((prev) => ({
            ...prev,
            currentX: curX,
            currentY: curY,
          }));

          const normalizedX = (Math.cos(angle) * clampedDist) / radius;
          const normalizedY = (Math.sin(angle) * clampedDist) / radius;

          // Apply deadzone of 0.15
          if (clampedDist / radius > 0.15) {
            onMove(normalizedX, normalizedY);
          } else {
            onMove(0, 0);
          }
          break;
        }
      }
    },
    [joystickPos.startX, joystickPos.startY, onMove]
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (touchIdRef.current === null) return;

      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === touchIdRef.current) {
          touchIdRef.current = null;
          setJoystickActive(false);
          onEnd();
          break;
        }
      }
    },
    [onEnd]
  );

  useEffect(() => {
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return (
    <div className="mobile-touch-controls-layer">
      {/* Floating Joystick Visualizer */}
      {joystickActive && (
        <div
          className="virtual-joystick-base"
          style={{
            left: `${joystickPos.startX}px`,
            top: `${joystickPos.startY}px`,
          }}
        >
          <div
            className="virtual-joystick-knob"
            style={{
              transform: `translate(${joystickPos.currentX - joystickPos.startX}px, ${
                joystickPos.currentY - joystickPos.startY
              }px)`,
            }}
          />
        </div>
      )}

      {/* Floating Action Buttons for Right Thumb on Mobile */}
      <div className="mobile-actions-right">
        {hasPortalNearby && onEnterPortal && (
          <button
            className="btn-mobile-action btn-mobile-portal"
            onTouchStart={(e) => {
              e.stopPropagation();
              onEnterPortal();
            }}
            onClick={onEnterPortal}
            title="Entrar/Sair do Buraco"
          >
            <span className="mobile-action-icon">🕳️</span>
            <span className="mobile-action-text">Entrar</span>
          </button>
        )}

        {onOpenInventory && (
          <button
            className="btn-mobile-action btn-mobile-bag"
            onTouchStart={(e) => {
              e.stopPropagation();
              onOpenInventory();
            }}
            onClick={onOpenInventory}
            title="Abrir Mochila"
          >
            <span className="mobile-action-icon">🎒</span>
            <span className="mobile-action-text">Bag</span>
          </button>
        )}

        <button
          className="btn-mobile-action btn-mobile-attack"
          onTouchStart={(e) => {
            e.stopPropagation();
            onAttack();
          }}
          onClick={onAttack}
          title="Ataque Físico"
        >
          <span className="mobile-action-icon">⚔️</span>
          <span className="mobile-action-text">Atacar</span>
        </button>
      </div>
    </div>
  );
}
