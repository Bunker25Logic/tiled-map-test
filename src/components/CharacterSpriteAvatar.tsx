import { useEffect, useRef } from 'react';
import type { CharacterId } from '../game/characters';
import { loadChromaKeyImage } from '../game/imageLoader';

interface CharacterSpriteAvatarProps {
  charId: CharacterId;
  size?: number;
  className?: string;
}

export default function CharacterSpriteAvatar({
  charId,
  size = 36,
  className = '',
}: CharacterSpriteAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let isCancelled = false;

    async function drawAvatar() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingEnabled = false;

      if (charId === 'mark') {
        // Mark uses spritesheet (frame 0,0 is front-facing idle)
        const img = await loadChromaKeyImage('/assets/char/mark/mark-walk.webp');
        if (isCancelled) return;
        ctx.drawImage(img, 0, 0, 32, 36, 0, 0, canvas.width, canvas.height);
      } else {
        // OTS characters (1_1_1_3.png is front-facing idle)
        const img = await loadChromaKeyImage(`/assets/char/${charId}/1_1_1_3.png`);
        if (isCancelled) return;
        ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, 0, 0, canvas.width, canvas.height);
      }
    }

    drawAvatar();

    return () => {
      isCancelled = true;
    };
  }, [charId]);

  const canvasWidth = charId === 'mark' ? 32 : 32;
  const canvasHeight = charId === 'mark' ? 36 : 32;

  return (
    <canvas
      ref={canvasRef}
      width={canvasWidth}
      height={canvasHeight}
      className={`char-sprite-avatar ${className}`}
      style={{
        width: `${size}px`,
        height: `${(size * canvasHeight) / canvasWidth}px`,
        imageRendering: 'pixelated',
      }}
    />
  );
}
