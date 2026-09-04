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
  // ── Caverna Subterrânea (Zona 1) ──────────────────────────────────────────
  'caverna-zona-1': [
    // Galeria dos Ecos (Entrada)
    {
      id: 'c1_bat_1', zone: 'caverna-zona-1', monsterType: 'bat',
      homeX: 180, homeY: 130, roamRadius: 50, maxChaseDistance: 240, respawnSeconds: 25,
      habitatName: 'Galeria dos Ecos (Entrada)',
    },
    {
      id: 'c1_soni_1', zone: 'caverna-zona-1', monsterType: 'soni',
      homeX: 230, homeY: 145, roamRadius: 45, maxChaseDistance: 240, respawnSeconds: 30,
      habitatName: 'Galeria dos Ecos (Entrada)',
    },
    // Câmara dos Mortos-Vivos
    {
      id: 'c1_zombie_1', zone: 'caverna-zona-1', monsterType: 'zombie',
      homeX: 380, homeY: 135, roamRadius: 55, maxChaseDistance: 260, respawnSeconds: 35,
      habitatName: 'Câmara dos Mortos-Vivos',
    },
    {
      id: 'c1_zombie_2', zone: 'caverna-zona-1', monsterType: 'zombie',
      homeX: 440, homeY: 155, roamRadius: 50, maxChaseDistance: 260, respawnSeconds: 35,
      habitatName: 'Câmara dos Mortos-Vivos',
    },
    // Acampamento Goblin
    {
      id: 'c1_goblin_1', zone: 'caverna-zona-1', monsterType: 'goblin',
      homeX: 600, homeY: 130, roamRadius: 50, maxChaseDistance: 250, respawnSeconds: 30,
      habitatName: 'Acampamento Goblin',
    },
    {
      id: 'c1_goblin_2', zone: 'caverna-zona-1', monsterType: 'goblin',
      homeX: 660, homeY: 150, roamRadius: 50, maxChaseDistance: 250, respawnSeconds: 30,
      habitatName: 'Acampamento Goblin',
    },
    // Cripta das Sombras
    {
      id: 'c1_aparition_1', zone: 'caverna-zona-1', monsterType: 'aparition',
      homeX: 810, homeY: 135, roamRadius: 60, maxChaseDistance: 280, respawnSeconds: 40,
      habitatName: 'Cripta das Sombras',
    },
    {
      id: 'c1_trolol_1', zone: 'caverna-zona-1', monsterType: 'trolol',
      homeX: 870, homeY: 150, roamRadius: 50, maxChaseDistance: 280, respawnSeconds: 45,
      habitatName: 'Cripta das Sombras',
    },
    // Salão dos Monólitos
    {
      id: 'c1_centostone_1', zone: 'caverna-zona-1', monsterType: 'centostone',
      homeX: 1020, homeY: 135, roamRadius: 50, maxChaseDistance: 260, respawnSeconds: 45,
      habitatName: 'Salão dos Monólitos',
    },
    {
      id: 'c1_stonemonster_1', zone: 'caverna-zona-1', monsterType: 'stonemonster',
      homeX: 1080, homeY: 150, roamRadius: 50, maxChaseDistance: 260, respawnSeconds: 50,
      habitatName: 'Salão dos Monólitos',
    },
  ],

  // ── Caverna 2 (Atalho Ilha 4) ─────────────────────────────────────────────
  'caverna2': [
    {
      id: 'c2_bat_1', zone: 'caverna2', monsterType: 'bat',
      homeX: 130, homeY: 110, roamRadius: 40, maxChaseDistance: 200, respawnSeconds: 25,
      habitatName: 'Fosso dos Morcegos',
    },
    {
      id: 'c2_aparition_1', zone: 'caverna2', monsterType: 'aparition',
      homeX: 210, homeY: 140, roamRadius: 45, maxChaseDistance: 220, respawnSeconds: 35,
      habitatName: 'Passagem Assombrada',
    },
    {
      id: 'c2_stonemonster_1', zone: 'caverna2', monsterType: 'stonemonster',
      homeX: 230, homeY: 115, roamRadius: 40, maxChaseDistance: 200, respawnSeconds: 45,
      habitatName: 'Guardião Pétreo',
    },
    {
      id: 'c2_soni_1', zone: 'caverna2', monsterType: 'soni',
      homeX: 280, homeY: 100, roamRadius: 45, maxChaseDistance: 220, respawnSeconds: 30,
      habitatName: 'Covil Subterrâneo',
    },
    {
      id: 'c2_goblin_1', zone: 'caverna2', monsterType: 'goblin',
      homeX: 350, homeY: 145, roamRadius: 45, maxChaseDistance: 220, respawnSeconds: 30,
      habitatName: 'Posto Goblin',
    },
  ],

  // ── Caverna 3 (Ilha 4 para Ilha 5 - Desafio Superior) ─────────────────────
  'caverna3': [
    {
      id: 'c3_boss_bat_rei', zone: 'caverna3', monsterType: 'bat rei',
      homeX: 140, homeY: 120, roamRadius: 60, maxChaseDistance: 320, respawnSeconds: 90,
      habitatName: 'Trono do Rei Morcego (Chefe)',
    },
    {
      id: 'c3_cavern_creature', zone: 'caverna3', monsterType: 'cavern creature',
      homeX: 220, homeY: 140, roamRadius: 50, maxChaseDistance: 250, respawnSeconds: 45,
      habitatName: 'Fosso das Profundezas',
    },
    {
      id: 'c3_skeleton_1', zone: 'caverna3', monsterType: 'skeleton',
      homeX: 300, homeY: 110, roamRadius: 50, maxChaseDistance: 250, respawnSeconds: 40,
      habitatName: 'Câmara dos Ossos',
    },
    {
      id: 'c3_draertis_1', zone: 'caverna3', monsterType: 'draertis_mini',
      homeX: 380, homeY: 150, roamRadius: 55, maxChaseDistance: 280, respawnSeconds: 65,
      habitatName: 'Ninho das Crias de Draertis',
    },
    {
      id: 'c3_fantasn_1', zone: 'caverna3', monsterType: 'fantasn',
      homeX: 260, homeY: 130, roamRadius: 50, maxChaseDistance: 240, respawnSeconds: 35,
      habitatName: 'Corredor Espectral',
    },
  ],

  // ── Superfície de Tibia (map1 - Ilhas 1 a 5) ──────────────────────────────
  'map1': [
    // ── ILHA 1 (Floresta & Ruínas) ──
    // Bosque Sul (Animais Dóceis / Neutros - Seguro perto do Templo)
    {
      id: 's_i1_esquilo_1', zone: 'map1', monsterType: 'esquilo',
      homeX: -160, homeY: 140, roamRadius: 45, maxChaseDistance: 160, respawnSeconds: 25,
      habitatName: 'Bosque das Bolotas (Ilha 1)',
    },
    {
      id: 's_i1_vead_1', zone: 'map1', monsterType: 'vead',
      homeX: -220, homeY: 90, roamRadius: 50, maxChaseDistance: 180, respawnSeconds: 30,
      habitatName: 'Clareira dos Cervos (Ilha 1)',
    },
    {
      id: 's_i1_alce_1', zone: 'map1', monsterType: 'alce',
      homeX: -190, homeY: -70, roamRadius: 55, maxChaseDistance: 190, respawnSeconds: 30,
      habitatName: 'Bosque Verdejante (Ilha 1)',
    },
    {
      id: 's_i1_piggi_1', zone: 'map1', monsterType: 'piggi',
      homeX: -110, homeY: -150, roamRadius: 45, maxChaseDistance: 160, respawnSeconds: 25,
      habitatName: 'Campina das Flores (Ilha 1)',
    },
    {
      id: 's_i1_dodo_1', zone: 'map1', monsterType: 'dodo',
      homeX: 130, homeY: -170, roamRadius: 45, maxChaseDistance: 160, respawnSeconds: 25,
      habitatName: 'Campina Oriental (Ilha 1)',
    },
    {
      id: 's_i1_dog_1', zone: 'map1', monsterType: 'dog',
      homeX: 150, homeY: 130, roamRadius: 45, maxChaseDistance: 160, respawnSeconds: 25,
      habitatName: 'Colina do Sul (Ilha 1)',
    },
    // Ruínas do Norte (Monstros Clássicos Iniciais)
    {
      id: 's_i1_orc_1', zone: 'map1', monsterType: 'orc',
      homeX: -270, homeY: -310, roamRadius: 55, maxChaseDistance: 240, respawnSeconds: 35,
      habitatName: 'Ruínas Orc (Ilha 1)',
    },
    {
      id: 's_i1_duende_1', zone: 'map1', monsterType: 'duende',
      homeX: -170, homeY: -350, roamRadius: 50, maxChaseDistance: 220, respawnSeconds: 30,
      habitatName: 'Acampamento dos Duendes (Ilha 1)',
    },
    {
      id: 's_i1_elf_1', zone: 'map1', monsterType: 'elf',
      homeX: 70, homeY: -330, roamRadius: 50, maxChaseDistance: 240, respawnSeconds: 35,
      habitatName: 'Santuário Élfico Antigo (Ilha 1)',
    },
    {
      id: 's_i1_anao_1', zone: 'map1', monsterType: 'anao',
      homeX: 190, homeY: -290, roamRadius: 50, maxChaseDistance: 230, respawnSeconds: 40,
      habitatName: 'Mina dos Anões (Ilha 1)',
    },
    {
      id: 's_i1_hiena_1', zone: 'map1', monsterType: 'hiena',
      homeX: 210, homeY: -210, roamRadius: 55, maxChaseDistance: 250, respawnSeconds: 30,
      habitatName: 'Terras Áridas (Ilha 1)',
    },
    {
      id: 's_i1_pand_1', zone: 'map1', monsterType: 'pand',
      homeX: -350, homeY: -110, roamRadius: 50, maxChaseDistance: 220, respawnSeconds: 40,
      habitatName: 'Costa Ocidental (Ilha 1)',
    },

    // ── ILHA 2 (Deserto de Areia & Pirâmides) ──
    {
      id: 's_i2_lacost_1', zone: 'map1', monsterType: 'lacost',
      homeX: 960, homeY: -140, roamRadius: 55, maxChaseDistance: 240, respawnSeconds: 35,
      habitatName: 'Oásis Seco (Ilha 2)',
    },
    {
      id: 's_i2_serpent_1', zone: 'map1', monsterType: 'serpent',
      homeX: 1110, homeY: -70, roamRadius: 50, maxChaseDistance: 230, respawnSeconds: 30,
      habitatName: 'Dunas Escaldantes (Ilha 2)',
    },
    {
      id: 's_i2_scarnsabre_1', zone: 'map1', monsterType: 'scarnsabre',
      homeX: 1260, homeY: -190, roamRadius: 55, maxChaseDistance: 250, respawnSeconds: 40,
      habitatName: 'Garganta do Escorpião (Ilha 2)',
    },
    {
      id: 's_i2_skedesert_1', zone: 'map1', monsterType: 'skedesert',
      homeX: 1390, homeY: -90, roamRadius: 55, maxChaseDistance: 250, respawnSeconds: 40,
      habitatName: 'Túmulo dos Esquecidos (Ilha 2)',
    },
    {
      id: 's_i2_mumia_1', zone: 'map1', monsterType: 'mumia',
      homeX: 1140, homeY: 160, roamRadius: 50, maxChaseDistance: 240, respawnSeconds: 45,
      habitatName: 'Pirâmide Sepulcral (Ilha 2)',
    },
    {
      id: 's_i2_mummi_1', zone: 'map1', monsterType: 'mummi',
      homeX: 1290, homeY: 130, roamRadius: 50, maxChaseDistance: 240, respawnSeconds: 45,
      habitatName: 'Pirâmide Sepulcral (Ilha 2)',
    },
    {
      id: 's_i2_mummi2_1', zone: 'map1', monsterType: 'mummi2',
      homeX: 1410, homeY: 210, roamRadius: 55, maxChaseDistance: 260, respawnSeconds: 50,
      habitatName: 'Câmara dos Faraós (Ilha 2)',
    },
    {
      id: 's_i2_genie_1', zone: 'map1', monsterType: 'genie',
      homeX: 1040, homeY: 260, roamRadius: 60, maxChaseDistance: 280, respawnSeconds: 60,
      habitatName: 'Lâmpada Ancestral (Ilha 2)',
    },
    {
      id: 's_i2_golen_magma_1', zone: 'map1', monsterType: 'golen-magma',
      homeX: 1210, homeY: 310, roamRadius: 50, maxChaseDistance: 260, respawnSeconds: 65,
      habitatName: 'Cratera Ardente (Ilha 2)',
    },
    // Chefe do Deserto & Crias
    {
      id: 's_i2_boss_golen', zone: 'map1', monsterType: 'golen_chefe',
      homeX: 1350, homeY: 280, roamRadius: 65, maxChaseDistance: 320, respawnSeconds: 90,
      habitatName: 'Altar do Colosso Golen (Chefe do Deserto)',
    },
    {
      id: 's_i2_mini_golen_1', zone: 'map1', monsterType: 'golen_mini',
      homeX: 1310, homeY: 310, roamRadius: 45, maxChaseDistance: 240, respawnSeconds: 35,
      habitatName: 'Guarda do Altar (Mini Golen)',
    },
    {
      id: 's_i2_mini_golen_2', zone: 'map1', monsterType: 'golen_mini',
      homeX: 1390, homeY: 250, roamRadius: 45, maxChaseDistance: 240, respawnSeconds: 35,
      habitatName: 'Guarda do Altar (Mini Golen)',
    },

    // ── ILHA 3 (Montanhas Rochosas) ──
    {
      id: 's_i3_whitewolf_1', zone: 'map1', monsterType: 'whitewolf',
      homeX: -660, homeY: -1760, roamRadius: 55, maxChaseDistance: 250, respawnSeconds: 35,
      habitatName: 'Alcateia dos Ventos (Ilha 3)',
    },
    {
      id: 's_i3_tiguersabre_1', zone: 'map1', monsterType: 'tiguersabre',
      homeX: -460, homeY: -1860, roamRadius: 60, maxChaseDistance: 260, respawnSeconds: 40,
      habitatName: 'Desfiladeiro Feroz (Ilha 3)',
    },
    {
      id: 's_i3_bufao_1', zone: 'map1', monsterType: 'bufao',
      homeX: -310, homeY: -1710, roamRadius: 55, maxChaseDistance: 250, respawnSeconds: 45,
      habitatName: 'Planalto dos Bisões (Ilha 3)',
    },
    {
      id: 's_i3_centgreen_1', zone: 'map1', monsterType: 'centgreen',
      homeX: -560, homeY: -1610, roamRadius: 55, maxChaseDistance: 250, respawnSeconds: 45,
      habitatName: 'Cordilheira Verde (Ilha 3)',
    },
    {
      id: 's_i3_centongg_1', zone: 'map1', monsterType: 'centongg',
      homeX: -710, homeY: -1560, roamRadius: 55, maxChaseDistance: 250, respawnSeconds: 45,
      habitatName: 'Pico dos Titãs (Ilha 3)',
    },
    {
      id: 's_i3_centon_1', zone: 'map1', monsterType: 'centon',
      homeX: -410, homeY: -1510, roamRadius: 55, maxChaseDistance: 250, respawnSeconds: 45,
      habitatName: 'Passagem das Pedras (Ilha 3)',
    },
    {
      id: 's_i3_lobisonem_1', zone: 'map1', monsterType: 'lobisonem',
      homeX: -210, homeY: -1810, roamRadius: 60, maxChaseDistance: 280, respawnSeconds: 55,
      habitatName: 'Toca do Lobisomem (Ilha 3)',
    },
    {
      id: 's_i3_golen_1', zone: 'map1', monsterType: 'golen',
      homeX: -160, homeY: -1610, roamRadius: 50, maxChaseDistance: 250, respawnSeconds: 60,
      habitatName: 'Guardião de Rocha (Ilha 3)',
    },
    {
      id: 's_i3_golen2_1', zone: 'map1', monsterType: 'golen2',
      homeX: -260, homeY: -1960, roamRadius: 50, maxChaseDistance: 250, respawnSeconds: 65,
      habitatName: 'Guardião de Rocha (Ilha 3)',
    },
    {
      id: 's_i3_trolol_1', zone: 'map1', monsterType: 'trolol',
      homeX: -510, homeY: -1910, roamRadius: 55, maxChaseDistance: 260, respawnSeconds: 70,
      habitatName: 'Caverna do Trolol (Ilha 3)',
    },
    {
      id: 's_i3_drago_1', zone: 'map1', monsterType: 'drago',
      homeX: -560, homeY: -2010, roamRadius: 65, maxChaseDistance: 320, respawnSeconds: 100,
      habitatName: 'Ninho do Dragão Vermelho (Ilha 3)',
    },
    // Chefe das Montanhas & Crias
    {
      id: 's_i3_boss_triar', zone: 'map1', monsterType: 'triardinguer_chefe',
      homeX: -360, homeY: -2010, roamRadius: 65, maxChaseDistance: 320, respawnSeconds: 100,
      habitatName: 'Pico do Titã Triardinguer (Chefe das Montanhas)',
    },
    {
      id: 's_i3_mini_triar_1', zone: 'map1', monsterType: 'triardinguer_mini',
      homeX: -320, homeY: -1980, roamRadius: 45, maxChaseDistance: 250, respawnSeconds: 40,
      habitatName: 'Escolta do Pico (Mini Triardinguer)',
    },
    {
      id: 's_i3_mini_triar_2', zone: 'map1', monsterType: 'triardinguer_mini',
      homeX: -400, homeY: -2040, roamRadius: 45, maxChaseDistance: 250, respawnSeconds: 40,
      habitatName: 'Escolta do Pico (Mini Triardinguer)',
    },

    // ── ILHA 4 (Santuário Místico) ──
    {
      id: 's_i4_fantasn_1', zone: 'map1', monsterType: 'fantasn',
      homeX: 560, homeY: -1760, roamRadius: 55, maxChaseDistance: 240, respawnSeconds: 35,
      habitatName: 'Vale dos Espectros (Ilha 4)',
    },
    {
      id: 's_i4_aparition_1', zone: 'map1', monsterType: 'aparition',
      homeX: 710, homeY: -1860, roamRadius: 55, maxChaseDistance: 250, respawnSeconds: 40,
      habitatName: 'Vale dos Espectros (Ilha 4)',
    },
    {
      id: 's_i4_thedeath_1', zone: 'map1', monsterType: 'thedeath',
      homeX: 860, homeY: -1960, roamRadius: 60, maxChaseDistance: 280, respawnSeconds: 70,
      habitatName: 'Altar da Morte (Ilha 4)',
    },
    {
      id: 's_i4_medusa_1', zone: 'map1', monsterType: 'medusa',
      homeX: 1010, homeY: -1810, roamRadius: 55, maxChaseDistance: 260, respawnSeconds: 75,
      habitatName: 'Covil da Medusa (Ilha 4)',
    },
    // Chefe do Santuário Místico & Crias
    {
      id: 's_i4_boss_draertis', zone: 'map1', monsterType: 'draertis_chefe',
      homeX: 1160, homeY: -1710, roamRadius: 65, maxChaseDistance: 320, respawnSeconds: 110,
      habitatName: 'Torre do Arquimago Draertis (Chefe do Santuário)',
    },
    {
      id: 's_i4_mini_draertis_1', zone: 'map1', monsterType: 'draertis_mini',
      homeX: 1120, homeY: -1680, roamRadius: 45, maxChaseDistance: 260, respawnSeconds: 45,
      habitatName: 'Sentinela do Altar (Mini Draertis)',
    },
    {
      id: 's_i4_mini_draertis_2', zone: 'map1', monsterType: 'draertis_mini',
      homeX: 1200, homeY: -1740, roamRadius: 45, maxChaseDistance: 260, respawnSeconds: 45,
      habitatName: 'Sentinela do Altar (Mini Draertis)',
    },
    {
      id: 's_i4_dragis_1', zone: 'map1', monsterType: 'dragis',
      homeX: 1260, homeY: -1910, roamRadius: 60, maxChaseDistance: 290, respawnSeconds: 80,
      habitatName: 'Pico dos Dragões Místicos (Ilha 4)',
    },
    {
      id: 's_i4_magmal_1', zone: 'map1', monsterType: 'magmal',
      homeX: 910, homeY: -1660, roamRadius: 50, maxChaseDistance: 250, respawnSeconds: 70,
      habitatName: 'Fissura de Magma (Ilha 4)',
    },
    {
      id: 's_i4_fera_1', zone: 'map1', monsterType: 'fera',
      homeX: 660, homeY: -1610, roamRadius: 55, maxChaseDistance: 260, respawnSeconds: 60,
      habitatName: 'Território das Feras (Ilha 4)',
    },
    {
      id: 's_i4_golen_1', zone: 'map1', monsterType: 'golen',
      homeX: 1110, homeY: -1560, roamRadius: 50, maxChaseDistance: 240, respawnSeconds: 60,
      habitatName: 'Guardião do Santuário (Ilha 4)',
    },
    {
      id: 's_i4_drago_1', zone: 'map1', monsterType: 'drago',
      homeX: 810, homeY: -2060, roamRadius: 65, maxChaseDistance: 320, respawnSeconds: 100,
      habitatName: 'Cume Dracônico (Ilha 4)',
    },

    // ── ILHA 5 (Terras Dracônicas - Endgame) ──
    // Chefe Supremo dos Dragões & Crias
    {
      id: 's_i5_boss_dragis', zone: 'map1', monsterType: 'dragis_chefe',
      homeX: 2010, homeY: -1910, roamRadius: 70, maxChaseDistance: 340, respawnSeconds: 120,
      habitatName: 'Trono do Imperador Dragis (Chefe Supremo)',
    },
    {
      id: 's_i5_mini_dragis_1', zone: 'map1', monsterType: 'dragis_mini',
      homeX: 1960, homeY: -1880, roamRadius: 50, maxChaseDistance: 280, respawnSeconds: 50,
      habitatName: 'Cria Dracônica (Mini Dragis)',
    },
    {
      id: 's_i5_mini_dragis_2', zone: 'map1', monsterType: 'dragis_mini',
      homeX: 2060, homeY: -1940, roamRadius: 50, maxChaseDistance: 280, respawnSeconds: 50,
      habitatName: 'Cria Dracônica (Mini Dragis)',
    },
    {
      id: 's_i5_mini_dragis_3', zone: 'map1', monsterType: 'dragis_mini',
      homeX: 2020, homeY: -1850, roamRadius: 50, maxChaseDistance: 280, respawnSeconds: 50,
      habitatName: 'Cria Dracônica (Mini Dragis)',
    },
    {
      id: 's_i5_bat_rei_1', zone: 'map1', monsterType: 'bat rei',
      homeX: 1910, homeY: -1660, roamRadius: 60, maxChaseDistance: 300, respawnSeconds: 70,
      habitatName: 'Trono do Rei das Asas (Ilha 5)',
    },
    {
      id: 's_i5_medusa_1', zone: 'map1', monsterType: 'medusa',
      homeX: 2160, homeY: -1760, roamRadius: 60, maxChaseDistance: 280, respawnSeconds: 75,
      habitatName: 'Templo Petrificado (Ilha 5)',
    },
    {
      id: 's_i5_cavern_creature_1', zone: 'map1', monsterType: 'cavern creature',
      homeX: 2310, homeY: -1860, roamRadius: 60, maxChaseDistance: 290, respawnSeconds: 80,
      habitatName: 'Abismo de Sangue (Ilha 5)',
    },
    {
      id: 's_i5_triron_1', zone: 'map1', monsterType: 'triron',
      homeX: 1860, homeY: -2060, roamRadius: 65, maxChaseDistance: 320, respawnSeconds: 90,
      habitatName: 'Baluarte dos Titãs de Ferro (Ilha 5)',
    },
    {
      id: 's_i5_glacis_1', zone: 'map1', monsterType: 'glacis',
      homeX: 2060, homeY: -2110, roamRadius: 65, maxChaseDistance: 320, respawnSeconds: 90,
      habitatName: 'Geleira Eterna (Ilha 5)',
    },
    {
      id: 's_i5_ins_1', zone: 'map1', monsterType: 'ins',
      homeX: 2260, homeY: -2010, roamRadius: 60, maxChaseDistance: 300, respawnSeconds: 85,
      habitatName: 'Ninho dos Insetóides do Vazio (Ilha 5)',
    },
    {
      id: 's_i5_token_1', zone: 'map1', monsterType: 'token',
      homeX: 2410, homeY: -1910, roamRadius: 65, maxChaseDistance: 320, respawnSeconds: 95,
      habitatName: 'Fortaleza Esquecida (Ilha 5)',
    },
  ],
};

/**
 * Cria instâncias clonadas com estado de runtime zerado para a zona fornecida.
 */
export function createZoneSpawnPoints(zoneId: string): SpawnPoint[] {
  const templates = ZONE_SPAWNS_TEMPLATES[zoneId] || ZONE_SPAWNS_TEMPLATES['map1'] || [];
  return templates.map((t) => ({
    ...t,
    currentMonsterId: null,
    deathTimestamp: null,
  }));
}
