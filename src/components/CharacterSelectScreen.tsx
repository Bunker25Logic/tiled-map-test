import { useState } from 'react';
import {
  type PlayerAccount,
  type PlayerCharacter,
  getLevelFromXP,
  getLevelProgress,
  MAX_CHARACTERS,
} from '../game/playerStore';
import { PLAYABLE_CHARACTERS, type CharacterId } from '../game/characters';
import CharacterSpriteAvatar from './CharacterSpriteAvatar';

interface CharacterSelectScreenProps {
  account: PlayerAccount;
  onSelectCharacter: (charIndex: number) => void;
  onAddNewCharacter: (charId: CharacterId) => void;
  onLogout: () => void;
}

export default function CharacterSelectScreen({
  account,
  onSelectCharacter,
  onAddNewCharacter,
  onLogout,
}: CharacterSelectScreenProps) {
  const [showPicker, setShowPicker] = useState(false);
  const [pickedCharId, setPickedCharId] = useState<CharacterId>('luxio');
  const [confirmingIndex, setConfirmingIndex] = useState<number | null>(null);

  const handlePlay = (index: number) => {
    if (confirmingIndex === index) {
      onSelectCharacter(index);
    } else {
      setConfirmingIndex(index);
      setTimeout(() => setConfirmingIndex(null), 3000);
    }
  };

  const handleAddCharacter = () => {
    onAddNewCharacter(pickedCharId);
    setShowPicker(false);
  };

  const getClassName = (charId: CharacterId) => {
    return PLAYABLE_CHARACTERS.find((c) => c.id === charId)?.className ?? charId;
  };

  const getCharIcon = (charId: CharacterId) => {
    return PLAYABLE_CHARACTERS.find((c) => c.id === charId)?.icon ?? '🧑';
  };

  return (
    <div className="charselect-overlay">
      <div className="charselect-bg-particles">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="login-particle" style={{ '--i': i } as React.CSSProperties} />
        ))}
      </div>

      <div className="charselect-container">
        {/* Header */}
        <div className="charselect-header">
          <div className="charselect-account-badge">
            <span className="charselect-account-icon">👤</span>
            <div>
              <span className="charselect-account-name">{account.name}</span>
              <span className="charselect-account-sub">
                {account.characters.length}/{MAX_CHARACTERS} personagens
              </span>
            </div>
          </div>
          <button className="charselect-logout-btn" onClick={onLogout} title="Sair da conta">
            🚪 Sair
          </button>
        </div>

        <div className="charselect-divider" />

        <h2 className="charselect-title">Seus Personagens</h2>

        {/* Character Cards */}
        <div className="charselect-cards">
          {account.characters.map((char: PlayerCharacter, index: number) => {
            const level = getLevelFromXP(char.xp);
            const progress = getLevelProgress(char.xp);
            const hpPercent = char.maxHp > 0 ? (char.hp / char.maxHp) : 1;
            const mpPercent = char.maxMp > 0 ? (char.mp / char.maxMp) : 1;
            const isConfirming = confirmingIndex === index;

            return (
              <div key={index} className="charselect-card">
                {/* Avatar */}
                <div className="charselect-card-avatar">
                  <div className="charselect-avatar-box">
                    <CharacterSpriteAvatar charId={char.characterId} size={44} />
                  </div>
                  <div className="charselect-level-badge">Lv.{level}</div>
                </div>

                {/* Info */}
                <div className="charselect-card-info">
                  <div className="charselect-card-top">
                    <div className="charselect-card-title-group">
                      <div className="charselect-card-name">
                        <span className="charselect-char-icon">{getCharIcon(char.characterId)}</span>
                        <strong>{account.name}</strong>
                      </div>
                      <span className="charselect-class-name">{getClassName(char.characterId)}</span>
                      <span className="charselect-zone-tag">
                        📍 {char.lastZone === 'map1' ? 'Superfície' : char.lastZone}
                      </span>
                    </div>

                    <button
                      className={`charselect-play-btn ${isConfirming ? 'confirming' : ''}`}
                      onClick={() => handlePlay(index)}
                    >
                      {isConfirming ? '▶ Confirmar?' : '▶ Jogar'}
                    </button>
                  </div>

                  {/* XP Bar */}
                  <div className="charselect-xp-row">
                    <span className="charselect-xp-label">XP</span>
                    <div className="charselect-xp-bar-bg">
                      <div
                        className="charselect-xp-bar-fill"
                        style={{ width: `${progress * 100}%` }}
                      />
                    </div>
                    <span className="charselect-xp-pct">{Math.round(progress * 100)}%</span>
                  </div>

                  {/* HP/MP bars */}
                  <div className="charselect-vitals-row">
                    <div className="charselect-vital">
                      <span>❤️</span>
                      <div className="charselect-vital-bar-bg">
                        <div
                          className="charselect-vital-bar hp"
                          style={{ width: `${hpPercent * 100}%` }}
                        />
                      </div>
                      <span className="charselect-vital-num">{char.hp}/{char.maxHp}</span>
                    </div>
                    <div className="charselect-vital">
                      <span>🔷</span>
                      <div className="charselect-vital-bar-bg">
                        <div
                          className="charselect-vital-bar mp"
                          style={{ width: `${mpPercent * 100}%` }}
                        />
                      </div>
                      <span className="charselect-vital-num">{char.mp}/{char.maxMp}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add New Character slot */}
          {account.characters.length < MAX_CHARACTERS && !showPicker && (
            <button
              className="charselect-add-slot"
              onClick={() => setShowPicker(true)}
            >
              <span className="charselect-add-icon">＋</span>
              <div className="charselect-add-text-group">
                <span className="charselect-add-title">Adicionar Personagem</span>
                <span className="charselect-add-sub">
                  Slot {account.characters.length + 1}/{MAX_CHARACTERS}
                </span>
              </div>
            </button>
          )}
        </div>

        {/* New Character Picker */}
        {showPicker && (
          <div className="charselect-picker-overlay">
            <div className="charselect-picker">
              <h3>Escolha a Classe</h3>
              <p className="charselect-picker-warning">
                ⚠️ Esta é uma escolha <strong>permanente</strong>. Escolha com cuidado!
              </p>

              <div className="charselect-picker-grid">
                {PLAYABLE_CHARACTERS.map((hero) => (
                  <button
                    key={hero.id}
                    className={`charselect-picker-card ${pickedCharId === hero.id ? 'selected' : ''}`}
                    onClick={() => setPickedCharId(hero.id)}
                  >
                    <div className="charselect-picker-avatar">
                      <CharacterSpriteAvatar charId={hero.id} size={28} />
                    </div>
                    <strong>{hero.name}</strong>
                    <span>{hero.className}</span>
                  </button>
                ))}
              </div>

              <div className="charselect-picker-actions">
                <button className="charselect-cancel-btn" onClick={() => setShowPicker(false)}>
                  Cancelar
                </button>
                <button className="charselect-confirm-btn" onClick={handleAddCharacter}>
                  ✅ Criar {PLAYABLE_CHARACTERS.find((c) => c.id === pickedCharId)?.name}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
