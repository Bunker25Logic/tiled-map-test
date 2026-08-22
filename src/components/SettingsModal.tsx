import type { GraphicStyle } from '../game/graphics';

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
  zoomLevel: number;
  onSelectZoomLevel: (zoom: number) => void;
  hasWings?: boolean;
  onToggleWings?: () => void;
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
  zoomLevel,
  onSelectZoomLevel,
  hasWings = true,
  onToggleWings,
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
              <p>Ajuste gráficos, câmera, auxílios visuais e opções de mapa</p>
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

          {/* 2. Visual Effects & Camera Zoom */}
          <div className="settings-two-columns">
            {/* Visual Toggles */}
            <div className="settings-column">
              <span className="settings-section-title">Efeitos & Equipamento</span>
              <div className="toggle-list">
                {onToggleWings && (
                  <label className="settings-toggle-item highlight-wings">
                    <input
                      type="checkbox"
                      checked={hasWings}
                      onChange={onToggleWings}
                    />
                    <div className="toggle-info">
                      <strong>⚡ Asas Trovão (+45% Vel)</strong>
                      <small>Asas celestiais animadas nas costas do personagem</small>
                    </div>
                  </label>
                )}

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
              </div>
            </div>

            {/* Camera Zoom Level */}
            <div className="settings-column">
              <span className="settings-section-title">Zoom da Câmera</span>
              <div className="zoom-options-row">
                {[0.75, 1.0, 1.5].map((z) => (
                  <button
                    key={z}
                    className={`btn-zoom-card ${zoomLevel === z ? 'active' : ''}`}
                    onClick={() => onSelectZoomLevel(z)}
                  >
                    <span className="zoom-num">{z}x</span>
                    <span className="zoom-name">
                      {z === 0.75 ? 'Amplo' : z === 1.0 ? 'Padrão Tibia' : 'Próximo'}
                    </span>
                  </button>
                ))}
              </div>

              {/* Map & Lobby Actions */}
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
