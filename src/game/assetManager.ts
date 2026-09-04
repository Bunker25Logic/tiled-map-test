import { loadChromaKeyImage } from './imageLoader';
import { loadAllCharacterAssets, type CharacterImages } from './characters';
import { loadMonsterSprites, MONSTER_CONFIGS, type MonsterImages } from './entities';
import { ALL_MAGIC_IMAGE_PATHS } from './magic';
import type { TilesetImages } from './renderer';
import { ITEM_OFFSETS } from './itemOffsets';

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

    // 5. Load equipment item textures and coin sprite sheets
    const itemPromises = [
      loadChromaKeyImage('/assets/itens/swords/gold_sword.webp')
        .then((img) => {
          globalCache.items['sword_gold'] = img;
          globalCache.items['gold_sword'] = img;
        })
        .catch((err) => {
          console.warn('Failed loading gold sword texture:', err);
        }),
      fetch('/assets/itens/positions/gold_sword_offsets.json')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.offsets) {
            ITEM_OFFSETS['sword_gold'] = data;
            ITEM_OFFSETS['gold_sword'] = data;
          }
        })
        .catch((err) => {
          console.warn('Using static ITEM_OFFSETS for gold_sword:', err);
        }),
      loadChromaKeyImage('/assets/itens/swords/wood_sword.webp')
        .then((img) => {
          globalCache.items['sword_wood'] = img;
          globalCache.items['wood_sword'] = img;
        })
        .catch((err) => {
          console.warn('Failed loading wood sword texture:', err);
        }),
      fetch('/assets/itens/positions/wood_sword_offsets.json')
        .then((res) => res.json())
        .then((data) => {
          if (data && data.offsets) {
            ITEM_OFFSETS['sword_wood'] = data;
            ITEM_OFFSETS['wood_sword'] = data;
          }
        })
        .catch((err) => {
          console.warn('Using static ITEM_OFFSETS for wood_sword:', err);
        }),
      loadChromaKeyImage('/assets/itens/swords/radiant_sword.webp')
        .then((img) => {
          globalCache.items['sword_light'] = img;
          globalCache.items['radiant_sword'] = img;
        })
        .catch((err) => {
          console.warn('Failed loading radiant sword texture:', err);
        }),
      loadChromaKeyImage('/assets/itens/asas/asas angelicais.webp')
        .then((img) => {
          globalCache.items['wings_angelic'] = img;
        })
        .catch((err) => {
          console.warn('Failed loading angelic wings:', err);
        }),
      loadChromaKeyImage('/assets/itens/gold.png')
        .then((img) => {
          globalCache.items['coin_gold'] = img;
        })
        .catch((err) => {
          console.warn('Failed loading gold coin sheet:', err);
        }),
      loadChromaKeyImage('/assets/itens/silver.png')
        .then((img) => {
          globalCache.items['coin_silver'] = img;
        })
        .catch((err) => {
          console.warn('Failed loading silver coin sheet:', err);
        }),
      loadChromaKeyImage('/assets/itens/basalt.png')
        .then((img) => {
          globalCache.items['coin_basalt'] = img;
        })
        .catch((err) => {
          console.warn('Failed loading basalt coin sheet:', err);
        }),
      loadChromaKeyImage('/assets/itens/blood/1.png', '#ff00ff')
        .then((img) => {
          globalCache.items['blood_1'] = img;
        })
        .catch((err) => {
          console.warn('Failed loading blood stage 1:', err);
        }),
      loadChromaKeyImage('/assets/itens/blood/2.png', '#ff00ff')
        .then((img) => {
          globalCache.items['blood_2'] = img;
        })
        .catch((err) => {
          console.warn('Failed loading blood stage 2:', err);
        }),
      loadChromaKeyImage('/assets/itens/blood/3.png', '#ff00ff')
        .then((img) => {
          globalCache.items['blood_3'] = img;
        })
        .catch((err) => {
          console.warn('Failed loading blood stage 3:', err);
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
