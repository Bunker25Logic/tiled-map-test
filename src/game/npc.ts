import type { Direction } from './types';
import { loadChromaKeyImage } from './imageLoader';

export type NPCId = 'jack' | 'nano' | 'split';

export interface NPCShopItem {
  itemId: string;
  priceInSilver: number;
}

export interface NPCDef {
  id: NPCId;
  name: string;
  title: string;
  role: 'blacksmith' | 'alchemist' | 'priest';
  greeting: string;
  dialogue: string;
  mapId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  hitboxW: number;
  hitboxH: number;
  shadowRadiusX: number;
  shadowRadiusY: number;
  defaultDir: Direction;
  shopItems?: NPCShopItem[];
  offersBlessing?: boolean;
  blessingCostGold?: number;
}

export const NPCS_CONFIG: Record<NPCId, NPCDef> = {
  nano: {
    id: 'nano',
    name: 'Nano',
    title: 'Mestre Ferreiro e Mercador Anão',
    role: 'blacksmith',
    greeting: 'Pelas forjas de Kazordoon! O que um valente guerreiro procura hoje?',
    dialogue:
      'Forjo lâminas e armaduras afiadas com o mais nobre aço do continente. Se você trouxe espadas, escudos ou troféus encontrados nas masmorras, pago um preço justo em moedas de prata e ouro!',
    mapId: 'map1',
    x: 23 - 96,   // à esquerda do spawn
    y: -32,
    width: 32,
    height: 32,
    hitboxW: 16,
    hitboxH: 10,
    shadowRadiusX: 11,
    shadowRadiusY: 5,
    defaultDir: 'right',
    shopItems: [
      { itemId: 'wood_sword', priceInSilver: 100 },     // 1 Ouro
      { itemId: 'sword_light', priceInSilver: 4500 },    // 45 Ouros
      { itemId: 'bow_elven', priceInSilver: 2500 },      // 25 Ouros
      { itemId: 'staff_shadow', priceInSilver: 5000 },   // 50 Ouros
      { itemId: 'shield_aegis', priceInSilver: 3000 },   // 30 Ouros
      { itemId: 'boots_hermes', priceInSilver: 2000 },   // 20 Ouros
      { itemId: 'armor_paladin', priceInSilver: 8000 },  // 80 Ouros
    ],
  },
  split: {
    id: 'split',
    name: 'Split',
    title: 'Mestra Alquimista Arcana',
    role: 'alchemist',
    greeting: 'Aproxime-se do caldeirão arcano... Sinto a fragrância de mana pura no ar.',
    dialogue:
      'Aventureiro prudente jamais desce às profundezas sem poções revigorantes! Meus elixires fecham as piores feridas e saciam a sede mágica instantaneamente.',
    mapId: 'map1',
    x: 23 + 96,   // à direita do spawn
    y: -32,
    width: 64,
    height: 64,
    hitboxW: 18,
    hitboxH: 12,
    shadowRadiusX: 14,
    shadowRadiusY: 6,
    defaultDir: 'left',
    shopItems: [
      { itemId: 'potion_hp_large', priceInSilver: 40 },  // 40 Pratas
      { itemId: 'potion_mp_large', priceInSilver: 50 },  // 50 Pratas
      { itemId: 'elixir_fury', priceInSilver: 300 },     // 3 Ouros (300 Pratas)
    ],
  },
  jack: {
    id: 'jack',
    name: 'Jack',
    title: 'Guardião Sagrado do Templo',
    role: 'priest',
    greeting: 'Que a luz dos Deuses de Tibia proteja seus passos nesta terra perigosa.',
    dialogue:
      'A morte neste mundo drena a alma e arranca 10% de toda a sua experiência acumulada. Como Sacerdote do Templo, posso conceder a Bênção Sagrada por 10 Moedas de Ouro. Com ela, a perda de XP ao cair em combate cai de 10% para meros 2%!',
    mapId: 'map1',
    x: 23,         // acima do spawn
    y: -32 - 80,
    width: 64,
    height: 64,
    hitboxW: 20,
    hitboxH: 14,
    shadowRadiusX: 16,
    shadowRadiusY: 7,
    defaultDir: 'down',
    offersBlessing: true,
    blessingCostGold: 10,
  },
};


export type NPCImages = Record<string, HTMLImageElement>;

/**
 * Loads all NPC sprites from /assets/npc/{id}/{frame}_1_1_{dir}.png
 */
export async function loadNPCSprites(): Promise<NPCImages> {
  const images: NPCImages = {};
  const promises: Promise<void>[] = [];
  const npcIds: NPCId[] = ['jack', 'nano', 'split'];

  for (const id of npcIds) {
    for (let frame = 1; frame <= 3; frame++) {
      for (let dir = 1; dir <= 4; dir++) {
        const key = `${id}_${frame}_${dir}`;
        const path = `/assets/npc/${id}/${frame}_1_1_${dir}.png`;

        promises.push(
          loadChromaKeyImage(path)
            .then((img) => {
              images[key] = img;
            })
            .catch((err) => {
              console.warn(`[NPC] Failed to load sprite for ${id}: ${path}`, err);
            })
        );
      }
    }
  }

  await Promise.all(promises);
  return images;
}

/**
 * Calculates direction to face player when nearby
 */
export function getNPCDirectionTowards(
  npcX: number,
  npcY: number,
  playerX: number,
  playerY: number,
  defaultDir: Direction
): Direction {
  const dx = playerX - npcX;
  const dy = playerY - npcY;
  const dist = Math.hypot(dx, dy);

  // If player is within 120px, turn towards player
  if (dist < 120) {
    if (Math.abs(dx) > Math.abs(dy)) {
      return dx > 0 ? 'right' : 'left';
    } else {
      return dy > 0 ? 'down' : 'up';
    }
  }
  return defaultDir;
}

/**
 * Maps direction to OTS direction index (1=down, 2=left, 3=up, 4=right)
 */
export function npcDirToNum(dir: Direction): number {
  switch (dir) {
    case 'down':  return 1;
    case 'left':  return 2;
    case 'up':    return 3;
    case 'right': return 4;
    default:      return 1;
  }
}
