import type { TiledMap } from './types';

export interface PortalDef {
  id: string;
  name: string;
  // Position in current map
  worldX: number;
  worldY: number;
  radius: number;
  // Destination
  targetMapId: string;
  targetSpawnX: number;
  targetSpawnY: number;
  promptText: string;
}

export interface ZoneDef {
  id: string;
  name: string;
  file: string;
  defaultSpawn: { x: number; y: number };
}

export const ZONES: Record<string, ZoneDef> = {
  'map1': {
    id: 'map1',
    name: 'Superfície de Tibia',
    file: '/map1.tmj',
    defaultSpawn: { x: 0, y: 0 },
  },
  'caverna-zona-1': {
    id: 'caverna-zona-1',
    name: 'Caverna Subterrânea (Zona 1)',
    file: '/caverna-zona-1.tmj',
    defaultSpawn: { x: 43, y: 126 },
  },
};

export async function fetchZoneMap(mapId: string): Promise<TiledMap> {
  const zone = ZONES[mapId] || ZONES['map1'];
  const res = await fetch(`${zone.file}?t=${Date.now()}`);
  if (!res.ok) {
    throw new Error(`HTTP Error ${res.status}: não foi possível carregar ${zone.file}`);
  }
  const data: TiledMap = await res.json();
  const fixedTilesets = data.tilesets.map((ts) => {
    if (ts.image) {
      const fileName = ts.image.replace(/.*[\\/]/, '');
      return {
        ...ts,
        image: `/assets/tiles/${fileName}`,
        columns: ts.columns || 16,
        tilewidth: ts.tilewidth || 32,
        tileheight: ts.tileheight || 32,
      };
    }
    return ts;
  });

  return {
    ...data,
    tilesets: fixedTilesets,
  };
}

/**
 * Extracts all interactive hole/portal points from the map object layers.
 */
export function getMapPortals(mapId: string, mapData: TiledMap): PortalDef[] {
  const portals: PortalDef[] = [];

  if (mapId === 'map1') {
    // 1. Ruin Hole -> Cave Entrance
    let ruinX = -306;
    let ruinY = -205;

    // 2. Desert Hole -> Cave Exit (on the golden sand island)
    let desertX = 1200;
    let desertY = 113;

    for (const layer of mapData.layers) {
      if (layer.type !== 'objectgroup' || !layer.objects) continue;
      for (const obj of layer.objects) {
        if (obj.name === 'entrada') {
          ruinX = obj.x + (obj.width ? obj.width / 2 : 16);
          ruinY = obj.y - (obj.height ? obj.height / 2 : 16);
        } else if (obj.name === 'saida') {
          desertX = obj.x + (obj.width ? obj.width / 2 : 16);
          desertY = obj.y - (obj.height ? obj.height / 2 : 16);
        }
      }
    }

    portals.push({
      id: 'map1_ruin_to_cave',
      name: 'Buraco das Ruínas',
      worldX: ruinX,
      worldY: ruinY,
      radius: 28,
      targetMapId: 'caverna-zona-1',
      targetSpawnX: 43,
      targetSpawnY: 126,
      promptText: '🕳️ Descer no Buraco das Ruínas (Caverna Zona 1)',
    });

    portals.push({
      id: 'map1_desert_to_cave',
      name: 'Buraco do Deserto',
      worldX: desertX,
      worldY: desertY,
      radius: 28,
      targetMapId: 'caverna-zona-1',
      targetSpawnX: 1245,
      targetSpawnY: 145,
      promptText: '🕳️ Descer no Buraco do Deserto (Caverna Zona 1)',
    });
  } else if (mapId === 'caverna-zona-1') {
    // Cave Start -> Ruin hole on surface
    let caveStartX = 43;
    let caveStartY = 126;

    // Cave End -> Desert hole on surface
    let caveEndX = 1245;
    let caveEndY = 145;

    for (const layer of mapData.layers) {
      if (layer.type !== 'objectgroup' || !layer.objects) continue;
      for (const obj of layer.objects) {
        if (obj.name === 'entrada') {
          caveStartX = obj.x;
          caveStartY = obj.y;
        } else if (obj.name === 'saida') {
          caveEndX = obj.x;
          caveEndY = obj.y;
        }
      }
    }

    portals.push({
      id: 'cave_to_ruin',
      name: 'Subida da Caverna (Ruínas)',
      worldX: caveStartX,
      worldY: caveStartY,
      radius: 28,
      targetMapId: 'map1',
      targetSpawnX: -306,
      targetSpawnY: -190,
      promptText: '🧗 Subir para a Superfície (Ruínas)',
    });

    portals.push({
      id: 'cave_to_desert',
      name: 'Buraco de Saída (Deserto)',
      worldX: caveEndX,
      worldY: caveEndY,
      radius: 28,
      targetMapId: 'map1',
      targetSpawnX: 1200,
      targetSpawnY: 113,
      promptText: '🕳️ Sair da Caverna para o Deserto de Areia',
    });
  }

  return portals;
}
