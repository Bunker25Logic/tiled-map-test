interface DeathModalProps {
  playerName: string;
  lostXp: number;
  oldLevel: number;
  newLevel: number;
  onRespawn: () => void;
}

export default function DeathModal({
  playerName,
  lostXp,
  oldLevel,
  newLevel,
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

        {/* Penalty Card */}
        <div className="death-penalty-card">
          <span className="death-penalty-heading">⚖️ Penalidade de Morte do Tibia</span>
          
          <div className="death-stat-row">
            <span>XP Perdido:</span>
            <strong className="death-xp-loss">-{lostXp.toLocaleString()} XP (10%)</strong>
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
