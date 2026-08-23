import { loadChromaKeyImage } from './imageLoader';
import { loadAllCharacterAssets, type CharacterImages } from './characters';
import { loadMonsterSprites, MONSTER_CONFIGS, type MonsterImages } from './entities';
import { ALL_MAGIC_IMAGE_PATHS } from './magic';
import type { TilesetImages } from './renderer';

export const TILESET_ASSETS: Record<string, string> = {
  otsp_tiles_01: '/assets/tiles/otsp_tiles_01.png',
  otsp_nature_01: '/assets/tiles/otsp_nature_01.png',
  otsp_walls_01: '/assets/tiles/otsp_walls_01.png',
  otsp_walls_02: '/assets/tiles/otsp_walls_02.png',
  otsp_doors_01: '/assets/tiles/otsp_doors_01.png',
  otsp_town_01: '/assets/tiles/otsp_town_01.png',
  otsp_misc_01: '/assets/tiles/otsp_misc_01.png',
  Daniel: '/assets/tiles/Daniel.png',
  Leshrot: '/assets/tiles/Leshrot.png',
  ElderDark: '/assets/tiles/ElderDark.png',
  Madarada: '/assets/tiles/Madarada.png',
  Nordberg: '/assets/tiles/Nordberg.png',
  Somni: '/assets/tiles/Somni.png',
  Way20: '/assets/tiles/Way20.png',
  wesleyt10: '/assets/tiles/wesleyt10.png',
};

export interface GameAssetCache {
  tilesets: TilesetImages;
  characters: CharacterImages;
  monsters: MonsterImages;
  magic: Record<string, HTMLImageElement>;
  items: Record<string, HTMLImageElement>;
  isLoaded: boolean;
}

const globalCache: GameAssetCache = {
  tilesets: {},
  characters: {},
  monsters: {},
  magic: {},
  items: {},
  isLoaded: false,
};

let preloadPromise: Promise<GameAssetCache> | null = null;

export async function preloadAllGameAssets(): Promise<GameAssetCache> {
  if (globalCache.isLoaded) {
    return globalCache;
  }

  if (preloadPromise) {
    return preloadPromise;
  }

  preloadPromise = (async () => {
    // 1. Load tilesets with magenta chroma-key
    const tilesetPromises = Object.entries(TILESET_ASSETS).map(async ([name, path]) => {
      try {
        const img = await loadChromaKeyImage(path, '#ff00ff');
        globalCache.tilesets[name] = img;
      } catch (err) {
        console.warn(`Failed loading tileset: ${name}`, err);
      }
    });

    // 2. Load 6 playable character asset sets
    const charPromise = loadAllCharacterAssets().then((chars) => {
      globalCache.characters = chars;
    });

    // 3. Load all 75 monster sprite sets
    const allMobTypes = Object.keys(MONSTER_CONFIGS);
    const monsterPromise = loadMonsterSprites(allMobTypes).then((monsters) => {
      globalCache.monsters = monsters;
    });

    // 4. Load all magic effect spritesheets & frames
    const magicPromises = Object.entries(ALL_MAGIC_IMAGE_PATHS).map(async ([key, path]) => {
      try {
        const img = await loadChromaKeyImage(path);
        globalCache.magic[key] = img;
      } catch (err) {
        console.warn(`Failed loading magic effect: ${key}`, err);
      }
    });

    // 5. Load equipment item textures (Thunder Wings + Angelic Wings)
    const itemPromises = [
      loadChromaKeyImage('/assets/itens/asas trovao.webp')
        .then((img) => {
          globalCache.items['wings_thunder'] = img;
        })
        .catch((err) => {
          console.warn('Failed loading thunder wings:', err);
        }),
      loadChromaKeyImage('/assets/itens/asas angelicais.webp')
        .then((img) => {
          globalCache.items['wings_angelic'] = img;
        })
        .catch((err) => {
          console.warn('Failed loading angelic wings:', err);
        }),
    ];

    await Promise.all([
      ...tilesetPromises,
      charPromise,
      monsterPromise,
      ...magicPromises,
      ...itemPromises,
    ]);

    globalCache.isLoaded = true;
    return globalCache;
  })();

  return preloadPromise;
}

export function getCachedAssets(): GameAssetCache {
  return globalCache;
}
