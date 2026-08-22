import { PLAYABLE_CHARACTERS, type CharacterId, type CharacterDef } from '../game/characters';
import CharacterSpriteAvatar from './CharacterSpriteAvatar';

interface CharacterLobbyProps {
  selectedCharacterId: CharacterId;
  onSelectCharacter: (id: CharacterId) => void;
  onStartGame: () => void;
}

interface HeroLore {
  title: string;
  role: string;
  difficulty: string;
  stats: {
    hp: number;
    mp: number;
    atk: number;
    spd: number;
  };
  startingSpells: string[];
}

const HERO_LORE_MAP: Record<CharacterId, HeroLore> = {
  mark: {
    title: 'Guerreiro da Espada',
    role: 'Corpo a Corpo / Versátil',
    difficulty: 'Fácil',
    stats: { hp: 140, mp: 60, atk: 120, spd: 120 },
    startingSpells: ['🔥 Fire Lion', '⚡ Lightning', '🌪️ Whirlwind', '🛡️ Ice Shield', '✨ Sparkling'],
  },
  archer: {
    title: 'Arqueira Élfica',
    role: 'Distância / Agilidade',
    difficulty: 'Médio',
    stats: { hp: 110, mp: 90, atk: 135, spd: 135 },
    startingSpells: ['🌱 Floral Ent.', '⚡ Lightning', '✨ Sparkling', '🌿 Ancient Roots', '🐍 Snake Bite'],
  },
  barbarian: {
    title: 'Fúria Bárbara',
    role: 'Tanque / Dano Pesado',
    difficulty: 'Fácil',
    stats: { hp: 180, mp: 40, atk: 150, spd: 110 },
    startingSpells: ['🌪️ Whirlwind', '🐢 Turtle Shell', '🪨 Stone & Leaves', '🔥 Fire Lion', '🛡️ Ice Shield'],
  },
  magician: {
    title: 'Arquimago Elemental',
    role: 'Mago / Área',
    difficulty: 'Médio',
    stats: { hp: 95, mp: 200, atk: 160, spd: 115 },
    startingSpells: ['🌌 Cosmic Vortex', '🔮 Arcane Nova', '⚡ Lightning', '🌊 Abyssal Vortex', '🔥 Fire Lion'],
  },
  necromancer: {
    title: 'Mestre das Sombras',
    role: 'Magia Negra / Controle',
    difficulty: 'Avançado',
    stats: { hp: 105, mp: 180, atk: 145, spd: 120 },
    startingSpells: ['🐍 Snake Bite', '👁️ Arcane Gaze', '🍄 Spore Eruption', '🌊 Abyssal Vortex', '✨ Astral Shield'],
  },
  paladin: {
    title: 'Cavaleiro Sagrado',
    role: 'Defensor / Suporte',
    difficulty: 'Fácil',
    stats: { hp: 160, mp: 120, atk: 115, spd: 115 },
    startingSpells: ['🛡️ Ice Shield', '✨ Astral Shield', '💎 Emerald Crystal', '🐢 Turtle Shell', '🌱 Floral Ent.'],
  },
};

export default function CharacterLobby({
  selectedCharacterId,
  onSelectCharacter,
  onStartGame,
}: CharacterLobbyProps) {
  const selectedHeroDef =
    PLAYABLE_CHARACTERS.find((c) => c.id === selectedCharacterId) || PLAYABLE_CHARACTERS[0];
  const lore = HERO_LORE_MAP[selectedHeroDef.id];

  return (
    <div className="lobby-overlay">
      <div className="lobby-container">
        {/* Compact Lobby Header */}
        <header className="lobby-header">
          <div className="lobby-brand">
            <span className="lobby-icon">⚔️</span>
            <div>
              <h1>Tibia Tiled Explorer</h1>
              <p>Escolha seu herói e entre na aventura</p>
            </div>
          </div>
          <div className="lobby-header-badge">
            <span>6 Classes</span>
          </div>
        </header>

        {/* Main Content Grid */}
        <div className="lobby-main-grid">
          {/* Left Column: 6 Hero Selection Cards */}
          <div className="lobby-heroes-panel">
            <div className="heroes-grid">
              {PLAYABLE_CHARACTERS.map((hero: CharacterDef) => {
                const isSelected = selectedCharacterId === hero.id;
                const heroLore = HERO_LORE_MAP[hero.id];
                return (
                  <button
                    key={hero.id}
                    className={`lobby-hero-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => onSelectCharacter(hero.id)}
                  >
                    <div className="hero-card-header">
                      <div className="hero-card-avatar-box">
                        <CharacterSpriteAvatar charId={hero.id} size={30} />
                      </div>
                      <div className="hero-card-names">
                        <strong>{hero.name}</strong>
                        <span className="hero-card-class">{hero.className}</span>
                      </div>
                    </div>

                    <div className="hero-card-role-tag">{heroLore.role}</div>

                    <div className="hero-card-mini-stats">
                      <div className="mini-stat">
                        <span className="stat-label">HP</span>
                        <div className="stat-bar-bg">
                          <div
                            className="stat-bar-fill hp"
                            style={{ width: `${(heroLore.stats.hp / 200) * 100}%` }}
                          />
                        </div>
                      </div>
                      <div className="mini-stat">
                        <span className="stat-label">MP</span>
                        <div className="stat-bar-bg">
                          <div
                            className="stat-bar-fill mp"
                            style={{ width: `${(heroLore.stats.mp / 200) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Hero Showcase & Always-Visible CTA */}
          <div className="lobby-detail-panel">
            <div className="hero-showcase-card">
              {/* Header with real sprite preview */}
              <div className="showcase-header">
                <div className="showcase-badge">
                  <div className="showcase-avatar-box">
                    <CharacterSpriteAvatar charId={selectedHeroDef.id} size={38} />
                  </div>
                  <div>
                    <h2>{selectedHeroDef.name}</h2>
                    <span className="showcase-subtitle">{lore.title}</span>
                  </div>
                </div>

                <div className="showcase-difficulty">
                  <span className="diff-label">Dificuldade</span>
                  <span className="diff-val">{lore.difficulty}</span>
                </div>
              </div>

              {/* Attributes (HP, MP, Dano, Vel) */}
              <div className="showcase-attributes">
                <div className="attributes-grid">
                  <div className="attr-item">
                    <div className="attr-meta">
                      <span>❤️ Vida</span>
                      <strong>{lore.stats.hp}</strong>
                    </div>
                    <div className="attr-progress-bg">
                      <div
                        className="attr-progress-bar hp"
                        style={{ width: `${(lore.stats.hp / 200) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="attr-item">
                    <div className="attr-meta">
                      <span>🔷 Mana</span>
                      <strong>{lore.stats.mp}</strong>
                    </div>
                    <div className="attr-progress-bg">
                      <div
                        className="attr-progress-bar mp"
                        style={{ width: `${(lore.stats.mp / 200) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="attr-item">
                    <div className="attr-meta">
                      <span>⚔️ Dano</span>
                      <strong>{lore.stats.atk}</strong>
                    </div>
                    <div className="attr-progress-bg">
                      <div
                        className="attr-progress-bar atk"
                        style={{ width: `${(lore.stats.atk / 200) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="attr-item">
                    <div className="attr-meta">
                      <span>⚡ Vel</span>
                      <strong>{lore.stats.spd}</strong>
                    </div>
                    <div className="attr-progress-bg">
                      <div
                        className="attr-progress-bar spd"
                        style={{ width: `${(lore.stats.spd / 160) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 5 Recommended Spells */}
              <div className="showcase-spells">
                <span className="section-label-mini">5 Magias Iniciais:</span>
                <div className="spells-tags-list">
                  {lore.startingSpells.map((spellName, idx) => (
                    <span key={idx} className="spell-tag">
                      <span className="spell-tag-slot">[{idx + 1}]</span>
                      {spellName}
                    </span>
                  ))}
                </div>
              </div>

              {/* Start Game Action Button (Always Visible) */}
              <div className="showcase-cta">
                <button className="btn-enter-world" onClick={onStartGame}>
                  <span className="cta-icon">⚔️</span>
                  <div className="cta-text">
                    <strong>ENTRAR NO MUNDO</strong>
                    <small>Jogar como {selectedHeroDef.name}</small>
                  </div>
                  <span className="cta-arrow">➜</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
