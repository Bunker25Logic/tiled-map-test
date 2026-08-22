import type { TiledMap, TiledLayer, TiledObject, Rect } from './types';
import {
  getTilesetForGid,
  getTileCoords,
  cleanGid,
  getAnimatedGid,
  type TileAnimationMap,
} from './mapUtils';

export interface TilesetImages {
  [name: string]: HTMLImageElement;
}

export interface RenderableObject {
  type: 'tiled-obj' | 'player';
  sortY: number;
  draw: (ctx: CanvasRenderingContext2D) => void;
}

/**
 * Draws a tile layer with buttery-smooth subpixel camera alignment and animated water support.
 */
export function drawTileLayer(
  ctx: CanvasRenderingContext2D,
  layer: TiledLayer,
  map: TiledMap,
  images: TilesetImages,
  cameraX: number,
  cameraY: number,
  canvasW: number,
  canvasH: number,
  animTimeMs = 0,
  animMap?: TileAnimationMap
): void {
  const tw = map.tilewidth;
  const th = map.tileheight;
  const offsetX = layer.offsetx ?? 0;
  const offsetY = layer.offsety ?? 0;

  const viewLeft = cameraX - offsetX;
  const viewTop = cameraY - offsetY;
  const viewRight = viewLeft + canvasW;
  const viewBottom = viewTop + canvasH;

  // 1. Infinite Map with Chunks
  if (layer.chunks && layer.chunks.length > 0) {
    for (const chunk of layer.chunks) {
      const chunkWorldX = chunk.x * tw;
      const chunkWorldY = chunk.y * th;
      const chunkWorldRight = chunkWorldX + chunk.width * tw;
      const chunkWorldBottom = chunkWorldY + chunk.height * th;

      if (
        chunkWorldRight < viewLeft ||
        chunkWorldX > viewRight ||
        chunkWorldBottom < viewTop ||
        chunkWorldY > viewBottom
      ) {
        continue;
      }

      for (let row = 0; row < chunk.height; row++) {
        for (let col = 0; col < chunk.width; col++) {
          const rawGid = chunk.data[row * chunk.width + col];
          if (!rawGid || cleanGid(rawGid) === 0) continue;

          const worldX = chunkWorldX + col * tw;
          const worldY = chunkWorldY + row * th;

          if (
            worldX + tw < viewLeft ||
            worldX > viewRight ||
            worldY + th < viewTop ||
            worldY > viewBottom
          ) {
            continue;
          }

          const activeGid = animMap ? getAnimatedGid(rawGid, animTimeMs, animMap) : rawGid;
          const tileset = getTilesetForGid(activeGid, map.tilesets);
          if (!tileset) continue;

          const img = images[tileset.name];
          if (!img) continue;

          const { sx, sy, sw, sh } = getTileCoords(activeGid, tileset);
          const screenX = worldX - cameraX + offsetX;
          const screenY = worldY - cameraY + offsetY;

          ctx.drawImage(img, sx, sy, sw, sh, screenX, screenY, tw, th);
        }
      }
    }
    return;
  }

  // 2. Fixed-size Map with layer.data
  if (layer.data && layer.width && layer.height) {
    const layerW = layer.width;
    const layerH = layer.height;

    for (let row = 0; row < layerH; row++) {
      for (let col = 0; col < layerW; col++) {
        const rawGid = layer.data[row * layerW + col];
        if (!rawGid || cleanGid(rawGid) === 0) continue;

        const worldX = col * tw;
        const worldY = row * th;

        if (
          worldX + tw < viewLeft ||
          worldX > viewRight ||
          worldY + th < viewTop ||
          worldY > viewBottom
        ) {
          continue;
        }

        const activeGid = animMap ? getAnimatedGid(rawGid, animTimeMs, animMap) : rawGid;
        const tileset = getTilesetForGid(activeGid, map.tilesets);
        if (!tileset) continue;

        const img = images[tileset.name];
        if (!img) continue;

        const { sx, sy, sw, sh } = getTileCoords(activeGid, tileset);
        const screenX = worldX - cameraX + offsetX;
        const screenY = worldY - cameraY + offsetY;

        ctx.drawImage(img, sx, sy, sw, sh, screenX, screenY, tw, th);
      }
    }
  }
}

/**
 * Returns true if an object is a flat ground decal (flowers, ground moss, pebbles, grass tufts)
 * that should be rendered on the ground under characters.
 */
function isGroundDecal(obj: TiledObject, layerName: string): boolean {
  if (layerName === 'muros') return false; // Walls are always vertical standing obstacles
  const w = obj.width || 32;
  const h = obj.height || 32;
  // Multi-tile structures (trees, big rocks, houses) are vertical obstacles
  if (w > 32 || h > 32) return false;
  // Single 32x32 tiles in decoracoes are flat ground decor
  return true;
}

/**
 * Clusters vertically connected tiles (like a 2-tile tall wall segment: top piece + bottom piece)
 * at the same X column so they share the base sortY of that wall column,
 * while strictly preventing merging the north wall into the south wall across the entire house!
 */
function clusterWallColumnObjects(objects: TiledObject[]): TiledObject[][] {
  const clusters: TiledObject[][] = [];
  const visited = new Set<number>();

  for (let i = 0; i < objects.length; i++) {
    if (visited.has(i)) continue;

    const cluster: TiledObject[] = [objects[i]];
    visited.add(i);

    const queue: TiledObject[] = [objects[i]];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      const currMinY = curr.y - curr.height;
      const currMaxY = curr.y;

      for (let j = 0; j < objects.length; j++) {
        if (visited.has(j)) continue;
        const other = objects[j];
        const otherMinY = other.y - other.height;
        const otherMaxY = other.y;

        // Only merge vertical column slices (tiles that stack directly on top of each other at same X column)
        const sameColumn = Math.abs(curr.x - other.x) < 6;
        const touchesVertically = !(currMaxY < otherMinY - 4 || currMinY > otherMaxY + 4);

        if (sameColumn && touchesVertically) {
          visited.add(j);
          cluster.push(other);
          queue.push(other);
        }
      }
    }

    clusters.push(cluster);
  }

  return clusters;
}

/**
 * Collects tile objects from an objectgroup layer to be depth-sorted.
 * - Flat ground decor (flowers, grass tufts, pebbles) has sortY = -Infinity (rendered on ground under player).
 * - Wall/building columns are clustered by vertical column slices so the north wall does not cut off the player inside the house!
 */
export function getLayerRenderables(
  layer: TiledLayer,
  map: TiledMap,
  images: TilesetImages,
  cameraX: number,
  cameraY: number,
  canvasW: number,
  canvasH: number,
  animTimeMs = 0,
  animMap?: TileAnimationMap
): RenderableObject[] {
  if (!layer.objects) return [];

  const offsetX = layer.offsetx ?? 0;
  const offsetY = layer.offsety ?? 0;
  const viewLeft = cameraX - offsetX;
  const viewTop = cameraY - offsetY;
  const viewRight = viewLeft + canvasW;
  const viewBottom = viewTop + canvasH;

  // Filter valid visible tile objects
  const validObjects = layer.objects.filter(
    (obj) => obj.gid !== undefined && obj.visible !== false && cleanGid(obj.gid) !== 0
  );

  const renderables: RenderableObject[] = [];
  const groundDecals: TiledObject[] = [];
  const standingObjects: TiledObject[] = [];

  for (const obj of validObjects) {
    if (isGroundDecal(obj, layer.name)) {
      groundDecals.push(obj);
    } else {
      standingObjects.push(obj);
    }
  }

  // 1. Render Ground Decals (Flowers, pebbles, grass tufts) at ground level under player
  for (const obj of groundDecals) {
    const worldX = obj.x + offsetX;
    const worldY = obj.y - obj.height + offsetY;

    if (
      worldX + obj.width < viewLeft ||
      worldX > viewRight ||
      worldY + obj.height < viewTop ||
      worldY > viewBottom
    ) {
      continue;
    }

    const activeGid = animMap ? getAnimatedGid(obj.gid!, animTimeMs, animMap) : obj.gid!;
    const tileset = getTilesetForGid(activeGid, map.tilesets);
    if (!tileset) continue;
    const img = images[tileset.name];
    if (!img) continue;

    const { sx, sy, sw, sh } = getTileCoords(activeGid, tileset);

    renderables.push({
      type: 'tiled-obj',
      sortY: -999999, // Ground level: player and monsters always walk OVER flowers/plants
      draw: (ctx: CanvasRenderingContext2D) => {
        const screenX = worldX - cameraX;
        const screenY = worldY - cameraY;
        ctx.drawImage(img, sx, sy, sw, sh, screenX, screenY, obj.width, obj.height);
      },
    });
  }

  // 2. Render Standing Objects (Walls, roofs, trees, large rocks) with vertical column depth Y-sorting
  if (standingObjects.length > 1) {
    const clusters = clusterWallColumnObjects(standingObjects);

    for (const cluster of clusters) {
      const minX = Math.min(...cluster.map((o) => o.x)) + offsetX;
      const maxX = Math.max(...cluster.map((o) => o.x + o.width)) + offsetX;
      const minY = Math.min(...cluster.map((o) => o.y - o.height)) + offsetY;
      const maxY = Math.max(...cluster.map((o) => o.y)) + offsetY;

      // Viewport culling for entire cluster
      if (maxX < viewLeft || minX > viewRight || maxY < viewTop || minY > viewBottom) {
        continue;
      }

      // Sort tiles within cluster from top to bottom
      const sortedTiles = [...cluster].sort((a, b) => a.y - b.y);

      // The entire wall column is anchored at its lowest point (ground base of this specific column)
      const clusterSortY = maxY;

      renderables.push({
        type: 'tiled-obj',
        sortY: clusterSortY,
        draw: (ctx: CanvasRenderingContext2D) => {
          for (const obj of sortedTiles) {
            const activeGid = animMap ? getAnimatedGid(obj.gid!, animTimeMs, animMap) : obj.gid!;
            const tileset = getTilesetForGid(activeGid, map.tilesets);
            if (!tileset) continue;
            const img = images[tileset.name];
            if (!img) continue;

            const worldX = obj.x + offsetX;
            const worldY = obj.y - obj.height + offsetY;
            const { sx, sy, sw, sh } = getTileCoords(activeGid, tileset);
            const screenX = worldX - cameraX;
            const screenY = worldY - cameraY;

            ctx.drawImage(img, sx, sy, sw, sh, screenX, screenY, obj.width, obj.height);
          }
        },
      });
    }
  } else if (standingObjects.length === 1) {
    const obj = standingObjects[0];
    const worldX = obj.x + offsetX;
    const worldY = obj.y - obj.height + offsetY;
    const sortY = obj.y + offsetY;

    if (
      worldX + obj.width >= viewLeft &&
      worldX <= viewRight &&
      worldY + obj.height >= viewTop &&
      worldY <= viewBottom
    ) {
      const activeGid = animMap ? getAnimatedGid(obj.gid!, animTimeMs, animMap) : obj.gid!;
      const tileset = getTilesetForGid(activeGid, map.tilesets);
      if (tileset && images[tileset.name]) {
        const img = images[tileset.name];
        const { sx, sy, sw, sh } = getTileCoords(activeGid, tileset);

        renderables.push({
          type: 'tiled-obj',
          sortY,
          draw: (ctx: CanvasRenderingContext2D) => {
            const screenX = worldX - cameraX;
            const screenY = worldY - cameraY;
            ctx.drawImage(img, sx, sy, sw, sh, screenX, screenY, obj.width, obj.height);
          },
        });
      }
    }
  }

  return renderables;
}

/**
 * Draws collision shapes for debugging and visual verification.
 */
export function drawDebugColliders(
  ctx: CanvasRenderingContext2D,
  colliders: Rect[],
  cameraX: number,
  cameraY: number
): void {
  ctx.save();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#ef4444';
  ctx.fillStyle = 'rgba(239, 68, 68, 0.25)';

  for (const rect of colliders) {
    const rx = rect.x - cameraX;
    const ry = rect.y - cameraY;
    ctx.fillRect(rx, ry, rect.width, rect.height);
    ctx.strokeRect(rx, ry, rect.width, rect.height);
  }

  ctx.restore();
}

/**
 * Draws a subtle 32x32 pixel grid aligned with the world tiles.
 */
export function drawTileGrid(
  ctx: CanvasRenderingContext2D,
  cameraX: number,
  cameraY: number,
  canvasW: number,
  canvasH: number,
  tileSize = 32
): void {
  ctx.save();
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';

  const startCol = Math.floor(cameraX / tileSize);
  const endCol = Math.ceil((cameraX + canvasW) / tileSize);
  const startRow = Math.floor(cameraY / tileSize);
  const endRow = Math.ceil((cameraY + canvasH) / tileSize);

  ctx.beginPath();
  for (let col = startCol; col <= endCol; col++) {
    const screenX = col * tileSize - cameraX;
    ctx.moveTo(screenX, 0);
    ctx.lineTo(screenX, canvasH);
  }
  for (let row = startRow; row <= endRow; row++) {
    const screenY = row * tileSize - cameraY;
    ctx.moveTo(0, screenY);
    ctx.lineTo(canvasW, screenY);
  }
  ctx.stroke();
  ctx.restore();
}
