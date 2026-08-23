import type { Rect, TiledMap } from './types';
import { loadChromaKeyImage } from './imageLoader';
import { moveAndSlide } from './mapUtils';
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
};

export class Monster {
  public id: string;
  public type: string;
  public config: MonsterConfig;
  public x: number;
  public y: number;
  public dir: 1 | 2 | 3 | 4 = 3; // 1: Up, 2: Right, 3: Down, 4: Left
  public frame = 1;
  public isMoving = false;
  public mapId = 'map1';
  public islandBounds?: IslandBounds;

  private stateTimer = 0;
  private stateDuration = 2;
  private animTimer = 0;
  private currentVx = 0;
  private currentVy = 0;

  constructor(id: string, type: string, x: number, y: number, mapId = 'map1', islandBounds?: IslandBounds) {
    this.id = id;
    this.type = type;
    this.mapId = mapId;
    this.islandBounds = islandBounds;
    this.config = MONSTER_CONFIGS[type] || {
      name: type,
      width: 32,
      height: 32,
      visW: 28,
      visH: 28,
      visCenterX: 16,
      feetY: 30,
      shadowRadiusX: 10,
      shadowRadiusY: 4,
      hitboxW: 16,
      hitboxH: 12,
      speed: 38,
      walkFps: 5,
      frameCount: 3,
    };
    this.x = x;
    this.y = y;
    this.pickNextAction();
  }

  private pickNextAction() {
    this.stateTimer = 0;
    // 40% chance to wander, 60% chance to idle/graze (like Tibia)
    if (Math.random() < 0.4) {
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
      this.isMoving = false;
      this.currentVx = 0;
      this.currentVy = 0;
      this.frame = 1;
      this.stateDuration = 2.0 + Math.random() * 4.0;
    }
  }

  public update(
    dt: number,
    colliders?: Rect[],
    playerHitbox?: Rect,
    allMonsters?: Monster[]
  ): void {
    this.stateTimer += dt;
    if (this.stateTimer >= this.stateDuration) {
      this.pickNextAction();
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

      // Nearby static colliders
      const nearbyObstacles: Rect[] = [];
      if (colliders) {
        for (const col of colliders) {
          if (
            col.x + col.width > this.x - 48 &&
            col.x < this.x + this.config.hitboxW + 48 &&
            col.y + col.height > this.y - 48 &&
            col.y < this.y + this.config.hitboxH + 48
          ) {
            nearbyObstacles.push(col);
          }
        }
      }

      // Player collision
      if (playerHitbox) {
        if (
          Math.abs(playerHitbox.x - this.x) < 56 &&
          Math.abs(playerHitbox.y - this.y) < 56
        ) {
          nearbyObstacles.push(playerHitbox);
        }
      }

      // Other monsters collision
      if (allMonsters) {
        for (const other of allMonsters) {
          if (other === this) continue;
          if (
            Math.abs(other.x - this.x) < 48 &&
            Math.abs(other.y - this.y) < 48
          ) {
            nearbyObstacles.push({
              x: other.x,
              y: other.y,
              width: other.config.hitboxW,
              height: other.config.hitboxH,
            });
          }
        }
      }

      const res = moveAndSlide(
        this.x,
        this.y,
        dx,
        dy,
        this.config.hitboxW,
        this.config.hitboxH,
        nearbyObstacles
      );

      // Strict containment within the monster's island borders
      if (this.islandBounds) {
        if (
          res.x < this.islandBounds.minX ||
          res.x > this.islandBounds.maxX ||
          res.y < this.islandBounds.minY ||
          res.y > this.islandBounds.maxY
        ) {
          this.pickNextAction();
          return;
        }
      }

      // On surface map, prevent walking into water or coast tiles
      if (this.mapId === 'map1' && activeWalkableLandSet && activeWalkableLandSet.size > 0) {
        const centerTileX = Math.floor((res.x + this.config.hitboxW / 2) / 32);
        const centerTileY = Math.floor((res.y + this.config.hitboxH / 2) / 32);
        if (activeWalkableLandSet.has(`${centerTileX},${centerTileY}`)) {
          this.x = res.x;
          this.y = res.y;
        } else {
          // Revert: cannot step into ocean water or void
          this.pickNextAction();
        }
      } else {
        this.x = res.x;
        this.y = res.y;
      }

      // Enforce zone boundaries in cave 1
      if (this.mapId === 'caverna-zona-1') {
        const minX = 64;
        const maxX = 1200;
        const minY = 70;
        const maxY = 210;

        if (this.x < minX || this.x > maxX || this.y < minY || this.y > maxY) {
          this.x = Math.max(minX, Math.min(maxX, this.x));
          this.y = Math.max(minY, Math.min(maxY, this.y));
          this.pickNextAction();
        }
      }

      // Enforce zone boundaries in cave 2
      if (this.mapId === 'caverna2') {
        const minX = 45;
        const maxX = 435;
        const minY = 45;
        const maxY = 205;

        if (this.x < minX || this.x > maxX || this.y < minY || this.y > maxY) {
          this.x = Math.max(minX, Math.min(maxX, this.x));
          this.y = Math.max(minY, Math.min(maxY, this.y));
          this.pickNextAction();
        }
      }

      // If collided with wall or player, pick another direction
      if (Math.abs(this.x - (prevX + dx)) > 0.1 || Math.abs(this.y - (prevY + dy)) > 0.1) {
        this.pickNextAction();
      }
    }

    // Separation pass against nearby monsters to prevent clumping
    if (allMonsters) {
      for (const other of allMonsters) {
        if (other === this) continue;
        const dx = (this.x + this.config.hitboxW / 2) - (other.x + other.config.hitboxW / 2);
        const dy = (this.y + this.config.hitboxH / 2) - (other.y + other.config.hitboxH / 2);
        const minDistanceX = (this.config.hitboxW + other.config.hitboxW) / 2;
        const minDistanceY = (this.config.hitboxH + other.config.hitboxH) / 2;

        if (Math.abs(dx) < minDistanceX && Math.abs(dy) < minDistanceY) {
          const overlapX = minDistanceX - Math.abs(dx);
          const overlapY = minDistanceY - Math.abs(dy);
          if (overlapX < overlapY) {
            this.x += (dx > 0 ? overlapX : -overlapX) * 0.3;
          } else {
            this.y += (dy > 0 ? overlapY : -overlapY) * 0.3;
          }
        }
      }
    }
  }
}

// Global active walkable land tiles index for current surface map
let activeWalkableLandSet: Set<string> | null = null;

function isWaterTileGid(gid: number): boolean {
  const clean = gid & 0x1fffffff;
  if (clean === 0) return true;
  // OTServ animated water sequences and coast borders
  if (clean >= 736 && clean <= 743) return true;
  if (clean >= 750 && clean <= 800) return true;
  return false;
}

/**
 * Builds an ultra-fast O(1) set of all solid walkable land tile coordinates (`col,row`)
 * across all map tile layers, strictly excluding ocean water and void.
 */
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

            const tileX = chunk.x + c;
            const tileY = chunk.y + r;
            landSet.add(`${tileX},${tileY}`);
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

// ── Biome Configurations for Surface Map (Tibia Density: 8-10 mobs per island) ─
interface BiomeIslandDef {
  id: string;
  name: string;
  bounds: IslandBounds;
  pool: string[];
  targetCount: number;
}

const BIOME_ISLANDS: BiomeIslandDef[] = [
  {
    id: 'ilha1',
    name: 'Ilha 1 (Floresta & Ruínas)',
    bounds: SURFACE_ISLAND_BOUNDS.ilha1,
    pool: ['esquilo', 'dog', 'dodo', 'hiena', 'elf', 'anao', 'duende', 'orc', 'pand'],
    targetCount: 9,
  },
  {
    id: 'ilha2',
    name: 'Ilha 2 (Deserto de Areia)',
    bounds: SURFACE_ISLAND_BOUNDS.ilha2,
    pool: ['skedesert', 'mumia', 'serpent', 'mummi', 'mummi2', 'golen-magma', 'genie'],
    targetCount: 9,
  },
  {
    id: 'ilha3',
    name: 'Ilha 3 (Montanhas Rochosas)',
    bounds: SURFACE_ISLAND_BOUNDS.ilha3,
    pool: ['tiguersabre', 'centon', 'whitewolf', 'golen', 'trolol', 'drago', 'orc'],
    targetCount: 9,
  },
  {
    id: 'ilha4',
    name: 'Ilha 4 (Santuário Místico)',
    bounds: SURFACE_ISLAND_BOUNDS.ilha4,
    pool: ['whitewolf', 'aparition', 'thedeath', 'golen', 'magmal', 'drago', 'centon'],
    targetCount: 9,
  },
];

const CAVE1_POOL = [
  'bat', 'zombie', 'aparition', 'goblin', 'soni', 'trolol', 'centostone', 'stonemonster'
];

/**
 * Populates balanced, Tibia-like monster populations cleanly divided by biomes.
 * Strictly confines spawns and movement to confirmed solid island land.
 */
export function createMapMonsters(
  mapId = 'map1',
  mapData?: TiledMap,
  colliders?: Rect[]
): Monster[] {
  const monsters: Monster[] = [];
  let monsterIdCounter = 1;

  // 1. Cave Zone 1 Handling (8 total monsters)
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
      const spawnX = Math.round(seg.minX + Math.random() * (seg.maxX - seg.minX));
      const spawnY = Math.round(seg.minY + Math.random() * (seg.maxY - seg.minY));

      monsters.push(new Monster(`cave1_mob_${i}_${type}`, type, spawnX, spawnY, 'caverna-zona-1'));
    }

    return monsters;
  }

  // 2. Cave Zone 2 Handling (5 total monsters)
  if (mapId === 'caverna2') {
    const c2Spawns = [
      { type: 'bat', x: 130, y: 110 },
      { type: 'aparition', x: 210, y: 140 },
      { type: 'soni', x: 280, y: 100 },
      { type: 'goblin', x: 350, y: 145 },
      { type: 'stonemonster', x: 230, y: 115 },
    ];

    for (let i = 0; i < c2Spawns.length; i++) {
      const s = c2Spawns[i];
      monsters.push(new Monster(`cave2_mob_${i}_${s.type}`, s.type, s.x, s.y, 'caverna2'));
    }

    return monsters;
  }

  // 3. Surface Zone (map1)
  if (!mapData) {
    return monsters;
  }

  // Index all solid ground tiles
  activeWalkableLandSet = buildWalkableLandSet(mapData);

  // Filter interior ground tiles per island
  const islandEligibleTiles: Record<string, Array<{ x: number; y: number }>> = {
    ilha1: [],
    ilha2: [],
    ilha3: [],
    ilha4: [],
  };

  activeWalkableLandSet.forEach((tileKey) => {
    const [tx, ty] = tileKey.split(',').map(Number);

    // Filter out coast edges: must have at least 4 solid neighbors
    let solidNeighbors = 0;
    for (const [dx, dy] of [[1,0], [-1,0], [0,1], [0,-1], [1,1], [-1,-1], [1,-1], [-1,1]]) {
      if (activeWalkableLandSet!.has(`${tx + dx},${ty + dy}`)) {
        solidNeighbors++;
      }
    }
    if (solidNeighbors < 4) return;

    const wx = tx * 32;
    const wy = ty * 32;

    // Check collision with walls / obstacles
    if (colliders) {
      const hits = colliders.some(
        (c) =>
          wx < c.x + c.width &&
          wx + 16 > c.x &&
          wy < c.y + c.height &&
          wy + 12 > c.y
      );
      if (hits) return;
    }

    // Classify into exact island
    for (const isl of BIOME_ISLANDS) {
      if (
        wx >= isl.bounds.minX + 32 &&
        wx <= isl.bounds.maxX - 32 &&
        wy >= isl.bounds.minY + 32 &&
        wy <= isl.bounds.maxY - 32
      ) {
        // Prevent spawning right over initial player start (0, 0)
        if (isl.id === 'ilha1' && Math.hypot(wx, wy) < 120) return;

        islandEligibleTiles[isl.id].push({ x: wx, y: wy });
        break;
      }
    }
  });

  // Spawn balanced number of monsters per biome island (9 per island)
  for (const isl of BIOME_ISLANDS) {
    const tiles = islandEligibleTiles[isl.id];
    if (!tiles || tiles.length === 0) continue;

    const count = Math.min(isl.targetCount, tiles.length);
    const step = Math.max(1, Math.floor(tiles.length / count));

    for (let i = 0; i < count; i++) {
      const tileIndex = (i * step + Math.floor(Math.random() * step)) % tiles.length;
      const tile = tiles[tileIndex];
      const type = isl.pool[i % isl.pool.length];

      monsters.push(
        new Monster(
          `surf_${isl.id}_${monsterIdCounter++}_${type}`,
          type,
          tile.x + 8,
          tile.y + 8,
          mapId,
          isl.bounds
        )
      );
    }
  }

  return monsters;
}
