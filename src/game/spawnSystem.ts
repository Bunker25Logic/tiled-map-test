/**
 * spawnSystem.ts
 *
 * Sistema Declarativo de Spawns e Ecologia de Criaturas (Estilo Tibia).
 *
 * Cada monstro no mundo nasce a partir de um SpawnPoint dedicado com:
 *  - Home Tile (homeX, homeY): O ninho ou ponto de ancoragem original.
 *  - Roam Radius: Raio máximo que a criatura se desloca enquanto ociosa/vagando.
 *  - Max Chase Distance (Leash): Limite de distância que ela persegue o jogador antes
 *    de quebrar aggro e retornar caminhando para casa (Home Leashing).
 *  - Respawn Seconds: Tempo após a morte para a criatura renascer.
 *  - Anti-Pop-in: O monstro só renasce se o ponto de spawn estiver fora da tela do jogador!
 */

export interface SpawnPoint {
  id: string;
  zone: string;
  monsterType: string;
  homeX: number;
  homeY: number;
  roamRadius: number;           // Raio de passeio quando ocioso (pixels)
  maxChaseDistance: number;     // Distância máxima do ninho antes de de-aggro e retorno (leash)
  respawnSeconds: number;       // Tempo em segundos para renascer após a morte
  habitatName: string;          // Nome temático da área ou ninho
  // Estado de runtime
  currentMonsterId: string | null;
  deathTimestamp: number | null;
}

type SpawnPointTemplate = Omit<SpawnPoint, 'currentMonsterId' | 'deathTimestamp'>;

export const ZONE_SPAWNS_TEMPLATES: Record<string, SpawnPointTemplate[]> = {
  // ── Mundo Sobrevivência (Superfície - 80x80 / 2560x2560 px) ───────────────
  'mundo_sobrevivencia': [
    // ── Bioma 1: Vila, Fazendas e Planícies (Noroeste: x 100..1200, y 100..1200) ──
    {
      id: 'ms_dog_1', zone: 'mundo_sobrevivencia', monsterType: 'dog',
      homeX: 520, homeY: 620, roamRadius: 45, maxChaseDistance: 160, respawnSeconds: 20,
      habitatName: 'Perímetro da Vila',
    },
    {
      id: 'ms_galinha_1', zone: 'mundo_sobrevivencia', monsterType: 'galinha',
      homeX: 300, homeY: 590, roamRadius: 30, maxChaseDistance: 120, respawnSeconds: 15,
      habitatName: 'Galinheiro da Fazenda',
    },
    {
      id: 'ms_ovelha_1', zone: 'mundo_sobrevivencia', monsterType: 'ovelha',
      homeX: 360, homeY: 720, roamRadius: 40, maxChaseDistance: 140, respawnSeconds: 20,
      habitatName: 'Pasto da Fazenda',
    },
    {
      id: 'ms_piggi_1', zone: 'mundo_sobrevivencia', monsterType: 'piggi',
      homeX: 260, homeY: 680, roamRadius: 35, maxChaseDistance: 130, respawnSeconds: 20,
      habitatName: 'Chiqueiro da Vila',
    },
    {
      id: 'ms_dodo_1', zone: 'mundo_sobrevivencia', monsterType: 'dodo',
      homeX: 680, homeY: 480, roamRadius: 40, maxChaseDistance: 150, respawnSeconds: 20,
      habitatName: 'Prados da Vila',
    },
    {
      id: 'ms_alce_1', zone: 'mundo_sobrevivencia', monsterType: 'alce',
      homeX: 780, homeY: 350, roamRadius: 55, maxChaseDistance: 220, respawnSeconds: 30,
      habitatName: 'Campos do Norte',
    },
    {
      id: 'ms_goblin_1', zone: 'mundo_sobrevivencia', monsterType: 'goblin',
      homeX: 850, homeY: 750, roamRadius: 50, maxChaseDistance: 220, respawnSeconds: 25,
      habitatName: 'Bosque dos Goblins',
    },
    {
      id: 'ms_goblin_2', zone: 'mundo_sobrevivencia', monsterType: 'goblin',
      homeX: 920, homeY: 820, roamRadius: 45, maxChaseDistance: 220, respawnSeconds: 25,
      habitatName: 'Bosque dos Goblins',
    },
    {
      id: 'ms_duende_1', zone: 'mundo_sobrevivencia', monsterType: 'duende',
      homeX: 720, homeY: 900, roamRadius: 50, maxChaseDistance: 200, respawnSeconds: 25,
      habitatName: 'Bosque Verdejante',
    },
    {
      id: 'ms_orc_1', zone: 'mundo_sobrevivencia', monsterType: 'orc',
      homeX: 1050, homeY: 650, roamRadius: 55, maxChaseDistance: 240, respawnSeconds: 35,
      habitatName: 'Guarnição Orc da Estrada',
    },
    {
      id: 'ms_anao_1', zone: 'mundo_sobrevivencia', monsterType: 'anao',
      homeX: 1100, homeY: 400, roamRadius: 50, maxChaseDistance: 220, respawnSeconds: 30,
      habitatName: 'Acampamento dos Mineradores Anões',
    },

    // ── Bioma 2: Pedreira, Montanhas e Minas (Nordeste: x 1300..2500, y 100..1200) ──
    {
      id: 'ms_stonemonster_1', zone: 'mundo_sobrevivencia', monsterType: 'stonemonster',
      homeX: 1450, homeY: 380, roamRadius: 50, maxChaseDistance: 250, respawnSeconds: 40,
      habitatName: 'Pedreira Rochosa',
    },
    {
      id: 'ms_centostone_1', zone: 'mundo_sobrevivencia', monsterType: 'centostone',
      homeX: 1600, homeY: 480, roamRadius: 50, maxChaseDistance: 240, respawnSeconds: 40,
      habitatName: 'Afloramento de Quartzo',
    },
    {
      id: 'ms_trolol_1', zone: 'mundo_sobrevivencia', monsterType: 'trolol',
      homeX: 1750, homeY: 350, roamRadius: 60, maxChaseDistance: 260, respawnSeconds: 45,
      habitatName: 'Ravina dos Trolls',
    },
    {
      id: 'ms_golen_1', zone: 'mundo_sobrevivencia', monsterType: 'golen',
      homeX: 1900, homeY: 450, roamRadius: 50, maxChaseDistance: 260, respawnSeconds: 50,
      habitatName: 'Posto Avançado da Pedreira',
    },
    {
      id: 'ms_whitewolf_1', zone: 'mundo_sobrevivencia', monsterType: 'whitewolf',
      homeX: 2100, homeY: 300, roamRadius: 60, maxChaseDistance: 280, respawnSeconds: 45,
      habitatName: 'Picos Nevados',
    },
    {
      id: 'ms_neveman_1', zone: 'mundo_sobrevivencia', monsterType: 'neveman',
      homeX: 2300, homeY: 400, roamRadius: 55, maxChaseDistance: 270, respawnSeconds: 55,
      habitatName: 'Cordilheira Gelada',
    },
    {
      id: 'ms_centon_1', zone: 'mundo_sobrevivencia', monsterType: 'centon',
      homeX: 2000, homeY: 750, roamRadius: 50, maxChaseDistance: 240, respawnSeconds: 40,
      habitatName: 'Entorno da Caverna Fúngica',
    },
    {
      id: 'ms_golen2_1', zone: 'mundo_sobrevivencia', monsterType: 'golen2',
      homeX: 2350, homeY: 700, roamRadius: 55, maxChaseDistance: 270, respawnSeconds: 55,
      habitatName: 'Guardião de Granito',
    },

    // ── Bioma 3: Pântano, Lago Sombrio e Cabana da Bruxa (Sudoeste: x 100..1200, y 1300..2500) ──
    {
      id: 'ms_lacost_1', zone: 'mundo_sobrevivencia', monsterType: 'lacost',
      homeX: 350, homeY: 1550, roamRadius: 55, maxChaseDistance: 250, respawnSeconds: 35,
      habitatName: 'Margem do Lago Sombrio',
    },
    {
      id: 'ms_jacare_1', zone: 'mundo_sobrevivencia', monsterType: 'jacare',
      homeX: 550, homeY: 1650, roamRadius: 50, maxChaseDistance: 240, respawnSeconds: 35,
      habitatName: 'Pântano Profundo',
    },
    {
      id: 'ms_serpent_1', zone: 'mundo_sobrevivencia', monsterType: 'serpent',
      homeX: 700, homeY: 1500, roamRadius: 55, maxChaseDistance: 240, respawnSeconds: 30,
      habitatName: 'Charco Nebuloso',
    },
    {
      id: 'ms_zombie_1', zone: 'mundo_sobrevivencia', monsterType: 'zombie',
      homeX: 420, homeY: 1850, roamRadius: 50, maxChaseDistance: 250, respawnSeconds: 35,
      habitatName: 'Cemitério da Cabana da Bruxa',
    },
    {
      id: 'ms_skeleton_1', zone: 'mundo_sobrevivencia', monsterType: 'skeleton',
      homeX: 580, homeY: 1950, roamRadius: 50, maxChaseDistance: 250, respawnSeconds: 35,
      habitatName: 'Cemitério da Cabana da Bruxa',
    },
    {
      id: 'ms_aparition_1', zone: 'mundo_sobrevivencia', monsterType: 'aparition',
      homeX: 380, homeY: 2150, roamRadius: 60, maxChaseDistance: 270, respawnSeconds: 40,
      habitatName: 'Pântano dos Sussurros',
    },
    {
      id: 'ms_centgreen_1', zone: 'mundo_sobrevivencia', monsterType: 'centgreen',
      homeX: 850, homeY: 1900, roamRadius: 55, maxChaseDistance: 250, respawnSeconds: 40,
      habitatName: 'Floresta de Esporos',
    },
    {
      id: 'ms_biliblili_1', zone: 'mundo_sobrevivencia', monsterType: 'biliblili',
      homeX: 950, homeY: 2200, roamRadius: 50, maxChaseDistance: 240, respawnSeconds: 35,
      habitatName: 'Garganta Fúngica',
    },

    // ── Bioma 4: Deserto Dourado, Pirâmides e Catacumbas (Sudeste: x 1300..2500, y 1300..2500) ──
    {
      id: 'ms_hiena_1', zone: 'mundo_sobrevivencia', monsterType: 'hiena',
      homeX: 1450, homeY: 1550, roamRadius: 55, maxChaseDistance: 250, respawnSeconds: 30,
      habitatName: 'Dunas de Transição',
    },
    {
      id: 'ms_scarnsabre_1', zone: 'mundo_sobrevivencia', monsterType: 'scarnsabre',
      homeX: 1650, homeY: 1650, roamRadius: 55, maxChaseDistance: 260, respawnSeconds: 40,
      habitatName: 'Garganta do Escorpião',
    },
    {
      id: 'ms_skedesert_1', zone: 'mundo_sobrevivencia', monsterType: 'skedesert',
      homeX: 1850, homeY: 1500, roamRadius: 55, maxChaseDistance: 250, respawnSeconds: 35,
      habitatName: 'Arenas Escaldantes',
    },
    {
      id: 'ms_mumia_1', zone: 'mundo_sobrevivencia', monsterType: 'mumia',
      homeX: 1800, homeY: 2250, roamRadius: 50, maxChaseDistance: 250, respawnSeconds: 45,
      habitatName: 'Perímetro do Santuário do Deserto',
    },
    {
      id: 'ms_mummi_1', zone: 'mundo_sobrevivencia', monsterType: 'mummi',
      homeX: 2000, homeY: 2350, roamRadius: 50, maxChaseDistance: 250, respawnSeconds: 45,
      habitatName: 'Perímetro do Santuário do Deserto',
    },
    {
      id: 'ms_mummi2_1', zone: 'mundo_sobrevivencia', monsterType: 'mummi2',
      homeX: 2150, homeY: 2200, roamRadius: 55, maxChaseDistance: 260, respawnSeconds: 50,
      habitatName: 'Entorno das Catacumbas',
    },
    {
      id: 'ms_genie_1', zone: 'mundo_sobrevivencia', monsterType: 'genie',
      homeX: 2350, homeY: 1950, roamRadius: 60, maxChaseDistance: 280, respawnSeconds: 65,
      habitatName: 'Oásis Escondido dos Djinns',
    },
    {
      id: 'ms_golen_magma_1', zone: 'mundo_sobrevivencia', monsterType: 'golen-magma',
      homeX: 2400, homeY: 2300, roamRadius: 50, maxChaseDistance: 260, respawnSeconds: 70,
      habitatName: 'Cratera Vulcânica do Deserto',
    },
  ],

  // ── Caverna dos Minérios (40x40 / 1280x1280 px) ───────────────────────────
  'caverna_minerios': [
    {
      id: 'cm_bat_1', zone: 'caverna_minerios', monsterType: 'bat',
      homeX: 380, homeY: 340, roamRadius: 50, maxChaseDistance: 220, respawnSeconds: 20,
      habitatName: 'Túnel de Entrada',
    },
    {
      id: 'cm_bat_2', zone: 'caverna_minerios', monsterType: 'bat',
      homeX: 520, homeY: 380, roamRadius: 45, maxChaseDistance: 220, respawnSeconds: 20,
      habitatName: 'Túnel de Entrada',
    },
    {
      id: 'cm_goblin_1', zone: 'caverna_minerios', monsterType: 'goblin',
      homeX: 480, homeY: 520, roamRadius: 50, maxChaseDistance: 240, respawnSeconds: 30,
      habitatName: 'Acampamento dos Mineradores Goblin',
    },
    {
      id: 'cm_goblin_2', zone: 'caverna_minerios', monsterType: 'goblin',
      homeX: 560, homeY: 560, roamRadius: 45, maxChaseDistance: 240, respawnSeconds: 30,
      habitatName: 'Acampamento dos Mineradores Goblin',
    },
    {
      id: 'cm_stonemonster_1', zone: 'caverna_minerios', monsterType: 'stonemonster',
      homeX: 720, homeY: 450, roamRadius: 50, maxChaseDistance: 250, respawnSeconds: 40,
      habitatName: 'Veio de Ferro Profundo',
    },
    {
      id: 'cm_centostone_1', zone: 'caverna_minerios', monsterType: 'centostone',
      homeX: 850, homeY: 520, roamRadius: 50, maxChaseDistance: 250, respawnSeconds: 45,
      habitatName: 'Câmara dos Cristais',
    },
    {
      id: 'cm_trolol_1', zone: 'caverna_minerios', monsterType: 'trolol',
      homeX: 680, homeY: 750, roamRadius: 55, maxChaseDistance: 260, respawnSeconds: 45,
      habitatName: 'Lago Subterrâneo',
    },
    {
      id: 'cm_cavern_1', zone: 'caverna_minerios', monsterType: 'cavern creature',
      homeX: 880, homeY: 780, roamRadius: 55, maxChaseDistance: 270, respawnSeconds: 50,
      habitatName: 'Salão da Forja Profunda',
    },
    {
      id: 'cm_golen_1', zone: 'caverna_minerios', monsterType: 'golen',
      homeX: 1020, homeY: 900, roamRadius: 60, maxChaseDistance: 280, respawnSeconds: 60,
      habitatName: 'Cofre dos Minérios Ancestrais',
    },
  ],

  // ── Caverna Fúngica (40x40 / 1280x1280 px) ────────────────────────────────
  'caverna_fungica': [
    {
      id: 'cf_bat_1', zone: 'caverna_fungica', monsterType: 'bat',
      homeX: 380, homeY: 350, roamRadius: 45, maxChaseDistance: 220, respawnSeconds: 20,
      habitatName: 'Gruta dos Cogumelos Pequenos',
    },
    {
      id: 'cf_soni_1', zone: 'caverna_fungica', monsterType: 'soni',
      homeX: 500, homeY: 450, roamRadius: 50, maxChaseDistance: 230, respawnSeconds: 30,
      habitatName: 'Bosque de Esporos Bioluminescentes',
    },
    {
      id: 'cf_centgreen_1', zone: 'caverna_fungica', monsterType: 'centgreen',
      homeX: 650, homeY: 520, roamRadius: 50, maxChaseDistance: 240, respawnSeconds: 35,
      habitatName: 'Alameda dos Cogumelos Gigantes',
    },
    {
      id: 'cf_aparition_1', zone: 'caverna_fungica', monsterType: 'aparition',
      homeX: 800, homeY: 480, roamRadius: 60, maxChaseDistance: 260, respawnSeconds: 40,
      habitatName: 'Rio Subterrâneo Bioluminescente',
    },
    {
      id: 'cf_creature_light_1', zone: 'caverna_fungica', monsterType: 'creature light',
      homeX: 720, homeY: 720, roamRadius: 50, maxChaseDistance: 250, respawnSeconds: 45,
      habitatName: 'Santuário de Alquimia Ancestral',
    },
    {
      id: 'cf_boss_bat_rei', zone: 'caverna_fungica', monsterType: 'bat rei',
      homeX: 920, homeY: 820, roamRadius: 65, maxChaseDistance: 320, respawnSeconds: 90,
      habitatName: 'Câmara do Rei Morcego dos Esporos (Chefe)',
    },
  ],

  // ── Catacumbas do Deserto (40x40 / 1280x1280 px) ──────────────────────────
  'catacumbas_deserto': [
    {
      id: 'cd_skedesert_1', zone: 'catacumbas_deserto', monsterType: 'skedesert',
      homeX: 420, homeY: 360, roamRadius: 45, maxChaseDistance: 230, respawnSeconds: 25,
      habitatName: 'Vestíbulo de Mármore',
    },
    {
      id: 'cd_skeleton_1', zone: 'catacumbas_deserto', monsterType: 'skeleton',
      homeX: 550, homeY: 420, roamRadius: 50, maxChaseDistance: 240, respawnSeconds: 30,
      habitatName: 'Corredor das Lápides',
    },
    {
      id: 'cd_mumia_1', zone: 'catacumbas_deserto', monsterType: 'mumia',
      homeX: 680, homeY: 520, roamRadius: 50, maxChaseDistance: 250, respawnSeconds: 35,
      habitatName: 'Câmara dos Sarcófagos',
    },
    {
      id: 'cd_mummi2_1', zone: 'catacumbas_deserto', monsterType: 'mummi2',
      homeX: 780, homeY: 620, roamRadius: 55, maxChaseDistance: 260, respawnSeconds: 45,
      habitatName: 'Cripta dos Faraós Ancestrais',
    },
    {
      id: 'cd_fantasn_1', zone: 'catacumbas_deserto', monsterType: 'fantasn',
      homeX: 600, homeY: 750, roamRadius: 60, maxChaseDistance: 270, respawnSeconds: 40,
      habitatName: 'Salão Rúnico do Monólito',
    },
    {
      id: 'cd_genie_1', zone: 'catacumbas_deserto', monsterType: 'genie',
      homeX: 880, homeY: 800, roamRadius: 60, maxChaseDistance: 290, respawnSeconds: 65,
      habitatName: 'Câmara do Tesouro das Catacumbas',
    },
  ],

  // ── Floresta Grande (60x60 / 1920x1920 px) ────────────────────────────────
  'floresta_grande': [
    {
      id: 'fg_alce_1', zone: 'floresta_grande', monsterType: 'alce',
      homeX: 850, homeY: 850, roamRadius: 60, maxChaseDistance: 240, respawnSeconds: 30,
      habitatName: 'Clareira Central',
    },
    {
      id: 'fg_dodo_1', zone: 'floresta_grande', monsterType: 'dodo',
      homeX: 950, homeY: 900, roamRadius: 40, maxChaseDistance: 160, respawnSeconds: 20,
      habitatName: 'Clareira Central',
    },
    {
      id: 'fg_goblin_1', zone: 'floresta_grande', monsterType: 'goblin',
      homeX: 650, homeY: 700, roamRadius: 50, maxChaseDistance: 220, respawnSeconds: 25,
      habitatName: 'Bosque das Ameixeiras',
    },
    {
      id: 'fg_orc_1', zone: 'floresta_grande', monsterType: 'orc',
      homeX: 1200, homeY: 800, roamRadius: 55, maxChaseDistance: 240, respawnSeconds: 35,
      habitatName: 'Acampamento da Árvore Dourada',
    },
    {
      id: 'fg_duende_1', zone: 'floresta_grande', monsterType: 'duende',
      homeX: 750, homeY: 1100, roamRadius: 50, maxChaseDistance: 220, respawnSeconds: 25,
      habitatName: 'Pomar Silvestre',
    },
    {
      id: 'fg_whitewolf_1', zone: 'floresta_grande', monsterType: 'whitewolf',
      homeX: 1300, homeY: 1250, roamRadius: 60, maxChaseDistance: 280, respawnSeconds: 45,
      habitatName: 'Floresta Profunda dos Carvalhos',
    },
  ],
};

// Aliases para retrocompatibilidade com zonas legadas
ZONE_SPAWNS_TEMPLATES['map1'] = ZONE_SPAWNS_TEMPLATES['mundo_sobrevivencia'];
ZONE_SPAWNS_TEMPLATES['caverna-zona-1'] = ZONE_SPAWNS_TEMPLATES['caverna_minerios'];
ZONE_SPAWNS_TEMPLATES['caverna2'] = ZONE_SPAWNS_TEMPLATES['caverna_fungica'];
ZONE_SPAWNS_TEMPLATES['caverna3'] = ZONE_SPAWNS_TEMPLATES['catacumbas_deserto'];

/**
 * Cria instâncias clonadas com estado de runtime zerado para a zona fornecida.
 */
export function createZoneSpawnPoints(zoneId: string): SpawnPoint[] {
  const resolvedZone =
    zoneId === 'map1' ? 'mundo_sobrevivencia' :
    zoneId === 'caverna-zona-1' ? 'caverna_minerios' :
    zoneId === 'caverna2' ? 'caverna_fungica' :
    zoneId === 'caverna3' ? 'catacumbas_deserto' :
    zoneId;

  const templates =
    ZONE_SPAWNS_TEMPLATES[resolvedZone] ||
    ZONE_SPAWNS_TEMPLATES[zoneId] ||
    ZONE_SPAWNS_TEMPLATES['mundo_sobrevivencia'] ||
    [];

  return templates.map((t) => ({
    ...t,
    currentMonsterId: null,
    deathTimestamp: null,
  }));
}
