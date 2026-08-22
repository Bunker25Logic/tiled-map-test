export type GraphicStyle = 'modern-hd' | 'bloom-glow' | 'retro-crt' | 'pixel-sharp';

export interface AmbientParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  baseAlpha: number;
  pulseSpeed: number;
  pulseTimer: number;
  color: string;
}

export class ParticleSystem {
  public particles: AmbientParticle[] = [];
  private mapId = 'map1';

  constructor(count = 35, mapId = 'map1') {
    this.mapId = mapId;
    this.init(count);
  }

  public init(count = 35) {
    this.particles = [];
    const isCave = this.mapId === 'caverna-zona-1';

    for (let i = 0; i < count; i++) {
      const isFirefly = !isCave && Math.random() < 0.6;
      const color = isCave
        ? Math.random() < 0.5 ? 'rgba(168, 85, 247, ' : 'rgba(56, 189, 248, '
        : isFirefly ? 'rgba(250, 204, 21, ' : 'rgba(255, 255, 255, ';

      this.particles.push({
        x: Math.random() * 600 - 100,
        y: Math.random() * 500 - 100,
        vx: (Math.random() - 0.5) * (isCave ? 8 : 14),
        vy: -4 - Math.random() * (isCave ? 6 : 10),
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.7 + 0.2,
        baseAlpha: Math.random() * 0.6 + 0.3,
        pulseSpeed: 1.5 + Math.random() * 2.5,
        pulseTimer: Math.random() * Math.PI * 2,
        color,
      });
    }
  }

  public setMap(mapId: string) {
    if (this.mapId !== mapId) {
      this.mapId = mapId;
      this.init(35);
    }
  }

  public update(dt: number, worldViewW: number, worldViewH: number) {
    for (const p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.pulseTimer += dt * p.pulseSpeed;
      p.alpha = Math.max(0.1, p.baseAlpha + Math.sin(p.pulseTimer) * 0.3);

      // Wrap around viewport
      if (p.x < -40) p.x = worldViewW + 30;
      if (p.x > worldViewW + 40) p.x = -30;
      if (p.y < -40) p.y = worldViewH + 30;
      if (p.y > worldViewH + 40) p.y = -30;
    }
  }

  public draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    for (const p of this.particles) {
      ctx.fillStyle = `${p.color}${p.alpha.toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(Math.round(p.x), Math.round(p.y), p.size, 0, Math.PI * 2);
      ctx.fill();

      // Soft glow aura
      ctx.fillStyle = `${p.color}${(p.alpha * 0.25).toFixed(2)})`;
      ctx.beginPath();
      ctx.arc(Math.round(p.x), Math.round(p.y), p.size * 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

/**
 * Applies full-screen post-processing graphical shaders & filters.
 */
export function applyPostProcessing(
  ctx: CanvasRenderingContext2D,
  style: GraphicStyle,
  viewW: number,
  viewH: number,
  isCave: boolean
) {
  if (style === 'pixel-sharp') {
    // Pure raw pixel art mode - no overlays
    return;
  }

  ctx.save();

  // 1. Modern HD & Bloom Modes: Soft Vignette & Tone Mapping
  if (style === 'modern-hd' || style === 'bloom-glow') {
    // Cinematic Vignette
    const vigGrad = ctx.createRadialGradient(
      viewW / 2,
      viewH / 2,
      Math.min(viewW, viewH) * 0.45,
      viewW / 2,
      viewH / 2,
      Math.max(viewW, viewH) * 0.85
    );
    vigGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vigGrad.addColorStop(1, isCave ? 'rgba(0, 0, 0, 0.45)' : 'rgba(10, 15, 25, 0.28)');

    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, viewW, viewH);

    // Subtle bloom / ambient tint
    if (style === 'bloom-glow') {
      ctx.fillStyle = isCave ? 'rgba(88, 28, 135, 0.04)' : 'rgba(234, 179, 8, 0.03)';
      ctx.fillRect(0, 0, viewW, viewH);
    }
  }

  // 2. Retro CRT Mode: Scanlines & Phosphor Vignette
  if (style === 'retro-crt') {
    // Subtle Scanlines
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    for (let y = 0; y < viewH; y += 3) {
      ctx.fillRect(0, y, viewW, 1);
    }

    // Heavy Curved CRT Vignette
    const crtGrad = ctx.createRadialGradient(
      viewW / 2,
      viewH / 2,
      Math.min(viewW, viewH) * 0.4,
      viewW / 2,
      viewH / 2,
      Math.max(viewW, viewH) * 0.75
    );
    crtGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
    crtGrad.addColorStop(0.8, 'rgba(0, 10, 0, 0.25)');
    crtGrad.addColorStop(1, 'rgba(0, 0, 0, 0.65)');

    ctx.fillStyle = crtGrad;
    ctx.fillRect(0, 0, viewW, viewH);
  }

  ctx.restore();
}
