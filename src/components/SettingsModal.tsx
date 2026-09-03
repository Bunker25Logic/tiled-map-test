import type { GraphicStyle } from '../game/graphics';
import type { WingType } from '../game/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  graphicStyle: GraphicStyle;
  onSelectGraphicStyle: (style: GraphicStyle) => void;
  enableParticles: boolean;
  onToggleParticles: () => void;
  showGrid: boolean;
  onToggleGrid: () => void;
  debugColliders: boolean;
  onToggleDebugColliders: () => void;
  autoAttackEnabled: boolean;
  onToggleAutoAttack: () => void;
  autoTargetNearbyEnabled: boolean;
  onToggleAutoTargetNearby: () => void;
  equippedWings?: WingType;
  onSelectWings?: (wings: WingType) => void;
  onReloadMap: () => void;
  isReloadingMap: boolean;
  onReturnToLobby: () => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  graphicStyle,
  onSelectGraphicStyle,
  enableParticles,
  onToggleParticles,
  showGrid,
  onToggleGrid,
  debugColliders,
  onToggleDebugColliders,
  autoAttackEnabled,
  onToggleAutoAttack,
  autoTargetNearbyEnabled,
  onToggleAutoTargetNearby,
  equippedWings = 'angelic',
  onSelectWings,
  onReloadMap,
  isReloadingMap,
  onReturnToLobby,
}: SettingsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="settings-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-box">
            <span className="modal-header-icon">⚙️</span>
            <div>
              <h2>Configurações do Jogo</h2>
              <p>Ajuste gráficos, efeitos, auxílios visuais e opções de mapa</p>
            </div>
          </div>
          <button className="btn-modal-close" onClick={onClose} title="Fechar Configurações">
            ✕
          </button>
        </div>

        {/* Settings Body */}
        <div className="settings-body">
          {/* 1. Graphic Style */}
          <div className="settings-section">
            <span className="settings-section-title">Estilo Gráfico do Mundo</span>
            <div className="settings-options-grid">
              <button
                className={`btn-setting-card ${graphicStyle === 'pixel-sharp' ? 'active' : ''}`}
                onClick={() => onSelectGraphicStyle('pixel-sharp')}
              >
                <span className="setting-card-icon">🎨</span>
                <div className="setting-card-text">
                  <strong>Pixel Sharp (Padrão)</strong>
                  <small>Pixel-art nítido e perfeito sem distorções</small>
                </div>
              </button>

              <button
                className={`btn-setting-card ${graphicStyle === 'modern-hd' ? 'active' : ''}`}
                onClick={() => onSelectGraphicStyle('modern-hd')}
              >
                <span className="setting-card-icon">✨</span>
                <div className="setting-card-text">
                  <strong>Moderno HD</strong>
                  <small>Interpolação bilinear suave e bordas polidas</small>
                </div>
              </button>

              <button
                className={`btn-setting-card ${graphicStyle === 'bloom-glow' ? 'active' : ''}`}
                onClick={() => onSelectGraphicStyle('bloom-glow')}
              >
                <span className="setting-card-icon">🌟</span>
                <div className="setting-card-text">
                  <strong>Glow Mágico</strong>
                  <small>Bloom realçado em magias, tochas e luzes</small>
                </div>
              </button>

              <button
                className={`btn-setting-card ${graphicStyle === 'retro-crt' ? 'active' : ''}`}
                onClick={() => onSelectGraphicStyle('retro-crt')}
              >
                <span className="setting-card-icon">🕹️</span>
                <div className="setting-card-text">
                  <strong>Retro CRT</strong>
                  <small>Scanlines sutis e curvatura nostálgica de tubo</small>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Visual Effects & Actions */}
          <div className="settings-two-columns">
            {/* Visual Toggles & Wings */}
            <div className="settings-column">
              <span className="settings-section-title">Efeitos & Equipamento</span>
              <div className="toggle-list">
                {/* 3-Option Wings Selector */}
                <div className="wings-selector-box">
                  <div className="wings-selector-grid">
                    <button
                      type="button"
                      className={`btn-wing-select angelic ${equippedWings === 'angelic' ? 'active' : ''}`}
                      onClick={() => onSelectWings && onSelectWings('angelic')}
                    >
                      <span className="wing-ico">🪽</span>
                      <div className="wing-select-meta">
                        <strong>Asas Angelicais</strong>
                        <small>+50% Vel • Sagrado</small>
                      </div>
                    </button>

                    <button
                      type="button"
                      className={`btn-wing-select none ${equippedWings === 'none' ? 'active' : ''}`}
                      onClick={() => onSelectWings && onSelectWings('none')}
                    >
                      <span className="wing-ico">❌</span>
                      <div className="wing-select-meta">
                        <strong>Desequipar</strong>
                        <small>A pé (Vel Normal)</small>
                      </div>
                    </button>
                  </div>
                </div>

                <label className="settings-toggle-item">
                  <input
                    type="checkbox"
                    checked={enableParticles}
                    onChange={onToggleParticles}
                  />
                  <div className="toggle-info">
                    <strong>Partículas Vivas</strong>
                    <small>Vaga-lumes na superfície e poeira na caverna</small>
                  </div>
                </label>

                <label className="settings-toggle-item">
                  <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={onToggleGrid}
                  />
                  <div className="toggle-info">
                    <strong>Grade de Blocos 32px</strong>
                    <small>Linhas de grade alinhadas ao grid do Tiled</small>
                  </div>
                </label>

                <label className="settings-toggle-item">
                  <input
                    type="checkbox"
                    checked={debugColliders}
                    onChange={onToggleDebugColliders}
                  />
                  <div className="toggle-info">
                    <strong>Colisores de Depuração</strong>
                    <small>Exibe caixas vermelhas de colisão</small>
                  </div>
                </label>

                {/* Combate & Seleção de Alvo */}
                <div style={{ marginTop: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '8px' }}>
                  <span className="settings-section-title">Combate & Mira</span>

                  <label className="settings-toggle-item" style={{ marginTop: '6px' }}>
                    <input
                      type="checkbox"
                      checked={autoAttackEnabled}
                      onChange={onToggleAutoAttack}
                    />
                    <div className="toggle-info">
                      <strong>Ataque Básico Automático</strong>
                      <small>Desfere golpes automaticamente corpo a corpo com o alvo</small>
                    </div>
                  </label>

                  <label className="settings-toggle-item" style={{ marginTop: '6px' }}>
                    <input
                      type="checkbox"
                      checked={autoTargetNearbyEnabled}
                      onChange={onToggleAutoTargetNearby}
                    />
                    <div className="toggle-info">
                      <strong>Alvo Automático por Proximidade</strong>
                      <small>Mira automaticamente no monstro mais próximo ao se aproximar</small>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Map & Lobby Actions */}
            <div className="settings-column">
              <span className="settings-section-title">Ações do Mundo</span>
              <div className="settings-quick-actions">
                <button
                  className={`btn-action-reload ${isReloadingMap ? 'loading' : ''}`}
                  onClick={onReloadMap}
                >
                  <span>🔄 Recarregar Mapa (.tmj)</span>
                </button>

                <button
                  className="btn-action-lobby"
                  onClick={() => {
                    onClose();
                    onReturnToLobby();
                  }}
                >
                  <span>🏰 Trocar Personagem / Voltar ao Lobby</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn-confirm-settings" onClick={onClose}>
            ✓ Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
