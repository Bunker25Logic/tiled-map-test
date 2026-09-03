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
  frameCount?: number;
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
    image: '/assets/itens/asas/asas angelicais.webp',
    wingType: 'angelic',
    stats: { speed: 15, maxMp: 30 },
    description: 'Asas celestiais tecidas com plumas de luz pura. Concedem velocidade graciosa e bônus de mana.',
  },

  // ── Weapons (Armas) ────────────────────────────────────────────────────────
  sword_wood: {
    id: 'sword_wood',
    name: 'Espada de Madeira',
    slotType: 'weapon',
    rarity: 'common',
    icon: '🗡️',
    image: '/assets/itens/swords/wood_sword.webp',
    stats: { attack: 18, speed: 6 },
    description: 'Espada de treino esculpida em madeira maciça com empunhadura reforçada por cordas.',
  },
  wood_sword: {
    id: 'wood_sword',
    name: 'Espada de Madeira',
    slotType: 'weapon',
    rarity: 'common',
    icon: '🗡️',
    image: '/assets/itens/swords/wood_sword.webp',
    stats: { attack: 18, speed: 6 },
    description: 'Espada de treino esculpida em madeira maciça com empunhadura reforçada por cordas.',
  },
  sword_gold: {
    id: 'sword_gold',
    name: 'Espada de Ouro',
    slotType: 'weapon',
    rarity: 'legendary',
    icon: '🗡️',
    image: '/assets/itens/swords/gold_sword.webp',
    stats: { attack: 45, speed: 12 },
    description: 'Lâmina lendária forjada em puro ouro resplandecente. Desfere golpes velozes de poder avassalador.',
  },
  gold_sword: {
    id: 'gold_sword',
    name: 'Espada de Ouro',
    slotType: 'weapon',
    rarity: 'legendary',
    icon: '🗡️',
    image: '/assets/itens/swords/gold_sword.webp',
    stats: { attack: 45, speed: 12 },
    description: 'Lâmina lendária forjada em puro ouro resplandecente. Desfere golpes velozes de poder avassalador.',
  },
  sword_light: {
    id: 'sword_light',
    name: 'Espada Radiante',
    slotType: 'weapon',
    rarity: 'rare',
    icon: '🗡️',
    image: '/assets/itens/swords/radiant_sword.webp',
    stats: { attack: 28, speed: 8 },
    description: 'Lâmina nobre encantada com energia luminosa. Emite um pulsar neon branco celestial constante.',
  },
  radiant_sword: {
    id: 'radiant_sword',
    name: 'Espada Radiante',
    slotType: 'weapon',
    rarity: 'rare',
    icon: '🗡️',
    image: '/assets/itens/swords/radiant_sword.webp',
    stats: { attack: 28, speed: 8 },
    description: 'Lâmina nobre encantada com energia luminosa. Emite um pulsar neon branco celestial constante.',
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
  // ── Anéis de Poder Animados (Tibia Classic Rings) ────────────────────────
  ring_energy: {
    id: 'ring_energy',
    name: 'Energy Ring',
    slotType: 'ring',
    rarity: 'rare',
    icon: '💍',
    image: '/assets/itens/aneis/201420-201423.png',
    frameCount: 4,
    stats: { maxMp: 120, mpRegen: 4, defense: 6 },
    description: 'Anel reluzente de safira mágica azul. Canaliza energia arcana pura, expandindo sua reserva de Mana.',
  },
  ring_amethyst: {
    id: 'ring_amethyst',
    name: 'Ring of the Sky',
    slotType: 'ring',
    rarity: 'epic',
    icon: '💍',
    image: '/assets/itens/aneis/201424-201427.png',
    frameCount: 4,
    stats: { defense: 10, maxMp: 80, mpRegen: 3 },
    description: 'Lendário anel celestial de ametista sagrada. Concede proteção mística superior e bênção espiritual.',
  },
  ring_life: {
    id: 'ring_life',
    name: 'Life Ring',
    slotType: 'ring',
    rarity: 'rare',
    icon: '💍',
    image: '/assets/itens/aneis/201428-201431.png',
    frameCount: 4,
    stats: { hpRegen: 6, mpRegen: 8, maxHp: 50, maxMp: 60 },
    description: 'Anel encantado com gema verde-água vital. Concede regeneração contínua de Vida e Mana a cada instante.',
  },
  ring_healing: {
    id: 'ring_healing',
    name: 'Ring of Healing',
    slotType: 'ring',
    rarity: 'epic',
    icon: '💍',
    image: '/assets/itens/aneis/201432-201435.png',
    frameCount: 4,
    stats: { hpRegen: 15, mpRegen: 20, maxHp: 100, maxMp: 120 },
    description: 'O mais potente anel de restauração do Tibia. Sua esmeralda radiante regenera Vida e Mana com velocidade avassaladora.',
  },
  ring_stealth: {
    id: 'ring_stealth',
    name: 'Stealth Ring',
    slotType: 'ring',
    rarity: 'rare',
    icon: '💍',
    image: '/assets/itens/aneis/201436-201439.png',
    frameCount: 4,
    stats: { defense: 10, speed: 20, attack: 8 },
    description: 'Anel forjado com ônix das sombras. Envolve o usuário com manto etéreo de furtividade e agilidade.',
  },
  ring_time: {
    id: 'ring_time',
    name: 'Time Ring',
    slotType: 'ring',
    rarity: 'rare',
    icon: '💍',
    image: '/assets/itens/aneis/201443-201446.png',
    frameCount: 4,
    stats: { speed: 35, defense: 4 },
    description: 'Poderoso anel de topázio cintilante. Acelera o fluxo temporal ao redor do portador, concedendo +35 de Velocidade extrema.',
  },
  ring_dwarven: {
    id: 'ring_dwarven',
    name: 'Dwarven Ring',
    slotType: 'ring',
    rarity: 'rare',
    icon: '💍',
    image: '/assets/itens/aneis/201447-201450.png',
    frameCount: 4,
    stats: { defense: 16, maxHp: 80 },
    description: 'Forjado nas fornalhas de Kazordoon pelos mestres anões. Concede solidez inquebrável e defesa física.',
  },
  ring_power: {
    id: 'ring_power',
    name: 'Power Ring',
    slotType: 'ring',
    rarity: 'epic',
    icon: '💍',
    image: '/assets/itens/aneis/201451-201454.png',
    frameCount: 4,
    stats: { attack: 22, maxHp: 60 },
    description: 'Anel místico de rubi magenta. Canaliza força destrutiva nos golpes corporais, amplificando o Ataque.',
  },
  ring_crystal: {
    id: 'ring_crystal',
    name: 'Crystal Ring',
    slotType: 'ring',
    rarity: 'epic',
    icon: '💍',
    image: '/assets/itens/aneis/201457-201460.png',
    frameCount: 4,
    stats: { maxMp: 180, mpRegen: 6, defense: 8 },
    description: 'Anel esculpido em diamante cristalino puro. Expande imensamente a reserva de Mana e a pureza defensiva.',
  },
  ring_might: {
    id: 'ring_might',
    name: 'Might Ring',
    slotType: 'ring',
    rarity: 'legendary',
    icon: '💍',
    image: '/assets/itens/aneis/201461-201464.png',
    frameCount: 4,
    stats: { defense: 25, attack: 14, maxHp: 120 },
    description: 'O anel mais cobiçado pelos guerreiros de Tibia. Reduz todo dano recebido em 20% e concede força heróica.',
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
  { ...ALL_ITEMS.sword_gold },
  { ...ALL_ITEMS.sword_wood },
  { ...ALL_ITEMS.sword_light },
  { ...ALL_ITEMS.armor_paladin },
  { ...ALL_ITEMS.shield_aegis },
  { ...ALL_ITEMS.amulet_heart },
  { ...ALL_ITEMS.ring_might },
  { ...ALL_ITEMS.ring_healing },
  { ...ALL_ITEMS.ring_time },
  { ...ALL_ITEMS.ring_life },
  { ...ALL_ITEMS.ring_power },
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
  ring: 'ring_might',
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
