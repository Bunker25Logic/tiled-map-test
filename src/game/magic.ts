import type { Direction } from './types';
import type { CharacterId } from './characters';

export type SpellAnimType = 'sheet' | 'sequence' | 'custom_frames' | 'directional_projectile';

export function getFireballDirectionFrame(vx: number, vy: number, dir: Direction): number {
  const speed = Math.hypot(vx, vy);
  if (speed < 1) {
    switch (dir) {
      case 'up': return 1;
      case 'right': return 5;
      case 'down': return 7;
      case 'left': return 3;
      default: return 5;
    }
  }
  const deg = (Math.atan2(vy, vx) * (180 / Math.PI) + 360) % 360;
  if (deg >= 337.5 || deg < 22.5) return 5; // Right / East
  if (deg >= 22.5 && deg < 67.5) return 8;  // Down-Right / South-East
  if (deg >= 67.5 && deg < 112.5) return 7; // Down / South
  if (deg >= 112.5 && deg < 157.5) return 6;// Down-Left / South-West
  if (deg >= 157.5 && deg < 202.5) return 3;// Left / West
  if (deg >= 202.5 && deg < 247.5) return 0;// Up-Left / North-West
  if (deg >= 247.5 && deg < 292.5) return 1;// Up / North
  if (deg >= 292.5 && deg < 337.5) return 2;// Up-Right / North-East
  return 5;
}

export interface SpellFrameCoord {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
}

export interface SpellDef {
  id: string;
  name: string;
  category: 'elemental' | 'arcane' | 'nature';
  classRestriction?: CharacterId;
  allowedClasses?: CharacterId[];
  key?: string;
  icon: string;
  color: string;
  description: string;
  animType: SpellAnimType;
  // For sheet
  cols?: number;
  rows?: number;
  totalFrames?: number;
  frameW?: number;
  frameH?: number;
  // For sequence
  frameKeys?: string[];
  // For custom_frames (e.g. magics t.webp)
  customFrames?: SpellFrameCoord[];
  imageKey?: string;
  // Display & sizing
  renderW: number;
  renderH: number;
  fps: number;
  // Positioning and Anchoring
  isDirectional?: boolean;
  attachToCaster?: boolean;
  projectileSpeed?: number;
  // Origin level on player body
  spawnOrigin?: 'torso' | 'ground';
  // Side image naturally faces left, so needs horizontal flip when facing right
  flipOnRight?: boolean;
  // Anchor ratio inside renderW/renderH (0..1, default 0.5, 0.5)
  anchorX?: (dir: Direction) => number;
  anchorY?: (dir: Direction) => number;
  spawnOffsetDist?: number;
  getImageKey?: (dir: Direction) => string;
  // Combat stats & Mana cost
  manaCost?: number;
  damage?: number;
  damageRadius?: number;
  isHoming?: boolean;
}

export const ALL_SPELLS: SpellDef[] = [
  // ─── Elemental Spells ──────────────────────────────────────────────────────
  {
    id: 'firelion',
    allowedClasses: ["luxio","magician"],
    damage: 70,
    manaCost: 30,
    damageRadius: 40,
    name: 'Fire Lion Wave',
    category: 'elemental',
    key: '1',
    icon: '🔥',
    color: '#f97316',
    description: 'Invoca uma onda flamejante em forma de leão de fogo',
    animType: 'sheet',
    cols: 4,
    rows: 4,
    totalFrames: 16,
    frameW: 128,
    frameH: 128,
    renderW: 96,
    renderH: 96,
    fps: 20,
    isDirectional: true,
    projectileSpeed: 160,
    spawnOrigin: 'torso',
    anchorX: (dir) => {
      if (dir === 'right') return 0.12;
      if (dir === 'left') return 0.88;
      return 0.5;
    },
    anchorY: (dir) => {
      if (dir === 'up') return 0.55;
      if (dir === 'down') return 0.44;
      return 0.45;
    },
    spawnOffsetDist: 10,
    getImageKey: (dir: Direction) => `firelion_${dir}`,
  },
  {
    id: 'lightningclaw',
    allowedClasses: ["luxio","paladin"],
    damage: 65,
    manaCost: 25,
    damageRadius: 35,
    name: 'Lightning Claw',
    category: 'elemental',
    key: '2',
    icon: '⚡',
    color: '#eab308',
    description: 'Golpe fulminante de garras elétricas no solo',
    animType: 'sheet',
    cols: 4,
    rows: 4,
    totalFrames: 16,
    frameW: 128,
    frameH: 128,
    renderW: 76,
    renderH: 76,
    fps: 22,
    spawnOrigin: 'ground',
    anchorX: () => 0.5,
    anchorY: () => 0.65,
    spawnOffsetDist: 18,
    getImageKey: () => 'lightningclaw',
  },
  {
    id: 'iceshield',
    allowedClasses: ["paladin","magician"],
    damage: 30,
    manaCost: 20,
    damageRadius: 35,
    name: 'Ice Shield',
    category: 'elemental',
    key: '3',
    icon: '❄️',
    color: '#38bdf8',
    description: 'Cúpula protetora de cristal de gelo em volta do corpo',
    animType: 'sheet',
    cols: 4,
    rows: 4,
    totalFrames: 16,
    frameW: 128,
    frameH: 128,
    renderW: 72,
    renderH: 72,
    fps: 16,
    attachToCaster: true,
    spawnOrigin: 'torso',
    anchorX: () => 0.5,
    anchorY: () => 0.5,
    spawnOffsetDist: 0,
    getImageKey: () => 'iceshield',
  },
  {
    id: 'tornado',
    allowedClasses: ["luxio","archer","magician"],
    damage: 70,
    manaCost: 30,
    damageRadius: 45,
    name: 'Whirlwind Tornado',
    category: 'elemental',
    key: '4',
    icon: '🌪️',
    color: '#a3e635',
    description: 'Turbilhão de ventos cortantes que avança pelo mapa',
    animType: 'sheet',
    cols: 4,
    rows: 4,
    totalFrames: 16,
    frameW: 128,
    frameH: 128,
    renderW: 80,
    renderH: 80,
    fps: 20,
    projectileSpeed: 95,
    spawnOrigin: 'ground',
    anchorX: () => 0.5,
    anchorY: () => 0.70,
    spawnOffsetDist: 14,
    getImageKey: () => 'tornado',
  },
  {
    id: 'torrentacle',
    allowedClasses: ["paladin","magician"],
    damage: 75,
    manaCost: 32,
    damageRadius: 40,
    name: 'Abyssal Torrentacle',
    category: 'elemental',
    key: '5',
    icon: '🌊',
    color: '#60a5fa',
    description: 'Tentáculos de água e gelo abissais brotam do solo',
    animType: 'sheet',
    cols: 4,
    rows: 4,
    totalFrames: 16,
    frameW: 128,
    frameH: 128,
    renderW: 88,
    renderH: 88,
    fps: 18,
    spawnOrigin: 'ground',
    anchorX: () => 0.5,
    anchorY: () => 0.75,
    spawnOffsetDist: 20,
    getImageKey: () => 'torrentacle',
  },
  {
    id: 'spikes',
    allowedClasses: ["necromancer","luxio","paladin"],
    damage: 65,
    manaCost: 24,
    damageRadius: 38,
    name: 'Stone & Ice Spikes',
    category: 'elemental',
    key: '6',
    icon: '⛰️',
    color: '#d97706',
    description: 'Espinhos pontiagudos de pedra e gelo perfuram o chão',
    animType: 'sheet',
    cols: 10,
    rows: 4,
    totalFrames: 10,
    frameW: 64,
    frameH: 64,
    renderW: 68,
    renderH: 68,
    fps: 15,
    spawnOrigin: 'ground',
    anchorX: () => 0.5,
    anchorY: () => 0.70,
    spawnOffsetDist: 20,
    getImageKey: () => 'spikes',
  },
  {
    id: 'turtleshell',
    allowedClasses: ["paladin","luxio"],
    damage: 25,
    manaCost: 18,
    damageRadius: 35,
    name: 'Turtle Shell Guard',
    category: 'elemental',
    key: '7',
    icon: '🛡️',
    color: '#22c55e',
    description: 'Escudo impenetrável de carapaça esmeralda',
    animType: 'sheet',
    cols: 4,
    rows: 4,
    totalFrames: 16,
    frameW: 128,
    frameH: 128,
    renderW: 72,
    renderH: 72,
    fps: 18,
    attachToCaster: true,
    spawnOrigin: 'torso',
    flipOnRight: true,
    anchorX: () => 0.5,
    anchorY: () => 0.5,
    spawnOffsetDist: 0,
    getImageKey: (dir: Direction) =>
      dir === 'left' || dir === 'right' ? 'turtleshell_side' : 'turtleshell_front',
  },
  {
    id: 'snakebite',
    allowedClasses: ["archer","necromancer"],
    damage: 50,
    manaCost: 22,
    damageRadius: 30,
    isHoming: true,
    name: 'Snake Bite',
    category: 'elemental',
    key: '8',
    icon: '🐍',
    color: '#84cc16',
    description: 'Mordida venenosa da serpente primordial',
    animType: 'sheet',
    cols: 4,
    rows: 4,
    totalFrames: 16,
    frameW: 128,
    frameH: 128,
    renderW: 84,
    renderH: 84,
    fps: 22,
    isDirectional: true,
    spawnOrigin: 'ground',
    flipOnRight: true,
    anchorX: (dir) => {
      if (dir === 'left' || dir === 'right') return 0.75;
      return 0.5;
    },
    anchorY: () => 0.73,
    spawnOffsetDist: 14,
    getImageKey: (dir: Direction) => {
      if (dir === 'up') return 'snakebite_up';
      if (dir === 'down') return 'snakebite_down';
      return 'snakebite_side';
    },
  },

  // ─── Fireball (Mage & Elemental) ─────────────────────────────────────────
  {
    id: 'fireball',
    allowedClasses: ['magician', 'necromancer'],
    damage: 65,
    manaCost: 20,
    damageRadius: 36,
    isHoming: true,
    projectileSpeed: 230,
    name: 'Bola de Fogo',
    category: 'elemental',
    key: '1',
    icon: '🔥',
    color: '#ff4500',
    description: 'Dispara uma esfera flamejante veloz que persegue o alvo e causa dano de fogo',
    animType: 'directional_projectile',
    imageKey: 'fireball',
    cols: 9,
    rows: 1,
    totalFrames: 9,
    frameW: 32,
    frameH: 32,
    renderW: 44,
    renderH: 44,
    fps: 1,
    spawnOrigin: 'torso',
    anchorX: () => 0.5,
    anchorY: () => 0.5,
    spawnOffsetDist: 14,
    getImageKey: () => 'fireball',
  },

  // ─── Fireball & Particle Blasts ───────────────────────────────────────────
  {
    id: 'sparkling_fireball',
    allowedClasses: ["luxio","magician","paladin"],
    damage: 55,
    manaCost: 20,
    damageRadius: 32,
    name: 'Sparkling Fireball',
    category: 'elemental',
    key: '9',
    icon: '☄️',
    color: '#ff4500',
    description: 'Grande meteoro flamejante que avança queimando tudo',
    animType: 'sheet',
    cols: 8,
    rows: 7,
    totalFrames: 50,
    frameW: 256,
    frameH: 256,
    renderW: 96,
    renderH: 96,
    fps: 28,
    isDirectional: true,
    projectileSpeed: 180,
    spawnOrigin: 'torso',
    anchorX: () => 0.50,
    anchorY: () => 0.48,
    spawnOffsetDist: 12,
    getImageKey: () => 'sparkling_fireball_small',
  },
  {
    id: 'wind_fireball',
    allowedClasses: ["archer","magician"],
    damage: 60,
    manaCost: 22,
    damageRadius: 34,
    name: 'Flaming Tempest',
    category: 'elemental',
    key: '0',
    icon: '🌪️🔥',
    color: '#fb923c',
    description: 'Turbilhão de fogo e tempestade de partículas incandescentes',
    animType: 'sheet',
    cols: 8,
    rows: 7,
    totalFrames: 50,
    frameW: 256,
    frameH: 256,
    renderW: 96,
    renderH: 96,
    fps: 28,
    isDirectional: true,
    projectileSpeed: 150,
    spawnOrigin: 'ground',
    anchorX: () => 0.51,
    anchorY: () => 0.76,
    spawnOffsetDist: 12,
    getImageKey: () => 'sparkling_fireball_wind',
  },

  // ─── Magias Exclusivas do Necromante ────────────────────────────────────────
  {
    id: 'necro_orb',
    allowedClasses: ["necromancer"],
    name: 'Miasma Sombrio',
    category: 'arcane',
    classRestriction: 'necromancer',
    damage: 105,
    manaCost: 35,
    damageRadius: 44,
    isHoming: true,
    projectileSpeed: 215,
    icon: '🔮',
    color: '#c026d3',
    description: 'Disparo de energia necromântica que persegue o alvo e explode em um denso miasma cadavérico',
    animType: 'sheet',
    imageKey: 'attack_necro',
    cols: 11,
    rows: 1,
    totalFrames: 11,
    frameW: 64,
    frameH: 64,
    renderW: 76,
    renderH: 76,
    fps: 15,
    spawnOrigin: 'torso',
    anchorX: () => 0.5,
    anchorY: () => 0.5,
    spawnOffsetDist: 18,
    getImageKey: () => 'attack_necro',
  },
  {
    id: 'necro_reaper',
    allowedClasses: ["necromancer"],
    name: 'Ceifador Espectral',
    category: 'arcane',
    classRestriction: 'necromancer',
    damage: 145,
    manaCost: 55,
    damageRadius: 56,
    icon: '💀',
    color: '#ef4444',
    description: 'Invoca a aparição do Ceifador com foice e olhos escarlates que ceifa as almas dos inimigos em área',
    animType: 'sheet',
    imageKey: 'attack_summon',
    cols: 11,
    rows: 1,
    totalFrames: 11,
    frameW: 64,
    frameH: 64,
    renderW: 92,
    renderH: 92,
    fps: 14,
    spawnOrigin: 'ground',
    anchorX: () => 0.5,
    anchorY: () => 0.65,
    spawnOffsetDist: 26,
    getImageKey: () => 'attack_summon',
  },

  // ─── Arcane Magic ────────────────────────────────────────────────────────
  {
    id: 'arcane_nova',
    allowedClasses: ["magician","luxio"],
    damage: 85,
    manaCost: 38,
    damageRadius: 48,
    name: 'Arcane Nova',
    category: 'arcane',
    icon: '🔮',
    color: '#c084fc',
    description: 'Explosão de energia arcana estelar em volta do mago',
    animType: 'sequence',
    frameKeys: [
      'arcane_01_1', 'arcane_01_2', 'arcane_01_3',
      'arcane_01_4', 'arcane_01_5', 'arcane_01_6', 'arcane_01_7',
    ],
    renderW: 90,
    renderH: 80,
    fps: 14,
    spawnOrigin: 'torso',
    anchorX: () => 0.5,
    anchorY: () => 0.5,
    spawnOffsetDist: 0,
  },
  {
    id: 'arcane_astral',
    allowedClasses: ["magician","necromancer"],
    damage: 90,
    manaCost: 40,
    damageRadius: 46,
    name: 'Astral Shockwave',
    category: 'arcane',
    icon: '🌌',
    color: '#a855f7',
    description: 'Onda de choque astral de pura matéria cósmica',
    animType: 'sequence',
    frameKeys: [
      'arcane_02_1', 'arcane_02_2', 'arcane_02_3',
      'arcane_02_4', 'arcane_02_5', 'arcane_02_6', 'arcane_02_7',
    ],
    renderW: 94,
    renderH: 84,
    fps: 14,
    spawnOrigin: 'torso',
    anchorX: () => 0.5,
    anchorY: () => 0.5,
    spawnOffsetDist: 16,
  },
  {
    id: 'arcane_sanctuary',
    allowedClasses: ["paladin"],
    damage: 40,
    manaCost: 25,
    damageRadius: 40,
    name: 'Arcane Glyph Ring',
    category: 'arcane',
    icon: '🧿',
    color: '#818cf8',
    description: 'Círculo rúnico arcano de proteção mística',
    animType: 'sequence',
    frameKeys: [
      'arcane_03_1', 'arcane_03_2', 'arcane_03_3',
      'arcane_03_4', 'arcane_03_5', 'arcane_03_6', 'arcane_03_7',
    ],
    renderW: 96,
    renderH: 86,
    fps: 14,
    attachToCaster: true,
    spawnOrigin: 'ground',
    anchorX: () => 0.5,
    anchorY: () => 0.55,
    spawnOffsetDist: 0,
  },
  {
    id: 'arcane_vortex',
    allowedClasses: ["magician"],
    damage: 95,
    manaCost: 42,
    damageRadius: 50,
    name: 'Cosmic Vortex',
    category: 'arcane',
    icon: '✨',
    color: '#e879f9',
    description: 'Vórtice cósmico concentrado de fissura arcana',
    animType: 'sequence',
    frameKeys: [
      'arcane_05_1', 'arcane_05_2', 'arcane_05_3',
      'arcane_05_4', 'arcane_05_5', 'arcane_05_6', 'arcane_05_7',
    ],
    renderW: 92,
    renderH: 82,
    fps: 14,
    spawnOrigin: 'torso',
    anchorX: () => 0.5,
    anchorY: () => 0.5,
    spawnOffsetDist: 18,
  },

  // ─── Nature Magic ────────────────────────────────────────────────────────
  {
    id: 'nature_roots',
    allowedClasses: ["archer"],
    damage: 55,
    manaCost: 22,
    damageRadius: 38,
    name: 'Ancient Roots',
    category: 'nature',
    icon: '🌿',
    color: '#4ade80',
    description: 'Raízes ancestrais e espinhos da floresta brotam da terra',
    animType: 'sequence',
    frameKeys: [
      'nature_0_1', 'nature_0_2', 'nature_0_3', 'nature_0_4', 'nature_0_5',
    ],
    renderW: 100,
    renderH: 60,
    fps: 12,
    spawnOrigin: 'ground',
    anchorX: () => 0.5,
    anchorY: () => 0.75,
    spawnOffsetDist: 18,
  },
  {
    id: 'nature_vines',
    allowedClasses: ["archer"],
    damage: 65,
    manaCost: 26,
    damageRadius: 40,
    name: 'Floral Entangle',
    category: 'nature',
    icon: '🌱',
    color: '#22c55e',
    description: 'Cipós encantados que brotam prendendo os inimigos',
    animType: 'sequence',
    frameKeys: [
      'nature_1_1', 'nature_1_2', 'nature_1_3',
      'nature_1_4', 'nature_1_5', 'nature_1_6', 'nature_1_7',
    ],
    renderW: 80,
    renderH: 50,
    fps: 13,
    spawnOrigin: 'ground',
    anchorX: () => 0.5,
    anchorY: () => 0.75,
    spawnOffsetDist: 18,
  },
  {
    id: 'leaf_tempest',
    allowedClasses: ["archer"],
    damage: 70,
    manaCost: 28,
    damageRadius: 42,
    name: 'Emerald Gale',
    category: 'nature',
    icon: '🍃',
    color: '#10b981',
    description: 'Vendaval de folhas esmeralda e pétalas afiadas',
    animType: 'sequence',
    frameKeys: [
      'nature_2_1', 'nature_2_2', 'nature_2_3',
      'nature_2_4', 'nature_2_5', 'nature_2_6', 'nature_2_7',
    ],
    renderW: 86,
    renderH: 54,
    fps: 13,
    spawnOrigin: 'torso',
    anchorX: () => 0.5,
    anchorY: () => 0.5,
    spawnOffsetDist: 16,
  },
  {
    id: 'nature_spores',
    allowedClasses: ["necromancer","archer"],
    damage: 80,
    manaCost: 32,
    damageRadius: 45,
    name: 'Spore Eruption',
    category: 'nature',
    icon: '🍄',
    color: '#bef264',
    description: 'Erupção de esporos venenosos da mata densa',
    animType: 'sequence',
    frameKeys: [
      'nature_3_1', 'nature_3_2', 'nature_3_3', 'nature_3_4', 'nature_3_5',
    ],
    renderW: 60,
    renderH: 90,
    fps: 12,
    spawnOrigin: 'ground',
    anchorX: () => 0.5,
    anchorY: () => 0.8,
    spawnOffsetDist: 16,
  },
];

export const ALL_MAGIC_IMAGE_PATHS: Record<string, string> = {
  // Mage Fireball & Paladin/Warrior Slice
  fireball: '/assets/magic-effects/fireball.png',
  slice: '/assets/magic-effects/slice.png',
  // Necromancer Exclusive Spells
  attack_necro: '/assets/magic-effects/attack_necro.png',
  attack_summon: '/assets/magic-effects/attack_summon.png',
  // Spritesheets
  firelion_up: '/assets/magic-effects/firelion_up.png',
  firelion_right: '/assets/magic-effects/firelion_right.png',
  firelion_down: '/assets/magic-effects/firelion_down.png',
  firelion_left: '/assets/magic-effects/firelion_left.png',
  iceshield: '/assets/magic-effects/iceshield.png',
  icetacle: '/assets/magic-effects/icetacle.png',
  lightningclaw: '/assets/magic-effects/lightningclaw.png',
  snakebite_up: '/assets/magic-effects/snakebite_up.png',
  snakebite_down: '/assets/magic-effects/snakebite_down.png',
  snakebite_side: '/assets/magic-effects/snakebite_side.png',
  spikes: '/assets/magic-effects/spikes.png',
  tornado: '/assets/magic-effects/tornado.png',
  torrentacle: '/assets/magic-effects/torrentacle.png',
  turtleshell_front: '/assets/magic-effects/turtleshell_front.png',
  turtleshell_side: '/assets/magic-effects/turtleshell_side.png',
  sparkling_fireball_small: '/assets/magic-effects/sparkling-fireball-small.png',
  sparkling_fireball_wind: '/assets/magic-effects/sparkling-fireball-wind.png',

  // Arcane Effect 01..06
  arcane_01_1: '/assets/magic-effects/Arcane_Effect/01/Arcane_Effect_1.png',
  arcane_01_2: '/assets/magic-effects/Arcane_Effect/01/Arcane_Effect_2.png',
  arcane_01_3: '/assets/magic-effects/Arcane_Effect/01/Arcane_Effect_3.png',
  arcane_01_4: '/assets/magic-effects/Arcane_Effect/01/Arcane_Effect_4.png',
  arcane_01_5: '/assets/magic-effects/Arcane_Effect/01/Arcane_Effect_5.png',
  arcane_01_6: '/assets/magic-effects/Arcane_Effect/01/Arcane_Effect_6.png',
  arcane_01_7: '/assets/magic-effects/Arcane_Effect/01/Arcane_Effect_7.png',

  arcane_02_1: '/assets/magic-effects/Arcane_Effect/02/Arcane_Effect_1.png',
  arcane_02_2: '/assets/magic-effects/Arcane_Effect/02/Arcane_Effect_2.png',
  arcane_02_3: '/assets/magic-effects/Arcane_Effect/02/Arcane_Effect_3.png',
  arcane_02_4: '/assets/magic-effects/Arcane_Effect/02/Arcane_Effect_4.png',
  arcane_02_5: '/assets/magic-effects/Arcane_Effect/02/Arcane_Effect_5.png',
  arcane_02_6: '/assets/magic-effects/Arcane_Effect/02/Arcane_Effect_6.png',
  arcane_02_7: '/assets/magic-effects/Arcane_Effect/02/Arcane_Effect_7.png',

  arcane_03_1: '/assets/magic-effects/Arcane_Effect/03/Arcane_Effect_1.png',
  arcane_03_2: '/assets/magic-effects/Arcane_Effect/03/Arcane_Effect_2.png',
  arcane_03_3: '/assets/magic-effects/Arcane_Effect/03/Arcane_Effect_3.png',
  arcane_03_4: '/assets/magic-effects/Arcane_Effect/03/Arcane_Effect_4.png',
  arcane_03_5: '/assets/magic-effects/Arcane_Effect/03/Arcane_Effect_5.png',
  arcane_03_6: '/assets/magic-effects/Arcane_Effect/03/Arcane_Effect_6.png',
  arcane_03_7: '/assets/magic-effects/Arcane_Effect/03/Arcane_Effect_7.png',

  arcane_05_1: '/assets/magic-effects/Arcane_Effect/05/Arcane_Effect_1.png',
  arcane_05_2: '/assets/magic-effects/Arcane_Effect/05/Arcane_Effect_2.png',
  arcane_05_3: '/assets/magic-effects/Arcane_Effect/05/Arcane_Effect_3.png',
  arcane_05_4: '/assets/magic-effects/Arcane_Effect/05/Arcane_Effect_4.png',
  arcane_05_5: '/assets/magic-effects/Arcane_Effect/05/Arcane_Effect_5.png',
  arcane_05_6: '/assets/magic-effects/Arcane_Effect/05/Arcane_Effect_6.png',
  arcane_05_7: '/assets/magic-effects/Arcane_Effect/05/Arcane_Effect_7.png',

  // Nature Magic Effect 0..3
  nature_0_1: '/assets/magic-effects/Nature Magic Effect/0-1.png',
  nature_0_2: '/assets/magic-effects/Nature Magic Effect/0-2.png',
  nature_0_3: '/assets/magic-effects/Nature Magic Effect/0-3.png',
  nature_0_4: '/assets/magic-effects/Nature Magic Effect/0-4.png',
  nature_0_5: '/assets/magic-effects/Nature Magic Effect/0-5.png',

  nature_1_1: '/assets/magic-effects/Nature Magic Effect/1-1.png',
  nature_1_2: '/assets/magic-effects/Nature Magic Effect/1-2.png',
  nature_1_3: '/assets/magic-effects/Nature Magic Effect/1-3.png',
  nature_1_4: '/assets/magic-effects/Nature Magic Effect/1-4.png',
  nature_1_5: '/assets/magic-effects/Nature Magic Effect/1-5.png',
  nature_1_6: '/assets/magic-effects/Nature Magic Effect/1-6.png',
  nature_1_7: '/assets/magic-effects/Nature Magic Effect/1-7.png',

  nature_2_1: '/assets/magic-effects/Nature Magic Effect/2-1.png',
  nature_2_2: '/assets/magic-effects/Nature Magic Effect/2-2.png',
  nature_2_3: '/assets/magic-effects/Nature Magic Effect/2-3.png',
  nature_2_4: '/assets/magic-effects/Nature Magic Effect/2-4.png',
  nature_2_5: '/assets/magic-effects/Nature Magic Effect/2-5.png',
  nature_2_6: '/assets/magic-effects/Nature Magic Effect/2-6.png',
  nature_2_7: '/assets/magic-effects/Nature Magic Effect/2-7.png',

  nature_3_1: '/assets/magic-effects/Nature Magic Effect/3-1.png',
  nature_3_2: '/assets/magic-effects/Nature Magic Effect/3-2.png',
  nature_3_3: '/assets/magic-effects/Nature Magic Effect/3-3.png',
  nature_3_4: '/assets/magic-effects/Nature Magic Effect/3-4.png',
  nature_3_5: '/assets/magic-effects/Nature Magic Effect/3-5.png',
};

export class ActiveSpell {
  public id: string;
  public def: SpellDef;
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public dir: Direction;
  public frame = 0;
  public isFinished = false;
  public imageKey?: string;
  public attachToCaster = false;
  public targetMonsterId?: string;
  public hitMonsterIds: Set<string> = new Set();

  private timer = 0;

  constructor(
    id: string,
    def: SpellDef,
    x: number,
    y: number,
    dir: Direction,
    vx = 0,
    vy = 0,
    targetMonsterId?: string
  ) {
    this.id = id;
    this.def = def;
    this.x = x;
    this.y = y;
    this.dir = dir;
    this.vx = vx;
    this.vy = vy;
    this.targetMonsterId = targetMonsterId;
    this.attachToCaster = Boolean(def.attachToCaster);
    if (def.getImageKey) {
      this.imageKey = def.getImageKey(dir);
    } else if (def.imageKey) {
      this.imageKey = def.imageKey;
    }
  }

  update(
    dt: number,
    casterX?: number,
    casterY?: number,
    targetPos?: { x: number; y: number }
  ): void {
    if (this.isFinished) return;

    if (this.attachToCaster && casterX !== undefined && casterY !== undefined) {
      this.x = casterX;
      this.y = casterY;
    } else if (this.def.isHoming && targetPos) {
      const dx = targetPos.x - this.x;
      const dy = targetPos.y - this.y;
      const dist = Math.hypot(dx, dy);
      const speed = this.def.projectileSpeed || 190;
      if (dist > 6) {
        this.vx = (dx / dist) * speed;
        this.vy = (dy / dist) * speed;
      }
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    } else {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
    }

    if (this.def.animType === 'directional_projectile') {
      this.timer += dt;
      if (this.timer >= 1.8) {
        this.isFinished = true;
      }
      this.frame = getFireballDirectionFrame(this.vx, this.vy, this.dir);
      return;
    }

    this.timer += dt;
    const frameDuration = 1 / this.def.fps;
    const totalFrames =
      this.def.animType === 'custom_frames'
        ? this.def.customFrames?.length || 1
        : this.def.animType === 'sequence'
        ? this.def.frameKeys?.length || 1
        : this.def.totalFrames || 1;

    while (this.timer >= frameDuration) {
      this.timer -= frameDuration;
      this.frame++;
      if (this.frame >= totalFrames) {
        this.isFinished = true;
        break;
      }
    }
  }

  getFrameCoords(): { col: number; row: number } {
    if (this.def.animType === 'directional_projectile') {
      const col = getFireballDirectionFrame(this.vx, this.vy, this.dir);
      return { col, row: 0 };
    }
    const cols = this.def.cols || 1;
    const col = this.frame % cols;
    const row = Math.floor(this.frame / cols);
    return { col, row };
  }

  getCurrentImageKey(): string {
    if (this.def.animType === 'custom_frames') {
      return this.def.imageKey || '';
    }
    if (this.def.animType === 'sequence') {
      const keys = this.def.frameKeys || [];
      return keys[Math.min(this.frame, keys.length - 1)] || '';
    }
    return this.imageKey || '';
  }

  getAnchor(): { ax: number; ay: number } {
    const ax = this.def.anchorX ? this.def.anchorX(this.dir) : 0.5;
    const ay = this.def.anchorY ? this.def.anchorY(this.dir) : 0.5;
    return { ax, ay };
  }
}

