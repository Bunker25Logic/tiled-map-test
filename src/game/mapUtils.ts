import type { TiledMap, TiledTileset, Rect } from './types';

const GID_FLIP_MASK = 0x1fffffff;

export function cleanGid(gid: number): number {
  return gid & GID_FLIP_MASK;
}

export function getTilesetForGid(
  gid: number,
  tilesets: TiledTileset[]
): TiledTileset | null {
  const cleaned = cleanGid(gid);
  if (cleaned === 0) return null;

  const valid = tilesets
    .filter((ts) => Boolean(ts.image) && Boolean(ts.columns))
    .sort((a, b) => a.firstgid - b.firstgid);

  let target: TiledTileset | null = null;
  for (const ts of valid) {
    if (cleaned >= ts.firstgid) {
      if (ts.tilecount && cleaned >= ts.firstgid + ts.tilecount) {
        continue;
      }
      target = ts;
    }
  }
  return target;
}

export function getTileCoords(
  gid: number,
  tileset: TiledTileset
): { sx: number; sy: number; sw: number; sh: number } {
  const cleaned = cleanGid(gid);
  const localId = cleaned - tileset.firstgid;
  const cols = tileset.columns || 16;
  const col = localId % cols;
  const row = Math.floor(localId / cols);
  const margin = tileset.margin ?? 0;
  const spacing = tileset.spacing ?? 0;
  const sx = margin + col * (tileset.tilewidth + spacing);
  const sy = margin + row * (tileset.tileheight + spacing);
  return { sx, sy, sw: tileset.tilewidth, sh: tileset.tileheight };
}

export interface ActiveTileAnimation {
  totalDuration: number;
  frames: Array<{ duration: number; gid: number }>;
}

export type TileAnimationMap = Map<number, ActiveTileAnimation>;

/**
 * Builds a fast lookup table of all animated tiles in the map tilesets,
 * including explicit Tiled animation arrays and full OTServ water wave sequences.
 */
export function buildTileAnimationMap(tilesets: TiledTileset[]): TileAnimationMap {
  const animMap: TileAnimationMap = new Map();

  for (const ts of tilesets) {
    // 1. Explicit Tiled animations from map tileset metadata
    if (ts.tiles) {
      for (const t of ts.tiles) {
        if (t.animation && t.animation.length > 0) {
          const baseGid = ts.firstgid + t.id;
          const frames = t.animation.map((f) => ({
            duration: f.duration || 120,
            gid: ts.firstgid + f.tileid,
          }));
          const totalDuration = frames.reduce((sum, f) => sum + f.duration, 0);

          const animObj: ActiveTileAnimation = { totalDuration, frames };
          animMap.set(baseGid, animObj);

          // Map each frame in the sequence so any frame placed on the map animates
          for (const f of frames) {
            animMap.set(f.gid, animObj);
          }
        }
      }
    }

    // 2. Built-in OTServ water wave animations for otsp_tiles_01 (Rows 46 to 61)
    if (ts.name === 'otsp_tiles_01') {
      const frameDuration = 120; // 120ms per wave frame
      for (let row = 46; row <= 61; row++) {
        // Block A: columns 0 to 7 (8 frames)
        const startGidA = ts.firstgid + row * 16;
        const framesA: Array<{ duration: number; gid: number }> = [];
        for (let c = 0; c < 8; c++) {
          framesA.push({ duration: frameDuration, gid: startGidA + c });
        }
        const totalDurationA = framesA.length * frameDuration;
        const animA: ActiveTileAnimation = { totalDuration: totalDurationA, frames: framesA };
        for (let c = 0; c < 8; c++) {
          if (!animMap.has(startGidA + c)) {
            animMap.set(startGidA + c, animA);
          }
        }

        // Block B: columns 8 to 15 (8 frames)
        const startGidB = ts.firstgid + row * 16 + 8;
        const framesB: Array<{ duration: number; gid: number }> = [];
        for (let c = 0; c < 8; c++) {
          framesB.push({ duration: frameDuration, gid: startGidB + c });
        }
        const totalDurationB = framesB.length * frameDuration;
        const animB: ActiveTileAnimation = { totalDuration: totalDurationB, frames: framesB };
        for (let c = 0; c < 8; c++) {
          if (!animMap.has(startGidB + c)) {
            animMap.set(startGidB + c, animB);
          }
        }
      }
    }
  }

  return animMap;
}

/**
 * Resolves the active animated GID for the current timestamp.
 */
export function getAnimatedGid(
  gid: number,
  animTimeMs: number,
  animMap: TileAnimationMap
): number {
  const cleaned = cleanGid(gid);
  const anim = animMap.get(cleaned);
  if (!anim || anim.frames.length === 0 || anim.totalDuration <= 0) {
    return gid;
  }

  const timeInLoop = animTimeMs % anim.totalDuration;
  let accumulated = 0;
  for (const frame of anim.frames) {
    accumulated += frame.duration;
    if (timeInLoop < accumulated) {
      const flipFlags = gid & ~GID_FLIP_MASK;
      return (frame.gid & GID_FLIP_MASK) | flipFlags;
    }
  }

  return anim.frames[0].gid;
}

/**
 * Gathers ONLY explicit collision shapes drawn by the user in Tiled
 * (Rectangles, Round/Ellipse selectors, Capsules, Polygons - all objects with no gid).
 * Never creates automatic collision on decorative tiles or ladders.
 */
export function buildCollisionRects(map: TiledMap): Rect[] {
  const rects: Rect[] = [];

  for (const layer of map.layers) {
    if (layer.type !== 'objectgroup' || !layer.objects) continue;
    const offX = layer.offsetx ?? 0;
    const offY = layer.offsety ?? 0;

    for (const obj of layer.objects) {
      // Ignore tile objects (items with images like ladders, wall tiles, flowers)
      if (obj.gid !== undefined) continue;

      // Handle user-drawn shapes: Rectangle, Ellipse/Round, Capsule
      const width = obj.width || 0;
      const height = obj.height || 0;
      if (width <= 0 || height <= 0) continue;

      rects.push({
        x: Math.round(obj.x + offX),
        y: Math.round(obj.y + offY),
        width: Math.round(width),
        height: Math.round(height),
      });
    }
  }

  return rects;
}

/**
 * Swept AABB & Axis-Separate sliding collision resolution.
 */
export function moveAndSlide(
  x: number,
  y: number,
  vx: number,
  vy: number,
  boxW: number,
  boxH: number,
  colliders: Rect[]
): { x: number; y: number } {
  // Step 1: Move on X axis
  let newX = x + vx;
  let newY = y;

  const playerBoxX = { x: newX, y: newY, width: boxW, height: boxH };
  for (const col of colliders) {
    if (checkOverlap(playerBoxX, col)) {
      if (vx > 0) {
        newX = col.x - boxW;
      } else if (vx < 0) {
        newX = col.x + col.width;
      }
      playerBoxX.x = newX;
    }
  }

  // Step 2: Move on Y axis
  newY = newY + vy;
  const playerBoxY = { x: newX, y: newY, width: boxW, height: boxH };
  for (const col of colliders) {
    if (checkOverlap(playerBoxY, col)) {
      if (vy > 0) {
        newY = col.y - boxH;
      } else if (vy < 0) {
        newY = col.y + col.height;
      }
      playerBoxY.y = newY;
    }
  }

  return { x: newX, y: newY };
}

function checkOverlap(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}
