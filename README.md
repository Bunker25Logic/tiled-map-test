# ⚔️ Tibia Tiled Map Explorer (RPG 2D)

Um motor de jogo RPG 2D inspirado no clássico **Tibia / OTServ**, desenvolvido em **React 19**, **TypeScript**, **Vite** e **Canvas 2D HTML5**, com carregamento nativo de mapas do **Tiled** (`.tmj` / `.json`), chroma-key automático de magenta (`#ff00ff`), sistema de profundidade Y-Sorting, 103 monstros com biomas, 5 classes de heróis, grimório com 26 magias e suporte completo a mobile e desktop.

---

## 🗺️ 1. Visão Geral da Arquitetura

O projeto é dividido em camadas modulares para permitir que o motor de renderização, física, combate e interface React coexistam de forma performática a 60 FPS:

```
tiled-tests/
├── public/
│   ├── map1.tmj                              # Mapa principal da superfície (Ilhas 1 a 5)
│   ├── caverna-zona-1.tmj                    # Caverna da Ilha 1 para Ilha 2
│   ├── caverna 2 ilha 2 para ilha 3.tmj      # Caverna da Ilha 2 para Ilha 3
│   ├── caverna 3 ilha 4 para ilha 5.tmj      # Caverna da Ilha 4 para Ilha 5
│   └── assets/
│       ├── tiles/                            # Tilesets OTServ (otsp_tiles_01, otsp_walls_01, etc.)
│       ├── char/                             # Sprites dos 5 heróis (pastas com 12 PNGs cada)
│       ├── entities/                         # 103 tipos de monstros com sprites animados
│       ├── magic-effects/                    # Efeitos de feitiços e spritesheet 'magics t.webp'
│       └── itens/                            # Asas equipáveis ('asas angelicais.webp', 'asas trovao.webp')
└── src/
    ├── App.tsx                               # Estado raiz, transição de lobby/mundo, loadouts
    ├── App.css                               # Design system escuro, responsivo para celular e desktop
    ├── GameCanvas.tsx                        # Loop principal (requestAnimationFrame), Y-sorting, asas, combate
    ├── components/
    │   ├── CharacterLobby.tsx                # Menu de seleção de heróis e estatísticas
    │   ├── CharacterSpriteAvatar.tsx         # Renderizador pixel-art de avatares com chroma-key
    │   ├── SpellbookModal.tsx                # Grimório de seleção e configuração dos 5 slots de magia
    │   ├── SettingsModal.tsx                 # Modal de gráficos (filtros HD/Pixel/CRT) e asas
    │   └── Minimap.tsx                       # Radar/minimapa em tempo real
    └── game/
        ├── characters.ts                     # Heróis jogáveis, convenção de direção OTServ
        ├── magic.ts                          # 26 feitiços (incluindo as 8 magias clássicas do Tibia)
        ├── entities.ts                       # Classe Monster, IA de perambulação e biomas de spawn
        ├── entitiesConfig.json               # Configuração balanceada dos 103 monstros
        ├── renderer.ts                       # Y-sorting, ondas de água animadas, culling de câmera
        ├── zones.ts                          # Catálogo de mapas e coordenadas de portais/escadas
        ├── imageLoader.ts                    # Carregador de imagens com remoção de magenta (#ff00ff)
        ├── mapUtils.ts                       # Decodificação de GID do Tiled e colisão AABB
        └── types.ts                          # Tipos TypeScript do mapa, direções e entidades
```

---

## 🧭 2. Convenções e Regras Fundamentais (Guia para IA e Desenvolvedores)

### 📌 A. Convenção de Direções OTServ (`dirToOtsNum`)
Todos os personagens e monstros nos diretórios OTServ utilizam a estrutura de 12 arquivos (`frame_1_1_dir.png`):
- `dir = 1`: **Cima / Norte (Costas)** ⬆️
- `dir = 2`: **Direita / Leste (Perfil Direito)** ➡️
- `dir = 3`: **Baixo / Sul (Frente / Olhando para a tela)** ⬇️
- `dir = 4`: **Esquerda / Oeste (Perfil Esquerdo)** ⬅️

> **Importante:** Sempre mantenha essa convenção em `characters.ts` e `entities.ts`.

---

### 📌 B. Sistema de Profundidade e Renderização (Y-Sorting)
- **Linha de Contato com o Solo:** Todos os objetos do mapa (paredes, telhados, árvores) utilizam sua linha base inferior exata `sortY = obj.y + offsetY`.
- **Pés do Jogador e Monstros:** O ponto de ordenação do jogador é `player.y + HITBOX_H` (linha dos pés).
- **Sem Agrupamentos Verticais Longos:** Não una paredes do norte com paredes do sul em colunas verticais para não cobrir o interior dos cômodos quando o herói entrar numa casa.
- **Decorações de Solo:** Apenas flores e gramíneas rasteiras recebem `sortY = -999999` para ficarem sempre sob os pés.

---

### 📌 C. Sistema de Asas e Rotação (`drawWings`)
Asas equipáveis são configuradas dinamicamente em `GameCanvas.tsx` através de `WINGS_ANGELIC_CONFIG` e `WINGS_THUNDER_CONFIG`:
- **Recorte Exato (`sx, sy, sw, sh`):** Define a região do spritesheet original a ser recortada para cada direção.
- **Offsets e Escala (`offX, offY, scale, rot`):** Permitem ajuste milimétrico de posição e ângulo de inclinação em graus.
- **Profundidade (`behind`):**
  - `true`: Asa desenhada **atrás** do tronco do personagem (visão de frente/sul).
  - `false`: Asa desenhada **na frente** do tronco do personagem (visão de costas/norte).

---

### 📌 D. Grimório e Conjuração de Magias
- As magias suportam 3 tipos de animação (`animType`):
  1. `'sheet'`: Spritesheet com grade regular de colunas e linhas (`cols, rows, frameW, frameH`).
  2. `'sequence'`: Sequência de arquivos individuais indexados em `frameKeys`.
  3. `'custom_frames'`: Recortes customizados em pixel via `customFrames: [{ sx, sy, sw, sh }]` (usado nas 8 magias de `magics t.webp`).
- **Ponto de Lançamento (`spawnOffsetDist`):** Magias de impacto frontal (como *Flame Strike*, *Terra Monolith*, *Ice Burst*, *Thunder Pillar*) possuem `spawnOffsetDist: 34` para surgirem **1 tile à frente** na direção em que o herói está olhando.

---

## 🧙 3. Heróis Jogáveis Ativos

| ID | Nome | Classe | Destaque |
| :--- | :--- | :--- | :--- |
| `luxio` | **Luxio** | Guerreiro da Luz | Espadachim veloz com ataques equilibrados. |
| `archer` | **Archer** | Arqueira Élfica | Ataques perfurantes à distância e agilidade. |
| `magician` | **Magician** | Arquimago Elemental | Grande dano em área e alta reserva de mana. |
| `necromancer`| **Necromancer**| Mestre das Sombras | Especialista em feitiços de morte (SD) e venenos. |
| `paladin` | **Paladin** | Paladino Sagrado | Defesa impenetrável e relâmpagos sagrados. |

---

## 🪄 4. As 8 Magias Clássicas do Tibia (`magics t.webp`)

1. ❄️ **Ice Burst (`Exevo Frigo`):** Esfera de gelo pulsante que expande em área.
2. ✨ **Divine Missile (`Exori San`):** Lança veloz de luz divina disparada em projétil.
3. 🌪️ **Ice Vortex (`Mas Frigo`):** Vórtice congelante em rotação contínua.
4. 💀 **Sudden Death (`SD / Exori Mort`):** Projétil sombrio com explosão de caveira/morte.
5. 🔥 **Flame Strike (`Exori Flam`):** Erupção instantânea de fogo e brasas no chão.
6. 🌿 **Terra Monolith (`Exori Tera`):** Coluna sólida de rocha e raízes que brota do solo.
7. ⚡ **Energy Wave (`Exevo Vis Hur`):** Raio perfurante elétrico horizontal.
8. 🌩️ **Thunder Pillar (`Exevo Vis Lux`):** Coluna colossal de relâmpagos caindo do céu.

---

## 🐉 5. Monstros e Biomas (103 Criaturas)

Os monstros estão mapeados em `entitiesConfig.json` e distribuídos automaticamente pelas ilhas da superfície e cavernas:
- **Ilha 1 (Floresta & Ruínas):** `esquilo`, `alce`, `vead`, `piggi`, `dog`, `dodo`, `hiena`, `elf`, `anao`, `duende`, `orc`, `pand`.
- **Ilha 2 (Deserto de Areia):** `skedesert`, `lacost`, `mumia`, `serpent`, `mummi`, `mummi2`, `golen-magma`, `genie`, `scarnsabre`.
- **Ilha 3 (Montanhas Rochosas):** `tiguersabre`, `bufao`, `centgreen`, `centongg`, `centon`, `whitewolf`, `golen`, `golen2`, `trolol`, `drago`, `orc`, `lobisonem`.
- **Ilha 4 (Santuário Místico):** `draertis`, `dragis`, `medusa`, `fantasn`, `aparition`, `thedeath`, `golen`, `magmal`, `drago`, `centon`, `fera`.
- **Ilha 5 (Terras Dracônicas):** `draertis`, `dragis`, `bat rei`, `medusa`, `triron`, `glacis`, `ins`, `token`, `cavern creature`.
- **Cavernas 1, 2 e 3:** Conectam as ilhas através de masmorras subterrâneas infestadas de mortos-vivos, morcegos e chefes.

---

## 🚀 6. Como Executar e Validar o Projeto

### Instalação e Desenvolvimento:
```bash
npm install
npm run dev
```

### Mandato de Validação (Obrigatório para alterações):
Toda modificação de código deve ser validada e concluir com **0 erros e 0 warnings**:
```bash
npm run lint
npm run build
```

---

## 🎮 7. Controles do Jogo

- **Movimentação:** Teclas `W`, `A`, `S`, `D` ou Setas do Teclado (ou Joystick Virtual no Celular).
- **Ataque Básico:** Barra de Espaço (`Space`) ou botão vermelho de espada no celular.
- **Magias Rápidas:** Teclas `1`, `2`, `3`, `4`, `5` ou toque nos slots inferiores da barra.
- **Grimório:** Tecla `B` ou botão `📖 Trocar / Grimório`.
- **Configurações & Asas:** Ícone de engrenagem (`⚙️`) no topo da tela.
- **Alternar Asas Rapidamente:** Botão de asas no header (`🪽 Asas`).

---

## 💰 8. Sistema de Economia Tripla (Moedas)

O jogo usa três tipos de moeda com taxas de câmbio fixas, armazenadas por personagem em `PlayerWallet`:

| Moeda | Ícone | Valor Base | Origem |
|:------|:------|:-----------|:-------|
| **Basalt** (Basalto) | 🪨 | 1 Basalto | Monstros fracos (biomas iniciais) |
| **Silver** (Prata) | 🥈 | 1 Prata | Monstros médios e chefes |
| **Gold** (Ouro) | 🥇 | 100 Pratas = 1 Ouro | Chefes, conversão na casa de câmbio |

### Taxas de Câmbio (`exchangeCharacterCoins`)

| Operação | Taxa |
|:---------|:-----|
| `silver_to_gold` | 100 Pratas → 1 Ouro |
| `gold_to_silver` | 1 Ouro → 100 Pratas |
| `gold_to_crystal` | 500 Ouros → 1 Cristal de Basalto |
| `crystal_to_gold` | 1 Cristal de Basalto → 400 Ouros (pequena taxa) |
| `optimize_all` | Converte automaticamente tudo no menor número de moedas |

> A casa de câmbio pode ser aberta pelo atalho de teclado `C`.

### Drops de Moedas por Monstros

Ao matar monstros, moedas são geradas no chão como entidades coletáveis via `generateMonsterCoinDrops`. O valor total dropado escala com a recompensa de XP do monstro:
- **Monstros comuns:** 1–3 Basaltos ou Pratas pequenas.
- **Monstros de elite:** Pilhas de Pratas e alguns Ouros.
- **Chefes:** Drops generosos de Ouros + baú de loot com equipamento garantido.

---

## 📈 9. Sistema de Progressão e Nivelamento

### Fórmula de XP (Idêntica ao OT Tibia)

```
XP necessário para o nível L = (50/3) × (L³ − 6L² + 17L − 12)
```

Implementada em `xpRequiredForLevel(level)` em `playerStore.ts`.

| Nível | XP Total Necessário |
|:------|:--------------------|
| 2 | 100 |
| 5 | 1.200 |
| 10 | 15.600 |
| 20 | 143.400 |
| 30 | 469.800 |
| 50 | 2.706.250 |

### HP e MP por Classe (Por Nível)

| Classe | HP Base | HP / Nível | MP Base | MP / Nível |
|:-------|:--------|:-----------|:--------|:-----------|
| **Luxio** | 150 | +15 | 80 | +6 |
| **Archer** | 110 | +10 | 90 | +8 |
| **Magician** | 95 | +5 | 200 | +25 |
| **Necromancer** | 105 | +8 | 180 | +20 |
| **Paladin** | 160 | +14 | 120 | +10 |

### Penalidade de Morte

Ao morrer, o personagem perde **10% do XP total acumulado** (podendo recuar de nível). Esse valor é reduzido para **2%** quando a Bênção do Templo está ativa:

```ts
// Sem bênção: perda de 10% do XP
lostXp = Math.floor(char.xp * 0.10);

// Com bênção sagrada: perda de apenas 2%
lostXp = Math.floor(char.xp * 0.02);
// bênção é consumida após o uso
```

---

## 🔒 10. Travamentos de Progressão (Level & Vocação)

Itens e magias possuem requisitos de desbloqueio. Se o personagem não atender, um ícone 🔒 aparece no inventário/grimório e o item não pode ser equipado.

### Requisitos por Equipamento

| Item | Nível Mínimo | Vocações Permitidas |
|:-----|:-------------|:--------------------|
| Espada de Madeira | 1 | Todas |
| Arco Élfico | 8 | Archer |
| Escudo Rúnico | 10 | Paladin, Luxio |
| Botas de Mercúrio | 10 | Todas |
| Espada Radiante | 12 | Luxio, Paladin |
| Cajado das Sombras | 15 | Magician, Necromancer |
| Armadura de Titânio | 20 | Paladin, Luxio |
| Espada de Ouro | 28 | Luxio, Paladin |
| Asas Angelicais | 30 | Todas |
| Might Ring | 35 | Todas |

### Requisitos por Magia

Magias com `requiredLevel` bloqueiam o slot no grimório até o nível necessário ser atingido. Classes sem permissão (`allowedClasses`) não enxergam a magia na lista.

---

## 🧑‍🤝‍🧑 11. Sistema de NPCs

Três NPCs habitam a cidade próxima ao ponto de spawn da Ilha 1 (`map1`):

### Jack — Guardião Sagrado do Templo (`role: 'priest'`)
- **Posição:** Acima do spawn, tile ~(48, -644)
- **Serviço principal:** Vende a **Bênção Sagrada** por **10 Moedas de Ouro**.
- **Efeito:** Reduz a penalidade de morte de 10% → 2% de XP na próxima morte. Consumida ao morrer.
- **Indicador visual:** Ícone de escudo 🛡️ no HUD do jogador enquanto a bênção estiver ativa.

### Nano — Mestre Ferreiro Anão (`role: 'blacksmith'`)
- **Posição:** À esquerda do spawn, tile ~(45, -642)
- **Serviços:** Compra e vende equipamentos. Aceita itens do inventário em troca de Prata.
- **Loja:**

| Item | Preço de Compra |
|:-----|:----------------|
| Espada de Madeira | 100 Pratas (1 Ouro) |
| Espada Radiante | 4.500 Pratas (45 Ouros) |
| Arco Élfico | 2.500 Pratas (25 Ouros) |
| Cajado das Sombras | 5.000 Pratas (50 Ouros) |
| Escudo Rúnico | 3.000 Pratas (30 Ouros) |
| Botas de Mercúrio | 2.000 Pratas (20 Ouros) |
| Armadura de Titânio | 8.000 Pratas (80 Ouros) |

### Split — Mestra Alquimista Arcana (`role: 'alchemist'`)
- **Posição:** À direita do spawn, tile ~(51, -642)
- **Serviços:** Vende poções de consumo rápido.
- **Loja:**

| Item | Preço | Efeito |
|:-----|:------|:-------|
| Poção de Vida Maior | 40 Pratas | +80 HP instantâneo |
| Poção de Mana Maior | 50 Pratas | +80 MP instantâneo |
| Elixir da Fúria Divina | 300 Pratas (3 Ouros) | +50 HP + 50 MP |

### Mecânica de Interação com NPC

- **Raio de Detecção:** 60 px — quando o jogador está próximo, um balão de fala 💬 aparece sobre o NPC.
- **Ativação:** Tecla `E` / `Enter` no teclado, ou botão de interação exibido pelo `VirtualJoystick` no mobile.
- **Direcionamento:** O NPC vira automaticamente para encarar o jogador quando a distância for ≤ 120 px.
- **Compra:** Valida saldo da carteira antes de confirmar a transação.
- **Venda:** Qualquer item do inventário pode ser vendido pela metade do preço de compra (~30–35% do valor de NPC).

---

## ⚔️ 12. Combate e Dano por Classe

O dano base de ataque físico varia por vocação e é aumentado pelos bônus de ataque (`stats.attack`) dos equipamentos:

| Classe | Dano Base (Físico) | Descrição |
|:-------|:-------------------|:----------|
| **Luxio** | 45 – 65 | Guerreiro equilibrado com alto dano físico |
| **Archer** | 38 – 56 | Ágil com dano médio-alto |
| **Paladin** | 35 – 53 | Defesa superior, dano físico sólido |
| **Necromancer** | 26 – 40 | Mago com dano físico baixo, foco em magias |
| **Magician** | 26 – 40 | Mesma base do Necromancer |

> O dano de magias adiciona 75% dos `stats.attack` do equipamento ao dano base da magia (`spellDmg += stats.attack × 0.75`).

### Regeneração Passiva (a cada 2 segundos)

| Classe | Regen HP Base | Regen MP Base |
|:-------|:-------------|:-------------|
| Todas as classes | +1 HP | +2 MP |
| + bônus de anéis | `hpRegen` do item | `mpRegen` do item |

---

## 🎁 13. Sistema de Loot

### Drops de Baú (`LootBox`)
Ao matar um monstro, um baú pode cair com:
- **Monstros comuns:** Chance baixa de drop de item comum.
- **Chefes (`isBoss: true`):** Baú lendário garantido com item épico/lendário do `ALL_ITEMS`.

### Manchas de Sangue (`BloodStain`)
Cada morte de monstro cria uma mancha de sangue no chão com 3 estágios visuais progressivos (clara → escura → desaparecendo ao longo de ~9 segundos).

### Pilhas de Moedas Coletáveis (`CoinDrop`)
Moedas ficam no chão como entidades físicas com sprite animado. O jogador coleta ao passar por cima. Identificáveis visualmente:
- 🪨 **Basalto** — sprite cinza
- 🥈 **Prata** — sprite prateado
- 🥇 **Ouro** — sprite dourado brilhante

---

## 📱 14. PWA e Suporte Offline

O projeto é um **Progressive Web App** completo com:

- **Instalação via Banner:** Ao abrir no celular pela primeira vez, um modal exige instalação antes de permitir jogar.
- **Ícone personalizado:** Estilo inspirado em Tibia com o brasão "Oliver B25L".
- **Modo Paisagem Forçado:** O jogo abre automaticamente em modo landscape; caso o aparelho esteja em portrait, um `OrientationLockModal` pede ao usuário que gire o dispositivo.
- **Service Worker (Workbox):** Pré-cacheia 3.202+ arquivos (~28 MB) automaticamente a cada deploy.
- **Download Manual de Assets:** Modal `AssetDownloadModal` pré-baixa todos os sprites de monstros, itens, mapas e efeitos mágicos para a `Cache API` do navegador, garantindo funcionamento 100% offline.
- **Auto-atualização Inteligente:** Sempre que o código é atualizado e publicado, o Service Worker detecta a nova versão e aplica sem necessidade de reinstalar o app.

