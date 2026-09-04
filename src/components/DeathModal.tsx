interface DeathModalProps {
  playerName: string;
  lostXp: number;
  oldLevel: number;
  newLevel: number;
  protectedByBlessing?: boolean;
  onRespawn: () => void;
}

export default function DeathModal({
  playerName,
  lostXp,
  oldLevel,
  newLevel,
  protectedByBlessing = false,
  onRespawn,
}: DeathModalProps) {
  const didLevelDown = newLevel < oldLevel;

  return (
    <div className="death-modal-overlay">
      <div className="death-modal-container">
        {/* Skull Icon */}
        <div className="death-skull-icon">☠️</div>

        <h1 className="death-modal-title">Você Morreu!</h1>
        <p className="death-modal-subtitle">As sombras consumiram o aventureiro <strong>{playerName}</strong></p>

        <div className="death-divider" />

        {/* Blessing Protection Highlight */}
        {protectedByBlessing && (
          <div className="death-blessing-banner">
            <span className="blessing-shield-icon">🛡️</span>
            <div>
              <strong>A Bênção do Templo te protegeu!</strong>
              <p>Os Deuses amorteceram o impacto da morte. Você perdeu apenas <strong>2% de XP</strong> em vez de 10%!</p>
            </div>
          </div>
        )}

        {/* Penalty Card */}
        <div className="death-penalty-card">
          <span className="death-penalty-heading">⚖️ Penalidade de Morte do Tibia</span>
          
          <div className="death-stat-row">
            <span>XP Perdido:</span>
            <strong className={`death-xp-loss ${protectedByBlessing ? 'blessed-loss' : ''}`}>
              -{lostXp.toLocaleString()} XP ({protectedByBlessing ? '2% com Bênção' : '10%'})
            </strong>
          </div>

          {didLevelDown && (
            <div className="death-level-down-alert">
              ⚠️ <strong>Regressão de Nível!</strong> Você desceu do nível {oldLevel} para o nível {newLevel}.
            </div>
          )}

          <div className="death-stat-row">
            <span>Ponto de Renascimento:</span>
            <strong>🏛️ Templo da Cidade (Superfície)</strong>
          </div>

          <div className="death-stat-row">
            <span>Vida & Mana:</span>
            <strong className="death-restored">Restauradas 100%</strong>
          </div>
        </div>

        {/* Respawn CTA */}
        <button className="death-respawn-btn" onClick={onRespawn}>
          <span>✨</span>
          <span>Renascer no Templo</span>
        </button>

        <div className="death-modal-footer">
          <span>Que os Deuses de Tibia guiem seus passos na próxima jornada.</span>
        </div>
      </div>
    </div>
  );
}

