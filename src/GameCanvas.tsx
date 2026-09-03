import { useEffect, useRef, useState } from 'react';
import type { TiledMap, Direction, Rect, WingType } from './game/types';
import { buildCollisionRects, moveAndSlide, buildTileAnimationMap } from './game/mapUtils';
import { SpriteAnimator, FRAME_SIZE } from './game/sprite';
import {
  drawTileLayer,
  getLayerRenderables,
  drawDebugColliders,
  drawTileGrid,
  type RenderableObject,
} from './game/renderer';
import {
  Monster,
  createMapMonsters,
  type MonsterCorpse,
  updateCorpse,
  type LootBox,
  type CoinDrop,
  generateLootBox,
  drawLootBox,
  canCollectLootBox,
  generateMonsterCoinDrops,
  drawCoinDrop,
  canCollectCoinDrop,
} from './game/entities';
import { type SpawnPoint, createZoneSpawnPoints } from './game/spawnSystem';
import { ALL_ITEMS, type EquippedGear } from './game/items';
import { ITEM_OFFSETS, type ItemOffsetConfig } from './game/itemOffsets';
import {
  PLAYABLE_CHARACTERS,
  dirToOtsNum,
  type CharacterId,
} from './game/characters';
import {
  ALL_SPELLS,
  ActiveSpell,
  type SpellDef,
} from './game/magic';
import { getMapPortals, type PortalDef } from './game/zones';
import { preloadAllGameAssets } from './game/assetManager';
import {
  ParticleSystem,
  applyPostProcessing,
  type GraphicStyle,
} from './game/graphics';
import VirtualJoystick from './components/VirtualJoystick';
import { createPoundElement } from './game/poundAnimation';

// ─── Constants ───────────────────────────────────────────────────────────────

const TILE_SIZE = 32;

// Tibia default viewport: 15 tiles wide by 11 tiles tall
const TIBIA_VIEW_TILES_Y = 11;
const BASE_WORLD_H = TIBIA_VIEW_TILES_Y * TILE_SIZE; // 352px

// Hitbox at player's feet for tight tile-based collisions
const HITBOX_W = 16;
const HITBOX_H = 12;

// Walk speed (world pixels per second)
const MOVE_SPEED = 120;

// Distância máxima de ação e combate (~6 tiles = 192px)
const ACTION_DISTANCE = 192;
// Cadência entre ataques básicos automáticos (em segundos)
const AUTO_ATTACK_INTERVAL = 1.25;

// ─── CONFIGURAÇÃO DE ASAS ─────────────────────────────────────────────────────
interface WingDirectionConfig {
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  offX: number;
  offY: number;
  baseW: number;
  baseH: number;
  scale: number;
  rot: number;
  behind: boolean;
}

const WINGS_ANGELIC_CONFIG: Record<Direction, WingDirectionConfig> = {
  down:  { sx: 6, sy: 175, sw: 355, sh: 176, offX: -4, offY: -9, baseW: 68, baseH: 34, scale: 1.0, rot: 0, behind: true },
  up:    { sx: 8, sy: -15,   sw: 355, sh: 175, offX: -3, offY: -12, baseW: 68, baseH: 34, scale: 1.0, rot: 0, behind: false },
  left:  { sx: 533, sy: 0, sw: 178, sh: 175, offX: 14, offY: -6, baseW: 56, baseH: 28, scale: 1.0, rot: -13, behind: false },
  right: { sx: 355, sy: 0, sw: 178, sh: 175, offX: -21, offY: -6, baseW: 48, baseH: 28, scale: 1.0, rot: 0, behind: true },
};

/**
 * Automatically computes responsive camera distance / zoom:
 * - Mobile / Touch devices / Narrow screens (<=768px or tablet touch): 1.5x zoom
 * - Desktop / PC: 1.0x (Tibia Standard 1.0)
 */
function getResponsiveCameraZoom(): number {
  if (typeof window === 'undefined') return 1.0;
  const isMobile =
    window.innerWidth <= 768 ||
    ('ontouchstart' in window && window.innerWidth <= 1024) ||
    (navigator.maxTouchPoints > 0 && window.innerWidth <= 1024);
  return isMobile ? 1.5 : 1.0;
}

// Floating number (damage / XP) displayed above monster on kill/hit
interface FloatingNumber {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;  // upward velocity in world px/s
  timer: number;
  duration: number;
}

interface GameCanvasProps {
  mapId: string;
  mapData: TiledMap;
  initialSpawn?: { x: number; y: number } | null;
  selectedCharacterId: CharacterId;
  graphicStyle: GraphicStyle;
  enableParticles: boolean;
  debugColliders: boolean;
  showGrid: boolean;
  equippedWings?: WingType;
  /** Currently equipped weapon item ID */
  equippedWeapon?: string | null;
  /** Full player equipped gear (wings, weapon, ring, etc.) */
  equippedGear?: EquippedGear | null;
  /** Whether automatic melee attack is enabled */
  autoAttackEnabled?: boolean;
  /** Whether automatic target locking on approaching an enemy is enabled */
  autoTargetNearbyEnabled?: boolean;
  /** Live weapon offsets (e.g. from real-time calibrator) */
  weaponOffsets?: ItemOffsetConfig | null;
  /** Force a player facing direction (for weapon offset calibrator) */
  overrideDirection?: Direction | null;
  /** Currently equipped spell IDs (5 slots) */
  equippedSpellIds?: string[];
  /** Current player HP (from account) */
  playerHp?: number;
  /** Max player HP (from account) */
  playerMaxHp?: number;
  /** Current player MP (from account) */
  playerMp?: number;
  /** Max player MP (from account) */
  playerMaxMp?: number;
  /** Called when a spell is cast to consume mana. Returns false if not enough mana */
  onConsumeMana?: (amount: number) => boolean;
  onPlayerPosChange?: (x: number, y: number, tileX: number, tileY: number) => void;
  onZoneTransition?: (targetMapId: string, spawnX: number, spawnY: number) => void;
  /** Called when a monster attacks the player */
  onPlayerDamage?: (amount: number) => void;
  /** Called when a monster is killed (for XP) */
  onMonsterKill?: (xpReward: number) => void;
  /** Called when player HP drops to 0 */
  onPlayerDeath?: () => void;
  /** Called to open the Inventory / Bag modal */
  onOpenInventory?: () => void;
  /** Called when a loot box is collected */
  onCollectLoot?: (gold: number, itemId?: string) => void;
  /** Called when coins are collected */
  onCollectCoins?: (coins: { gold?: number; silver?: number; basalt?: number }) => void;
}

export default function GameCanvas({
  mapId,
  mapData,
  initialSpawn,
  selectedCharacterId,
  graphicStyle,
  enableParticles,
  debugColliders,
  showGrid,
  equippedWings = 'angelic',
  equippedWeapon = null,
  equippedGear = null,
  autoAttackEnabled = true,
  autoTargetNearbyEnabled = true,
  weaponOffsets = null,
  overrideDirection = null,
  equippedSpellIds = [],
  playerHp,
  playerMaxHp,
  playerMp,
  playerMaxMp,
  onConsumeMana,
  onPlayerPosChange,
  onZoneTransition,
  onPlayerDamage,
  onMonsterKill,
  onPlayerDeath,
  onOpenInventory,
  onCollectLoot,
  onCollectCoins,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [, setAssetsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeNearbyPortal, setActiveNearbyPortal] = useState<PortalDef | null>(null);

  // Persistent player position
  const playerRef = useRef({
    x: initialSpawn?.x ?? 0,
    y: initialSpawn?.y ?? 0,
  });

  // Mobile Touch Controls State
  const touchVectorRef = useRef({ vx: 0, vy: 0 });
  const tapTargetRef = useRef<{ x: number; y: number; anim: number } | null>(null);

  // Trigger attack function ref for external touch buttons
  const triggerAttackRef = useRef<() => void>(() => {});

  // Keep camera coords in ref for mouse/touch raycasting
  const cameraRef = useRef({ x: 0, y: 0, scale: 1.0 });

  // Persistent monsters, corpses, loot boxes, coin drops, spells, floating numbers, slashes, targeted mob
  const monstersRef = useRef<Monster[]>([]);
  const corpsesRef = useRef<MonsterCorpse[]>([]);
  const spawnPointsRef = useRef<SpawnPoint[]>([]);
  const respawnCheckTimerRef = useRef(0);
  const lootBoxesRef = useRef<LootBox[]>([]);
  const coinDropsRef = useRef<CoinDrop[]>([]);
  const activeSpellsRef = useRef<ActiveSpell[]>([]);
  const floatingNumbersRef = useRef<FloatingNumber[]>([]);
  const slashEffectsRef = useRef<Array<{ x: number; y: number; dir: Direction; timer: number; duration: number }>>([]);
  const poundWorldContainerRef = useRef<HTMLDivElement>(null);
  const selectedTargetIdRef = useRef<string | null>(null);

  // Refs so callbacks inside the game loop always get fresh values
  const onPlayerDamageRef = useRef(onPlayerDamage);
  const onMonsterKillRef = useRef(onMonsterKill);
  const onPlayerDeathRef = useRef(onPlayerDeath);
  const onCollectLootRef = useRef(onCollectLoot);
  const onCollectCoinsRef = useRef(onCollectCoins);
  useEffect(() => {
    onPlayerDamageRef.current = onPlayerDamage;
    onMonsterKillRef.current = onMonsterKill;
    onPlayerDeathRef.current = onPlayerDeath;
    onCollectLootRef.current = onCollectLoot;
    onCollectCoinsRef.current = onCollectCoins;
  }, [onPlayerDamage, onMonsterKill, onPlayerDeath, onCollectLoot, onCollectCoins]);

  // Ambient atmospheric particle system
  const particleSystemRef = useRef<ParticleSystem>(new ParticleSystem(35, mapId));

  // Smooth fade transition overlay state
  const isTransitioningRef = useRef(false);

  // Store props & callback in refs
  const propsRef = useRef({
    mapId,
    selectedCharacterId,
    graphicStyle,
    enableParticles,
    debugColliders,
    showGrid,
    equippedWings,
    equippedWeapon,
    equippedGear,
    autoAttackEnabled,
    autoTargetNearbyEnabled,
    weaponOffsets,
    overrideDirection,
    equippedSpellIds,
    playerHp,
    playerMaxHp,
    playerMp,
    playerMaxMp,
    onConsumeMana,
    onPlayerPosChange,
    onZoneTransition,
    onPlayerDeath,
    onOpenInventory,
    onCollectLoot,
    onCollectCoins,
  });

  useEffect(() => {
    propsRef.current.mapId = mapId;
    propsRef.current.selectedCharacterId = selectedCharacterId;
    propsRef.current.graphicStyle = graphicStyle;
    propsRef.current.enableParticles = enableParticles;
    propsRef.current.debugColliders = debugColliders;
    propsRef.current.showGrid = showGrid;
    propsRef.current.equippedWings = equippedWings;
    propsRef.current.equippedWeapon = equippedWeapon;
    propsRef.current.equippedGear = equippedGear;
    propsRef.current.autoAttackEnabled = autoAttackEnabled;
    propsRef.current.autoTargetNearbyEnabled = autoTargetNearbyEnabled;
    propsRef.current.weaponOffsets = weaponOffsets;
    propsRef.current.overrideDirection = overrideDirection;
    propsRef.current.equippedSpellIds = equippedSpellIds;
    propsRef.current.playerHp = playerHp;
    propsRef.current.playerMaxHp = playerMaxHp;
    propsRef.current.playerMp = playerMp;
    propsRef.current.playerMaxMp = playerMaxMp;
    propsRef.current.onConsumeMana = onConsumeMana;
    propsRef.current.onPlayerPosChange = onPlayerPosChange;
    propsRef.current.onZoneTransition = onZoneTransition;
    propsRef.current.onPlayerDeath = onPlayerDeath;
    propsRef.current.onOpenInventory = onOpenInventory;
    propsRef.current.onCollectLoot = onCollectLoot;
    propsRef.current.onCollectCoins = onCollectCoins;
  }, [mapId, selectedCharacterId, graphicStyle, enableParticles, debugColliders, showGrid, equippedWings, equippedWeapon, equippedGear, autoAttackEnabled, autoTargetNearbyEnabled, weaponOffsets, overrideDirection, equippedSpellIds, playerHp, playerMaxHp, playerMp, playerMaxMp, onConsumeMana, onPlayerPosChange, onZoneTransition, onPlayerDeath, onOpenInventory, onCollectLoot, onCollectCoins]);

  // Update particles on map change
  useEffect(() => {
    particleSystemRef.current.setMap(mapId);
  }, [mapId]);

  // Set spawn position when map or initialSpawn changes
  useEffect(() => {
    if (initialSpawn) {
      playerRef.current.x = initialSpawn.x;
      playerRef.current.y = initialSpawn.y;
    }
  }, [mapId, initialSpawn]);

  useEffect(() => {
    let isCancelled = false;
    let animFrameId = 0;

    async function init() {
      try {
        // 1. Fetch preloaded game assets (instant in-memory cache)
        const cached = await preloadAllGameAssets();

        if (isCancelled) return;

        // 2. Collision rects from Tiled map
        const colliders: Rect[] = buildCollisionRects(mapData);

        // 3. Tile animation map (water wave cycles and Tiled animations)
        const animMap = buildTileAnimationMap(mapData.tilesets);

        // 4. Initialize spawn points, corpses, and monsters for this zone
        corpsesRef.current = [];
        lootBoxesRef.current = [];
        coinDropsRef.current = [];
        floatingNumbersRef.current = [];
        respawnCheckTimerRef.current = 0;

        spawnPointsRef.current = createZoneSpawnPoints(mapId);

        const attachMonsterCallbacks = (mob: Monster, sp?: SpawnPoint) => {
          mob.onDeath = (xpReward, deathX, deathY) => {
            // Mark spawn point as dead for respawn timer
            const targetSp = sp || spawnPointsRef.current.find((s) => s.id === mob.spawnPointId);
            if (targetSp) {
              targetSp.currentMonsterId = null;
              targetSp.deathTimestamp = performance.now();
            }

            // Create monster corpse on the ground (Tibia style)
            corpsesRef.current.push({
              x: deathX - mob.config.hitboxW / 2,
              y: deathY - mob.config.hitboxH / 2,
              type: mob.type,
              config: mob.config,
              dir: mob.dir,
              alpha: 1.0,
              timer: 0,
            });

            // 1. Spawn authentic stackable Tibia coin drops on the ground
            const coins = generateMonsterCoinDrops(mob.id, deathX, deathY, xpReward);
            coinDropsRef.current.push(...coins);

            // 2. Extra equipment or potion loot box if rare item rolled
            const loot = generateLootBox(mob.id, deathX, deathY - 8, xpReward);
            if (loot.itemId || loot.rarity !== 'common') {
              lootBoxesRef.current.push(loot);
            }

            // 3. Floating XP number
            floatingNumbersRef.current.push({
              id: `xp_${Date.now()}_${Math.random()}`,
              x: deathX,
              y: deathY - 20,
              text: `+${xpReward} XP`,
              color: '#facc15',
              alpha: 1,
              vy: -28,
              timer: 0,
              duration: 2.0,
            });
            onMonsterKillRef.current?.(xpReward);
          };

          mob.onAttackPlayer = (damage: number) => {
            // Floating damage number on player
            floatingNumbersRef.current.push({
              id: `dmg_p_${Date.now()}`,
              x: playerRef.current.x + HITBOX_W / 2,
              y: playerRef.current.y - 8,
              text: `-${damage}`,
              color: '#ef4444',
              alpha: 1,
              vy: -32,
              timer: 0,
              duration: 1.5,
            });
            onPlayerDamageRef.current?.(damage);
          };
        };

        const spawnMonsters = () => {
          const mobs = createMapMonsters(mapId, mapData, colliders, spawnPointsRef.current);
          for (const mob of mobs) {
            const sp = spawnPointsRef.current.find((s) => s.id === mob.spawnPointId);
            attachMonsterCallbacks(mob, sp);
          }
          return mobs;
        };
        monstersRef.current = spawnMonsters();

        setAssetsLoaded(true);
        isTransitioningRef.current = false;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const animator = new SpriteAnimator();
        animator.setState('idle', 'down');

        let playerAttackAnimTimer = 0;
        let playerMeleeAttackAnimTimer = 0;
        let autoAttackCooldown = 0;
        let lastMeleeAttackTime = 0;
        const PLAYER_ATTACK_ANIM_DURATION = 0.32;
        const MELEE_ATTACK_COOLDOWN = 0.45; // Cooldown leve de 450ms no ataque básico

        const executeMeleeAttack = () => {
          if (animator.state === 'dead' || (propsRef.current.playerHp !== undefined && propsRef.current.playerHp <= 0)) return;

          const nowSec = performance.now() / 1000;
          if (nowSec - lastMeleeAttackTime < MELEE_ATTACK_COOLDOWN) {
            return; // Bloqueia ataque duplo acidental / disparos rápidos no mobile
          }
          lastMeleeAttackTime = nowSec;

          autoAttackCooldown = AUTO_ATTACK_INTERVAL;
          animator.triggerAttack();
          playerAttackAnimTimer = PLAYER_ATTACK_ANIM_DURATION;
          playerMeleeAttackAnimTimer = PLAYER_ATTACK_ANIM_DURATION;

          const px = playerRef.current.x + HITBOX_W / 2;
          const py = playerRef.current.y + HITBOX_H / 2;
          const curDir = animator.direction;
          const curCharId = propsRef.current.selectedCharacterId || 'luxio';

          // Base damage by class
          let baseDamage = 32 + Math.floor(Math.random() * 18);
          if (curCharId === 'luxio') baseDamage = 45 + Math.floor(Math.random() * 20);
          else if (curCharId === 'archer') baseDamage = 38 + Math.floor(Math.random() * 18);
          else if (curCharId === 'magician' || curCharId === 'necromancer') baseDamage = 26 + Math.floor(Math.random() * 14);
          else if (curCharId === 'paladin') baseDamage = 35 + Math.floor(Math.random() * 18);

          // Bônus de ataque de armas e anéis de poder equipados
          let gearAttack = 0;
          const gear = propsRef.current.equippedGear;
          if (gear) {
            for (const slot of Object.keys(gear) as (keyof EquippedGear)[]) {
              const itemId = gear[slot];
              if (itemId && ALL_ITEMS[itemId]?.stats?.attack) {
                gearAttack += ALL_ITEMS[itemId].stats!.attack!;
              }
            }
          }
          baseDamage += gearAttack;

          // Check if player has sword equipped
          const currentWeaponId = propsRef.current.equippedWeapon ?? propsRef.current.equippedGear?.weapon ?? null;
          const hasSword = Boolean(
            currentWeaponId &&
            ALL_ITEMS[currentWeaponId]?.slotType === 'weapon' &&
            (currentWeaponId.includes('sword') || !currentWeaponId.startsWith('staff'))
          );

          // Impact position in front of player
          let impactX = px;
          let impactY = py;
          if (curDir === 'up') impactY -= 20;
          else if (curDir === 'down') impactY += 20;
          else if (curDir === 'left') impactX -= 20;
          else if (curDir === 'right') impactX += 20;

          if (hasSword) {
            // Sword equipped: blade slice effect
            slashEffectsRef.current.push({
              x: impactX,
              y: impactY,
              dir: curDir,
              timer: 0,
              duration: 0.26,
            });
          } else {
            // Unarmed: animated SVG pound ("Pancada com as Mãos") with CSS
            if (poundWorldContainerRef.current) {
              const poundEl = createPoundElement(impactX, impactY, curDir);
              poundWorldContainerRef.current.appendChild(poundEl);
              setTimeout(() => {
                poundEl.remove();
              }, 420);
            }
          }

          // Check if explicit target is in range
          const targetMob = selectedTargetIdRef.current
            ? monstersRef.current.find((m) => m.id === selectedTargetIdRef.current && !m.isDead)
            : null;

          let hitAny = false;

          if (targetMob) {
            const mx = targetMob.x + targetMob.config.hitboxW / 2;
            const my = targetMob.y + targetMob.config.hitboxH / 2;
            if (Math.hypot(px - mx, py - my) <= 65) {
              hitAny = true;
              targetMob.takeDamage(baseDamage);
              floatingNumbersRef.current.push({
                id: `dmg_${targetMob.id}_${Date.now()}`,
                x: mx,
                y: targetMob.y - 12,
                text: `-${baseDamage}`,
                color: '#ffffff',
                alpha: 1,
                vy: -32,
                timer: 0,
                duration: 1.5,
              });
            }
          }

          if (!hitAny) {
            for (const mob of monstersRef.current) {
              if (mob.isDead) continue;
              const mx = mob.x + mob.config.hitboxW / 2;
              const my = mob.y + mob.config.hitboxH / 2;
              const dist = Math.hypot(px - mx, py - my);
              if (dist <= 56) {
                mob.takeDamage(baseDamage);
                floatingNumbersRef.current.push({
                  id: `dmg_${mob.id}_${Date.now()}_${Math.random()}`,
                  x: mx,
                  y: mob.y - 12,
                  text: `-${baseDamage}`,
                  color: '#ffffff',
                  alpha: 1,
                  vy: -32,
                  timer: 0,
                  duration: 1.5,
                });
                if (!selectedTargetIdRef.current) {
                  selectedTargetIdRef.current = mob.id;
                }
                break;
              }
            }
          }
        };

        triggerAttackRef.current = executeMeleeAttack;

        // Function to cast a spell with target tracking & homing
        const castSpell = (spellDef: SpellDef) => {
          if (animator.state === 'dead' || (propsRef.current.playerHp !== undefined && propsRef.current.playerHp <= 0)) return;

          const px = playerRef.current.x;
          const py = playerRef.current.y;
          const pCenterX = px + HITBOX_W / 2;
          const pCenterY = py + HITBOX_H / 2;
          const pTorsoX = pCenterX;
          const pTorsoY = py + HITBOX_H - 18;
          const pFeetY = py + HITBOX_H;

          // 1. Check if the player has a valid target within ACTION_DISTANCE
          let targetMob = selectedTargetIdRef.current
            ? monstersRef.current.find((m) => m.id === selectedTargetIdRef.current && !m.isDead)
            : null;

          if (targetMob) {
            const dist = Math.hypot(
              pCenterX - (targetMob.x + targetMob.config.hitboxW / 2),
              pCenterY - (targetMob.y + targetMob.config.hitboxH / 2)
            );
            if (dist > ACTION_DISTANCE) {
              // Target is too far away to cast!
              selectedTargetIdRef.current = null;
              targetMob = null;
            }
          }

          // If no target and auto-target is enabled, try locking onto closest monster within ACTION_DISTANCE
          if (!targetMob && propsRef.current.autoTargetNearbyEnabled) {
            let closestDist = ACTION_DISTANCE;
            for (const mob of monstersRef.current) {
              if (mob.isDead) continue;
              const d = Math.hypot(
                pCenterX - (mob.x + mob.config.hitboxW / 2),
                pCenterY - (mob.y + mob.config.hitboxH / 2)
              );
              if (d <= closestDist) {
                closestDist = d;
                targetMob = mob;
              }
            }
            if (targetMob) {
              selectedTargetIdRef.current = targetMob.id;
            }
          }

          // 2. REQUIRE A VALID TARGET TO CAST!
          if (!targetMob) {
            floatingNumbersRef.current.push({
              id: `notarget_${Date.now()}`,
              x: pCenterX,
              y: py - 18,
              text: '⚠️ Selecione um inimigo!',
              color: '#f87171',
              alpha: 1,
              vy: -32,
              timer: 0,
              duration: 1.6,
            });
            return; // Abort: no mana consumed, no animation played!
          }

          // 3. Check and consume mana
          const manaCost = spellDef.manaCost || 0;
          if (manaCost > 0) {
            const currentMp = propsRef.current.playerMp ?? 100;
            if (currentMp < manaCost) {
              floatingNumbersRef.current.push({
                id: `nomana_${Date.now()}`,
                x: pCenterX,
                y: py - 14,
                text: 'Sem mana!',
                color: '#38bdf8',
                alpha: 1,
                vy: -28,
                timer: 0,
                duration: 1.2,
              });
              return;
            }

            propsRef.current.onConsumeMana?.(manaCost);
          }

          animator.triggerAttack();
          playerAttackAnimTimer = PLAYER_ATTACK_ANIM_DURATION;

          let dir = animator.direction;

          // Orient caster towards target
          if (targetMob) {
            const dx = (targetMob.x + targetMob.config.hitboxW / 2) - pTorsoX;
            const dy = (targetMob.y + targetMob.config.hitboxH / 2) - pTorsoY;
            if (Math.abs(dx) > Math.abs(dy)) {
              animator.direction = dx > 0 ? 'right' : 'left';
            } else {
              animator.direction = dy > 0 ? 'down' : 'up';
            }
            dir = animator.direction;
          }

          let spawnX = pTorsoX;
          let spawnY = spellDef.spawnOrigin === 'ground' ? pFeetY : pTorsoY;
          let vx = 0;
          let vy = 0;

          const speed = spellDef.projectileSpeed || 0;
          const isProjectile = speed > 0;
          const isAttached = Boolean(spellDef.attachToCaster);

          let targetX: number | undefined;
          let targetY: number | undefined;

          if (targetMob) {
            targetX = targetMob.x + targetMob.config.hitboxW / 2;
            targetY = targetMob.y + targetMob.config.hitboxH / 2;
          }

          if (isAttached) {
            // Attached buff/shield (e.g. Ice Shield)
            spawnX = pTorsoX;
            spawnY = spellDef.spawnOrigin === 'ground' ? pFeetY : pTorsoY;
          } else if (isProjectile) {
            // Projectile launches from caster towards target
            spawnX = pTorsoX;
            spawnY = spellDef.spawnOrigin === 'ground' ? pFeetY : pTorsoY;

            if (targetX !== undefined && targetY !== undefined) {
              const dx = targetX - spawnX;
              const dy = targetY - spawnY;
              const dist = Math.hypot(dx, dy);
              if (dist > 0) {
                vx = (dx / dist) * speed;
                vy = (dy / dist) * speed;
              }
            } else {
              if (dir === 'up') vy = -speed;
              else if (dir === 'down') vy = speed;
              else if (dir === 'left') vx = -speed;
              else if (dir === 'right') vx = speed;
            }
          } else {
            // Targeted Manifestation / Strike / Area Burst / Summon (e.g. Ceifador, Flame Strike, Ice Burst, etc.)
            if (targetMob) {
              // Manifests directly on the targeted enemy at their location!
              spawnX = targetMob.x + targetMob.config.hitboxW / 2;
              spawnY = targetMob.y + targetMob.config.hitboxH / 2;
            } else {
              // If no target, manifests in front of player in facing direction
              const forwardDist = spellDef.spawnOffsetDist || 45;
              if (dir === 'up') spawnY -= forwardDist;
              else if (dir === 'down') spawnY += forwardDist;
              else if (dir === 'left') spawnX -= forwardDist;
              else if (dir === 'right') spawnX += forwardDist;
            }
          }

          const spell = new ActiveSpell(
            `spell_${Date.now()}_${Math.random()}`,
            spellDef,
            spawnX,
            spawnY,
            dir,
            vx,
            vy,
            targetMob?.id
          );

          activeSpellsRef.current.push(spell);
        };

        // Smooth zone transition execution helper
        const executeTransition = (targetMapId: string, spawnX: number, spawnY: number) => {
          if (isTransitioningRef.current) return;
          isTransitioningRef.current = true;
          propsRef.current.onZoneTransition?.(targetMapId, spawnX, spawnY);
        };

        // 4. Keyboard Input handling
        const keys = new Set<string>();

        const handleKeyDown = (e: KeyboardEvent) => {
          const key = e.key.toLowerCase();
          keys.add(key);

          // Clear touch tap target when keyboard is pressed
          tapTargetRef.current = null;

          // Interaction key (E or Enter) to enter/exit hole if nearby
          if (key === 'e' || key === 'enter') {
            const portals = getMapPortals(mapId, mapData);
            const px = playerRef.current.x + HITBOX_W / 2;
            const py = playerRef.current.y + HITBOX_H / 2;
            const nearby = portals.find((p) => Math.hypot(px - p.worldX, py - p.worldY) < 65);
            if (nearby) {
              e.preventDefault();
              executeTransition(nearby.targetMapId, nearby.targetSpawnX, nearby.targetSpawnY);
              return;
            }
          }

          // Space or J to trigger basic melee attack
          if (key === ' ' || key === 'j') {
            e.preventDefault();
            executeMeleeAttack();
          }

          // Number keys 1..3 for Equipped Spells
          if (['1', '2', '3'].includes(key)) {
            e.preventDefault();
            const slotIdx = parseInt(key, 10) - 1;
            const equippedIds = propsRef.current.equippedSpellIds || [];
            const spellId = equippedIds[slotIdx];
            if (spellId) {
              const def = ALL_SPELLS.find((s) => s.id === spellId);
              if (def) {
                castSpell(def);
              }
            }
            return;
          }

          // B or I to open Bag / Inventory
          if (key === 'b' || key === 'i') {
            e.preventDefault();
            propsRef.current.onOpenInventory?.();
            return;
          }

          // R to respawn at start
          if (key === 'r') {
            playerRef.current.x = initialSpawn?.x ?? 0;
            playerRef.current.y = initialSpawn?.y ?? 0;
            animator.setState('idle', 'down');
          }
        };

        const handleKeyUp = (e: KeyboardEvent) => {
          keys.delete(e.key.toLowerCase());
        };

        // Custom Event listener for UI Skill buttons
        const handleCustomSpellCast = (e: Event) => {
          const customEvt = e as CustomEvent<{ spellId: string }>;
          if (customEvt.detail?.spellId) {
            const def = ALL_SPELLS.find((s) => s.id === customEvt.detail.spellId);
            if (def) {
              castSpell(def);
            }
          }
        };

        const handleCustomPlayerAttack = () => {
          executeMeleeAttack();
        };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('cast-magic-spell', handleCustomSpellCast);
        window.addEventListener('player-attack', handleCustomPlayerAttack);

        // 5. Portals in this zone
        const mapPortals: PortalDef[] = getMapPortals(mapId, mapData);

        // 6. Main 60 FPS Game Loop
        let lastTime = performance.now();
        let lastPosReportTime = 0;
        let otsWalkTimer = 0;
        let otsWalkFrame = 1;
        let swordWalkTimer = 0;
        let swordWalkWeight = 0;
        let fadeAlpha = 1.0; // Smooth fade-in on map spawn

        const loop = (now: number) => {
          const dt = Math.min((now - lastTime) / 1000, 0.05);
          lastTime = now;

          if (playerAttackAnimTimer > 0) {
            playerAttackAnimTimer = Math.max(0, playerAttackAnimTimer - dt);
          }
          if (playerMeleeAttackAnimTimer > 0) {
            playerMeleeAttackAnimTimer = Math.max(0, playerMeleeAttackAnimTimer - dt);
          }

          const px = playerRef.current.x + HITBOX_W / 2;
          const py = playerRef.current.y + HITBOX_H / 2;

          // ── Validate Current Target Within ACTION_DISTANCE ───────────
          if (selectedTargetIdRef.current) {
            const currentTarget = monstersRef.current.find(
              (m) => m.id === selectedTargetIdRef.current && !m.isDead
            );
            if (!currentTarget) {
              selectedTargetIdRef.current = null;
            } else {
              const d = Math.hypot(
                px - (currentTarget.x + currentTarget.config.hitboxW / 2),
                py - (currentTarget.y + currentTarget.config.hitboxH / 2)
              );
              // Deselect if target leaves action range + buffer (230px)
              if (d > ACTION_DISTANCE + 38) {
                selectedTargetIdRef.current = null;
              }
            }
          }

          // ── Auto-Target Nearby Enemy if Enabled ──────────────────────
          if (!selectedTargetIdRef.current && propsRef.current.autoTargetNearbyEnabled && animator.state !== 'dead') {
            let closestDist = ACTION_DISTANCE;
            let closestMob: Monster | null = null;
            for (const mob of monstersRef.current) {
              if (mob.isDead) continue;
              const d = Math.hypot(
                px - (mob.x + mob.config.hitboxW / 2),
                py - (mob.y + mob.config.hitboxH / 2)
              );
              if (d <= closestDist) {
                closestDist = d;
                closestMob = mob;
              }
            }
            if (closestMob) {
              selectedTargetIdRef.current = closestMob.id;
            }
          }

          // ── Auto-Attack Cooldown & Auto-Trigger ───────────────────────
          if (autoAttackCooldown > 0) {
            autoAttackCooldown = Math.max(0, autoAttackCooldown - dt);
          }

          if (propsRef.current.autoAttackEnabled && autoAttackCooldown <= 0 && animator.state !== 'dead') {
            const targetMob = selectedTargetIdRef.current
              ? monstersRef.current.find((m) => m.id === selectedTargetIdRef.current && !m.isDead)
              : null;

            if (targetMob) {
              const mx = targetMob.x + targetMob.config.hitboxW / 2;
              const my = targetMob.y + targetMob.config.hitboxH / 2;
              const dist = Math.hypot(px - mx, py - my);
              // Melee range (within 65px of target)
              if (dist <= 65) {
                executeMeleeAttack();
              }
            }
          }

          // ── Read Player Movement Input (Virtual Joystick / Tap / Keyboard) ────
          let moveX = 0;
          let moveY = 0;

          const touchX = touchVectorRef.current.vx;
          const touchY = touchVectorRef.current.vy;
          const isTouchActive = Math.hypot(touchX, touchY) > 0.15;

          if (isTouchActive) {
            // Priority 1: Virtual Joystick
            moveX = touchX;
            moveY = touchY;
            tapTargetRef.current = null;
          } else if (tapTargetRef.current) {
            // Priority 2: Tap-to-Move Target Destination
            const dx = tapTargetRef.current.x - playerRef.current.x;
            const dy = tapTargetRef.current.y - playerRef.current.y;
            const dist = Math.hypot(dx, dy);

            if (dist < 6) {
              tapTargetRef.current = null;
            } else {
              moveX = dx / dist;
              moveY = dy / dist;
            }
          } else {
            // Priority 3: Keyboard inputs
            const up = keys.has('w') || keys.has('arrowup') || keys.has('numpad8');
            const down = keys.has('s') || keys.has('arrowdown') || keys.has('numpad2');
            const left = keys.has('a') || keys.has('arrowleft') || keys.has('numpad4');
            const right = keys.has('d') || keys.has('arrowright') || keys.has('numpad6');

            const upLeft = keys.has('q') || keys.has('numpad7');
            const upRight = keys.has('e') || keys.has('numpad9');
            const downLeft = keys.has('z') || keys.has('numpad1');
            const downRight = keys.has('c') || keys.has('numpad3');

            if (up || upLeft || upRight) moveY -= 1;
            if (down || downLeft || downRight) moveY += 1;
            if (left || upLeft || downLeft) moveX -= 1;
            if (right || upRight || downRight) moveX += 1;

            if (moveX !== 0 && moveY !== 0) {
              const inv = 1 / Math.SQRT2;
              moveX *= inv;
              moveY *= inv;
            }
          }

          const isMoving = Math.hypot(moveX, moveY) > 0.1;

          let newDir: Direction = animator.direction;
          if (Math.abs(moveX) > Math.abs(moveY)) {
            if (moveX > 0) newDir = 'right';
            else if (moveX < 0) newDir = 'left';
          } else if (Math.abs(moveY) > 0) {
            if (moveY > 0) newDir = 'down';
            else if (moveY < 0) newDir = 'up';
          }

          if (animator.state === 'attack') {
            if (animator.isFinished) {
              animator.setState(isMoving ? 'walk' : 'idle', newDir);
            }
          } else {
            if (isMoving) {
              animator.setState('walk', newDir);
            } else {
              animator.setState('idle', newDir);
            }
          }
          animator.update(dt);

          // OTServ Player step animation cycling sincronizado com o balanço da espada
          const OTS_WALK_CYCLE = [1, 2, 1, 3];
          const STEP_DURATION = 0.22; // 220ms por fase do passo (cadência suave e natural)
          const FULL_CYCLE_DURATION = 4 * STEP_DURATION; // 0.88s para o ciclo completo dos dois passos

          if (isMoving) {
            otsWalkTimer += dt;
            const cycleTime = otsWalkTimer % FULL_CYCLE_DURATION;
            const stepIndex = Math.floor(cycleTime / STEP_DURATION);
            otsWalkFrame = OTS_WALK_CYCLE[stepIndex];

            // swordWalkTimer sincronizado suavemente
            swordWalkTimer = cycleTime;
            swordWalkWeight = Math.min(1.0, swordWalkWeight + dt * 3.2);
          } else {
            otsWalkFrame = 1;
            otsWalkTimer = 0;
            // Amortecimento suave ao parar de caminhar
            if (swordWalkWeight > 0.001) {
              swordWalkTimer = (swordWalkTimer + dt * 0.4) % FULL_CYCLE_DURATION;
            }
            swordWalkWeight = Math.max(0.0, swordWalkWeight - dt * 3.2);
          }

          // ── Player Physics & Collision Resolution ───────────────────────
          if (isMoving && animator.state !== 'dead') {
            let gearSpeedBonus = 0;
            const gear = propsRef.current.equippedGear;
            if (gear) {
              for (const slot of Object.keys(gear) as (keyof EquippedGear)[]) {
                const itemId = gear[slot];
                if (itemId && ALL_ITEMS[itemId]?.stats?.speed) {
                  gearSpeedBonus += ALL_ITEMS[itemId].stats!.speed!;
                }
              }
            }
            const speedMultiplier = propsRef.current.equippedWings !== 'none' ? 1.45 : 1.0;
            const effectiveSpeed = (MOVE_SPEED + gearSpeedBonus) * speedMultiplier;
            const dx = moveX * effectiveSpeed * dt;
            const dy = moveY * effectiveSpeed * dt;

            // Collect static colliders + nearby monsters as obstacles for the player
            const effectiveObstacles: Rect[] = [];
            for (const col of colliders) {
              if (
                col.x + col.width > playerRef.current.x - 48 &&
                col.x < playerRef.current.x + HITBOX_W + 48 &&
                col.y + col.height > playerRef.current.y - 48 &&
                col.y < playerRef.current.y + HITBOX_H + 48
              ) {
                effectiveObstacles.push(col);
              }
            }

            for (const mob of monstersRef.current) {
              if (
                Math.abs(mob.x - playerRef.current.x) < 56 &&
                Math.abs(mob.y - playerRef.current.y) < 56
              ) {
                effectiveObstacles.push({
                  x: mob.x,
                  y: mob.y,
                  width: mob.config.hitboxW,
                  height: mob.config.hitboxH,
                });
              }
            }

            const res = moveAndSlide(
              playerRef.current.x,
              playerRef.current.y,
              dx,
              dy,
              HITBOX_W,
              HITBOX_H,
              effectiveObstacles
            );
            playerRef.current.x = res.x;
            playerRef.current.y = res.y;
          }

          // ── Proximity Detection for Interactive Holes ───────────────────
          const pxFootCenterX = playerRef.current.x + HITBOX_W / 2;
          const pyFootCenterY = playerRef.current.y + HITBOX_H / 2;
          let nearbyPortal: PortalDef | null = null;

          for (const portal of mapPortals) {
            const dist = Math.hypot(pxFootCenterX - portal.worldX, pyFootCenterY - portal.worldY);
            if (dist < 65) {
              nearbyPortal = portal;
              break;
            }
          }
          setActiveNearbyPortal(nearbyPortal);

          // ── Update Monsters (AI with combat) ─────────────────────────────
          const playerHitbox: Rect = {
            x: playerRef.current.x,
            y: playerRef.current.y,
            width: HITBOX_W,
            height: HITBOX_H,
          };

          for (const mob of monstersRef.current) {
            mob.update(dt, colliders, playerHitbox, monstersRef.current);
          }
          // Remove dead monsters after a brief delay (corpse already spawned)
          monstersRef.current = monstersRef.current.filter((m) => !m.isDead);

          // ── Update Corpses (Tibia-style fade out) ────────────────────────
          for (let i = corpsesRef.current.length - 1; i >= 0; i--) {
            const corpse = corpsesRef.current[i];
            if (updateCorpse(corpse, dt)) {
              corpsesRef.current.splice(i, 1);
            }
          }

          // ── Continuous Monster Respawn with Anti-Pop-in (Tibia rules) ─────
          respawnCheckTimerRef.current += dt;
          if (respawnCheckTimerRef.current >= 0.5) {
            respawnCheckTimerRef.current = 0;
            const now = performance.now();

            const dpr = window.devicePixelRatio || 1;
            const zoom = getResponsiveCameraZoom();
            const scale = zoom * dpr;
            const viewW = canvas.width / scale;
            const viewH = canvas.height / scale;
            const camMinX = cameraRef.current.x - 72;
            const camMaxX = cameraRef.current.x + viewW + 72;
            const camMinY = cameraRef.current.y - 72;
            const camMaxY = cameraRef.current.y + viewH + 72;

            for (const sp of spawnPointsRef.current) {
              if (sp.deathTimestamp === null || sp.currentMonsterId !== null) continue;

              const elapsedMs = now - sp.deathTimestamp;
              if (elapsedMs < sp.respawnSeconds * 1000) continue;

              // Regra de Ouro do Tibia: Se o ponto de spawn estiver visível na tela, adia o renascimento!
              const isInsideScreen = (
                sp.homeX >= camMinX && sp.homeX <= camMaxX &&
                sp.homeY >= camMinY && sp.homeY <= camMaxY
              );
              if (isInsideScreen) continue;

              // Renasce nova criatura com vida cheia no ninho
              const newMob = new Monster(
                `${sp.id}_${Date.now()}_${sp.monsterType}`,
                sp.monsterType,
                sp.homeX,
                sp.homeY,
                mapId,
                undefined,
                {
                  spawnPointId: sp.id,
                  homeX: sp.homeX,
                  homeY: sp.homeY,
                  roamRadius: sp.roamRadius,
                  maxChaseDistance: sp.maxChaseDistance,
                }
              );
              attachMonsterCallbacks(newMob, sp);
              sp.currentMonsterId = newMob.id;
              sp.deathTimestamp = null;
              monstersRef.current.push(newMob);
            }
          }

          // ── Update Coin Drops (Collect on player proximity) ──────────────
          for (const coin of coinDropsRef.current) {
            coin.animTimer += dt * 3.0;

            if (!coin.collected) {
              if (canCollectCoinDrop(coin, playerRef.current.x, playerRef.current.y, HITBOX_W, HITBOX_H)) {
                coin.collected = true;

                const coinLabel =
                  coin.coinType === 'basalt' ? 'Cristal' : coin.coinType === 'silver' ? 'Prata' : 'Ouro';
                const coinColor =
                  coin.coinType === 'basalt' ? '#38bdf8' : coin.coinType === 'silver' ? '#cbd5e1' : '#facc15';

                floatingNumbersRef.current.push({
                  id: `coin_${Date.now()}_${Math.random()}`,
                  x: coin.x,
                  y: coin.y - 14,
                  text: `+${coin.amount} ${coinLabel}`,
                  color: coinColor,
                  alpha: 1,
                  vy: -32,
                  timer: 0,
                  duration: 1.8,
                });

                propsRef.current.onCollectCoins?.({ [coin.coinType]: coin.amount });
              }
            } else {
              coin.collectAnim += dt * 3.5;
            }
          }
          coinDropsRef.current = coinDropsRef.current.filter((c) => !c.collected || c.collectAnim < 1.0);

          // ── Update Loot Boxes (Collect on player proximity) ──────────────
          for (const loot of lootBoxesRef.current) {
            loot.animTimer += dt * 3.0;

            if (!loot.collected) {
              if (canCollectLootBox(loot, playerRef.current.x, playerRef.current.y, HITBOX_W, HITBOX_H)) {
                loot.collected = true;

                // Floating gold reward
                floatingNumbersRef.current.push({
                  id: `gold_${Date.now()}_${Math.random()}`,
                  x: loot.x,
                  y: loot.y - 12,
                  text: `+${loot.gold} Ouro`,
                  color: '#facc15',
                  alpha: 1,
                  vy: -32,
                  timer: 0,
                  duration: 1.8,
                });

                // Floating item reward if dropped
                if (loot.itemId && ALL_ITEMS[loot.itemId]) {
                  const item = ALL_ITEMS[loot.itemId];
                  const itemColor =
                    loot.rarity === 'legendary' ? '#f59e0b'
                    : loot.rarity === 'epic' ? '#c084fc'
                    : loot.rarity === 'rare' ? '#38bdf8'
                    : '#e2e8f0';

                  floatingNumbersRef.current.push({
                    id: `item_${Date.now()}_${Math.random()}`,
                    x: loot.x,
                    y: loot.y - 28,
                    text: `+${item.name}`,
                    color: itemColor,
                    alpha: 1,
                    vy: -24,
                    timer: 0,
                    duration: 2.4,
                  });
                }

                propsRef.current.onCollectLoot?.(loot.gold, loot.itemId);
              }
            } else {
              loot.collectAnim += dt * 3.5;
            }
          }
          // Remove only collected loot boxes after collection animation completes
          lootBoxesRef.current = lootBoxesRef.current.filter((l) => !l.collected || l.collectAnim < 1.0);

          // ── Update Floating Numbers ───────────────────────────────────────
          for (const fn of floatingNumbersRef.current) {
            fn.timer += dt;
            fn.y += fn.vy * dt;
            fn.alpha = Math.max(0, 1 - fn.timer / fn.duration);
          }
          floatingNumbersRef.current = floatingNumbersRef.current.filter((fn) => fn.timer < fn.duration);

          // ── Update Slashes ───────────────────────────────────────────────
          for (const slash of slashEffectsRef.current) {
            slash.timer += dt;
          }
          slashEffectsRef.current = slashEffectsRef.current.filter((s) => s.timer < s.duration);

          // ── Update Active Spells & Collision ─────────────────────────────
          const pTorsoX = playerRef.current.x + HITBOX_W / 2;
          const pTorsoY = playerRef.current.y + HITBOX_H - 18;
          const pFeetY = playerRef.current.y + HITBOX_H;

          for (const spell of activeSpellsRef.current) {
            let targetPos: { x: number; y: number } | undefined;
            if (spell.targetMonsterId) {
              const targetMob = monstersRef.current.find((m) => m.id === spell.targetMonsterId && !m.isDead);
              if (targetMob) {
                targetPos = {
                  x: targetMob.x + targetMob.config.hitboxW / 2,
                  y: targetMob.y + targetMob.config.hitboxH / 2,
                };
              }
            }
            const casterY = spell.def.spawnOrigin === 'ground' ? pFeetY : pTorsoY;
            spell.update(dt, pTorsoX, casterY, targetPos);

            // Check collision with monsters
            const hitRadius = spell.def.damageRadius || 42;
            const spellDmg = spell.def.damage || (40 + Math.floor(Math.random() * 25));

            for (const mob of monstersRef.current) {
              if (mob.isDead) continue;
              const mobCenterX = mob.x + mob.config.hitboxW / 2;
              const mobCenterY = mob.y + mob.config.hitboxH / 2;
              const dist = Math.hypot(spell.x - mobCenterX, spell.y - mobCenterY);

              if (dist <= hitRadius && !spell.hitMonsterIds.has(mob.id)) {
                spell.hitMonsterIds.add(mob.id);
                mob.takeDamage(spellDmg);

                // Floating damage number in spell color
                floatingNumbersRef.current.push({
                  id: `dmg_${mob.id}_${Date.now()}_${Math.random()}`,
                  x: mobCenterX,
                  y: mob.y - 12,
                  text: `-${spellDmg}`,
                  color: spell.def.color || '#facc15',
                  alpha: 1,
                  vy: -34,
                  timer: 0,
                  duration: 1.6,
                });

                if ((spell.def.projectileSpeed || 0) > 0 && !spell.def.isDirectional) {
                  spell.isFinished = true;
                }
              }
            }
          }
          activeSpellsRef.current = activeSpellsRef.current.filter((s) => !s.isFinished);

          // Player death check
          if (propsRef.current.playerHp !== undefined && propsRef.current.playerHp <= 0) {
            if (animator.state !== 'dead') {
              animator.setState('dead', animator.direction);
              propsRef.current.onPlayerDeath?.();
            }
          }

          // Throttle coordinate callback to ~10Hz
          if (now - lastPosReportTime > 100) {
            lastPosReportTime = now;
            const cb = propsRef.current.onPlayerPosChange;
            if (cb) {
              cb(
                Math.round(playerRef.current.x),
                Math.round(playerRef.current.y),
                Math.floor(playerRef.current.x / TILE_SIZE),
                Math.floor(playerRef.current.y / TILE_SIZE)
              );
            }
          }

          // ── Viewport & Tibia Camera ────────────────────────────────────
          const rect = canvas.getBoundingClientRect();
          const dpr = window.devicePixelRatio || 1;
          const displayW = Math.round(rect.width * dpr);
          const displayH = Math.round(rect.height * dpr);

          if (canvas.width !== displayW || canvas.height !== displayH) {
            canvas.width = displayW;
            canvas.height = displayH;
          }

          const zoom = getResponsiveCameraZoom();
          const scale = (displayH / BASE_WORLD_H) * zoom;
          const worldViewW = displayW / scale;
          const worldViewH = displayH / scale;

          const pCenterX = playerRef.current.x + HITBOX_W / 2;
          const pCenterY = playerRef.current.y + HITBOX_H / 2;

          // Continuous camera coordinates for buttery smooth 60fps tracking
          const camX = pCenterX - worldViewW / 2;
          const camY = pCenterY - worldViewH / 2;

          cameraRef.current = { x: camX, y: camY, scale };

          // Synchronize unarmed pound SVG layer with camera & world scale
          if (poundWorldContainerRef.current) {
            const factor = scale / dpr;
            poundWorldContainerRef.current.style.transform = `translate(${-camX * factor}px, ${-camY * factor}px) scale(${factor})`;
          }

          // Update ambient particles
          if (propsRef.current.enableParticles) {
            particleSystemRef.current.update(dt, worldViewW, worldViewH);
          }

          // ── Rendering ──────────────────────────────────────────────────
          ctx.save();

          // Intelligent antialiasing based on active graphic style
          const currentStyle = propsRef.current.graphicStyle || 'modern-hd';
          if (currentStyle === 'modern-hd') {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
          } else {
            ctx.imageSmoothingEnabled = false;
          }

          // Pure pitch black background in cave, dark void in surface
          ctx.fillStyle = mapId.startsWith('caverna') ? '#000000' : '#06070a';
          ctx.fillRect(0, 0, displayW, displayH);

          ctx.scale(scale, scale);

          // 1. Base tile layers (terreno, chao, blocos) with live water wave animation
          for (const layer of mapData.layers) {
            if (!layer.visible || layer.type !== 'tilelayer') continue;
            drawTileLayer(
              ctx,
              layer,
              mapData,
              cached.tilesets,
              camX,
              camY,
              worldViewW,
              worldViewH,
              now,
              animMap
            );
          }

          // Draw Tap-to-Move pulsing target indicator on ground
          if (tapTargetRef.current) {
            tapTargetRef.current.anim += dt * 5;
            const targetScreenX = tapTargetRef.current.x + HITBOX_W / 2 - camX;
            const targetScreenY = tapTargetRef.current.y + HITBOX_H / 2 - camY;
            const pulseR = 8 + Math.sin(tapTargetRef.current.anim) * 3;

            ctx.save();
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
            ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.ellipse(targetScreenX, targetScreenY, pulseR, pulseR * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.arc(targetScreenX, targetScreenY, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }

          // Optional 32px tile grid
          if (propsRef.current.showGrid) {
            drawTileGrid(ctx, camX, camY, worldViewW, worldViewH, TILE_SIZE);
          }

          // 2. Depth Y-sorted objects (walls, nature/trees, player, monsters, spells)
          const depthObjects: RenderableObject[] = [];

          for (const layer of mapData.layers) {
            if (!layer.visible || layer.type !== 'objectgroup') continue;
            const objs = getLayerRenderables(
              layer,
              mapData,
              cached.tilesets,
              camX,
              camY,
              worldViewW,
              worldViewH,
              now,
              animMap
            );
            depthObjects.push(...objs);
          }

          // Add Coin Drops to depth sorting (on ground until collected)
          for (const coin of coinDropsRef.current) {
            if (coin.x + 24 < camX || coin.x - 24 > camX + worldViewW) continue;
            if (coin.y + 24 < camY || coin.y - 24 > camY + worldViewH) continue;

            const assetKey =
              coin.coinType === 'basalt'
                ? 'coin_basalt'
                : coin.coinType === 'silver'
                ? 'coin_silver'
                : 'coin_gold';
            const coinImg = cached.items[assetKey];

            depthObjects.push({
              type: 'tiled-obj',
              sortY: coin.y + 2,
              draw: (renderCtx) => {
                drawCoinDrop(renderCtx, coin, coinImg, camX, camY);
              },
            });
          }

          // Add Loot Boxes to depth sorting (on ground until collected)
          for (const loot of lootBoxesRef.current) {
            if (loot.x + 30 < camX || loot.x - 30 > camX + worldViewW) continue;
            if (loot.y + 30 < camY || loot.y - 30 > camY + worldViewH) continue;

            depthObjects.push({
              type: 'tiled-obj',
              sortY: loot.y + 4,
              draw: (renderCtx) => {
                drawLootBox(renderCtx, loot, camX, camY);
              },
            });
          }

          // Add Monster Corpses to depth sorting (lying on ground under living creatures)
          for (const corpse of corpsesRef.current) {
            if (
              corpse.x + corpse.config.width < camX ||
              corpse.x > camX + worldViewW ||
              corpse.y + corpse.config.height < camY ||
              corpse.y > camY + worldViewH
            ) {
              continue;
            }

            depthObjects.push({
              type: 'tiled-obj',
              sortY: corpse.y + corpse.config.hitboxH - 6,
              draw: (renderCtx) => {
                const corpseFootCenterX = corpse.x + corpse.config.hitboxW / 2 - camX;
                const corpseFootBottomY = corpse.y + corpse.config.hitboxH - camY;

                // Faded shadow
                renderCtx.save();
                renderCtx.globalAlpha = corpse.alpha * 0.3;
                renderCtx.fillStyle = 'rgba(0, 0, 0, 0.4)';
                renderCtx.beginPath();
                renderCtx.ellipse(
                  corpseFootCenterX,
                  corpseFootBottomY - 1,
                  corpse.config.shadowRadiusX * 1.1,
                  corpse.config.shadowRadiusY * 0.8,
                  0, 0, Math.PI * 2
                );
                renderCtx.fill();
                renderCtx.restore();

                // Corpse Sprite
                const spriteKey = `${corpse.type}_1_${corpse.dir}`;
                const spr = cached.monsters[spriteKey] || cached.monsters[`${corpse.type}_1_3`];
                const drawX = corpse.x + corpse.config.hitboxW / 2 - corpse.config.visCenterX - camX;
                const drawY = corpse.y + corpse.config.hitboxH - corpse.config.feetY - camY;

                if (spr) {
                  renderCtx.save();
                  renderCtx.globalAlpha = corpse.alpha * 0.75;
                  renderCtx.drawImage(spr, drawX, drawY, corpse.config.width, corpse.config.height);
                  renderCtx.restore();
                }
              },
            });
          }

          // Add Monsters to depth sorting
          for (const mob of monstersRef.current) {
            const mobBaseY = mob.y + mob.config.hitboxH;

            if (
              mob.x + mob.config.width < camX ||
              mob.x > camX + worldViewW ||
              mob.y + mob.config.height < camY ||
              mob.y > camY + worldViewH
            ) {
              continue;
            }

            depthObjects.push({
              type: 'tiled-obj',
              sortY: mobBaseY,
              draw: (renderCtx) => {
                const mobFootCenterX = mob.x + mob.config.hitboxW / 2 - camX;
                const mobFootBottomY = mob.y + mob.config.hitboxH - camY;

                // Monster drop shadow
                renderCtx.save();
                renderCtx.fillStyle = 'rgba(0, 0, 0, 0.35)';
                renderCtx.beginPath();
                renderCtx.ellipse(
                  mobFootCenterX,
                  mobFootBottomY - 1,
                  mob.config.shadowRadiusX,
                  mob.config.shadowRadiusY,
                  0, 0, Math.PI * 2
                );
                renderCtx.fill();
                renderCtx.restore();

                // Monster sprite
                const spriteKey = `${mob.type}_${mob.frame}_${mob.dir}`;
                const spr = cached.monsters[spriteKey];

                const drawX = mob.x + mob.config.hitboxW / 2 - mob.config.visCenterX - camX;
                const drawY = mob.y + mob.config.hitboxH - mob.config.feetY - camY;

                if (spr) {
                  renderCtx.drawImage(spr, drawX, drawY, mob.config.width, mob.config.height);
                }

                // Name Tag & HP Bar
                renderCtx.save();
                const visualTopY = drawY + (mob.config.height - mob.config.visH);
                const textY = visualTopY - 4;
                renderCtx.font = 'bold 9px Tahoma, Verdana, sans-serif';
                renderCtx.textAlign = 'center';

                renderCtx.fillStyle = 'rgba(0, 0, 0, 0.9)';
                renderCtx.fillText(mob.config.name, mobFootCenterX + 1, textY + 1);
                // Name color by behavior
                const nameColor = mob.combat.behavior === 'aggressive' ? '#f87171'
                  : mob.combat.behavior === 'animal' ? '#86efac'
                  : '#fcd34d';
                renderCtx.fillStyle = nameColor;
                renderCtx.fillText(mob.config.name, mobFootCenterX, textY);

                const barW = Math.max(22, mob.config.visW * 0.7);
                const barH = 3;
                const barX = mobFootCenterX - barW / 2;
                const barY = textY - 9;

                const hpPct = mob.maxHp > 0 ? mob.hp / mob.maxHp : 0;
                const hpColor = hpPct > 0.6 ? '#22c55e' : hpPct > 0.3 ? '#f59e0b' : '#ef4444';

                renderCtx.fillStyle = '#000000';
                renderCtx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
                renderCtx.fillStyle = '#333';
                renderCtx.fillRect(barX, barY, barW, barH);
                renderCtx.fillStyle = hpColor;
                renderCtx.fillRect(barX, barY, barW * hpPct, barH);
                renderCtx.restore();
              },
            });
          }

          // Add Player to depth sorting
          const curCharId = propsRef.current.selectedCharacterId || 'mark';
          const curCharDef = PLAYABLE_CHARACTERS.find((c) => c.id === curCharId) || PLAYABLE_CHARACTERS[0];
          const playerFeetSortY = playerRef.current.y + HITBOX_H;

          depthObjects.push({
            type: 'player',
            sortY: playerFeetSortY,
            draw: (renderCtx) => {
              const px = playerRef.current.x;
              const py = playerRef.current.y;

              // Character shadow
              renderCtx.save();
              renderCtx.fillStyle = 'rgba(0, 0, 0, 0.35)';
              renderCtx.beginPath();
              const shadowCenterX = px + HITBOX_W / 2 - camX;
              const shadowCenterY = py + HITBOX_H - 1 - camY;
              renderCtx.ellipse(
                shadowCenterX,
                shadowCenterY,
                10,
                3.5,
                0,
                0,
                Math.PI * 2
              );
              renderCtx.fill();
              renderCtx.restore();

                // Player Shadow
                renderCtx.save();
                renderCtx.fillStyle = 'rgba(0, 0, 0, 0.40)';
                renderCtx.beginPath();
                renderCtx.ellipse(
                  px + HITBOX_W / 2 - camX,
                  py + HITBOX_H - 3 - camY,
                  10,
                  5,
                  0,
                  0,
                  Math.PI * 2
                );
                renderCtx.fill();
                renderCtx.restore();

                // Calculate Elastic Attack & Lunge Transform
                let attackOffsetX = 0;
                let attackOffsetY = 0;
                let attackScaleX = 1.0;
                let attackScaleY = 1.0;
                let attackRotate = 0;

                if (playerAttackAnimTimer > 0) {
                  const p = 1 - playerAttackAnimTimer / PLAYER_ATTACK_ANIM_DURATION;
                  const dir = animator.direction;
                  // Dynamic forward thrust impulse
                  const thrustDist = Math.sin(p * Math.PI) * 7;
                  // Squash & stretch elastic wave
                  const stretch = Math.sin(p * Math.PI) * 0.20 - Math.sin(p * Math.PI * 2) * 0.05;
                  const squash = Math.sin(p * Math.PI) * 0.14;

                  if (dir === 'right') {
                    attackOffsetX = thrustDist;
                    attackScaleX = 1 + stretch;
                    attackScaleY = 1 - squash;
                    attackRotate = Math.sin(p * Math.PI) * 0.07;
                  } else if (dir === 'left') {
                    attackOffsetX = -thrustDist;
                    attackScaleX = 1 + stretch;
                    attackScaleY = 1 - squash;
                    attackRotate = -Math.sin(p * Math.PI) * 0.07;
                  } else if (dir === 'up') {
                    attackOffsetY = -thrustDist;
                    attackScaleX = 1 - squash;
                    attackScaleY = 1 + stretch;
                  } else if (dir === 'down') {
                    attackOffsetY = thrustDist;
                    attackScaleX = 1 - squash;
                    attackScaleY = 1 + stretch;
                  }
                }

                // Base player anchor at feet
                const pFeetX = px + HITBOX_W / 2 - camX;
                const pFeetY = py + HITBOX_H - camY;

                renderCtx.save();
                renderCtx.translate(pFeetX + attackOffsetX, pFeetY + attackOffsetY);
                renderCtx.scale(attackScaleX, attackScaleY);
                if (attackRotate !== 0) {
                  renderCtx.rotate(attackRotate);
                }

                // Helper para desenhar as Asas Equipadas (Angelicais)
                const currentEquippedWings = propsRef.current.equippedWings ?? 'none';
                const isAngelic = currentEquippedWings === 'angelic';
                const wingsImg = isAngelic ? cached.items['wings_angelic'] : null;

                const currentDirection = (propsRef.current.overrideDirection || animator.direction) as Direction;
                const wingCfg = WINGS_ANGELIC_CONFIG[currentDirection] || WINGS_ANGELIC_CONFIG.down;

                const drawWings = () => {
                  if (!wingsImg || currentEquippedWings === 'none') return;

                  const cfg = wingCfg;

                  // Animação de bater asas (flap) e flutuação (bob)
                  const isPlayerMoving = animator.state === 'walk';
                  const flap = Math.sin(now * (isPlayerMoving ? 0.020 : 0.005)) * (isPlayerMoving ? 0.14 : 0.04);
                  const bob = isPlayerMoving ? Math.abs(Math.cos(now * 0.012)) * 2 : Math.sin(now * 0.004) * 1.5;

                  // Dimensões e coordenadas do spritesheet original
                  const sx = cfg.sx;
                  const sy = cfg.sy;
                  const sw = cfg.sw;
                  const sh = cfg.sh;

                  // Tamanho final na tela (aplicando escala e flap)
                  const wingDestW = cfg.baseW * cfg.scale * (1 + flap);
                  const wingDestH = cfg.baseH * cfg.scale;

                  // Posição relativa ao centro dos pés (0, 0)
                  const wingCenterX = cfg.offX;
                  const wingCenterY = -curCharDef.feetY + cfg.offY - bob + wingDestH / 2;

                  renderCtx.save();
                  renderCtx.translate(wingCenterX, wingCenterY);
                  if (cfg.rot) {
                    renderCtx.rotate((cfg.rot * Math.PI) / 180);
                  }

                  if (isAngelic) {
                    renderCtx.shadowColor = 'rgba(250, 204, 21, 0.75)';
                    renderCtx.shadowBlur = 8;
                  } else {
                    renderCtx.shadowColor = 'rgba(56, 189, 248, 0.65)';
                    renderCtx.shadowBlur = 6;
                  }

                  renderCtx.drawImage(
                    wingsImg,
                    sx,
                    sy,
                    sw,
                    sh,
                    -wingDestW / 2,
                    -wingDestH / 2,
                    wingDestW,
                    wingDestH
                  );
                  renderCtx.restore();
                };

                // Helper para desenhar Arma Equipada (Offsets do Tibia Sprite Offset Studio)
                const currentEquippedWeapon = propsRef.current.equippedWeapon ?? null;
                const weaponCfgRoot = propsRef.current.weaponOffsets || (currentEquippedWeapon ? ITEM_OFFSETS[currentEquippedWeapon] : null);
                const weaponDirCfg = weaponCfgRoot ? weaponCfgRoot.offsets[currentDirection] : null;
                const weaponImg = currentEquippedWeapon
                  ? (cached.items[currentEquippedWeapon] ||
                     (currentEquippedWeapon.includes('wood') ? cached.items['sword_wood'] || cached.items['wood_sword'] : null) ||
                     (currentEquippedWeapon.includes('light') || currentEquippedWeapon.includes('radiant') ? cached.items['sword_light'] || cached.items['radiant_sword'] : null) ||
                     cached.items['sword_gold'] || cached.items['gold_sword'])
                  : null;

                // Estado de calibração ativa (desliga oscilações de caminhada para precisão estática)
                const isCalibratorActive = Boolean(propsRef.current.overrideDirection);

                // 1. Animação de Balanço ao Caminhar (Walk Sway & Step Bobbing)
                let walkRot = 0;
                let walkOffX = 0;
                let walkOffY = 0;

                if (swordWalkWeight > 0.005 && !isCalibratorActive) {
                  // Ângulo de fase do ciclo de 4 passos com cadência suave (0.88s por ciclo completo)
                  // Frame 1 (0.00s): sway = 0 (posição neutra de repouso)
                  // Frame 2 (0.22s): sway = +1 (Passo A: braço estende suavemente)
                  // Frame 1 (0.44s): sway = 0 (passagem neutra central)
                  // Frame 3 (0.66s): sway = -1 (Passo B: braço recua suavemente)
                  const FULL_WALK_CYCLE = 4 * 0.22;
                  const cycleProgress = (swordWalkTimer / FULL_WALK_CYCLE) * Math.PI * 2;
                  const sway = Math.sin(cycleProgress) * swordWalkWeight;
                  const stepBob = (1 - Math.cos(cycleProgress * 2)) * 0.35 * swordWalkWeight;

                  if (currentDirection === 'down') {
                    // No Frame 2 (sway > 0), a mão direita oscila suavemente para fora/esquerda (-X)
                    // No Frame 3 (sway < 0), a mão direita oscila para dentro/direita (+X)
                    walkOffX = -sway * 1.5;
                    walkOffY = -sway * 0.4 + stepBob;
                    walkRot = -sway * 6.5;
                  } else if (currentDirection === 'right') {
                    // No Frame 2 (sway > 0), o braço frontal recua suavemente (-X, -Y)
                    // No Frame 3 (sway < 0), o braço frontal avança suavemente (+X, +Y)
                    walkOffX = -sway * 1.4;
                    walkOffY = -sway * 0.7 + stepBob;
                    walkRot = -sway * 7.5;
                  } else if (currentDirection === 'left') {
                    // No Frame 2 (sway > 0), o braço frontal avança suavemente para a frente/esquerda (-X)
                    // No Frame 3 (sway < 0), o braço frontal recua suavemente para trás/direita (+X)
                    walkOffX = -sway * 1.4;
                    walkOffY = sway * 0.7 + stepBob;
                    walkRot = -sway * 7.5;
                  } else if (currentDirection === 'up') {
                    // Nas costas: balanço sutil do tronco acompanhando os passos
                    walkOffX = sway * 1.0;
                    walkOffY = -sway * 0.4 + stepBob;
                    walkRot = sway * 4.5;
                  }
                } else if (!isCalibratorActive && playerMeleeAttackAnimTimer <= 0) {
                  // Respiração calma e suave / Idle micro-sway
                  const idleCycle = now * 0.0018;
                  walkRot = Math.sin(idleCycle) * 1.0;
                  walkOffY = Math.sin(idleCycle) * 0.35;
                }

                // 2. Animação de Golpe / Ataque com a Espada (Sword Slash Attack):
                // Aciona APENAS no ataque físico com arma equipada (magias não cortam com a espada)
                let attackRot = 0;
                let attackOffX = 0;
                let attackOffY = 0;
                let attackGlow = false;
                let attackScaleBoost = 1.0;

                const isMeleeAttacking = playerMeleeAttackAnimTimer > 0 && Boolean(currentEquippedWeapon);

                if (isMeleeAttacking) {
                  // Progresso normalizado de 0.0 (início) a 1.0 (fim do golpe)
                  const t = Math.min(1, Math.max(0, 1 - playerMeleeAttackAnimTimer / PLAYER_ATTACK_ANIM_DURATION));

                  let slashProgress: number;
                  let thrustProgress: number;

                  if (t < 0.22) {
                    // Fase 1: Preparação / Puxada para trás (wind-up)
                    const p = t / 0.22;
                    const ease = Math.sin(p * Math.PI * 0.5);
                    slashProgress = -0.32 * ease;
                    thrustProgress = -0.22 * ease;
                  } else if (t < 0.62) {
                    // Fase 2: Corte veloz em arco explosivo
                    const p = (t - 0.22) / 0.40;
                    // Cubic ease-out para aceleração extrema
                    const ease = 1 - Math.pow(1 - p, 3);
                    slashProgress = -0.32 + 1.32 * ease; // varre de -0.32 até +1.0
                    thrustProgress = Math.sin(p * Math.PI) * 1.0;
                    attackGlow = true;
                    attackScaleBoost = 1.0 + Math.sin(p * Math.PI) * 0.12;
                  } else {
                    // Fase 3: Retorno elástico suave à postura neutra
                    const p = (t - 0.62) / 0.38;
                    const ease = Math.sin(p * Math.PI * 0.5);
                    slashProgress = 1.0 * (1 - ease);
                    thrustProgress = (1 - ease) * 0.12;
                  }

                  // Trajetória do corte e avanço por direção
                  if (currentDirection === 'right') {
                    attackRot = slashProgress * 82;
                    attackOffX = thrustProgress * 13;
                    attackOffY = thrustProgress * 4;
                  } else if (currentDirection === 'left') {
                    attackRot = -slashProgress * 82;
                    attackOffX = -thrustProgress * 13;
                    attackOffY = thrustProgress * 4;
                  } else if (currentDirection === 'down') {
                    attackRot = slashProgress * 88;
                    attackOffX = Math.sin(t * Math.PI) * 6;
                    attackOffY = thrustProgress * 14;
                  } else if (currentDirection === 'up') {
                    attackRot = -slashProgress * 70;
                    attackOffX = -Math.sin(t * Math.PI) * 4;
                    attackOffY = -thrustProgress * 13;
                  }
                }

                // Camada dinâmica de profundidade:
                // Durante o golpe para baixo ou esquerda, a lâmina corta à frente do corpo do personagem
                let effectiveWeaponLayer = weaponDirCfg?.layer ?? 'in_front';
                if (isMeleeAttacking && (currentDirection === 'down' || currentDirection === 'left')) {
                  effectiveWeaponLayer = 'in_front';
                }

                const drawWeapon = () => {
                  if (!weaponImg || !weaponDirCfg || !weaponDirCfg.visible) return;

                  const resolution = weaponCfgRoot?.metadata?.resolution ?? 32;
                  // Comprimento da lâmina com escala aplicada
                  const swordLen = resolution * weaponDirCfg.scale;
                  const swordW = swordLen * (weaponImg.naturalWidth / weaponImg.naturalHeight);

                  // Ponto de pegada (grip / hilt) da espada: 50% largura, 85% altura (onde a mão segura)
                  const pivotX = swordW * 0.5;
                  const pivotY = swordLen * 0.85;

                  // Centro da caixa 32x32 do personagem na cena
                  const charBoxCenterX = -curCharDef.visCenterX + curCharDef.width / 2;
                  const charBoxCenterY = -curCharDef.feetY + curCharDef.height / 2;

                  // Posição base do punho (hilt) conforme o offset cartesiano (Y positivo é para cima)
                  const baseHiltX = charBoxCenterX + weaponDirCfg.x;
                  const baseHiltY = charBoxCenterY - weaponDirCfg.y;

                  // Aplica transformações dinâmicas de caminhada ou golpe
                  const finalHiltX = baseHiltX + (isMeleeAttacking ? attackOffX : walkOffX);
                  const finalHiltY = baseHiltY + (isMeleeAttacking ? attackOffY : walkOffY);
                  const finalRotation = weaponDirCfg.rotation + (isMeleeAttacking ? attackRot : walkRot);

                  renderCtx.save();
                  renderCtx.translate(finalHiltX, finalHiltY);
                  if (finalRotation) {
                    renderCtx.rotate((finalRotation * Math.PI) / 180);
                  }
                  if (weaponDirCfg.flipX) {
                    renderCtx.scale(-1, 1);
                  }
                  if (weaponDirCfg.flipY) {
                    renderCtx.scale(1, -1);
                  }
                  if (attackScaleBoost !== 1.0) {
                    renderCtx.scale(attackScaleBoost, attackScaleBoost);
                  }

                  if (weaponDirCfg.opacity !== undefined) {
                    renderCtx.globalAlpha = Math.max(0, Math.min(1, weaponDirCfg.opacity / 100));
                  }

                  // Efeito luminoso de corte e brilho no impacto
                  const isWoodWeapon = currentEquippedWeapon?.includes('wood');
                  const isRadiantWeapon = currentEquippedWeapon?.includes('light') || currentEquippedWeapon?.includes('radiant');

                  if (isRadiantWeapon) {
                    // White neon glow around the radiant blade
                    renderCtx.shadowColor = '#ffffff';
                    renderCtx.shadowBlur = attackGlow ? 18 : 10;
                  } else if (attackGlow) {
                    renderCtx.shadowColor = isWoodWeapon ? 'rgba(251, 191, 36, 0.95)' : 'rgba(255, 235, 120, 0.95)';
                    renderCtx.shadowBlur = 14;
                  } else {
                    renderCtx.shadowColor = isWoodWeapon ? 'rgba(180, 110, 50, 0.40)' : 'rgba(250, 204, 21, 0.45)';
                    renderCtx.shadowBlur = 4;
                  }

                  // Camada de aura branca neon translúcida ao redor da lâmina radiante
                  if (isRadiantWeapon) {
                    renderCtx.save();
                    renderCtx.shadowColor = '#ffffff';
                    renderCtx.shadowBlur = attackGlow ? 22 : 14;
                    renderCtx.drawImage(
                      weaponImg,
                      -pivotX,
                      -pivotY,
                      swordW,
                      swordLen
                    );
                    renderCtx.restore();
                  }

                  renderCtx.drawImage(
                    weaponImg,
                    -pivotX,
                    -pivotY,
                    swordW,
                    swordLen
                  );

                  // Segunda passada aditiva de iluminação durante o golpe ou brilho radiante constante
                  if (attackGlow || isRadiantWeapon) {
                    renderCtx.save();
                    renderCtx.globalCompositeOperation = 'lighter';
                    renderCtx.globalAlpha = isRadiantWeapon ? (attackGlow ? 0.75 : 0.35) : 0.55;
                    renderCtx.drawImage(
                      weaponImg,
                      -pivotX,
                      -pivotY,
                      swordW,
                      swordLen
                    );
                    renderCtx.restore();
                  }

                  renderCtx.restore();
                };

                // PROFUNDIDADE: Se behind for TRUE -> Desenha a asa ATRÁS do corpo do personagem
                if (wingCfg.behind && currentEquippedWings !== 'none') {
                  drawWings();
                }

                // PROFUNDIDADE: Se layer for 'behind' -> Desenha a arma ATRÁS do corpo do personagem
                if (weaponDirCfg && effectiveWeaponLayer === 'behind') {
                  drawWeapon();
                }

                // Render Character Sprite
                if (curCharDef.type === 'sheet') {
                  // Mark spritesheet
                  const currentAnim = animator.state;
                  const sprKey =
                    currentAnim === 'attack'
                      ? 'mark_attack'
                      : currentAnim === 'dead'
                      ? 'mark_dead'
                      : 'mark_walk';
                  const sprImage = cached.characters[sprKey];

                  if (sprImage) {
                    const { col, row } = animator.getFrameCoords();
                    const sx = col * FRAME_SIZE;
                    const sy = row * FRAME_SIZE;

                    renderCtx.drawImage(
                      sprImage,
                      sx,
                      sy,
                      FRAME_SIZE,
                      FRAME_SIZE,
                      -curCharDef.width / 2,
                      -curCharDef.height,
                      curCharDef.width,
                      curCharDef.height
                    );
                  }
                } else {
                  // OTServ individual PNGs (archer, barbarian, magician, necromancer, paladin)
                  const dirNum = dirToOtsNum(currentDirection);
                  // During attack, use dynamic fighting stance step (frame 2)
                  const displayFrame = playerAttackAnimTimer > 0 ? 2 : otsWalkFrame;
                  const spriteKey = `${curCharDef.id}_${displayFrame}_${dirNum}`;
                  const sprImage = cached.characters[spriteKey];

                  if (sprImage) {
                    renderCtx.drawImage(
                      sprImage,
                      -curCharDef.visCenterX,
                      -curCharDef.feetY,
                      curCharDef.width,
                      curCharDef.height
                    );
                  }
                }

                // PROFUNDIDADE: Se layer for 'in_front' -> Desenha a arma NA FRENTE do corpo do personagem
                if (weaponDirCfg && effectiveWeaponLayer === 'in_front') {
                  drawWeapon();
                }

                // PROFUNDIDADE: Se behind for FALSE -> Desenha a asa NA FRENTE do corpo do personagem
                if (!wingCfg.behind && currentEquippedWings !== 'none') {
                  drawWings();
                }

                renderCtx.restore();

                // Player Name tag (drawn above character, unaffected by squash/stretch)
                renderCtx.save();
                const pNameX = px + HITBOX_W / 2 - camX + attackOffsetX * 0.5;
                const pNameY = py + HITBOX_H - curCharDef.height - 4 - camY + attackOffsetY * 0.5;
                renderCtx.font = 'bold 9px Tahoma, Verdana, sans-serif';
                renderCtx.textAlign = 'center';
                renderCtx.fillStyle = 'rgba(0, 0, 0, 0.9)';
                renderCtx.fillText(curCharDef.name, pNameX + 1, pNameY + 1);
                renderCtx.fillStyle = '#38bdf8';
                renderCtx.fillText(curCharDef.name, pNameX, pNameY);
                renderCtx.restore();
            },
          });

          // Add Active Spells to depth sorting
          for (const spell of activeSpellsRef.current) {
            const { ay } = spell.getAnchor();
            const groundSortY = spell.y + spell.def.renderH * (1 - ay);

            depthObjects.push({
              type: 'tiled-obj',
              sortY: groundSortY,
              draw: (renderCtx) => {
                const imgKey = spell.getCurrentImageKey();
                const sprImg = cached.magic[imgKey];
                if (!sprImg) return;

                const { ax } = spell.getAnchor();
                const screenX = spell.x - camX;
                const screenY = spell.y - camY;
                const shouldFlipX = Boolean(spell.def.flipOnRight && spell.dir === 'right');

                renderCtx.save();
                renderCtx.translate(screenX, screenY);
                if (shouldFlipX) {
                  renderCtx.scale(-1, 1);
                }

                const localDrawX = -spell.def.renderW * ax;
                const localDrawY = -spell.def.renderH * ay;

                if (spell.def.animType === 'custom_frames' && spell.def.customFrames) {
                  const frameIdx = Math.min(spell.frame, spell.def.customFrames.length - 1);
                  const f = spell.def.customFrames[frameIdx];
                  renderCtx.drawImage(
                    sprImg,
                    f.sx,
                    f.sy,
                    f.sw,
                    f.sh,
                    localDrawX,
                    localDrawY,
                    spell.def.renderW,
                    spell.def.renderH
                  );
                } else if (spell.def.animType === 'directional_projectile' || spell.def.animType === 'sheet') {
                  const { col, row } = spell.getFrameCoords();
                  const frameW = spell.def.frameW || 128;
                  const frameH = spell.def.frameH || 128;
                  const sx = col * frameW;
                  const sy = row * frameH;

                  renderCtx.drawImage(
                    sprImg,
                    sx,
                    sy,
                    frameW,
                    frameH,
                    localDrawX,
                    localDrawY,
                    spell.def.renderW,
                    spell.def.renderH
                  );
                } else {
                  // Sequence animation frame
                  renderCtx.drawImage(
                    sprImg,
                    0,
                    0,
                    sprImg.naturalWidth,
                    sprImg.naturalHeight,
                    localDrawX,
                    localDrawY,
                    spell.def.renderW,
                    spell.def.renderH
                  );
                }

                renderCtx.restore();
              },
            });
          }

          // Sort depth objects from top to bottom
          depthObjects.sort((a, b) => a.sortY - b.sortY);

          for (const obj of depthObjects) {
            obj.draw(ctx);
          }

          // ── Floating Numbers (damage / XP) ─────────────────────────────
          ctx.save();
          for (const fn of floatingNumbersRef.current) {
            const fnX = fn.x - camX;
            const fnY = fn.y - camY;
            ctx.globalAlpha = fn.alpha;
            ctx.font = 'bold 11px Tahoma, Verdana, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(0,0,0,0.7)';
            ctx.fillText(fn.text, fnX + 1, fnY + 1);
            ctx.fillStyle = fn.color;
            ctx.fillText(fn.text, fnX, fnY);
          }
          ctx.globalAlpha = 1;
          ctx.restore();

          // ── Sword Slash Effects (slice.png animation) ────────────────────
          const sliceImg = cached.magic['slice'];
          ctx.save();
          for (const slash of slashEffectsRef.current) {
            const sx = slash.x - camX;
            const sy = slash.y - camY;
            const progress = Math.min(1, Math.max(0, slash.timer / slash.duration));
            const frameIdx = Math.min(5, Math.floor(progress * 6));

            if (sliceImg) {
              const srcX = frameIdx * 64;
              const renderSize = 64;

              ctx.save();
              ctx.translate(sx, sy);

              if (slash.dir === 'right') {
                ctx.rotate(0);
              } else if (slash.dir === 'left') {
                ctx.scale(-1, 1);
              } else if (slash.dir === 'up') {
                ctx.rotate(-Math.PI / 2);
              } else if (slash.dir === 'down') {
                ctx.rotate(Math.PI / 2);
              }

              ctx.drawImage(
                sliceImg,
                srcX,
                0,
                64,
                64,
                -renderSize / 2,
                -renderSize / 2,
                renderSize,
                renderSize
              );

              // Subtle luminous blade glow
              ctx.globalAlpha = Math.max(0, 0.35 * (1 - progress));
              ctx.drawImage(
                sliceImg,
                srcX,
                0,
                64,
                64,
                -renderSize / 2,
                -renderSize / 2,
                renderSize,
                renderSize
              );

              ctx.restore();
            } else {
              ctx.strokeStyle = `rgba(255, 255, 255, ${1 - progress})`;
              ctx.fillStyle = `rgba(56, 189, 248, ${0.45 * (1 - progress)})`;
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.arc(sx, sy, 14 + progress * 10, 0, Math.PI * 2);
              ctx.stroke();
              ctx.fill();
            }
          }
          ctx.restore();

          // ── Tibia Target Lock Indicator ──────────────────────────────────
          if (selectedTargetIdRef.current) {
            const targetMob = monstersRef.current.find(
              (m) => m.id === selectedTargetIdRef.current && !m.isDead
            );
            if (targetMob) {
              const tX = targetMob.x + targetMob.config.hitboxW / 2 - camX;
              const tY = targetMob.y + targetMob.config.hitboxH / 2 - camY;
              const tW = targetMob.config.visW + 12;
              const tH = targetMob.config.visH + 12;
              const corner = 7;

              ctx.save();
              ctx.strokeStyle = '#ef4444';
              ctx.lineWidth = 2;

              // Top-Left corner
              ctx.beginPath();
              ctx.moveTo(tX - tW / 2, tY - tH / 2 + corner);
              ctx.lineTo(tX - tW / 2, tY - tH / 2);
              ctx.lineTo(tX - tW / 2 + corner, tY - tH / 2);
              ctx.stroke();

              // Top-Right corner
              ctx.beginPath();
              ctx.moveTo(tX + tW / 2 - corner, tY - tH / 2);
              ctx.lineTo(tX + tW / 2, tY - tH / 2);
              ctx.lineTo(tX + tW / 2, tY - tH / 2 + corner);
              ctx.stroke();

              // Bottom-Left corner
              ctx.beginPath();
              ctx.moveTo(tX - tW / 2, tY + tH / 2 - corner);
              ctx.lineTo(tX - tW / 2, tY + tH / 2);
              ctx.lineTo(tX - tW / 2 + corner, tY + tH / 2);
              ctx.stroke();

              // Bottom-Right corner
              ctx.beginPath();
              ctx.moveTo(tX + tW / 2 - corner, tY + tH / 2);
              ctx.lineTo(tX + tW / 2, tY + tH / 2);
              ctx.lineTo(tX + tW / 2, tY + tH / 2 - corner);
              ctx.stroke();

              ctx.restore();
            } else {
              selectedTargetIdRef.current = null;
            }
          }

          // 3. Ambient Floating Particles (Fireflies / Dungeon Dust)
          if (propsRef.current.enableParticles) {
            particleSystemRef.current.draw(ctx);
          }

          // 4. Cave Darkness & Torchlight (Centered directly on the player in screen coords)
          if (mapId.startsWith('caverna')) {
            ctx.save();

            const pScreenX = playerRef.current.x + HITBOX_W / 2 - camX;
            const pScreenY = playerRef.current.y + HITBOX_H / 2 - camY;

            // Subtle atmospheric torch flicker
            const flicker = Math.sin(now * 0.007) * 3 + Math.cos(now * 0.013) * 2;
            const darkOuterRadius = Math.max(120, 175 + flicker);

            // Ambient darkness mask covering entire viewport
            const darkGrad = ctx.createRadialGradient(
              pScreenX,
              pScreenY,
              30,
              pScreenX,
              pScreenY,
              darkOuterRadius
            );
            darkGrad.addColorStop(0, 'rgba(0, 0, 0, 0.0)');
            darkGrad.addColorStop(0.35, 'rgba(2, 3, 6, 0.45)');
            darkGrad.addColorStop(0.70, 'rgba(1, 2, 4, 0.85)');
            darkGrad.addColorStop(1, 'rgba(0, 0, 0, 0.98)');

            ctx.fillStyle = darkGrad;
            ctx.fillRect(0, 0, worldViewW, worldViewH);

            // Warm torchlight glow around player
            const torchGrad = ctx.createRadialGradient(
              pScreenX,
              pScreenY,
              0,
              pScreenX,
              pScreenY,
              100 + flicker * 0.5
            );
            torchGrad.addColorStop(0, 'rgba(255, 185, 75, 0.16)');
            torchGrad.addColorStop(0.5, 'rgba(255, 130, 35, 0.06)');
            torchGrad.addColorStop(1, 'rgba(255, 100, 10, 0)');

            ctx.fillStyle = torchGrad;
            ctx.fillRect(0, 0, worldViewW, worldViewH);

            ctx.restore();
          }

          // 5. Post-processing Filters (Vignette, Tone-mapping, CRT scanlines)
          applyPostProcessing(
            ctx,
            propsRef.current.graphicStyle || 'modern-hd',
            worldViewW,
            worldViewH,
            mapId.startsWith('caverna')
          );

          // 6. Smooth Fade-in Transition Overlay
          if (fadeAlpha > 0) {
            fadeAlpha = Math.max(0, fadeAlpha - dt * 5.0); // Fades in ~200ms
            ctx.save();
            ctx.fillStyle = `rgba(0, 0, 0, ${fadeAlpha})`;
            ctx.fillRect(0, 0, worldViewW, worldViewH);
            ctx.restore();
          }

          // 7. Debug colliders overlay
          if (propsRef.current.debugColliders) {
            drawDebugColliders(ctx, colliders, camX, camY);

            // Draw player hitbox in bright green
            ctx.save();
            ctx.strokeStyle = '#22c55e';
            ctx.fillStyle = 'rgba(34, 197, 94, 0.4)';
            const phX = playerRef.current.x - camX;
            const phY = playerRef.current.y - camY;
            ctx.fillRect(phX, phY, HITBOX_W, HITBOX_H);
            ctx.strokeRect(phX, phY, HITBOX_W, HITBOX_H);

            // Draw portal trigger zones in cyan
            ctx.strokeStyle = '#06b6d4';
            ctx.fillStyle = 'rgba(6, 182, 212, 0.3)';
            for (const portal of mapPortals) {
              ctx.beginPath();
              ctx.arc(
                portal.worldX - camX,
                portal.worldY - camY,
                portal.radius,
                0,
                Math.PI * 2
              );
              ctx.fill();
              ctx.stroke();
            }

            // Draw monster hitboxes in orange
            ctx.strokeStyle = '#f59e0b';
            ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
            for (const mob of monstersRef.current) {
              const mx = mob.x - camX;
              const my = mob.y - camY;
              ctx.fillRect(mx, my, mob.config.hitboxW, mob.config.hitboxH);
              ctx.strokeRect(mx, my, mob.config.hitboxW, mob.config.hitboxH);
            }
            ctx.restore();
          }

          ctx.restore();

          animFrameId = requestAnimationFrame(loop);
        };

        animFrameId = requestAnimationFrame(loop);

        return () => {
          cancelAnimationFrame(animFrameId);
          window.removeEventListener('keydown', handleKeyDown);
          window.removeEventListener('keyup', handleKeyUp);
          window.removeEventListener('cast-magic-spell', handleCustomSpellCast);
          window.removeEventListener('player-attack', handleCustomPlayerAttack);
        };
      } catch (e) {
        if (!isCancelled) {
          setLoadError(String(e));
        }
      }
    }

    let cleanupFn: (() => void) | undefined;
    init().then((fn) => {
      cleanupFn = fn;
    });

    return () => {
      isCancelled = true;
      cleanupFn?.();
      cancelAnimationFrame(animFrameId);
    };
  }, [mapId, mapData, initialSpawn]);

  // Handle clicking or tapping directly on the canvas (Portal interaction or Tap-to-Move)
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickScreenX = e.clientX - rect.left;
    const clickScreenY = e.clientY - rect.top;

    const dpr = window.devicePixelRatio || 1;
    const displayH = Math.round(rect.height * dpr);
    const zoom = getResponsiveCameraZoom();
    const scale = (displayH / BASE_WORLD_H) * zoom;

    const clickWorldX = cameraRef.current.x + clickScreenX * (dpr / scale);
    const clickWorldY = cameraRef.current.y + clickScreenY * (dpr / scale);

    // 1. Check if clicking on a living monster to target it (Tibia Target Lock)
    for (const mob of monstersRef.current) {
      if (mob.isDead) continue;
      const mobCenterX = mob.x + mob.config.hitboxW / 2;
      const mobCenterY = mob.y + mob.config.hitboxH / 2;
      if (Math.hypot(clickWorldX - mobCenterX, clickWorldY - mobCenterY) < 32) {
        const distToPlayer = Math.hypot(
          (playerRef.current.x + HITBOX_W / 2) - mobCenterX,
          (playerRef.current.y + HITBOX_H / 2) - mobCenterY
        );
        if (distToPlayer > ACTION_DISTANCE) {
          floatingNumbersRef.current.push({
            id: `toofar_${Date.now()}`,
            x: mobCenterX,
            y: mob.y - 12,
            text: 'Muito longe!',
            color: '#f59e0b',
            alpha: 1,
            vy: -24,
            timer: 0,
            duration: 1.2,
          });
          return;
        }
        selectedTargetIdRef.current = selectedTargetIdRef.current === mob.id ? null : mob.id;
        tapTargetRef.current = null;
        return;
      }
    }

    // 2. Check if clicking on a coin drop to walk towards it
    for (const coin of coinDropsRef.current) {
      if (coin.collected) continue;
      if (Math.hypot(clickWorldX - coin.x, clickWorldY - coin.y) < 22) {
        tapTargetRef.current = {
          x: coin.x - HITBOX_W / 2,
          y: coin.y - HITBOX_H / 2,
          anim: 0,
        };
        return;
      }
    }

    // 3. Check if clicking on a loot box to walk towards it
    for (const loot of lootBoxesRef.current) {
      if (loot.collected) continue;
      if (Math.hypot(clickWorldX - loot.x, clickWorldY - loot.y) < 26) {
        tapTargetRef.current = {
          x: loot.x - HITBOX_W / 2,
          y: loot.y - HITBOX_H / 2,
          anim: 0,
        };
        return;
      }
    }

    const mapPortals = getMapPortals(mapId, mapData);
    let enteredPortal = false;

    for (const portal of mapPortals) {
      const distClick = Math.hypot(clickWorldX - portal.worldX, clickWorldY - portal.worldY);
      const distPlayer = Math.hypot(playerRef.current.x - portal.worldX, playerRef.current.y - portal.worldY);

      // Only enter if clicked on the hole and player is within reasonable reach (<= 75px)
      if (distClick < portal.radius + 24 && distPlayer < 75) {
        propsRef.current.onZoneTransition?.(
          portal.targetMapId,
          portal.targetSpawnX,
          portal.targetSpawnY
        );
        enteredPortal = true;
        break;
      }
    }

    // If not clicking a portal, set Tap-to-Move destination
    if (!enteredPortal) {
      tapTargetRef.current = {
        x: clickWorldX - HITBOX_W / 2,
        y: clickWorldY - HITBOX_H / 2,
        anim: 0,
      };
    }
  };

  const handlePortalButtonClick = () => {
    if (activeNearbyPortal) {
      propsRef.current.onZoneTransition?.(
        activeNearbyPortal.targetMapId,
        activeNearbyPortal.targetSpawnX,
        activeNearbyPortal.targetSpawnY
      );
    }
  };

  if (loadError) {
    return (
      <div className="canvas-error">
        <p>Erro carregando assets:</p>
        <code>{loadError}</code>
      </div>
    );
  }

  return (
    <div className="canvas-container" tabIndex={0}>
      {/* Interactive Portal Action Button (Click to Enter/Exit) */}
      {activeNearbyPortal && (
        <div className="portal-action-container">
          <button className="btn-portal-action" onClick={handlePortalButtonClick}>
            <span className="portal-btn-icon">🕳️</span>
            <span className="portal-btn-title">{activeNearbyPortal.promptText}</span>
            <span className="portal-btn-hint">[ Pressione E ou Clique ]</span>
          </button>
        </div>
      )}

      <canvas
        ref={canvasRef}
        className="game-canvas"
        onClick={handleCanvasClick}
      />

      {/* Unarmed Pound Attack SVG Animation Layer */}
      <div className="pound-overlay-layer">
        <div ref={poundWorldContainerRef} className="pound-world-container" />
      </div>

      {/* Mobile Virtual Joystick & Touch Action Controls */}
      <VirtualJoystick
        onMove={(vx, vy) => {
          touchVectorRef.current = { vx, vy };
          tapTargetRef.current = null;
        }}
        onEnd={() => {
          touchVectorRef.current = { vx: 0, vy: 0 };
        }}
        onAttack={() => {
          triggerAttackRef.current();
        }}
        onEnterPortal={handlePortalButtonClick}
        hasPortalNearby={Boolean(activeNearbyPortal)}
        onOpenInventory={onOpenInventory}
      />
    </div>
  );
}
