import { useMemo } from 'react';
import type { GraphicStyle } from '../game/graphics';
import type { WingType } from '../game/types';
import { ALL_ITEMS } from '../game/items';
import type { EquippedGear, ItemDef } from '../game/items';

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
  equippedGear?: EquippedGear | null;
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
  equippedGear,
  onReloadMap,
  isReloadingMap,
  onReturnToLobby,
}: SettingsModalProps) {
  // Lista de itens equipados com efeitos ativos positivos no jogo
  const equippedItemsList = useMemo(() => {
    const list: Array<{ slotLabel: string; item: ItemDef; customNote?: string }> = [];

    // Asas
    if (equippedWings === 'angelic' || equippedGear?.wings === 'angelic') {
      list.push({
        slotLabel: 'Asas',
        item: ALL_ITEMS.wing_angelic,
        customNote: '+45% Vel. Movimento • Voo Sagrado',
      });
    }

    if (equippedGear) {
      const slotMap: Array<{ key: keyof EquippedGear; label: string }> = [
        { key: 'weapon', label: 'Arma' },
        { key: 'armor', label: 'Armadura' },
        { key: 'shield', label: 'Escudo' },
        { key: 'boots', label: 'Botas' },
        { key: 'ring', label: 'Anel' },
        { key: 'amulet', label: 'Amuleto' },
      ];

      for (const { key, label } of slotMap) {
        const itemId = equippedGear[key];
        if (itemId && ALL_ITEMS[itemId]) {
          list.push({ slotLabel: label, item: ALL_ITEMS[itemId] });
        }
      }
    }

    return list;
  }, [equippedGear, equippedWings]);

  // Soma de todos os bônus passivos providos pelos itens
  const totalStats = useMemo(() => {
    let atk = 0;
    let def = 0;
    let spd = (equippedWings === 'angelic' || equippedGear?.wings === 'angelic') ? 45 : 0;
    let maxHp = 0;
    let maxMp = 0;

    for (const entry of equippedItemsList) {
      if (entry.item.stats) {
        if (entry.item.stats.attack) atk += entry.item.stats.attack;
        if (entry.item.stats.defense) def += entry.item.stats.defense;
        if (entry.item.stats.speed) spd += entry.item.stats.speed;
        if (entry.item.stats.maxHp) maxHp += entry.item.stats.maxHp;
        if (entry.item.stats.maxMp) maxMp += entry.item.stats.maxMp;
      }
    }
    return { atk, def, spd, maxHp, maxMp };
  }, [equippedItemsList, equippedWings, equippedGear]);

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
                className={`btn-setting-card ${graphicStyle === 'modern-hd' ? 'active' : ''}`}
                onClick={() => onSelectGraphicStyle('modern-hd')}
              >
                <span className="setting-card-icon">✨</span>
                <div className="setting-card-text">
                  <strong>Moderno HD (Padrão)</strong>
                  <small>Interpolação bilinear suave e sem serrilhado</small>
                </div>
              </button>

              <button
                className={`btn-setting-card ${graphicStyle === 'pixel-sharp' ? 'active' : ''}`}
                onClick={() => onSelectGraphicStyle('pixel-sharp')}
              >
                <span className="setting-card-icon">🎨</span>
                <div className="setting-card-text">
                  <strong>Pixel Sharp</strong>
                  <small>Pixel-art clássico com arestas quadradas</small>
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

          {/* 2. Visual Effects, Active Gear & Actions */}
          <div className="settings-two-columns">
            {/* Visual Toggles & Gear Effects */}
            <div className="settings-column">
              <span className="settings-section-title">✨ Bônus & Efeitos de Equipamentos</span>
              <div className="gear-effects-panel">
                <div className="gear-stats-summary-grid">
                  {totalStats.atk > 0 && (
                    <div className="gear-stat-pill atk" title="Bônus Total de Ataque Físico">
                      <span className="pill-ico">⚔️</span>
                      <span className="pill-lbl">Ataque</span>
                      <strong className="pill-val">+{totalStats.atk}</strong>
                    </div>
                  )}
                  {totalStats.def > 0 && (
                    <div className="gear-stat-pill def" title="Bônus Total de Defesa">
                      <span className="pill-ico">🛡️</span>
                      <span className="pill-lbl">Defesa</span>
                      <strong className="pill-val">+{totalStats.def}</strong>
                    </div>
                  )}
                  {totalStats.spd > 0 && (
                    <div className="gear-stat-pill spd" title="Bônus Total de Velocidade de Movimento">
                      <span className="pill-ico">⚡</span>
                      <span className="pill-lbl">Velocidade</span>
                      <strong className="pill-val">+{totalStats.spd}%</strong>
                    </div>
                  )}
                  {totalStats.maxHp > 0 && (
                    <div className="gear-stat-pill hp" title="Bônus Total de Vida Máxima">
                      <span className="pill-ico">❤️</span>
                      <span className="pill-lbl">Vida Máx</span>
                      <strong className="pill-val">+{totalStats.maxHp}</strong>
                    </div>
                  )}
                  {totalStats.maxMp > 0 && (
                    <div className="gear-stat-pill mp" title="Bônus Total de Mana Máxima">
                      <span className="pill-ico">🔷</span>
                      <span className="pill-lbl">Mana Máx</span>
                      <strong className="pill-val">+{totalStats.maxMp}</strong>
                    </div>
                  )}
                  {totalStats.atk === 0 && totalStats.def === 0 && totalStats.spd === 0 && totalStats.maxHp === 0 && (
                    <div className="gear-stat-empty">
                      <span>Nenhum bônus passivo de item ativo no momento</span>
                    </div>
                  )}
                </div>

                {/* Lista compacta de itens com efeitos ativos */}
                <div className="gear-active-items-list">
                  {equippedItemsList.length === 0 ? (
                    <div className="gear-item-none">
                      <span>Abra a Mochila (B) para equipar armas e armaduras!</span>
                    </div>
                  ) : (
                    equippedItemsList.map(({ slotLabel, item, customNote }) => (
                      <div key={`${slotLabel}-${item.id}`} className="gear-active-item-row" title={item.description}>
                        <span className="gear-item-slot-tag">{slotLabel}</span>
                        <span className="gear-item-icon">{item.icon}</span>
                        <div className="gear-item-meta">
                          <strong className={`gear-item-name rarity-${item.rarity}`}>{item.name}</strong>
                          <span className="gear-item-bonus">
                            {customNote || (
                              <>
                                {item.stats?.attack ? `+${item.stats.attack} ATK ` : ''}
                                {item.stats?.defense ? `+${item.stats.defense} DEF ` : ''}
                                {item.stats?.speed ? `+${item.stats.speed} VEL ` : ''}
                                {item.stats?.maxHp ? `+${item.stats.maxHp} HP ` : ''}
                                {item.stats?.maxMp ? `+${item.stats.maxMp} MP ` : ''}
                              </>
                            )}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <span className="settings-section-title" style={{ marginTop: '12px' }}>Auxílios Visuais</span>
              <div className="toggle-list">
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
                  title="Salva o progresso e retorna à seleção de personagens"
                >
                  <span>🏰 Voltar ao Lobby</span>
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
