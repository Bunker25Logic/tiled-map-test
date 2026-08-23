import { useEffect, useRef, useState } from 'react';
import type { TiledMap, Direction, Rect } from './game/types';
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
} from './game/entities';
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

// ─── CONFIGURAÇÃO DAS ASAS TROVÃO (Ajuste Direto de Posição e Escala) ───────
// Idêntico ao padrão do projeto survive-rpg-bunker:
// - offX: deslocamento horizontal (+ = direita, - = esquerda)
// - offY: deslocamento vertical (+ = desce, - = sobe nas costas)
// - baseW / baseH: tamanho base da asa em pixels
// - scale: multiplicador geral de tamanho (1.0 = normal, 1.2 = maior)
// - frame: índice do spritesheet (0: Direita, 1: Esquerda, 2: Frente/Baixo, 3: Costas/Cima)
const WINGS_THUNDER_CONFIG: Record<Direction, {
  frame: number;
  offX: number;
  offY: number;
  baseW: number;
  baseH: number;
  scale: number;
  behind: boolean;
}> = {
  // 1. Olhando para Frente (Baixo)
  down:  { frame: 2, offX: 3,  offY: -10, baseW: 66, baseH: 38, scale: 1.0, behind: true },

  // 2. Olhando para Cima (Costas)
  up:    { frame: 3, offX: -1,  offY: -8, baseW: 56, baseH: 58, scale: 1.0, behind: false },

  // 3. Olhando para a Esquerda
  left:  { frame: 1, offX: 15,  offY: -14, baseW: 46, baseH: 48, scale: 1.0, behind: true },

  // 4. Olhando para a Direita
  right: { frame: 0, offX: -23, offY: -16, baseW: 46, baseH: 48, scale: 1.0, behind: true },
};

/**
 * Automatically computes responsive camera distance / zoom:
 * - Mobile / Touch devices / Narrow screens (<=768px or tablet touch): 1.5x zoom
 * - Desktop / PC: 1.0x (Tibia Standard 1.0)
 */
export function getResponsiveCameraZoom(): number {
  if (typeof window === 'undefined') return 1.0;
  const isMobile =
    window.innerWidth <= 768 ||
    ('ontouchstart' in window && window.innerWidth <= 1024) ||
    (navigator.maxTouchPoints > 0 && window.innerWidth <= 1024);
  return isMobile ? 1.5 : 1.0;
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
  hasWings?: boolean;
  onPlayerPosChange?: (x: number, y: number, tileX: number, tileY: number) => void;
  onZoneTransition?: (targetMapId: string, spawnX: number, spawnY: number) => void;
  onRequestSpellCast?: (callback: (spellId: string) => void) => void;
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
  hasWings = true,
  onPlayerPosChange,
  onZoneTransition,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [assetsLoaded, setAssetsLoaded] = useState(false);
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

  // Persistent monsters and active spells
  const monstersRef = useRef<Monster[]>([]);
  const activeSpellsRef = useRef<ActiveSpell[]>([]);

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
    hasWings,
    onPlayerPosChange,
    onZoneTransition,
  });

  useEffect(() => {
    propsRef.current.mapId = mapId;
    propsRef.current.selectedCharacterId = selectedCharacterId;
    propsRef.current.graphicStyle = graphicStyle;
    propsRef.current.enableParticles = enableParticles;
    propsRef.current.debugColliders = debugColliders;
    propsRef.current.showGrid = showGrid;
    propsRef.current.hasWings = hasWings;
    propsRef.current.onPlayerPosChange = onPlayerPosChange;
    propsRef.current.onZoneTransition = onZoneTransition;
  }, [mapId, selectedCharacterId, graphicStyle, enableParticles, debugColliders, showGrid, hasWings, onPlayerPosChange, onZoneTransition]);

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

        // 4. Initialize monsters for this specific zone (procedural map-wide spawner)
        monstersRef.current = createMapMonsters(mapId, mapData, colliders);

        setAssetsLoaded(true);
        isTransitioningRef.current = false;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const animator = new SpriteAnimator();
        animator.setState('idle', 'down');

        triggerAttackRef.current = () => {
          animator.triggerAttack();
        };

        // Function to cast a spell perfectly centered from player
        const castSpell = (spellDef: SpellDef) => {
          animator.triggerAttack();

          const dir = animator.direction;
          const px = playerRef.current.x;
          const py = playerRef.current.y;

          // Player positions: feet level vs torso level
          const pTorsoX = px + HITBOX_W / 2;
          const pTorsoY = py + HITBOX_H - 18;
          const pFeetY = py + HITBOX_H;

          let spawnX = pTorsoX;
          let spawnY = spellDef.spawnOrigin === 'ground' ? pFeetY : pTorsoY;
          let vx = 0;
          let vy = 0;

          const speed = spellDef.projectileSpeed || 0;

          if (speed > 0) {
            if (dir === 'up') vy = -speed;
            else if (dir === 'down') vy = speed;
            else if (dir === 'left') vx = -speed;
            else if (dir === 'right') vx = speed;
          }

          if (!spellDef.attachToCaster) {
            const offset = spellDef.spawnOffsetDist || 0;
            if (dir === 'up') spawnY -= offset;
            else if (dir === 'down') spawnY += offset;
            else if (dir === 'left') spawnX -= offset;
            else if (dir === 'right') spawnX += offset;
          }

          const spell = new ActiveSpell(
            `spell_${Date.now()}_${Math.random()}`,
            spellDef,
            spawnX,
            spawnY,
            dir,
            vx,
            vy
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
            animator.triggerAttack();
          }

          // Number keys 1..9, 0 for Spells
          const spellByKey = ALL_SPELLS.find((s) => s.key === key);
          if (spellByKey) {
            e.preventDefault();
            castSpell(spellByKey);
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

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('cast-magic-spell', handleCustomSpellCast);

        // 5. Portals in this zone
        const mapPortals: PortalDef[] = getMapPortals(mapId, mapData);

        // 6. Main 60 FPS Game Loop
        let lastTime = performance.now();
        let lastPosReportTime = 0;
        let otsWalkTimer = 0;
        let otsWalkFrame = 1;
        let fadeAlpha = 1.0; // Smooth fade-in on map spawn

        const loop = (now: number) => {
          const dt = Math.min((now - lastTime) / 1000, 0.05);
          lastTime = now;

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

          // OTServ Player step animation cycling
          if (isMoving) {
            otsWalkTimer += dt;
            if (otsWalkTimer >= 0.16) {
              otsWalkTimer = 0;
              otsWalkFrame = (otsWalkFrame % 3) + 1;
            }
          } else {
            otsWalkFrame = 1;
            otsWalkTimer = 0;
          }

          // ── Player Physics & Collision Resolution ───────────────────────
          if (isMoving && animator.state !== 'dead') {
            const speedMultiplier = propsRef.current.hasWings ? 1.45 : 1.0;
            const dx = moveX * MOVE_SPEED * speedMultiplier * dt;
            const dy = moveY * MOVE_SPEED * speedMultiplier * dt;

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

          // ── Update Monsters (Wandering AI with multi-entity & player collisions) ──────
          const playerHitbox: Rect = {
            x: playerRef.current.x,
            y: playerRef.current.y,
            width: HITBOX_W,
            height: HITBOX_H,
          };

          for (const mob of monstersRef.current) {
            mob.update(dt, colliders, playerHitbox, monstersRef.current);
          }

          // ── Update Active Spells ────────────────────────────────────────
          const pTorsoX = playerRef.current.x + HITBOX_W / 2;
          const pTorsoY = playerRef.current.y + HITBOX_H - 18;
          const pFeetY = playerRef.current.y + HITBOX_H;

          for (const spell of activeSpellsRef.current) {
            const casterY = spell.def.spawnOrigin === 'ground' ? pFeetY : pTorsoY;
            spell.update(dt, pTorsoX, casterY);
          }
          activeSpellsRef.current = activeSpellsRef.current.filter((s) => !s.isFinished);

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
                  0,
                  0,
                  Math.PI * 2
                );
                renderCtx.fill();
                renderCtx.restore();

                // Monster sprite
                const spriteKey = `${mob.type}_${mob.frame}_${mob.dir}`;
                const spr = cached.monsters[spriteKey];

                const drawX = mob.x + mob.config.hitboxW / 2 - mob.config.visCenterX - camX;
                const drawY = mob.y + mob.config.hitboxH - mob.config.feetY - camY;

                if (spr) {
                  renderCtx.drawImage(
                    spr,
                    drawX,
                    drawY,
                    mob.config.width,
                    mob.config.height
                  );
                }

                // Name Tag & HP Bar
                renderCtx.save();
                const visualTopY = drawY + (mob.config.height - mob.config.visH);
                const textY = visualTopY - 4;
                renderCtx.font = 'bold 9px Tahoma, Verdana, sans-serif';
                renderCtx.textAlign = 'center';

                renderCtx.fillStyle = 'rgba(0, 0, 0, 0.9)';
                renderCtx.fillText(mob.config.name, mobFootCenterX + 1, textY + 1);
                renderCtx.fillStyle = '#4ade80';
                renderCtx.fillText(mob.config.name, mobFootCenterX, textY);

                const barW = Math.max(22, mob.config.visW * 0.7);
                const barH = 3;
                const barX = mobFootCenterX - barW / 2;
                const barY = textY - 9;

                renderCtx.fillStyle = '#000000';
                renderCtx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
                renderCtx.fillStyle = '#22c55e';
                renderCtx.fillRect(barX, barY, barW, barH);
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

              // Helper para desenhar as Asas Trovão
              const drawWings = () => {
                const wingsImg = cached.items['wings_thunder'];
                if (!propsRef.current.hasWings || !wingsImg) return;

                const dir = animator.direction;
                const cfg = WINGS_THUNDER_CONFIG[dir] || WINGS_THUNDER_CONFIG.down;

                // Animação de bater asas (flap) e flutuação (bob)
                const isPlayerMoving = animator.state === 'walk';
                const flap = Math.sin(now * (isPlayerMoving ? 0.022 : 0.006)) * (isPlayerMoving ? 0.14 : 0.04);
                const bob = isPlayerMoving ? Math.abs(Math.cos(now * 0.012)) * 2 : Math.sin(now * 0.004) * 1.5;

                // Dimensões do spritesheet original (4 frames de 480x509)
                const frameW = 480;
                const frameH = 509;
                const sx = cfg.frame * frameW;
                const sy = 0;

                // Tamanho final na tela (aplicando escala e flap)
                const wingDestW = cfg.baseW * cfg.scale * (1 + flap);
                const wingDestH = cfg.baseH * cfg.scale;

                // Posição final na tela (Eixo X e Eixo Y)
                const wingCenterX = px + HITBOX_W / 2 - camX;
                const wingDrawX = wingCenterX - wingDestW / 2 + cfg.offX;
                const wingTopY = py + HITBOX_H - curCharDef.feetY + cfg.offY - bob - camY;

                renderCtx.save();
                // Aura celestial sutil
                renderCtx.shadowColor = 'rgba(56, 189, 248, 0.6)';
                renderCtx.shadowBlur = 6;
                renderCtx.drawImage(
                  wingsImg,
                  sx,
                  sy,
                  frameW,
                  frameH,
                  wingDrawX,
                  wingTopY,
                  wingDestW,
                  wingDestH
                );
                renderCtx.restore();
              };

              const currentDirection = animator.direction;
              const wingCfg = WINGS_THUNDER_CONFIG[currentDirection] || WINGS_THUNDER_CONFIG.down;

              // PROFUNDIDADE: Se behind for TRUE -> Desenha a asa ATRÁS do corpo do personagem
              if (wingCfg.behind) {
                drawWings();
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

                  const drawX = px + HITBOX_W / 2 - curCharDef.width / 2 - camX;
                  const drawY = py + HITBOX_H - curCharDef.height - camY;

                  renderCtx.drawImage(
                    sprImage,
                    sx,
                    sy,
                    FRAME_SIZE,
                    FRAME_SIZE,
                    drawX,
                    drawY,
                    curCharDef.width,
                    curCharDef.height
                  );
                }
              } else {
                // OTServ individual PNGs (archer, barbarian, magician, necromancer, paladin)
                const dirNum = dirToOtsNum(animator.direction);
                const spriteKey = `${curCharDef.id}_${otsWalkFrame}_${dirNum}`;
                const sprImage = cached.characters[spriteKey];

                if (sprImage) {
                  const drawX = px + HITBOX_W / 2 - curCharDef.visCenterX - camX;
                  const drawY = py + HITBOX_H - curCharDef.feetY - camY;

                  renderCtx.drawImage(
                    sprImage,
                    drawX,
                    drawY,
                    curCharDef.width,
                    curCharDef.height
                  );
                }
              }

              // PROFUNDIDADE: Se behind for FALSE -> Desenha a asa NA FRENTE do corpo do personagem
              if (!wingCfg.behind) {
                drawWings();
              }

              // Player Name tag
              renderCtx.save();
              const pNameX = px + HITBOX_W / 2 - camX;
              const pNameY = py + HITBOX_H - curCharDef.height - 4 - camY;
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

                if (spell.def.animType === 'sheet') {
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
      {!assetsLoaded && (
        <div className="canvas-loading-overlay">
          <div className="spinner" />
          <span>Carregando mapa, monstros e heróis...</span>
        </div>
      )}

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
      />
    </div>
  );
}
