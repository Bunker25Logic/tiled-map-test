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
    defaultSpawn: { x: 1536, y: -20544 }, // tile X:48, Y:-642
  },
  'caverna-zona-1': {
    id: 'caverna-zona-1',
    name: 'Caverna Subterr�nea (Zona 1)',
    file: '/caverna-zona-1.tmj',
    defaultSpawn: { x: 43, y: 126 },
  },
  'caverna2': {
    id: 'caverna2',
    name: 'Caverna Subterr�nea (Atalho Ilha 4)',
    file: '/caverna2.tmj',
    defaultSpawn: { x: 50, y: 112 },
  },
  'caverna3': {
    id: 'caverna3',
    name: 'Caverna Subterr�nea (Ilha 4 para Ilha 5)',
    file: '/caverna 3 ilha 4 para ilha 5.tmj',
    defaultSpawn: { x: 80, y: 172 },
  },
};

export async function fetchZoneMap(mapId: string): Promise<TiledMap> {
  const zone = ZONES[mapId] || ZONES['map1'];
  const res = await fetch(`${zone.file}?t=${Date.now()}`);
  if (!res.ok) {
    throw new Error(`HTTP Error ${res.status}: n�o foi poss�vel carregar ${zone.file}`);
  }
  const data: TiledMap = await res.json();
  const fixedTilesets = data.tilesets.map((ts) => {
    let rawImage = ts.image;
    let name = ts.name;
    if (!rawImage && ts.source) {
      const srcName = ts.source.replace(/.*[\\/]/, '').replace(/\.tsx$/i, '');
      rawImage = `/assets/tiles/${srcName}.png`;
      if (!name) name = srcName;
    }
    if (rawImage) {
      const fileName = rawImage.replace(/.*[\\/]/, '').replace(/\.tsx$/i, '.png');
      const baseName = fileName.replace(/\.png$/i, '');
      return {
        ...ts,
        name: name || baseName,
        image: `/assets/tiles/${fileName}`,
        columns: ts.columns || 16,
        tilewidth: ts.tilewidth || 32,
        tileheight: ts.tileheight || 32,
        tilecount: ts.tilecount || (baseName === 'otsp_nature_01' ? 768 : 1008),
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
    // 1. Ruin Hole -> Cave 1 Entrance (Island 1)
    let ruinX = -306;
    let ruinY = -205;

    // 2. Desert Hole -> Cave 1 Exit (Island 2)
    let desertX = 1058;
    let desertY = 129;

    // 3. Second Island / Northwest Hole -> Cave 2 Entrance (point 1170)
    let island2CaveX = -90;
    let island2CaveY = -1845;

    // 4. Island 4 Hole -> Cave 2 Exit (point 1172/1174)
    let island4X = 430.5;
    let island4Y = -1847.2;

    // 5. Island 4 Hole -> Cave 3 Entrance (point 1454 at x: 1365, y: -1777 / x: 1355)
    let island4Cave3X = 1355;
    let island4Cave3Y = -1778;

    // 6. Island 5 Hole -> Cave 3 Exit (point 1449 at x: 2036, y: -1846.67)
    let island5Cave3X = 2036;
    let island5Cave3Y = -1846.67;

    for (const layer of mapData.layers) {
      if (layer.type !== 'objectgroup' || !layer.objects) continue;
      for (const obj of layer.objects) {
        const objName = (obj.name || '').toLowerCase().trim();

        if (objName === 'entrada') {
          ruinX = obj.x + (obj.width ? obj.width / 2 : 16);
          ruinY = obj.y - (obj.height ? obj.height / 2 : 16);
        } else if (objName === 'saida') {
          desertX = obj.x + (obj.width ? obj.width / 2 : 16);
          desertY = obj.y - (obj.height ? obj.height / 2 : 16);
        } else if (obj.point && obj.x < 100 && obj.y < -1500) {
          // Point object 1170 on Island 2
          island2CaveX = obj.x;
          island2CaveY = obj.y;
        } else if (obj.point && obj.x > 200 && obj.x < 800 && obj.y < -1500) {
          // Point object 1174 on Island 4 (West side)
          island4X = obj.x;
          island4Y = obj.y;
        } else if (obj.point && obj.x > 1200 && obj.x < 1600 && obj.y < -1500) {
          // Point object 1454 on Island 4 (East side hole to Cave 3)
          island4Cave3X = obj.x;
          island4Cave3Y = obj.y;
        } else if (obj.point && obj.x > 1800 && obj.x < 2400 && obj.y < -1500) {
          // Point object 1449 on Island 5 (Cave 3 hole)
          island5Cave3X = obj.x;
          island5Cave3Y = obj.y;
        }
      }
    }

    // Portal 1: Ruin Hole -> Cave 1 (Island 1)
    portals.push({
      id: 'map1_ruin_to_cave',
      name: 'Buraco das Ru�nas (Ilha 1)',
      worldX: ruinX,
      worldY: ruinY,
      radius: 48,
      targetMapId: 'caverna-zona-1',
      targetSpawnX: 43,
      targetSpawnY: 126,
      promptText: '??? Descer no Buraco das Ru�nas (Caverna Zona 1)',
    });

    // Portal 2: Desert Hole -> Cave 1 (Island 2)
    portals.push({
      id: 'map1_desert_to_cave',
      name: 'Buraco do Deserto (Ilha 2)',
      worldX: desertX,
      worldY: desertY,
      radius: 48,
      targetMapId: 'caverna-zona-1',
      targetSpawnX: 1245,
      targetSpawnY: 145,
      promptText: '??? Descer no Buraco do Deserto (Caverna Zona 1)',
    });

    // Portal 3: Second Island Hole -> Cave 2 Entrance
    portals.push({
      id: 'map1_island2_to_cave2',
      name: 'Buraco de Entrada da Caverna 2',
      worldX: island2CaveX,
      worldY: island2CaveY,
      radius: 54,
      targetMapId: 'caverna2',
      targetSpawnX: 50,
      targetSpawnY: 112,
      promptText: '??? Entrar na Caverna 2 (Atalho Quarta Ilha)',
    });

    // Portal 4: Island 4 Hole (West) -> Cave 2 Exit
    portals.push({
      id: 'map1_island4_to_cave2',
      name: 'Buraco da Quarta Ilha (Ilha 4 - Oeste)',
      worldX: island4X,
      worldY: island4Y,
      radius: 54,
      targetMapId: 'caverna2',
      targetSpawnX: 430,
      targetSpawnY: 108,
      promptText: '??? Descer na Caverna 2 (Voltar para Ilha 2)',
    });

    // Portal 5: Island 4 Hole (East) -> Cave 3 Entrance (leads to Island 5)
    portals.push({
      id: 'map1_island4_to_cave3',
      name: 'Buraco da Ilha 4 para Ilha 5',
      worldX: island4Cave3X,
      worldY: island4Cave3Y,
      radius: 58,
      targetMapId: 'caverna3',
      targetSpawnX: 80,
      targetSpawnY: 172,
      promptText: '??? Entrar na Caverna 3 (Travessia Ilha 4 para Ilha 5)',
    });

    // Portal 6: Island 5 Hole -> Cave 3 (leads back to Island 4)
    portals.push({
      id: 'map1_island5_to_cave3',
      name: 'Buraco da Quinta Ilha (Ilha 5)',
      worldX: island5Cave3X,
      worldY: island5Cave3Y,
      radius: 58,
      targetMapId: 'caverna3',
      targetSpawnX: 1040,
      targetSpawnY: 140,
      promptText: '??? Entrar na Caverna 3 (Voltar para Ilha 4)',
    });
  } else if (mapId === 'caverna-zona-1') {
    // Cave 1 Start -> Ruin hole on surface
    let caveStartX = 43;
    let caveStartY = 126;

    // Cave 1 End -> Desert hole on surface
    let caveEndX = 1245;
    let caveEndY = 145;

    for (const layer of mapData.layers) {
      if (layer.type !== 'objectgroup' || !layer.objects) continue;
      for (const obj of layer.objects) {
        const objName = (obj.name || '').toLowerCase().trim();
        if (objName === 'entrada') {
          caveStartX = obj.x;
          caveStartY = obj.y;
        } else if (objName === 'saida') {
          caveEndX = obj.x;
          caveEndY = obj.y;
        }
      }
    }

    portals.push({
      id: 'cave_to_ruin',
      name: 'Subida da Caverna (Ru�nas - Ilha 1)',
      worldX: caveStartX,
      worldY: caveStartY,
      radius: 40,
      targetMapId: 'map1',
      targetSpawnX: -306,
      targetSpawnY: -190,
      promptText: '?? Subir para a Primeira Ilha (Ru�nas)',
    });

    portals.push({
      id: 'cave_to_desert',
      name: 'Buraco de Sa�da (Deserto - Ilha 2)',
      worldX: caveEndX,
      worldY: caveEndY,
      radius: 40,
      targetMapId: 'map1',
      targetSpawnX: 1058,
      targetSpawnY: 129,
      promptText: '??? Sair da Caverna para a Segunda Ilha (Deserto)',
    });
  } else if (mapId === 'caverna2') {
    // Cave 2 Left side -> Entrance hole on surface (Island 2)
    let cave2StartX = 50;
    let cave2StartY = 112.67;

    // Cave 2 Right side -> Island 4 hole on surface
    let cave2EndX = 430;
    let cave2EndY = 108.67;

    for (const layer of mapData.layers) {
      if (layer.type !== 'objectgroup' || !layer.objects) continue;
      for (const obj of layer.objects) {
        const objName = (obj.name || '').toLowerCase().trim();
        if (objName === 'entrada' || (obj.point && obj.x < 100)) {
          cave2StartX = obj.x;
          cave2StartY = obj.y;
        } else if (objName === 'saida' || (obj.point && obj.x > 300)) {
          cave2EndX = obj.x;
          cave2EndY = obj.y;
        }
      }
    }

    portals.push({
      id: 'cave2_to_desert',
      name: 'Subida da Caverna 2 (Ilha 2)',
      worldX: cave2StartX,
      worldY: cave2StartY,
      radius: 40,
      targetMapId: 'map1',
      targetSpawnX: -90,
      targetSpawnY: -1845,
      promptText: '?? Subir para a Segunda Ilha',
    });

    portals.push({
      id: 'cave2_to_island4',
      name: 'Subida da Caverna 2 (Quarta Ilha)',
      worldX: cave2EndX,
      worldY: cave2EndY,
      radius: 40,
      targetMapId: 'map1',
      targetSpawnX: 430.5,
      targetSpawnY: -1847.2,
      promptText: '?? Subir para a Quarta Ilha (Nova Ilha)',
    });
  } else if (mapId === 'caverna3') {
    // Cave 3 Left Side (Entry from Island 4 - Point 453)
    let cave3StartX = 80;
    let cave3StartY = 172;

    // Cave 3 Right Side (Entry from Island 5 - Point 452)
    let cave3EndX = 1040;
    let cave3EndY = 140;

    for (const layer of mapData.layers) {
      if (layer.type !== 'objectgroup' || !layer.objects) continue;
      for (const obj of layer.objects) {
        if (obj.point && obj.x < 200) {
          cave3StartX = obj.x;
          cave3StartY = obj.y;
        } else if (obj.point && obj.x > 800) {
          cave3EndX = obj.x;
          cave3EndY = obj.y;
        }
      }
    }

    portals.push({
      id: 'cave3_to_island4',
      name: 'Subida da Caverna 3 (Ilha 4)',
      worldX: cave3StartX,
      worldY: cave3StartY,
      radius: 44,
      targetMapId: 'map1',
      targetSpawnX: 1355,
      targetSpawnY: -1778,
      promptText: '?? Subir para a Quarta Ilha (Ilha 4)',
    });

    portals.push({
      id: 'cave3_to_island5',
      name: 'Subida da Caverna 3 (Ilha 5)',
      worldX: cave3EndX,
      worldY: cave3EndY,
      radius: 44,
      targetMapId: 'map1',
      targetSpawnX: 2036,
      targetSpawnY: -1846.67,
      promptText: '?? Subir para a Quinta Ilha (Ilha 5)',
    });
  }

  return portals;
}
