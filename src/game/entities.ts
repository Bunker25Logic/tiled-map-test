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

  private stateTimer = 0;
  private stateDuration = 2;
  private animTimer = 0;
  private currentVx = 0;
  private currentVy = 0;

  constructor(id: string, type: string, x: number, y: number, mapId = 'map1') {
    this.id = id;
    this.type = type;
    this.mapId = mapId;
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
      speed: 40,
      walkFps: 5,
      frameCount: 3,
    };
    this.x = x;
    this.y = y;
    this.pickNextAction();
  }

  private pickNextAction() {
    this.stateTimer = 0;
    // 45% chance to wander, 55% chance to idle/graze
    if (Math.random() < 0.45) {
      this.isMoving = true;
      this.stateDuration = 1.0 + Math.random() * 2.5;

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
      this.stateDuration = 1.5 + Math.random() * 3.5;
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

      this.x = res.x;
      this.y = res.y;

      // Enforce zone boundaries in cave
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

// Biome-based Monster Pools
const FOREST_SURFACE_POOL = [
  'hiena', 'drago', 'anao', 'elf', 'pirata', 'golen', 'whitewolf', 'dog', 'pand', 'centon',
  'orc', 'duende', 'lizardman', 'tiguersabre', 'trolol', 'esquilo', 'dodo'
];

const DESERT_SURFACE_POOL = [
  'skedesert', 'golen-magma', 'mumia', 'serpent', 'mummi', 'mummi2', 'genie', 'magmal'
];

const CAVE_POOL = [
  'bat', 'zombie', 'aparition', 'goblin', 'soni', 'trolol', 'centostone', 'stonemonster', 'thedeath', 'binger'
];

/**
 * Procedurally populates only solid, walkable land tiles (strictly excluding ocean/water)
 * across any new map areas or northern expansions.
 */
export function createMapMonsters(
  mapId = 'map1',
  mapData?: TiledMap,
  colliders?: Rect[]
): Monster[] {
  const monsters: Monster[] = [];
  let monsterIdCounter = 1;

  // 1. Cave Zone Handling
  if (mapId === 'caverna-zona-1') {
    const caveSegments = [
      { minX: 120, maxX: 280, minY: 90, maxY: 180 },
      { minX: 300, maxX: 500, minY: 90, maxY: 190 },
      { minX: 520, maxX: 720, minY: 90, maxY: 190 },
      { minX: 740, maxX: 940, minY: 90, maxY: 190 },
      { minX: 960, maxX: 1120, minY: 90, maxY: 180 },
    ];

    for (let i = 0; i < 10; i++) {
      const seg = caveSegments[i % caveSegments.length];
      const type = CAVE_POOL[i % CAVE_POOL.length];
      const spawnX = Math.round(seg.minX + Math.random() * (seg.maxX - seg.minX));
      const spawnY = Math.round(seg.minY + Math.random() * (seg.maxY - seg.minY));

      monsters.push(new Monster(`cave_mob_${i}_${type}`, type, spawnX, spawnY, 'caverna-zona-1'));
    }

    return monsters;
  }

  // 2. Surface Zone (map1)
  if (!mapData) {
    return monsters;
  }

  // A. Check for explicit Tiled spawn objects
  for (const layer of mapData.layers) {
    if (layer.type === 'objectgroup' && layer.objects) {
      for (const obj of layer.objects) {
        const objName = (obj.name || '').toLowerCase().trim();
        const objType = (obj.type || '').toLowerCase().trim();

        const matchedMonster =
          MONSTER_CONFIGS[objName] ? objName :
          MONSTER_CONFIGS[objType] ? objType : null;

        if (matchedMonster) {
          monsters.push(
            new Monster(
              `tiled_spawn_${monsterIdCounter++}_${matchedMonster}`,
              matchedMonster,
              Math.round(obj.x),
              Math.round(obj.y),
              mapId
            )
          );
        }
      }
    }
  }

  // B. Procedural Walkable Sector Spawner
  // ONLY scan solid ground layers ('chao', 'ground', 'terra', 'floor', etc.) — NEVER water/ocean ('terreno')
  const walkableTilesBySector: Map<string, Array<{ x: number; y: number; isDesert: boolean }>> = new Map();
  const tw = mapData.tilewidth || 32;
  const th = mapData.tileheight || 32;
  const sectorSize = 256;

  for (const layer of mapData.layers) {
    if (layer.type !== 'tilelayer') continue;

    const layerName = (layer.name || '').toLowerCase().trim();
    // Exclude water/ocean layers (e.g. 'terreno' is full water)
    if (layerName.includes('terreno') || layerName.includes('agua') || layerName.includes('water') || layerName.includes('mar')) {
      continue;
    }

    if (layer.chunks) {
      for (const chunk of layer.chunks) {
        for (let row = 0; row < chunk.height; row++) {
          for (let col = 0; col < chunk.width; col++) {
            const rawGid = chunk.data[row * chunk.width + col];
            const clean = rawGid & 0x1fffffff;
            if (clean === 0) continue;

            // Water GID exclusion: OTServ water tiles (700 to 1200)
            if (clean >= 700 && clean <= 1200) continue;

            const worldX = (chunk.x + col) * tw;
            const worldY = (chunk.y + row) * th;

            // Check if collides with static objects (walls, houses, fences)
            if (colliders) {
              const hits = colliders.some(
                (c) =>
                  worldX < c.x + c.width &&
                  worldX + 16 > c.x &&
                  worldY < c.y + c.height &&
                  worldY + 12 > c.y
              );
              if (hits) continue;
            }

            // Avoid initial player spawn center
            if (Math.hypot(worldX, worldY) < 64) continue;

            const sectorKey = `${Math.floor(worldX / sectorSize)},${Math.floor(worldY / sectorSize)}`;
            const isDesert = worldX > 850 || (clean >= 460 && clean <= 530);

            if (!walkableTilesBySector.has(sectorKey)) {
              walkableTilesBySector.set(sectorKey, []);
            }
            walkableTilesBySector.get(sectorKey)!.push({ x: worldX, y: worldY, isDesert });
          }
        }
      }
    }
  }

  // Populate each solid ground sector
  walkableTilesBySector.forEach((tiles) => {
    // Only spawn if sector has enough solid ground (at least 6 tiles)
    if (tiles.length < 6) return;

    const count = tiles.length > 20 ? 2 : 1;

    for (let c = 0; c < count; c++) {
      const randomTile = tiles[Math.floor(Math.random() * tiles.length)];
      const pool = randomTile.isDesert ? DESERT_SURFACE_POOL : FOREST_SURFACE_POOL;
      const type = pool[Math.floor(Math.random() * pool.length)];

      const jitterX = Math.round(randomTile.x + (Math.random() - 0.5) * 14);
      const jitterY = Math.round(randomTile.y + (Math.random() - 0.5) * 14);

      monsters.push(
        new Monster(
          `auto_mob_${monsterIdCounter++}_${type}`,
          type,
          jitterX,
          jitterY,
          mapId
        )
      );
    }
  });

  return monsters;
}
