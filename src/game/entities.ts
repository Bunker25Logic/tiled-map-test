import type { Rect, TiledMap } from './types';
import { loadChromaKeyImage } from './imageLoader';
import { moveAndSlide } from './mapUtils';
import { type CoinType, getCoinFrameIndex } from './currency';
import rawConfigs from './entitiesConfig.json';

export interface MonsterConfig {
  name: string;
  width: number;
  height: number;
  visW: number;
  visH: number;
  visCenterX: number;
  feetY: number;
  shadowRadiusX: number;
  shadowRadiusY: number;
  hitboxW: number;
  hitboxH: number;
  speed: number;
  walkFps: number;
  frameCount?: number;
}

export const MONSTER_CONFIGS: Record<string, MonsterConfig> = rawConfigs;

export type MonsterImages = Record<string, HTMLImageElement>;

export async function loadMonsterSprites(types: string[]): Promise<MonsterImages> {
  const images: MonsterImages = {};
  const promises: Promise<void>[] = [];

  for (const type of types) {
    const config = MONSTER_CONFIGS[type];
    const maxFrames = config?.frameCount || 3;

    for (let frame = 1; frame <= maxFrames; frame++) {
      for (let dirNum = 1; dirNum <= 4; dirNum++) {
        const key = `${type}_${frame}_${dirNum}`;
        const filePath = `/assets/entities/${type}/${frame}_1_1_${dirNum}.png`;

        promises.push(
          loadChromaKeyImage(filePath)
            .then((img) => {
              images[key] = img;
            })
            .catch((err) => {
              console.warn(`Failed to load monster sprite: ${filePath}`, err);
            })
        );
      }
    }
  }

  await Promise.all(promises);
  return images;
}

export interface IslandBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export const SURFACE_ISLAND_BOUNDS: Record<string, IslandBounds> = {
  ilha1: { minX: -550, maxX: 350, minY: -500, maxY: 350 },     // Floresta & Ruínas
  ilha2: { minX: 850, maxX: 1550, minY: -500, maxY: 400 },     // Deserto
  ilha3: { minX: -850, maxX: 50, minY: -2050, maxY: -1450 },   // Montanhas Rochosas
  ilha4: { minX: 350, maxX: 1450, minY: -2150, maxY: -1450 },  // Santuário Místico
  ilha5: { minX: 1650, maxX: 2500, minY: -2200, maxY: -1450 }, // Terras Dracônicas
};

// ─── Combat Behavior Types ────────────────────────────────────────────────────

/** How a monster reacts to the player */
export type MonsterBehavior =
  | 'aggressive'  // Advances when player is within aggroRadius; always hostile
  | 'neutral'     // Only attacks if the player attacks first
  | 'animal';     // Passive; retaliates if attacked

interface MonsterCombatDef {
  behavior: MonsterBehavior;
  maxHp: number;
  attack: number;
  attackRange: number;
  attackCooldown: number;
  aggroRadius: number;
  xpReward: number;
  chaseSpeed: number;
}

const MONSTER_COMBAT: Record<string, Partial<MonsterCombatDef>> = {
  orc:          { behavior: 'aggressive', maxHp: 185, attack: 30, aggroRadius: 160, xpReward: 115, chaseSpeed: 1.2 },
  elf:          { behavior: 'aggressive', maxHp: 90,  attack: 18, aggroRadius: 180, xpReward: 55,  chaseSpeed: 1.4 },
  duende:       { behavior: 'aggressive', maxHp: 60,  attack: 12, aggroRadius: 140, xpReward: 30,  chaseSpeed: 1.3 },
  goblin:       { behavior: 'aggressive', maxHp: 65,  attack: 14, aggroRadius: 130, xpReward: 35,  chaseSpeed: 1.2 },
  anao:         { behavior: 'aggressive', maxHp: 120, attack: 22, aggroRadius: 150, xpReward: 80,  chaseSpeed: 1.1 },
  hiena:        { behavior: 'aggressive', maxHp: 75,  attack: 16, aggroRadius: 200, xpReward: 40,  chaseSpeed: 1.5 },
  skedesert:    { behavior: 'aggressive', maxHp: 100, attack: 20, aggroRadius: 170, xpReward: 65,  chaseSpeed: 1.2 },
  mumia:        { behavior: 'aggressive', maxHp: 145, attack: 25, aggroRadius: 130, xpReward: 90,  chaseSpeed: 1.0 },
  mummi:        { behavior: 'aggressive', maxHp: 130, attack: 22, aggroRadius: 130, xpReward: 75,  chaseSpeed: 1.0 },
  mummi2:       { behavior: 'aggressive', maxHp: 150, attack: 28, aggroRadius: 140, xpReward: 95,  chaseSpeed: 1.0 },
  trolol:       { behavior: 'aggressive', maxHp: 220, attack: 35, aggroRadius: 145, xpReward: 150, chaseSpeed: 1.0 },
  zombie:       { behavior: 'aggressive', maxHp: 100, attack: 18, aggroRadius: 120, xpReward: 55,  chaseSpeed: 0.9 },
  bat:          { behavior: 'aggressive', maxHp: 55,  attack: 10, aggroRadius: 190, xpReward: 25,  chaseSpeed: 1.6 },
  aparition:    { behavior: 'aggressive', maxHp: 90,  attack: 22, aggroRadius: 200, xpReward: 60,  chaseSpeed: 1.3 },
  soni:         { behavior: 'aggressive', maxHp: 80,  attack: 18, aggroRadius: 175, xpReward: 50,  chaseSpeed: 1.2 },
  thedeath:     { behavior: 'aggressive', maxHp: 300, attack: 55, aggroRadius: 230, xpReward: 400, chaseSpeed: 1.1 },
  magmal:       { behavior: 'aggressive', maxHp: 250, attack: 45, aggroRadius: 210, xpReward: 300, chaseSpeed: 1.0 },
  drago:        { behavior: 'aggressive', maxHp: 400, attack: 70, aggroRadius: 240, xpReward: 700, chaseSpeed: 1.2 },
  golen:        { behavior: 'aggressive', maxHp: 200, attack: 40, aggroRadius: 160, xpReward: 200, chaseSpeed: 0.9 },
  'golen-magma':{ behavior: 'aggressive', maxHp: 280, attack: 50, aggroRadius: 170, xpReward: 350, chaseSpeed: 0.9 },
  stonemonster: { behavior: 'aggressive', maxHp: 180, attack: 32, aggroRadius: 140, xpReward: 160, chaseSpeed: 0.8 },
  centostone:   { behavior: 'aggressive', maxHp: 170, attack: 30, aggroRadius: 160, xpReward: 140, chaseSpeed: 1.1 },
  genie:        { behavior: 'aggressive', maxHp: 160, attack: 35, aggroRadius: 220, xpReward: 175, chaseSpeed: 1.3 },
  pand:         { behavior: 'aggressive', maxHp: 110, attack: 20, aggroRadius: 150, xpReward: 70,  chaseSpeed: 1.1 },
  centon:       { behavior: 'neutral',   maxHp: 160, attack: 28, aggroRadius: 0,   xpReward: 120, chaseSpeed: 1.3 },
  whitewolf:    { behavior: 'neutral',   maxHp: 95,  attack: 22, aggroRadius: 0,   xpReward: 70,  chaseSpeed: 1.4 },
  serpent:      { behavior: 'neutral',   maxHp: 80,  attack: 20, aggroRadius: 0,   xpReward: 55,  chaseSpeed: 1.2 },
  tiguersabre:  { behavior: 'neutral',   maxHp: 140, attack: 30, aggroRadius: 0,   xpReward: 100, chaseSpeed: 1.4 },
  esquilo:      { behavior: 'animal',    maxHp: 30,  attack: 5,  aggroRadius: 0,   xpReward: 10,  chaseSpeed: 1.0 },
  dog:          { behavior: 'animal',    maxHp: 50,  attack: 10, aggroRadius: 0,   xpReward: 20,  chaseSpeed: 1.2 },
  dodo:         { behavior: 'animal',    maxHp: 40,  attack: 6,  aggroRadius: 0,   xpReward: 12,  chaseSpeed: 0.9 },
  alce:         { behavior: 'animal',    maxHp: 80,  attack: 12, aggroRadius: 0,   xpReward: 35,  chaseSpeed: 1.1 },
  vead:         { behavior: 'animal',    maxHp: 60,  attack: 8,  aggroRadius: 0,   xpReward: 20,  chaseSpeed: 1.2 },
  piggi:        { behavior: 'animal',    maxHp: 55,  attack: 8,  aggroRadius: 0,   xpReward: 18,  chaseSpeed: 1.0 },
  // New GitHub v1.0.2 monsters
  skeleton:     { behavior: 'aggressive', maxHp: 95,  attack: 20, aggroRadius: 160, xpReward: 60,  chaseSpeed: 1.1 },
  'bat rei':    { behavior: 'aggressive', maxHp: 120, attack: 20, aggroRadius: 200, xpReward: 80,  chaseSpeed: 1.5 },
  lobisonem:    { behavior: 'aggressive', maxHp: 190, attack: 35, aggroRadius: 175, xpReward: 180, chaseSpeed: 1.4 },
  bufao:        { behavior: 'aggressive', maxHp: 200, attack: 38, aggroRadius: 180, xpReward: 220, chaseSpeed: 1.0 },
  centgreen:    { behavior: 'aggressive', maxHp: 160, attack: 30, aggroRadius: 165, xpReward: 145, chaseSpeed: 1.2 },
  centongg:     { behavior: 'aggressive', maxHp: 175, attack: 33, aggroRadius: 170, xpReward: 160, chaseSpeed: 1.1 },
  scarnsabre:   { behavior: 'aggressive', maxHp: 155, attack: 28, aggroRadius: 165, xpReward: 130, chaseSpeed: 1.3 },
  lacost:       { behavior: 'aggressive', maxHp: 140, attack: 26, aggroRadius: 160, xpReward: 110, chaseSpeed: 1.2 },
  draertis:     { behavior: 'aggressive', maxHp: 320, attack: 58, aggroRadius: 220, xpReward: 500, chaseSpeed: 1.1 },
  dragis:       { behavior: 'aggressive', maxHp: 280, attack: 50, aggroRadius: 210, xpReward: 420, chaseSpeed: 1.0 },
  medusa:       { behavior: 'aggressive', maxHp: 260, attack: 48, aggroRadius: 200, xpReward: 380, chaseSpeed: 1.0 },
  fantasn:      { behavior: 'aggressive', maxHp: 70,  attack: 15, aggroRadius: 180, xpReward: 45,  chaseSpeed: 1.4 },
  fera:         { behavior: 'aggressive', maxHp: 200, attack: 38, aggroRadius: 180, xpReward: 250, chaseSpeed: 1.2 },
  triron:       { behavior: 'aggressive', maxHp: 350, attack: 65, aggroRadius: 230, xpReward: 600, chaseSpeed: 1.0 },
  glacis:       { behavior: 'aggressive', maxHp: 300, attack: 55, aggroRadius: 220, xpReward: 500, chaseSpeed: 0.9 },
  ins:          { behavior: 'aggressive', maxHp: 240, attack: 44, aggroRadius: 200, xpReward: 350, chaseSpeed: 1.1 },
  token:        { behavior: 'aggressive', maxHp: 220, attack: 40, aggroRadius: 195, xpReward: 310, chaseSpeed: 1.0 },
  'cavern creature': { behavior: 'aggressive', maxHp: 180, attack: 32, aggroRadius: 170, xpReward: 200, chaseSpeed: 1.1 },
  golen2:       { behavior: 'aggressive', maxHp: 230, attack: 42, aggroRadius: 165, xpReward: 250, chaseSpeed: 0.9 },
};

const DEFAULT_COMBAT: MonsterCombatDef = {
  behavior: 'neutral',
  maxHp: 80,
  attack: 15,
  attackRange: 28,
  attackCooldown: 2.0,
  aggroRadius: 140,
  xpReward: 40,
  chaseSpeed: 1.0,
};

function getCombat(type: string): MonsterCombatDef {
  const partial = MONSTER_COMBAT[type] ?? {};
  return {
    ...DEFAULT_COMBAT,
    ...partial,
    attackRange: partial.attackRange ?? DEFAULT_COMBAT.attackRange,
    attackCooldown: partial.attackCooldown ?? DEFAULT_COMBAT.attackCooldown,
  };
}

type MonsterAIState = 'wander' | 'idle' | 'chase' | 'attack' | 'dead';

/** Death animation state — Tibia corpse style */
export interface MonsterCorpse {
  x: number;
  y: number;
  type: string;
  config: MonsterConfig;
  dir: 1 | 2 | 3 | 4;
  alpha: number;
  timer: number;
  totalDuration?: number;
}

export class Monster {
  public id: string;
  public type: string;
  public config: MonsterConfig;
  public combat: MonsterCombatDef;
  public x: number;
  public y: number;
  public dir: 1 | 2 | 3 | 4 = 3;
  public frame = 1;
  public isMoving = false;
  public mapId = 'map1';
  public islandBounds?: IslandBounds;

  public hp: number;
  public maxHp: number;
  public aiState: MonsterAIState = 'idle';
  public isProvoked = false;
  public isDead = false;

  private stateTimer = 0;
  private stateDuration = 2;
  private animTimer = 0;
  private currentVx = 0;
  private currentVy = 0;
  private attackCooldownTimer = 0;

  /** Called when this monster is killed — awards XP */
  public onDeath?: (xpReward: number, x: number, y: number) => void;
  /** Called when this monster successfully hits the player */
  public onAttackPlayer?: (damage: number) => void;

  constructor(id: string, type: string, x: number, y: number, mapId = 'map1', islandBounds?: IslandBounds) {
    this.id = id;
    this.type = type;
    this.mapId = mapId;
    this.islandBounds = islandBounds;
    this.config = MONSTER_CONFIGS[type] || {
      name: type,
      width: 32, height: 32,
      visW: 28, visH: 28,
      visCenterX: 16, feetY: 30,
      shadowRadiusX: 10, shadowRadiusY: 4,
      hitboxW: 16, hitboxH: 12,
      speed: 38, walkFps: 5, frameCount: 3,
    };
    this.combat = getCombat(type);
    this.hp = this.combat.maxHp;
    this.maxHp = this.combat.maxHp;
    this.x = x;
    this.y = y;
    this.pickNextAction();
  }

  public takeDamage(amount: number): void {
    if (this.isDead) return;
    this.hp = Math.max(0, this.hp - amount);
    if (this.combat.behavior === 'neutral' || this.combat.behavior === 'animal') {
      this.isProvoked = true;
    }
    if (this.hp <= 0) this.die();
  }

  private die(): void {
    this.isDead = true;
    this.isMoving = false;
    this.currentVx = 0;
    this.currentVy = 0;
    this.aiState = 'dead';
    this.onDeath?.(this.combat.xpReward, this.x + this.config.hitboxW / 2, this.y + this.config.hitboxH / 2);
  }

  private pickNextAction() {
    this.stateTimer = 0;
    if (Math.random() < 0.4) {
      this.aiState = 'wander';
      this.isMoving = true;
      this.stateDuration = 1.2 + Math.random() * 2.0;
      const directions: (1 | 2 | 3 | 4)[] = [1, 2, 3, 4];
      this.dir = directions[Math.floor(Math.random() * directions.length)];
      this.currentVx = 0;
      this.currentVy = 0;
      const spd = this.config.speed;
      if (this.dir === 1) this.currentVy = -spd;
      else if (this.dir === 2) this.currentVx = spd;
      else if (this.dir === 3) this.currentVy = spd;
      else if (this.dir === 4) this.currentVx = -spd;
    } else {
      this.aiState = 'idle';
      this.isMoving = false;
      this.currentVx = 0;
      this.currentVy = 0;
      this.frame = 1;
      this.stateDuration = 2.0 + Math.random() * 4.0;
    }
  }

  private faceTowardsPlayer(px: number, py: number): void {
    const dx = px - (this.x + this.config.hitboxW / 2);
    const dy = py - (this.y + this.config.hitboxH / 2);
    if (Math.abs(dx) > Math.abs(dy)) {
      this.dir = dx > 0 ? 2 : 4;
    } else {
      this.dir = dy > 0 ? 3 : 1;
    }
  }

  public update(
    dt: number,
    colliders?: Rect[],
    playerHitbox?: Rect,
    allMonsters?: Monster[]
  ): void {
    if (this.isDead) return;

    const playerCenterX = playerHitbox ? playerHitbox.x + 8 : 0;
    const playerCenterY = playerHitbox ? playerHitbox.y + 6 : 0;
    const myCenterX = this.x + this.config.hitboxW / 2;
    const myCenterY = this.y + this.config.hitboxH / 2;
    const distToPlayer = playerHitbox
      ? Math.hypot(playerCenterX - myCenterX, playerCenterY - myCenterY)
      : Infinity;

    const shouldChase =
      playerHitbox &&
      (
        (this.combat.behavior === 'aggressive' && distToPlayer <= this.combat.aggroRadius) ||
        (this.isProvoked && distToPlayer <= this.combat.aggroRadius * 2)
      );

    const inAttackRange = distToPlayer <= this.combat.attackRange + 4;

    if (this.attackCooldownTimer > 0) {
      this.attackCooldownTimer = Math.max(0, this.attackCooldownTimer - dt);
    }

    if (shouldChase && inAttackRange) {
      this.aiState = 'attack';
      this.isMoving = false;
      this.currentVx = 0;
      this.currentVy = 0;
      if (playerHitbox) this.faceTowardsPlayer(playerCenterX, playerCenterY);
      if (this.attackCooldownTimer <= 0) {
        this.attackCooldownTimer = this.combat.attackCooldown;
        this.onAttackPlayer?.(this.combat.attack);
      }
    } else if (shouldChase) {
      this.aiState = 'chase';
      this.isMoving = true;
      if (playerHitbox) this.faceTowardsPlayer(playerCenterX, playerCenterY);
      const chaseSpd = this.config.speed * this.combat.chaseSpeed;
      const norm = distToPlayer > 0.1 ? distToPlayer : 1;
      this.currentVx = ((playerCenterX - myCenterX) / norm) * chaseSpd;
      this.currentVy = ((playerCenterY - myCenterY) / norm) * chaseSpd;
    } else {
      if (this.aiState === 'chase' || this.aiState === 'attack') {
        this.pickNextAction();
      } else {
        this.stateTimer += dt;
        if (this.stateTimer >= this.stateDuration) this.pickNextAction();
      }
    }

    if (this.isMoving) {
      this.animTimer += dt;
      const maxFrames = this.config.frameCount || 3;
      const frameDuration = 1 / Math.max(1, this.config.walkFps);
      if (this.animTimer >= frameDuration) {
        this.animTimer = 0;
        this.frame = (this.frame % maxFrames) + 1;
      }

      const dx = this.currentVx * dt;
      const dy = this.currentVy * dt;
      const prevX = this.x;
      const prevY = this.y;

      const nearbyObstacles: Rect[] = [];
      if (colliders) {
        for (const col of colliders) {
          if (
            col.x + col.width > this.x - 48 && col.x < this.x + this.config.hitboxW + 48 &&
            col.y + col.height > this.y - 48 && col.y < this.y + this.config.hitboxH + 48
          ) nearbyObstacles.push(col);
        }
      }

      if (playerHitbox) {
        if (Math.abs(playerHitbox.x - this.x) < 56 && Math.abs(playerHitbox.y - this.y) < 56) {
          nearbyObstacles.push(playerHitbox);
        }
      }

      if (allMonsters) {
        for (const other of allMonsters) {
          if (other === this || other.isDead) continue;
          if (Math.abs(other.x - this.x) < 48 && Math.abs(other.y - this.y) < 48) {
            nearbyObstacles.push({ x: other.x, y: other.y, width: other.config.hitboxW, height: other.config.hitboxH });
          }
        }
      }

      const res = moveAndSlide(
        this.x, this.y, dx, dy,
        this.config.hitboxW, this.config.hitboxH,
        nearbyObstacles
      );

      if (this.islandBounds) {
        if (
          res.x < this.islandBounds.minX || res.x > this.islandBounds.maxX ||
          res.y < this.islandBounds.minY || res.y > this.islandBounds.maxY
        ) { this.pickNextAction(); return; }
      }

      if (this.mapId === 'map1' && activeWalkableLandSet && activeWalkableLandSet.size > 0) {
        const centerTileX = Math.floor((res.x + this.config.hitboxW / 2) / 32);
        const centerTileY = Math.floor((res.y + this.config.hitboxH / 2) / 32);
        if (activeWalkableLandSet.has(`${centerTileX},${centerTileY}`)) {
          this.x = res.x; this.y = res.y;
        } else { this.pickNextAction(); }
      } else {
        this.x = res.x; this.y = res.y;
      }

      if (this.mapId === 'caverna-zona-1') {
        const minX = 64, maxX = 1200, minY = 70, maxY = 210;
        if (this.x < minX || this.x > maxX || this.y < minY || this.y > maxY) {
          this.x = Math.max(minX, Math.min(maxX, this.x));
          this.y = Math.max(minY, Math.min(maxY, this.y));
          this.pickNextAction();
        }
      }

      if (this.mapId === 'caverna2') {
        const minX = 45, maxX = 435, minY = 45, maxY = 205;
        if (this.x < minX || this.x > maxX || this.y < minY || this.y > maxY) {
          this.x = Math.max(minX, Math.min(maxX, this.x));
          this.y = Math.max(minY, Math.min(maxY, this.y));
          this.pickNextAction();
        }
      }

      if (
        this.aiState === 'wander' &&
        (Math.abs(this.x - (prevX + dx)) > 0.1 || Math.abs(this.y - (prevY + dy)) > 0.1)
      ) { this.pickNextAction(); }
    }

    if (allMonsters) {
      for (const other of allMonsters) {
        if (other === this || other.isDead) continue;
        const dx = (this.x + this.config.hitboxW / 2) - (other.x + other.config.hitboxW / 2);
        const dy = (this.y + this.config.hitboxH / 2) - (other.y + other.config.hitboxH / 2);
        const minDistanceX = (this.config.hitboxW + other.config.hitboxW) / 2;
        const minDistanceY = (this.config.hitboxH + other.config.hitboxH) / 2;
        if (Math.abs(dx) < minDistanceX && Math.abs(dy) < minDistanceY) {
          const overlapX = minDistanceX - Math.abs(dx);
          const overlapY = minDistanceY - Math.abs(dy);
          if (overlapX < overlapY) this.x += (dx > 0 ? overlapX : -overlapX) * 0.3;
          else this.y += (dy > 0 ? overlapY : -overlapY) * 0.3;
        }
      }
    }
  }
}

// ─── Corpse (Tibia-style death animation) ─────────────────────────────────────

/**
 * Updates a corpse fade-out. Returns true when it should be removed.
 * Tibia-style: solid for ~3s, then fade over ~2s
 */
export function updateCorpse(corpse: MonsterCorpse, dt: number): boolean {
  corpse.timer += dt;
  const solidDuration = 3.0;
  const fadeDuration = 2.0;
  if (corpse.timer <= solidDuration) {
    corpse.alpha = 1.0;
  } else {
    corpse.alpha = Math.max(0, 1.0 - (corpse.timer - solidDuration) / fadeDuration);
  }
  return corpse.timer >= solidDuration + fadeDuration;
}

// ─── Loot Box System ──────────────────────────────────────────────────────────

export type LootRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface LootBox {
  id: string;
  x: number;
  y: number;
  rarity: LootRarity;
  /** Gold amount inside */
  gold: number;
  /** Optional item ID from the items table */
  itemId?: string;
  /** Floating animation timer */
  animTimer: number;
  /** Whether this loot box has been collected */
  collected: boolean;
  /** Collection animation progress (0 to 1) */
  collectAnim: number;
}

/** Loot table entries per rarity */
const LOOT_TABLE: { rarity: LootRarity; weight: number; goldRange: [number, number]; itemPool: string[] }[] = [
  {
    rarity: 'common',
    weight: 55,
    goldRange: [5, 25],
    itemPool: [],
  },
  {
    rarity: 'rare',
    weight: 30,
    goldRange: [20, 60],
    itemPool: ['potion_hp_large', 'potion_mp_large'],
  },
  {
    rarity: 'epic',
    weight: 12,
    goldRange: [50, 120],
    itemPool: ['elixir_fury', 'sword_light', 'bow_elven'],
  },
  {
    rarity: 'legendary',
    weight: 3,
    goldRange: [100, 300],
    itemPool: ['staff_shadow', 'armor_paladin', 'ring_storm'],
  },
];

const RARITY_COLORS: Record<LootRarity, { main: string; glow: string; accent: string }> = {
  common:    { main: '#94a3b8', glow: 'rgba(148, 163, 184, 0.4)', accent: '#cbd5e1' },
  rare:      { main: '#38bdf8', glow: 'rgba(56, 189, 248, 0.5)',  accent: '#7dd3fc' },
  epic:      { main: '#c084fc', glow: 'rgba(192, 132, 252, 0.5)', accent: '#e9d5ff' },
  legendary: { main: '#f59e0b', glow: 'rgba(245, 158, 11, 0.6)',  accent: '#fde68a' },
};

/** Generate a loot box drop from a killed monster */
export function generateLootBox(monsterId: string, x: number, y: number, xpReward: number): LootBox {
  // XP bonus shifts rarity weights towards better loot
  const xpBonus = Math.min(45, xpReward / 10);

  // Roll rarity
  const adjustedWeights = LOOT_TABLE.map((entry) => {
    let w = entry.weight;
    if (entry.rarity === 'common') w = Math.max(8, w - xpBonus * 1.2);
    else if (entry.rarity === 'rare') w += xpBonus * 0.45;
    else if (entry.rarity === 'epic') w += xpBonus * 0.45;
    else if (entry.rarity === 'legendary') w += xpBonus * 0.30;
    return w;
  });
  const totalWeight = adjustedWeights.reduce((a, b) => a + b, 0);
  let roll = Math.random() * totalWeight;
  let selectedEntry = LOOT_TABLE[0];
  for (let i = 0; i < LOOT_TABLE.length; i++) {
    roll -= adjustedWeights[i];
    if (roll <= 0) {
      selectedEntry = LOOT_TABLE[i];
      break;
    }
  }

  const minGold = selectedEntry.goldRange[0];
  const maxGold = selectedEntry.goldRange[1];
  const gold = minGold + Math.floor(Math.random() * (maxGold - minGold + 1));
  const hasItem = selectedEntry.itemPool.length > 0 && (selectedEntry.rarity !== 'common' ? Math.random() < 0.75 : Math.random() < 0.25);
  const itemId = hasItem && selectedEntry.itemPool.length > 0
    ? selectedEntry.itemPool[Math.floor(Math.random() * selectedEntry.itemPool.length)]
    : undefined;

  return {
    id: `loot_${monsterId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    x,
    y,
    rarity: selectedEntry.rarity,
    gold,
    itemId,
    animTimer: Math.random() * Math.PI * 2,
    collected: false,
    collectAnim: 0,
  };
}

/** Check if player is close enough to collect a loot box */
export function canCollectLootBox(loot: LootBox, playerX: number, playerY: number, hitboxW: number, hitboxH: number): boolean {
  if (loot.collected) return false;
  const lootCenterX = loot.x;
  const lootCenterY = loot.y;
  const playerCenterX = playerX + hitboxW / 2;
  const playerCenterY = playerY + hitboxH / 2;
  return Math.hypot(lootCenterX - playerCenterX, lootCenterY - playerCenterY) < 28;
}

/**
 * Draw a loot box on the canvas using SVG-style path drawing.
 * Renders a stylized treasure chest with rarity-based colors, metallic trims and glow.
 */
export function drawLootBox(
  ctx: CanvasRenderingContext2D,
  loot: LootBox,
  camX: number,
  camY: number,
): void {
  const screenX = loot.x - camX;
  const screenY = loot.y - camY;
  const colors = RARITY_COLORS[loot.rarity];

  // Floating bob animation
  const bob = Math.sin(loot.animTimer) * 2.5;
  // Pulsing glow
  const glowPulse = 0.65 + Math.sin(loot.animTimer * 1.8) * 0.35;

  // Collection shrink animation
  let scale = 1.0;
  let alpha = 1.0;
  if (loot.collected) {
    scale = Math.max(0, 1.0 - loot.collectAnim * 0.7);
    alpha = Math.max(0, 1.0 - loot.collectAnim);
    if (alpha <= 0) return;
  }

  ctx.save();
  ctx.translate(screenX, screenY + bob);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;

  const boxW = 20;
  const boxH = 15;
  const halfW = boxW / 2;
  const halfH = boxH / 2;

  // ── Vertical Light Beam (Epic / Legendary) ──
  if (loot.rarity === 'legendary' || loot.rarity === 'epic') {
    ctx.save();
    const beamH = loot.rarity === 'legendary' ? 48 : 32;
    const beamW = loot.rarity === 'legendary' ? 14 : 10;
    const beamGrad = ctx.createLinearGradient(0, halfH, 0, -beamH);
    beamGrad.addColorStop(0, colors.glow);
    beamGrad.addColorStop(0.7, colors.glow.replace(/[\d.]+\)$/, '0.15)'));
    beamGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = beamGrad;
    ctx.fillRect(-beamW / 2, -beamH, beamW, beamH + halfH);
    ctx.restore();
  }

  // ── Ground Shadow ──
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(0, halfH + 3 - bob, 11, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Outer glow aura
  ctx.shadowColor = colors.glow;
  ctx.shadowBlur = (loot.rarity === 'legendary' ? 12 : 8) * glowPulse;

  // ── Chest Body (bottom base) ──
  ctx.fillStyle = '#27170a'; // Dark sturdy mahogany wood
  ctx.strokeStyle = colors.main;
  ctx.lineWidth = 1;

  const bodyTop = -1;
  const bodyBottom = halfH;
  const radius = 2;
  ctx.beginPath();
  ctx.moveTo(-halfW + radius, bodyTop);
  ctx.lineTo(halfW - radius, bodyTop);
  ctx.quadraticCurveTo(halfW, bodyTop, halfW, bodyTop + radius);
  ctx.lineTo(halfW, bodyBottom);
  ctx.lineTo(-halfW, bodyBottom);
  ctx.lineTo(-halfW, bodyTop + radius);
  ctx.quadraticCurveTo(-halfW, bodyTop, -halfW + radius, bodyTop);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Wood planks highlight on body
  ctx.fillStyle = '#3d2412';
  ctx.fillRect(-halfW + 3, bodyTop + 2, boxW - 6, boxH - 5);

  // ── Chest Lid (curved dome) ──
  const lidTop = -halfH - 3;
  const lidBottom = bodyTop;
  ctx.fillStyle = '#341d0e';
  ctx.beginPath();
  ctx.moveTo(-halfW - 1, lidBottom);
  ctx.lineTo(-halfW - 1, lidTop + 3);
  ctx.quadraticCurveTo(-halfW - 1, lidTop, -halfW + 3, lidTop);
  ctx.lineTo(halfW - 3, lidTop);
  ctx.quadraticCurveTo(halfW + 1, lidTop, halfW + 1, lidTop + 3);
  ctx.lineTo(halfW + 1, lidBottom);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = colors.main;
  ctx.stroke();

  // Lid top highlight
  ctx.fillStyle = colors.accent;
  ctx.fillRect(-halfW + 4, lidTop + 1, boxW - 8, 1.5);

  // ── Metal Straps & Rims (Rarity Colored) ──
  ctx.fillStyle = colors.main;
  // Left vertical strap
  ctx.fillRect(-halfW + 3, lidTop, 2.5, boxH + 3);
  // Right vertical strap
  ctx.fillRect(halfW - 5.5, lidTop, 2.5, boxH + 3);
  // Horizontal middle rim
  ctx.fillRect(-halfW - 1, bodyTop - 1, boxW + 2, 2.5);

  // ── Central Lock Gem / Clasp ──
  ctx.shadowBlur = 6 * glowPulse;
  ctx.shadowColor = colors.glow;
  ctx.fillStyle = colors.accent;
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(0, bodyTop + 0.5, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Center crystal core
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-0.6, bodyTop - 0.2, 1.2, 0, Math.PI * 2);
  ctx.fill();

  // ── Sparkle particles around rare+ loot ──
  if (loot.rarity !== 'common') {
    const sparkleCount = loot.rarity === 'legendary' ? 6 : loot.rarity === 'epic' ? 4 : 2;
    for (let i = 0; i < sparkleCount; i++) {
      const angle = (loot.animTimer * 1.5 + (i * Math.PI * 2) / sparkleCount);
      const sparkleR = 13 + Math.sin(loot.animTimer * 2 + i) * 4;
      const sx = Math.cos(angle) * sparkleR;
      const sy = Math.sin(angle) * sparkleR * 0.55 - 2;
      const sparkleAlpha = 0.45 + Math.sin(loot.animTimer * 3 + i * 1.5) * 0.35;

      ctx.fillStyle = colors.accent;
      ctx.globalAlpha = alpha * sparkleAlpha;
      ctx.beginPath();
      ctx.arc(sx, sy, loot.rarity === 'legendary' ? 1.6 : 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ── Small Floating Rarity Badge ──
  ctx.globalAlpha = alpha * 0.9;
  ctx.shadowBlur = 0;
  ctx.font = 'bold 8px Tahoma, Verdana, sans-serif';
  ctx.textAlign = 'center';
  const tagY = lidTop - 5;
  const tagText = loot.rarity === 'legendary' ? '★ LENDÁRIO' : loot.rarity === 'epic' ? '◆ ÉPICO' : loot.rarity === 'rare' ? '● RARO' : 'BAÚ';
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillText(tagText, 1, tagY + 1);
  ctx.fillStyle = colors.accent;
  ctx.fillText(tagText, 0, tagY);

  ctx.restore();
}

// ─── Tibia Stackable Coin Drops System ────────────────────────────────────────

export interface CoinDrop {
  id: string;
  x: number;
  y: number;
  coinType: CoinType;
  amount: number;
  frameIndex: number;
  animTimer: number;
  collected: boolean;
  collectAnim: number;
}

/** Check if player is close enough to collect a coin drop */
export function canCollectCoinDrop(
  coin: CoinDrop,
  playerX: number,
  playerY: number,
  hitboxW: number,
  hitboxH: number
): boolean {
  if (coin.collected) return false;
  const playerCenterX = playerX + hitboxW / 2;
  const playerCenterY = playerY + hitboxH / 2;
  return Math.hypot(coin.x - playerCenterX, coin.y - playerCenterY) < 28;
}

/**
 * Generate Tibia-style coin drops for a defeated monster.
 * Drops authentic Gold, Silver (Platinum), and Basalt (Crystal) coin stacks.
 */
export function generateMonsterCoinDrops(
  monsterId: string,
  x: number,
  y: number,
  xpReward: number
): CoinDrop[] {
  const drops: CoinDrop[] = [];

  // 1. Gold coins: Almost all monsters drop gold
  const minGold = Math.max(1, Math.floor(xpReward * 0.35));
  const maxGold = Math.max(4, Math.floor(xpReward * 1.3));
  const goldAmount = Math.min(100, minGold + Math.floor(Math.random() * (maxGold - minGold + 1)));

  drops.push({
    id: `coin_gold_${monsterId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    x: x + (Math.random() - 0.5) * 6,
    y: y + (Math.random() - 0.5) * 6,
    coinType: 'gold',
    amount: goldAmount,
    frameIndex: getCoinFrameIndex(goldAmount),
    animTimer: Math.random() * Math.PI * 2,
    collected: false,
    collectAnim: 0,
  });

  // 2. Silver coins (Tier 2 / stronger mobs, xp >= 55)
  if (xpReward >= 55) {
    const silverChance = Math.min(0.85, (xpReward - 35) / 200);
    if (Math.random() < silverChance) {
      const maxSilver = Math.min(30, Math.max(1, Math.floor(xpReward / 40)));
      const silverAmount = 1 + Math.floor(Math.random() * maxSilver);
      drops.push({
        id: `coin_silver_${monsterId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        x: x + 12 + (Math.random() - 0.5) * 4,
        y: y + (Math.random() - 0.5) * 6,
        coinType: 'silver',
        amount: silverAmount,
        frameIndex: getCoinFrameIndex(silverAmount),
        animTimer: Math.random() * Math.PI * 2,
        collected: false,
        collectAnim: 0,
      });
    }
  }

  // 3. Basalt / Crystal coins (Tier 3 / bosses, dragons, xp >= 220)
  if (xpReward >= 220) {
    const basaltChance = Math.min(0.75, (xpReward - 180) / 350);
    if (Math.random() < basaltChance) {
      const maxBasalt = Math.min(8, Math.max(1, Math.floor(xpReward / 180)));
      const basaltAmount = 1 + Math.floor(Math.random() * maxBasalt);
      drops.push({
        id: `coin_basalt_${monsterId}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        x: x - 12 + (Math.random() - 0.5) * 4,
        y: y + (Math.random() - 0.5) * 6,
        coinType: 'basalt',
        amount: basaltAmount,
        frameIndex: getCoinFrameIndex(basaltAmount),
        animTimer: Math.random() * Math.PI * 2,
        collected: false,
        collectAnim: 0,
      });
    }
  }

  return drops;
}

/**
 * Draw a Tibia coin stack on the canvas with exact sprite frame from spritesheet.
 */
export function drawCoinDrop(
  ctx: CanvasRenderingContext2D,
  coin: CoinDrop,
  coinImg: HTMLImageElement | undefined,
  camX: number,
  camY: number,
): void {
  const screenX = coin.x - camX;
  const screenY = coin.y - camY;

  // Subtle floating bob
  const bob = Math.sin(coin.animTimer * 2.5) * 1.5;
  const glowPulse = 0.5 + Math.sin(coin.animTimer * 3.0) * 0.5;

  let scale = 1.0;
  let alpha = 1.0;
  if (coin.collected) {
    scale = Math.max(0, 1.0 - coin.collectAnim * 0.85);
    alpha = Math.max(0, 1.0 - coin.collectAnim);
    if (alpha <= 0) return;
  }

  ctx.save();
  ctx.translate(screenX, screenY + bob);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;

  // Ground drop shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 8 - bob, 9, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Draw 32x32 sprite frame from coin spritesheet
  if (coinImg) {
    const frameW = 32;
    const frameH = 32;
    const sx = coin.frameIndex * frameW;
    ctx.drawImage(coinImg, sx, 0, frameW, frameH, -16, -16, 32, 32);
  }

  // Sparkles for silver / basalt or high piles
  if (coin.coinType !== 'gold' || coin.amount >= 25) {
    const sparkleColor =
      coin.coinType === 'basalt' ? '#38bdf8' : coin.coinType === 'silver' ? '#e2e8f0' : '#facc15';
    ctx.fillStyle = sparkleColor;
    ctx.globalAlpha = alpha * glowPulse * 0.8;
    const sparkX = Math.cos(coin.animTimer * 2.0) * 10;
    const sparkY = Math.sin(coin.animTimer * 2.0) * 7 - 3;
    ctx.beginPath();
    ctx.arc(sparkX, sparkY, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Floating amount badge above coin stack
  ctx.globalAlpha = alpha * 0.9;
  ctx.font = 'bold 8px Tahoma, Verdana, sans-serif';
  ctx.textAlign = 'center';
  const tagColor =
    coin.coinType === 'basalt' ? '#38bdf8' : coin.coinType === 'silver' ? '#cbd5e1' : '#facc15';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
  ctx.fillText(`${coin.amount}`, 1, -13);
  ctx.fillStyle = tagColor;
  ctx.fillText(`${coin.amount}`, 0, -14);

  ctx.restore();
}

// Global active walkable land tiles index for current surface map
let activeWalkableLandSet: Set<string> | null = null;

function isWaterTileGid(gid: number): boolean {
  const clean = gid & 0x1fffffff;
  if (clean === 0) return true;
  if (clean >= 736 && clean <= 743) return true;
  if (clean >= 750 && clean <= 800) return true;
  return false;
}

export function buildWalkableLandSet(mapData: TiledMap): Set<string> {
  const landSet = new Set<string>();
  for (const layer of mapData.layers) {
    if (layer.type !== 'tilelayer') continue;
    if (layer.chunks) {
      for (const chunk of layer.chunks) {
        for (let r = 0; r < chunk.height; r++) {
          for (let c = 0; c < chunk.width; c++) {
            const rawGid = chunk.data[r * chunk.width + c];
            const clean = rawGid & 0x1fffffff;
            if (clean === 0) continue;
            if (isWaterTileGid(clean)) continue;
            landSet.add(`${chunk.x + c},${chunk.y + r}`);
          }
        }
      }
    } else if (layer.data && layer.width && layer.height) {
      for (let r = 0; r < layer.height; r++) {
        for (let c = 0; c < layer.width; c++) {
          const rawGid = layer.data[r * layer.width + c];
          const clean = rawGid & 0x1fffffff;
          if (clean === 0) continue;
          if (isWaterTileGid(clean)) continue;
          landSet.add(`${c},${r}`);
        }
      }
    }
  }
  return landSet;
}

// ── Biome Configurations ───────────────────────────────────────────────────────
interface BiomeIslandDef {
  id: string;
  name: string;
  bounds: IslandBounds;
  pool: string[];
  targetCount: number;
}

const BIOME_ISLANDS: BiomeIslandDef[] = [
  { id: 'ilha1', name: 'Ilha 1 (Floresta & Ruínas)', bounds: SURFACE_ISLAND_BOUNDS.ilha1,
    pool: ['esquilo', 'alce', 'vead', 'piggi', 'dog', 'dodo', 'hiena', 'elf', 'anao', 'duende', 'orc', 'pand'], targetCount: 10 },
  { id: 'ilha2', name: 'Ilha 2 (Deserto de Areia)', bounds: SURFACE_ISLAND_BOUNDS.ilha2,
    pool: ['skedesert', 'lacost', 'mumia', 'serpent', 'mummi', 'mummi2', 'golen-magma', 'genie', 'scarnsabre'], targetCount: 10 },
  { id: 'ilha3', name: 'Ilha 3 (Montanhas Rochosas)', bounds: SURFACE_ISLAND_BOUNDS.ilha3,
    pool: ['tiguersabre', 'bufao', 'centgreen', 'centongg', 'centon', 'whitewolf', 'golen', 'golen2', 'trolol', 'drago', 'orc', 'lobisonem'], targetCount: 10 },
  { id: 'ilha4', name: 'Ilha 4 (Santuário Místico)', bounds: SURFACE_ISLAND_BOUNDS.ilha4,
    pool: ['draertis', 'dragis', 'medusa', 'fantasn', 'aparition', 'thedeath', 'golen', 'magmal', 'drago', 'centon', 'fera'], targetCount: 10 },
  { id: 'ilha5', name: 'Ilha 5 (Terras Dracônicas)', bounds: SURFACE_ISLAND_BOUNDS.ilha5,
    pool: ['draertis', 'dragis', 'bat rei', 'medusa', 'triron', 'glacis', 'ins', 'token', 'cavern creature'], targetCount: 10 },
];

const CAVE1_POOL = ['bat', 'zombie', 'aparition', 'goblin', 'soni', 'trolol', 'centostone', 'stonemonster'];

export function createMapMonsters(
  mapId = 'map1',
  mapData?: TiledMap,
  colliders?: Rect[]
): Monster[] {
  const monsters: Monster[] = [];
  let monsterIdCounter = 1;

  if (mapId === 'caverna-zona-1') {
    const caveSegments = [
      { minX: 120, maxX: 280, minY: 90, maxY: 180 },
      { minX: 300, maxX: 500, minY: 90, maxY: 190 },
      { minX: 520, maxX: 720, minY: 90, maxY: 190 },
      { minX: 740, maxX: 940, minY: 90, maxY: 190 },
      { minX: 960, maxX: 1120, minY: 90, maxY: 180 },
    ];
    for (let i = 0; i < 8; i++) {
      const seg = caveSegments[i % caveSegments.length];
      const type = CAVE1_POOL[i % CAVE1_POOL.length];
      monsters.push(new Monster(
        `cave1_mob_${i}_${type}`, type,
        Math.round(seg.minX + Math.random() * (seg.maxX - seg.minX)),
        Math.round(seg.minY + Math.random() * (seg.maxY - seg.minY)),
        'caverna-zona-1'
      ));
    }
    return monsters;
  }

  if (mapId === 'caverna2') {
    const c2Spawns = [
      { type: 'bat', x: 130, y: 110 }, { type: 'aparition', x: 210, y: 140 },
      { type: 'soni', x: 280, y: 100 }, { type: 'goblin', x: 350, y: 145 },
      { type: 'stonemonster', x: 230, y: 115 },
    ];
    for (let i = 0; i < c2Spawns.length; i++) {
      const s = c2Spawns[i];
      monsters.push(new Monster(`cave2_mob_${i}_${s.type}`, s.type, s.x, s.y, 'caverna2'));
    }
    return monsters;
  }

  if (mapId === 'caverna3') {
    const c3Spawns = [
      { type: 'bat rei', x: 140, y: 120 },
      { type: 'cavern creature', x: 220, y: 140 },
      { type: 'skeleton', x: 300, y: 110 },
      { type: 'draertis', x: 380, y: 150 },
      { type: 'fantasn', x: 260, y: 130 },
    ];
    for (let i = 0; i < c3Spawns.length; i++) {
      const s = c3Spawns[i];
      monsters.push(new Monster(`cave3_mob_${i}_${s.type}`, s.type, s.x, s.y, 'caverna3'));
    }
    return monsters;
  }

  if (!mapData) return monsters;

  activeWalkableLandSet = buildWalkableLandSet(mapData);
  const islandEligibleTiles: Record<string, Array<{ x: number; y: number }>> = {
    ilha1: [], ilha2: [], ilha3: [], ilha4: [], ilha5: [],
  };

  activeWalkableLandSet.forEach((tileKey) => {
    const [tx, ty] = tileKey.split(',').map(Number);
    let solidNeighbors = 0;
    for (const [dx, dy] of [[1,0], [-1,0], [0,1], [0,-1], [1,1], [-1,-1], [1,-1], [-1,1]]) {
      if (activeWalkableLandSet!.has(`${tx + dx},${ty + dy}`)) solidNeighbors++;
    }
    if (solidNeighbors < 4) return;
    const wx = tx * 32, wy = ty * 32;
    if (colliders) {
      if (colliders.some((c) => wx < c.x + c.width && wx + 16 > c.x && wy < c.y + c.height && wy + 12 > c.y)) return;
    }
    for (const isl of BIOME_ISLANDS) {
      if (wx >= isl.bounds.minX + 32 && wx <= isl.bounds.maxX - 32 &&
          wy >= isl.bounds.minY + 32 && wy <= isl.bounds.maxY - 32) {
        if (isl.id === 'ilha1' && Math.hypot(wx, wy) < 120) return;
        islandEligibleTiles[isl.id].push({ x: wx, y: wy });
        break;
      }
    }
  });

  for (const isl of BIOME_ISLANDS) {
    const tiles = islandEligibleTiles[isl.id];
    if (!tiles || tiles.length === 0) continue;
    const count = Math.min(isl.targetCount, tiles.length);
    const step = Math.max(1, Math.floor(tiles.length / count));
    for (let i = 0; i < count; i++) {
      const tileIndex = (i * step + Math.floor(Math.random() * step)) % tiles.length;
      const tile = tiles[tileIndex];
      const type = isl.pool[i % isl.pool.length];
      monsters.push(new Monster(
        `surf_${isl.id}_${monsterIdCounter++}_${type}`,
        type, tile.x + 8, tile.y + 8, mapId, isl.bounds
      ));
    }
  }

  return monsters;
}
