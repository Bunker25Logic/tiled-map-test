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
