# 🗺️ Reconstrução Completa do Mundo & Cavernas com Camadas de Objetos

Todas as estruturas, paredes, telhados, portas, árvores, cogumelos, baús, pilares, móveis e decorações foram reconstruídos **do zero utilizando exclusivamente Camadas de Objetos (`objectgroup`) como Tile Objects**.

---

## 🚀 Principais Mudanças e Correções

### 1. Camadas de Objetos vs Camada de Blocos
* **Problema Anterior:** Ao colocar paredes e móveis na camada de blocos (`tilelayer`), os blocos ficavam presos no chão ortogonal, sem possibilidade de serem girados, espelhados ou ajustados para fechar cantos.
* **Nova Solução:** Agora a camada `Chao` (`tilelayer`) contém **apenas o piso do terreno** (grama, caminhos de pedra, areia, terra, piso de madeira, água e bedrock).
* Todas as casas, paredes, telhados, árvores e móveis estão em **Camadas de Objetos** (`Estruturas_e_Casas`, `Natureza_e_Vegetacao`, `Moveis_e_Decoracoes`):
  * **Manipulação Total no Tiled:** Você pode selecionar qualquer elemento com a ferramenta de seleção de objetos, mover livremente, ajustar alinhamentos e fechar paredes.
  * **Espelhamento e Rotação:** Pressione **`X`** para espelhar horizontalmente, **`Y`** para espelhar verticalmente e **`Z`** para rotacionar 90 graus.

### 2. Integridade Completa de Objetos Multi-Tile (Sem Metades ou Cortes)
* **Baús Duplos Completos:** Todos os baús de madeira (`town.png` 68 + 69) e baús de ouro (`town.png` 64 + 65) possuem as 2 metades devidamente montadas lado a lado.
* **Pilares de Pedra 2x2:** Todos os pilares são conjuntos completos de 64x64 px (tiles 164, 165, 180, 181).
* **Forjas de Lava 2x2:** Montadas com as 4 peças completas (tiles 230, 231, 246, 247).
* **Monólitos Rúnicos 2x2:** Montados com as 4 peças completas (tiles 228, 229, 244, 245).
* **Fonte de Água 2x2:** Montada com as 4 peças completas (tiles 232, 233, 248, 249).
* **Camas Completas:** Cabeceira e base alinhadas perfeitamente (tiles 419 + 435).
* **Árvores e Cogumelos Gigantes 2x2:** Árvores de carvalho, pinheiros e cogumelos gigantes contam com os 4 quadrantes devidamente conectados.

### 3. Casas Fechadas e Estruturadas
* As casas nas vilas e postos contam com:
  * Paredes de pedra com cantos de encaixe autênticos (`walls.png` 6, 7, 22, 23).
  * Paredes horizontais com janelas de vidro integradas (`walls.png` 3, 19, 9, 25).
  * Telhados de terracota alinhados no topo (`chao.png` 295, 296).
  * Portais de entrada com batente e porta de madeira (`otsp_doors_01.png` 32).
  * Caixas de colisão delimitando precisamente as paredes sólidas e liberando a porta.

### 4. Cavernas Naturais e Orgânicas (Sem Paredes Retas Artificiais)
* As 3 cavernas foram refeitas com algoritmo orgânico (Autômatos Celulares):
  * **Caverna dos Minérios:** Túneis sinuosos, lago subterrâneo, acampamento com fogueira, caixas, baús de suprimento, veios de minério expostos, forja profunda de lava e escada de corda para a superfície.
  * **Caverna Fúngica:** Rio subterrâneo sinuoso com água bioluminescente, cogumelos gigantes 2x2, santuário de alquimia e saída para a pedreira.
  * **Catacumbas do Deserto:** Lápides e criptas subterrâneas com piso de mármore claro, pilares rituais em torno do monólito central, câmara do tesouro com múltiplos baús de ouro e escada para o deserto.
* Todo o perímetro das cavernas é preenchido com **Bedrock Sólido Preto** (`chao.png` 196) e contornado por objetos de escarpas rochosas.

---

## 🖼️ Pré-visualizações dos Mapas Gerados

````carousel
![Mapa Principal do Mundo de Sobrevivência](file:///C:/Users/SEE2/.gemini/antigravity-ide/brain/f7d4566a-7627-4f16-92c5-5a62e194132d/overworld_preview.png)
<!-- slide -->
![Caverna dos Minérios](file:///C:/Users/SEE2/.gemini/antigravity-ide/brain/f7d4566a-7627-4f16-92c5-5a62e194132d/caverna_minerios_preview.png)
<!-- slide -->
![Caverna Fúngica](file:///C:/Users/SEE2/.gemini/antigravity-ide/brain/f7d4566a-7627-4f16-92c5-5a62e194132d/caverna_fungica_preview.png)
<!-- slide -->
![Catacumbas do Deserto](file:///C:/Users/SEE2/.gemini/antigravity-ide/brain/f7d4566a-7627-4f16-92c5-5a62e194132d/catacumbas_deserto_preview.png)
````

---

## 📁 Arquivos do Projeto no Diretório Tiled

| Tipo | Arquivo JSON (`.tmj`) | Arquivo XML (`.tmx`) | Dimensões | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| **Mundo Superior** | [mundo_sobrevivencia.tmj](file:///C:/Users/SEE2/Documents/tiled/mundo_sobrevivencia.tmj) | [mundo_sobrevivencia.tmx](file:///C:/Users/SEE2/Documents/tiled/mundo_sobrevivencia.tmx) | 80x80 (2560x2560 px) | 4 biomas, vila, casas fechadas, 3 entradas de cavernas |
| **Caverna 1** | [caverna_minerios.tmj](file:///C:/Users/SEE2/Documents/tiled/caverna_minerios.tmj) | [caverna_minerios.tmx](file:///C:/Users/SEE2/Documents/tiled/caverna_minerios.tmx) | 40x40 (1280x1280 px) | Mineração, lago, forja profunda, veios de ouro/ferro |
| **Caverna 2** | [caverna_fungica.tmj](file:///C:/Users/SEE2/Documents/tiled/caverna_fungica.tmj) | [caverna_fungica.tmx](file:///C:/Users/SEE2/Documents/tiled/caverna_fungica.tmx) | 40x40 (1280x1280 px) | Rio subterrâneo, cogumelos gigantes 2x2, santuário |
| **Caverna 3** | [catacumbas_deserto.tmj](file:///C:/Users/SEE2/Documents/tiled/catacumbas_deserto.tmj) | [catacumbas_deserto.tmx](file:///C:/Users/SEE2/Documents/tiled/catacumbas_deserto.tmx) | 40x40 (1280x1280 px) | Cripta de mármore, sarcófago rúnico, cofre de ouro |
| **Mundo Unificado** | [mundo.world](file:///C:/Users/SEE2/Documents/tiled/mundo.world) | - | - | Integração de todos os 4 mapas no visualizador de mundos |
