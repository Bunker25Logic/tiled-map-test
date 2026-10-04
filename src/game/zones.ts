import type { TiledMap, TiledObject } from './types';

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
  'mundo_sobrevivencia': {
    id: 'mundo_sobrevivencia',
    name: 'Mundo Sobrevivência (Superfície)',
    file: '/assets/maps/mundo_sobrevivencia.tmj',
    defaultSpawn: { x: 416, y: 560 }, // Em frente à Cabana do Jogador
  },
  'caverna_minerios': {
    id: 'caverna_minerios',
    name: 'Caverna dos Minérios',
    file: '/assets/maps/caverna_minerios.tmj',
    defaultSpawn: { x: 320, y: 320 },
  },
  'caverna_fungica': {
    id: 'caverna_fungica',
    name: 'Caverna Fúngica',
    file: '/assets/maps/caverna_fungica.tmj',
    defaultSpawn: { x: 320, y: 320 },
  },
  'catacumbas_deserto': {
    id: 'catacumbas_deserto',
    name: 'Catacumbas do Deserto',
    file: '/assets/maps/catacumbas_deserto.tmj',
    defaultSpawn: { x: 320, y: 320 },
  },
  'floresta_grande': {
    id: 'floresta_grande',
    name: 'Floresta Grande',
    file: '/assets/maps/floresta_grande.tmj',
    defaultSpawn: { x: 960, y: 960 },
  },
  // Aliases de retrocompatibilidade para contas/saves existentes
  'map1': {
    id: 'mundo_sobrevivencia',
    name: 'Mundo Sobrevivência (Superfície)',
    file: '/assets/maps/mundo_sobrevivencia.tmj',
    defaultSpawn: { x: 416, y: 560 },
  },
  'caverna-zona-1': {
    id: 'caverna_minerios',
    name: 'Caverna dos Minérios',
    file: '/assets/maps/caverna_minerios.tmj',
    defaultSpawn: { x: 320, y: 320 },
  },
  'caverna2': {
    id: 'caverna_fungica',
    name: 'Caverna Fúngica',
    file: '/assets/maps/caverna_fungica.tmj',
    defaultSpawn: { x: 320, y: 320 },
  },
  'caverna3': {
    id: 'catacumbas_deserto',
    name: 'Catacumbas do Deserto',
    file: '/assets/maps/catacumbas_deserto.tmj',
    defaultSpawn: { x: 320, y: 320 },
  },
};

export const TILESET_METADATA: Record<string, { columns: number; tilecount: number; tilewidth: number; tileheight: number }> = {
  chao: { columns: 16, tilecount: 1008, tilewidth: 32, tileheight: 32 },
  nature: { columns: 16, tilecount: 768, tilewidth: 32, tileheight: 32 },
  agua: { columns: 16, tilecount: 272, tilewidth: 32, tileheight: 32 },
  walls: { columns: 16, tilecount: 1024, tilewidth: 32, tileheight: 32 },
  walls2: { columns: 16, tilecount: 976, tilewidth: 32, tileheight: 32 },
  town: { columns: 16, tilecount: 928, tilewidth: 32, tileheight: 32 },
  otsp_doors_01: { columns: 16, tilecount: 688, tilewidth: 32, tileheight: 32 },
};

export async function fetchZoneMap(mapId: string): Promise<TiledMap> {
  const zoneKey = mapId in ZONES ? mapId : 'mundo_sobrevivencia';
  const zone = ZONES[zoneKey] || ZONES['mundo_sobrevivencia'];
  const res = await fetch(`${zone.file}?t=${Date.now()}`);
  if (!res.ok) {
    throw new Error(`HTTP Error ${res.status}: não foi possível carregar ${zone.file}`);
  }
  const data: TiledMap = await res.json();
  const fixedTilesets = data.tilesets.map((ts) => {
    let srcName = '';
    if (ts.source) {
      srcName = ts.source.replace(/.*[\\/]/, '').replace(/\.(tsx|tsj|json)$/i, '');
    }
    const name = ts.name || srcName || 'tileset';
    const baseName = (srcName || name).toLowerCase();
    const meta = TILESET_METADATA[baseName];

    let rawImage = ts.image;
    if (!rawImage) {
      rawImage = `/assets/tiles/${srcName || name}.png`;
    } else {
      const imgFileName = rawImage.replace(/.*[\\/]/, '').replace(/\.(tsx|tsj|json)$/i, '.png');
      rawImage = `/assets/tiles/${imgFileName}`;
    }

    return {
      ...ts,
      name,
      image: rawImage,
      columns: ts.columns || meta?.columns || 16,
      tilewidth: ts.tilewidth || meta?.tilewidth || 32,
      tileheight: ts.tileheight || meta?.tileheight || 32,
      tilecount: ts.tilecount || meta?.tilecount || 1008,
    };
  });

  return {
    ...data,
    tilesets: fixedTilesets,
  };
}

/**
 * Extrai todos os buracos, escadas e gatilhos de teleporte (cavernas/superfície)
 * diretamente das camadas de objetos e propriedades do mapa Tiled.
 */
export function getMapPortals(_mapId: string, mapData: TiledMap): PortalDef[] {
  const portals: PortalDef[] = [];
  const candidateObjects: Array<{ obj: TiledObject; offX: number; offY: number }> = [];

  for (const layer of mapData.layers) {
    if (layer.type !== 'objectgroup' || !layer.objects) continue;
    const offX = layer.offsetx ?? 0;
    const offY = layer.offsety ?? 0;

    for (const obj of layer.objects) {
      const objType = (obj.type || '').toLowerCase();
      const objName = (obj.name || '').toLowerCase();
      const isTrigger =
        objType.includes('trigger') ||
        objType.includes('portal') ||
        objType.includes('caveentrance') ||
        objType.includes('exitladder') ||
        objName.includes('entrada') ||
        objName.includes('saida') ||
        objName.includes('portal') ||
        objName.includes('buraco') ||
        objName.includes('escada');

      if (isTrigger) {
        candidateObjects.push({ obj, offX, offY });
      }
    }
  }

  // Prioriza objetos que contêm explicitamente a propriedade 'destination_map'
  candidateObjects.sort((a, b) => {
    const aHasProps = Boolean(a.obj.properties?.some((p) => p.name === 'destination_map'));
    const bHasProps = Boolean(b.obj.properties?.some((p) => p.name === 'destination_map'));
    return (bHasProps ? 1 : 0) - (aHasProps ? 1 : 0);
  });

  for (const { obj, offX, offY } of candidateObjects) {
    const objType = (obj.type || '').toLowerCase();
    const objName = (obj.name || '').toLowerCase();

    const destProp = obj.properties?.find((p) => p.name === 'destination_map')?.value as string | undefined;
    const sxProp = obj.properties?.find((p) => p.name === 'spawn_x')?.value as number | undefined;
    const syProp = obj.properties?.find((p) => p.name === 'spawn_y')?.value as number | undefined;

    const objW = obj.width || 32;
    const objH = obj.height || 32;
    const worldX = Math.round(obj.x + offX + objW / 2);
    // No Tiled: objetos com gid têm y na base; formas retangulares têm y no topo
    const worldY = Math.round(obj.gid ? obj.y + offY - objH / 2 : obj.y + offY + objH / 2);

    let targetMapId = '';
    let targetSpawnX = 0;
    let targetSpawnY = 0;
    let friendlyName = obj.name || 'Portal';

    if (destProp) {
      targetMapId = destProp.replace(/.*[\\/]/, '').replace(/\.tmj$/i, '');
      // Coordenadas em tiles (< 100) são convertidas para pixels
      targetSpawnX = sxProp !== undefined ? (sxProp < 100 ? sxProp * 32 : sxProp) : 320;
      targetSpawnY = syProp !== undefined ? (syProp < 100 ? syProp * 32 : syProp) : 320;
    }

    let promptText: string;
    if (objName.includes('minerios')) {
      targetMapId = targetMapId || 'caverna_minerios';
      targetSpawnX = targetSpawnX || 320;
      targetSpawnY = targetSpawnY || 320;
      friendlyName = 'Caverna dos Minérios';
      promptText = '⛏️ [E] Entrar na Caverna dos Minérios';
    } else if (objName.includes('fungica')) {
      targetMapId = targetMapId || 'caverna_fungica';
      targetSpawnX = targetSpawnX || 320;
      targetSpawnY = targetSpawnY || 320;
      friendlyName = 'Caverna Fúngica';
      promptText = '🍄 [E] Entrar na Caverna Fúngica';
    } else if (objName.includes('catacumba')) {
      targetMapId = targetMapId || 'catacumbas_deserto';
      targetSpawnX = targetSpawnX || 320;
      targetSpawnY = targetSpawnY || 320;
      friendlyName = 'Catacumbas do Deserto';
      promptText = '⚰️ [E] Entrar nas Catacumbas do Deserto';
    } else if (objName.includes('saida') || objType.includes('exit')) {
      targetMapId = targetMapId || 'mundo_sobrevivencia';
      friendlyName = 'Escada para a Superfície';
      promptText = '🪜 [E] Subir para a Superfície';
    } else {
      promptText = `[E] Entrar em ${friendlyName}`;
    }

    if (targetMapId) {
      // Evita duplicatas se o mapa contiver tanto o tile gráfico quanto o trigger na mesma posição
      const alreadyAdded = portals.some(
        (p) => p.targetMapId === targetMapId && Math.hypot(p.worldX - worldX, p.worldY - worldY) < 64
      );
      if (!alreadyAdded) {
        portals.push({
          id: `portal_${obj.id || portals.length + 1}`,
          name: friendlyName,
          worldX,
          worldY,
          radius: 48,
          targetMapId,
          targetSpawnX,
          targetSpawnY,
          promptText,
        });
      }
    }
  }

  return portals;
}
