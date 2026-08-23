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

      const img = await loadChromaKeyImage(`/assets/char/${charId}/1_1_1_3.png`);
      if (isCancelled) return;
      canvas.width = img.naturalWidth || 32;
      canvas.height = img.naturalHeight || 32;
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, 0, 0);
    }

    drawAvatar();

    return () => {
      isCancelled = true;
    };
  }, [charId]);

  return (
    <canvas
      ref={canvasRef}
      width={32}
      height={32}
      className={`char-sprite-avatar ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        imageRendering: 'pixelated',
      }}
    />
  );
}

