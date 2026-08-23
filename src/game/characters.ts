import type { Direction } from './types';
import { loadChromaKeyImage } from './imageLoader';

export type CharacterId = 'archer' | 'luxio' | 'magician' | 'necromancer' | 'paladin';

export interface CharacterDef {
  id: CharacterId;
  name: string;
  className: string;
  icon: string;
  type: 'sheet' | 'ots';
  width: number;
  height: number;
  visCenterX: number;
  feetY: number;
}

export const PLAYABLE_CHARACTERS: CharacterDef[] = [
  {
    id: 'luxio',
    name: 'Luxio',
    className: 'Guerreiro da Luz',
    icon: '⚔️',
    type: 'ots',
    width: 32,
    height: 32,
    visCenterX: 16,
    feetY: 30,
  },
  {
    id: 'archer',
    name: 'Archer',
    className: 'Arqueiro',
    icon: '🏹',
    type: 'ots',
    width: 32,
    height: 32,
    visCenterX: 15,
    feetY: 30,
  },
  {
    id: 'magician',
    name: 'Magician',
    className: 'Mago',
    icon: '🧙',
    type: 'ots',
    width: 32,
    height: 32,
    visCenterX: 17,
    feetY: 31,
  },
  {
    id: 'necromancer',
    name: 'Necromancer',
    className: 'Necromante',
    icon: '💀',
    type: 'ots',
    width: 32,
    height: 32,
    visCenterX: 16,
    feetY: 31,
  },
  {
    id: 'paladin',
    name: 'Paladin',
    className: 'Paladino',
    icon: '🛡️',
    type: 'ots',
    width: 32,
    height: 32,
    visCenterX: 14,
    feetY: 31,
  },
];

export type CharacterImages = Record<string, HTMLImageElement>;

export async function loadAllCharacterAssets(): Promise<CharacterImages> {
  const images: CharacterImages = {};

  // Load all 5 OTServ characters
  const otsClasses: CharacterId[] = ['archer', 'luxio', 'magician', 'necromancer', 'paladin'];
  const promises: Promise<void>[] = [];

  for (const cName of otsClasses) {
    for (let frame = 1; frame <= 3; frame++) {
      for (let dirNum = 1; dirNum <= 4; dirNum++) {
        const key = `${cName}_${frame}_${dirNum}`;
        const filePath = `/assets/char/${cName}/${frame}_1_1_${dirNum}.png`;

        promises.push(
          loadChromaKeyImage(filePath)
            .then((img) => {
              images[key] = img;
            })
            .catch((err) => {
              console.warn(`Failed to load char sprite: ${filePath}`, err);
            })
        );
      }
    }
  }

  await Promise.all(promises);
  return images;
}

// Convert direction to OTServ frame number (1: Up/North, 2: Right/East, 3: Down/South, 4: Left/West)
export function dirToOtsNum(dir: Direction): number {
  switch (dir) {
    case 'up':    return 1;
    case 'right': return 2;
    case 'down':  return 3;
    case 'left':  return 4;
    default:      return 3;
  }
}
