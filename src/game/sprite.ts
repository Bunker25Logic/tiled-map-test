import type { Direction, AnimationState } from './types';

/**
 * LPC Sprite Sheet Specifications (64x64 per frame):
 * - Row 0: Up (North)
 * - Row 1: Left (West)
 * - Row 2: Down (South)
 * - Row 3: Right (East)
 */
export const DIR_ROW: Record<Direction, number> = {
  up: 0,
  left: 1,
  down: 2,
  right: 3,
};

export const FRAME_SIZE = 64;

export interface SpriteConfig {
  frames: number;
  fps: number;
  loop: boolean;
}

export const SPRITE_CONFIGS: Record<AnimationState, SpriteConfig> = {
  idle: { frames: 1, fps: 0, loop: true },
  walk: { frames: 9, fps: 11, loop: true },
  attack: { frames: 6, fps: 12, loop: false },
  dead: { frames: 6, fps: 8, loop: false },
};

export class SpriteAnimator {
  public frame = 0;
  private timer = 0;
  public state: AnimationState = 'idle';
  public direction: Direction = 'down';
  public isFinished = false;

  update(dt: number): void {
    const config = SPRITE_CONFIGS[this.state];
    if (config.fps <= 0 || this.state === 'idle') {
      this.frame = 0;
      return;
    }

    this.timer += dt;
    const interval = 1 / config.fps;

    while (this.timer >= interval) {
      this.timer -= interval;
      this.frame++;

      if (this.frame >= config.frames) {
        if (config.loop) {
          this.frame = 0;
        } else {
          this.frame = config.frames - 1;
          this.isFinished = true;
          break;
        }
      }
    }
  }

  setState(state: AnimationState, direction?: Direction): void {
    if (direction) {
      this.direction = direction;
    }

    // Don't interrupt attack until it finishes unless forcing dead
    if (this.state === 'attack' && !this.isFinished && state !== 'dead' && state !== 'attack') {
      return;
    }

    if (this.state === state) return;

    this.state = state;
    this.frame = 0;
    this.timer = 0;
    this.isFinished = false;
  }

  triggerAttack(): void {
    this.state = 'attack';
    this.frame = 0;
    this.timer = 0;
    this.isFinished = false;
  }

  getFrameCoords(): { col: number; row: number } {
    if (this.state === 'dead') {
      return { col: this.frame, row: 0 };
    }
    return {
      col: this.frame,
      row: DIR_ROW[this.direction],
    };
  }
}
