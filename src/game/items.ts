import type { WingType } from './types';

export type ItemRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type ItemSlotType = 'wings' | 'weapon' | 'armor' | 'shield' | 'amulet' | 'ring' | 'boots' | 'potion';

export interface ItemStats {
  attack?: number;
  defense?: number;
  maxHp?: number;
  maxMp?: number;
  speed?: number;
  hpRegen?: number;
  mpRegen?: number;
}

export interface ItemEffect {
  healHp?: number;
  healMp?: number;
}

export interface ItemDef {
  id: string;
  name: string;
  slotType: ItemSlotType;
  rarity: ItemRarity;
  icon: string;
  image?: string;
  wingType?: WingType;
  stats?: ItemStats;
  effect?: ItemEffect;
  quantity?: number;
  description: string;
}

export interface EquippedGear {
  wings: WingType;
  weapon: string | null;
  armor: string | null;
  shield: string | null;
  amulet: string | null;
  ring: string | null;
  boots: string | null;
}

export const ALL_ITEMS: Record<string, ItemDef> = {
  // ── Wings (Asas) ───────────────────────────────────────────────────────────
  wing_angelic: {
    id: 'wing_angelic',
    name: 'Asas Angelicais',
    slotType: 'wings',
    rarity: 'epic',
    icon: '🪽',
    image: '/assets/itens/asas angelicais.webp',
    wingType: 'angelic',
    stats: { speed: 15, maxMp: 30 },
    description: 'Asas celestiais tecidas com plumas de luz pura. Concedem velocidade graciosa e bônus de mana.',
  },
  wing_thunder: {
    id: 'wing_thunder',
    name: 'Asas do Trovão',
    slotType: 'wings',
    rarity: 'legendary',
    icon: '⚡',
    image: '/assets/itens/asas trovao.webp',
    wingType: 'thunder',
    stats: { attack: 15, speed: 20 },
    description: 'Asas forjadas no coração de uma tempestade de relâmpagos. Eletrizam todos os seus movimentos.',
  },

  // ── Weapons (Armas) ────────────────────────────────────────────────────────
  sword_wood: {
    id: 'sword_wood',
    name: 'Espada de Madeira',
    slotType: 'weapon',
    rarity: 'common',
    icon: '🗡️',
    image: '/assets/itens/wood_sword.webp',
    stats: { attack: 18, speed: 6 },
    description: 'Espada de treino esculpida em madeira maciça com empunhadura reforçada por cordas.',
  },
  wood_sword: {
    id: 'wood_sword',
    name: 'Espada de Madeira',
    slotType: 'weapon',
    rarity: 'common',
    icon: '🗡️',
    image: '/assets/itens/wood_sword.webp',
    stats: { attack: 18, speed: 6 },
    description: 'Espada de treino esculpida em madeira maciça com empunhadura reforçada por cordas.',
  },
  sword_gold: {
    id: 'sword_gold',
    name: 'Espada de Ouro',
    slotType: 'weapon',
    rarity: 'legendary',
    icon: '🗡️',
    image: '/assets/itens/gold_sword.webp',
    stats: { attack: 45, speed: 12 },
    description: 'Lâmina lendária forjada em puro ouro resplandecente. Desfere golpes velozes de poder avassalador.',
  },
  sword_light: {
    id: 'sword_light',
    name: 'Espada Radiante',
    slotType: 'weapon',
    rarity: 'rare',
    icon: '🗡️',
    stats: { attack: 25 },
    description: 'Lâmina nobre encantada com energia luminosa que desfere cortes rápidos e precisos.',
  },
  staff_shadow: {
    id: 'staff_shadow',
    name: 'Cajado das Sombras',
    slotType: 'weapon',
    rarity: 'epic',
    icon: '🔮',
    stats: { attack: 35, maxMp: 40 },
    description: 'Cajado antigo canalizador de energias abissais, potencializando o poder mágico.',
  },
  bow_elven: {
    id: 'bow_elven',
    name: 'Arco Élfico dos Bosques',
    slotType: 'weapon',
    rarity: 'rare',
    icon: '🏹',
    stats: { attack: 22, speed: 10 },
    description: 'Arco leve de madeira élfica sagrada que acelera a velocidade e mira do atirador.',
  },

  // ── Armor & Shields (Armaduras e Escudos) ───────────────────────────────────
  armor_paladin: {
    id: 'armor_paladin',
    name: 'Armadura de Placas de Titânio',
    slotType: 'armor',
    rarity: 'epic',
    icon: '🦺',
    stats: { maxHp: 60, defense: 18 },
    description: 'Armadura pesada reforçada com liga de titânio para absorver impactos devastadores.',
  },
  robe_mystic: {
    id: 'robe_mystic',
    name: 'Manto do Feiticeiro Arcano',
    slotType: 'armor',
    rarity: 'rare',
    icon: '👘',
    stats: { maxMp: 50, defense: 8 },
    description: 'Tecido com fios de mana pura, amplificando a reserva mágica do usuário.',
  },
  shield_aegis: {
    id: 'shield_aegis',
    name: 'Escudo Guardião Rúnico',
    slotType: 'shield',
    rarity: 'rare',
    icon: '🛡️',
    stats: { defense: 15, maxHp: 30 },
    description: 'Escudo ornamentado com runas protetoras ancestrais que repelem investidas inimigas.',
  },

  // ── Accessories (Acessórios) ───────────────────────────────────────────────
  amulet_heart: {
    id: 'amulet_heart',
    name: 'Amuleto do Coração de Rubi',
    slotType: 'amulet',
    rarity: 'rare',
    icon: '📿',
    stats: { maxHp: 40, hpRegen: 2 },
    description: 'Rubi pulsante com essência vital que acelera a recuperação contínua de vida.',
  },
  ring_storm: {
    id: 'ring_storm',
    name: 'Anel da Tempestade',
    slotType: 'ring',
    rarity: 'epic',
    icon: '💍',
    stats: { attack: 10, maxMp: 25 },
    description: 'Anel energizado com relâmpagos em miniatura, aumentando o dano e poder elemental.',
  },
  boots_hermes: {
    id: 'boots_hermes',
    name: 'Botas de Mercúrio',
    slotType: 'boots',
    rarity: 'rare',
    icon: '👢',
    stats: { speed: 25 },
    description: 'Botas encantadas que diminuem o atrito com o solo, concedendo grande mobilidade.',
  },

  // ── Consumables (Poções) ───────────────────────────────────────────────────
  potion_hp_large: {
    id: 'potion_hp_large',
    name: 'Poção de Vida Maior',
    slotType: 'potion',
    rarity: 'common',
    icon: '🧪',
    quantity: 5,
    effect: { healHp: 80 },
    description: 'Frasco destilado com ervas curativas. Restaura +80 pontos de Vida instantaneamente.',
  },
  potion_mp_large: {
    id: 'potion_mp_large',
    name: 'Poção de Mana Maior',
    slotType: 'potion',
    rarity: 'common',
    icon: '🧪',
    quantity: 5,
    effect: { healMp: 80 },
    description: 'Elixir cintilante de mana condensada. Restaura +80 pontos de Mana instantaneamente.',
  },
  elixir_fury: {
    id: 'elixir_fury',
    name: 'Elixir da Fúria Divina',
    slotType: 'potion',
    rarity: 'rare',
    icon: '🍷',
    quantity: 2,
    effect: { healHp: 50, healMp: 50 },
    description: 'Bebida revigorante dos guerreiros ancestrais. Recupera +50 HP e +50 MP com vigor imediato.',
  },
};

// Default starter inventory items for every player
export const DEFAULT_INVENTORY_ITEMS: ItemDef[] = [
  { ...ALL_ITEMS.wing_angelic },
  { ...ALL_ITEMS.wing_thunder },
  { ...ALL_ITEMS.sword_gold },
  { ...ALL_ITEMS.sword_wood },
  { ...ALL_ITEMS.sword_light },
  { ...ALL_ITEMS.armor_paladin },
  { ...ALL_ITEMS.shield_aegis },
  { ...ALL_ITEMS.amulet_heart },
  { ...ALL_ITEMS.ring_storm },
  { ...ALL_ITEMS.boots_hermes },
  { ...ALL_ITEMS.potion_hp_large, quantity: 8 },
  { ...ALL_ITEMS.potion_mp_large, quantity: 8 },
  { ...ALL_ITEMS.elixir_fury, quantity: 3 },
];

export const DEFAULT_EQUIPPED_GEAR: EquippedGear = {
  wings: 'angelic',
  weapon: 'sword_gold',
  armor: 'armor_paladin',
  shield: 'shield_aegis',
  amulet: 'amulet_heart',
  ring: 'ring_storm',
  boots: 'boots_hermes',
};

export function getRarityColor(rarity: ItemRarity): string {
  switch (rarity) {
    case 'legendary':
      return '#f59e0b';
    case 'epic':
      return '#c084fc';
    case 'rare':
      return '#38bdf8';
    case 'common':
    default:
      return '#94a3b8';
  }
}
