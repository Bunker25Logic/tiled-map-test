import { useEffect, useRef, useState } from 'react';
import type { TiledMap, Direction, Rect } from '../game/types';
import type { Monster } from '../game/entities';
import type { PortalDef } from '../game/zones';

interface MinimapProps {
  mapData: TiledMap;
  playerPos: { x: number; y: number; dir?: Direction };
  colliders?: Rect[];
  monsters?: Monster[];
  portals?: PortalDef[];
  mapId: string;
}

export default function Minimap({
  mapData,
  playerPos,
  colliders = [],
  monsters = [],
  portals = [],
  mapId,
}: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [minimapZoom, setMinimapZoom] = useState<number>(0.13);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isCollapsed) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const mapW = canvas.width;
    const mapH = canvas.height;

    ctx.clearRect(0, 0, mapW, mapH);

    // Deep background
    ctx.fillStyle = mapId.startsWith('caverna') ? '#090a0f' : '#0d1d3a';
    ctx.fillRect(0, 0, mapW, mapH);

    const centerX = mapW / 2;
    const centerY = mapH / 2;
    const px = playerPos.x;
    const py = playerPos.y;

    const tw = mapData.tilewidth || 32;
    const th = mapData.tileheight || 32;

    ctx.save();
    // Center minimap on player position
    ctx.translate(centerX, centerY);
    ctx.scale(minimapZoom, minimapZoom);
    ctx.translate(-px, -py);

    // 1. Draw Tile Layers (Terrain, Ground, Paths)
    const isCave = mapId.startsWith('caverna') || mapId.startsWith('catacumbas');

    for (const layer of mapData.layers) {
      if (layer.type !== 'tilelayer') continue;

      const layerName = (layer.name || '').toLowerCase();
      const isWaterLayer = layerName.includes('terreno') || layerName.includes('agua') || layerName.includes('water');

      const drawTileColor = (gid: number, tileX: number, tileY: number) => {
        if (isCave) {
          ctx.fillStyle = '#292524'; // Piso de pedra subterrâneo
        } else if (isWaterLayer) {
          ctx.fillStyle = '#1e3a8a'; // Oceano / Água profunda
        } else if (gid >= 1777 && gid < 2049) {
          ctx.fillStyle = '#2563eb'; // Água (tileset agua)
        } else if (tileX >= 1280 && tileY >= 1280) {
          ctx.fillStyle = '#ca8a04'; // Deserto / Areia dourada (Sudeste)
        } else if (tileX < 1280 && tileY >= 1280) {
          ctx.fillStyle = '#14532d'; // Pântano / Floresta Escura (Sudoeste)
        } else if (tileX >= 1280 && tileY < 1280) {
          ctx.fillStyle = '#64748b'; // Pedreira / Montanha rochosa (Nordeste)
        } else if (gid >= 531 && gid <= 560) {
          ctx.fillStyle = '#854d0e'; // Estradas e caminhos de terra
        } else {
          ctx.fillStyle = '#15803d'; // Gramado verde da Vila (Noroeste)
        }
        ctx.fillRect(tileX, tileY, tw, th);
      };

      if (layer.chunks) {
        for (const chunk of layer.chunks) {
          const chunkX = chunk.x * tw;
          const chunkY = chunk.y * th;

          for (let row = 0; row < chunk.height; row++) {
            for (let col = 0; col < chunk.width; col++) {
              const gid = chunk.data[row * chunk.width + col] & 0x1fffffff;
              if (gid === 0) continue;
              drawTileColor(gid, chunkX + col * tw, chunkY + row * th);
            }
          }
        }
      } else if (layer.data && layer.width && layer.height) {
        for (let row = 0; row < layer.height; row++) {
          for (let col = 0; col < layer.width; col++) {
            const gid = layer.data[row * layer.width + col] & 0x1fffffff;
            if (gid === 0) continue;
            drawTileColor(gid, col * tw, row * th);
          }
        }
      }
    }

    // 2. Draw House Walls, Ruins, and Static Colliders (Structures)
    if (colliders && colliders.length > 0) {
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;

      for (const col of colliders) {
        ctx.fillRect(col.x, col.y, col.width, col.height);
        ctx.strokeRect(col.x, col.y, col.width, col.height);
      }
    }

    // 3. Draw Portals / Cave Ruins Holes
    for (const portal of portals) {
      ctx.save();
      ctx.fillStyle = '#a855f7';
      ctx.strokeStyle = '#f3e8ff';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(portal.worldX, portal.worldY, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // 4. Draw Monsters
    ctx.fillStyle = '#ef4444';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    for (const mob of monsters) {
      ctx.beginPath();
      ctx.arc(mob.x + 8, mob.y + 6, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    ctx.restore();

    // 5. Draw Glowing Player Center Dot & Compass Direction
    ctx.save();
    // Outer pulse ring
    ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, 9, 0, Math.PI * 2);
    ctx.fill();

    // Inner bright dot
    ctx.fillStyle = '#38bdf8';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Direction cone
    const dir = playerPos.dir || 'down';
    let angle = Math.PI / 2;
    if (dir === 'up') angle = -Math.PI / 2;
    else if (dir === 'left') angle = Math.PI;
    else if (dir === 'right') angle = 0;

    const arrowDist = 10;
    const ax = centerX + Math.cos(angle) * arrowDist;
    const ay = centerY + Math.sin(angle) * arrowDist;

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ax, ay, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }, [mapData, playerPos, colliders, monsters, portals, mapId, minimapZoom, isCollapsed]);

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMinimapZoom((z) => Math.min(0.26, z + 0.04));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMinimapZoom((z) => Math.max(0.06, z - 0.04));
  };

  return (
    <div className={`minimap-hud-container ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="minimap-frame">
        {/* Header */}
        <div className="minimap-header" onClick={() => setIsCollapsed(!isCollapsed)}>
          <span className="minimap-title-text">
            🗺️ {mapId === 'map1' ? 'Superfície' : 'Caverna'}
          </span>
          <div className="minimap-controls">
            <button className="btn-minimap-tool" onClick={handleZoomIn} title="Aproximar Radar">
              +
            </button>
            <button className="btn-minimap-tool" onClick={handleZoomOut} title="Afastar Radar">
              -
            </button>
            <button className="btn-minimap-tool btn-collapse" title={isCollapsed ? 'Expandir' : 'Minimizar'}>
              {isCollapsed ? '▲' : '▼'}
            </button>
          </div>
        </div>

        {/* Radar Canvas with Structures */}
        {!isCollapsed && (
          <div className="minimap-canvas-box">
            <canvas ref={canvasRef} width={130} height={130} className="minimap-canvas" />
            <div className="minimap-crosshair" />
          </div>
        )}

        {/* Footer Coords */}
        <div className="minimap-footer-coords">
          <span>X: {Math.round(playerPos.x)}</span>
          <span>Y: {Math.round(playerPos.y)}</span>
        </div>
      </div>
    </div>
  );
}
