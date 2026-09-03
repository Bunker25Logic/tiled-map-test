import { useState } from 'react';
import type { Direction } from '../game/types';
import type { ItemOffsetConfig, ItemOffsetDirectionConfig } from '../game/itemOffsets';

interface WeaponOffsetCalibratorProps {
  isOpen: boolean;
  onClose: () => void;
  currentDirection: Direction;
  onSetDirection?: (dir: Direction) => void;
  offsets: ItemOffsetConfig;
  onOffsetsChange: (offsets: ItemOffsetConfig) => void;
}

export default function WeaponOffsetCalibrator({
  isOpen,
  onClose,
  currentDirection,
  onSetDirection,
  offsets,
  onOffsetsChange,
}: WeaponOffsetCalibratorProps) {
  const [activeDir, setActiveDir] = useState<Direction>(currentDirection || 'down');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentDirConfig: ItemOffsetDirectionConfig = offsets.offsets[activeDir] || {
    x: 0,
    y: 0,
    scale: 0.8,
    flipX: false,
    flipY: false,
    rotation: 0,
    layer: 'behind',
    opacity: 100,
    visible: true,
  };

  const updateDirConfig = (patch: Partial<ItemOffsetDirectionConfig>) => {
    const updated: ItemOffsetConfig = {
      ...offsets,
      offsets: {
        ...offsets.offsets,
        [activeDir]: {
          ...currentDirConfig,
          ...patch,
        },
      },
    };
    onOffsetsChange(updated);
  };

  const handleSelectDirection = (dir: Direction) => {
    setActiveDir(dir);
    if (onSetDirection) {
      onSetDirection(dir);
    }
  };

  const handleSaveToServer = async () => {
    setSaveStatus('Salvando...');
    try {
      const res = await fetch('/api/save-offsets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(offsets),
      });
      const data = await res.json();
      if (data.success) {
        setSaveStatus('✅ Salvo com sucesso no arquivo!');
        setTimeout(() => setSaveStatus(null), 3500);
      } else {
        setSaveStatus(`❌ Erro: ${data.error}`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSaveStatus(`❌ Erro de conexão: ${msg}`);
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(offsets, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const dirLabels: Record<Direction, { label: string; icon: string }> = {
    down: { label: 'Frente', icon: '⬇️' },
    up: { label: 'Costas', icon: '⬆️' },
    left: { label: 'Esquerda', icon: '⬅️' },
    right: { label: 'Direita', icon: '➡️' },
  };

  return (
    <div className="calibrator-floating-panel">
      <div className="calibrator-header">
        <div className="calibrator-title">
          <span className="calibrator-icon">🎯</span>
          <div>
            <h3>Calibrador de Posição da Arma</h3>
            <span className="calibrator-sub">Ajuste de pixels e rotação em tempo real</span>
          </div>
        </div>
        <button className="btn-calibrator-close" onClick={onClose} title="Fechar Calibrador">
          ✕
        </button>
      </div>

      {/* Tabs de Direções */}
      <div className="calibrator-dirs-bar">
        {(['down', 'up', 'left', 'right'] as Direction[]).map((d) => {
          const isActive = activeDir === d;
          return (
            <button
              key={d}
              className={`btn-calibrator-dir ${isActive ? 'active' : ''}`}
              onClick={() => handleSelectDirection(d)}
            >
              <span className="dir-icon">{dirLabels[d].icon}</span>
              <span className="dir-name">{dirLabels[d].label}</span>
              <span className="dir-badge">{offsets.offsets[d]?.layer === 'in_front' ? 'Frente' : 'Atrás'}</span>
            </button>
          );
        })}
      </div>

      <div className="calibrator-body">
        {/* Controle X Offset */}
        <div className="control-group">
          <div className="control-label-row">
            <span className="control-label">Eixo X (Horizontal)</span>
            <span className="control-val">{currentDirConfig.x} px</span>
          </div>
          <div className="control-input-row">
            <button className="btn-step" onClick={() => updateDirConfig({ x: currentDirConfig.x - 5 })}>-5</button>
            <button className="btn-step" onClick={() => updateDirConfig({ x: currentDirConfig.x - 1 })}>-1</button>
            <input
              type="range"
              min={-30}
              max={30}
              value={currentDirConfig.x}
              onChange={(e) => updateDirConfig({ x: parseInt(e.target.value, 10) })}
              className="calibrator-slider"
            />
            <button className="btn-step" onClick={() => updateDirConfig({ x: currentDirConfig.x + 1 })}>+1</button>
            <button className="btn-step" onClick={() => updateDirConfig({ x: currentDirConfig.x + 5 })}>+5</button>
          </div>
        </div>

        {/* Controle Y Offset */}
        <div className="control-group">
          <div className="control-label-row">
            <span className="control-label">Eixo Y (Vertical - Cartesiano)</span>
            <span className="control-val">{currentDirConfig.y} px</span>
          </div>
          <div className="control-input-row">
            <button className="btn-step" onClick={() => updateDirConfig({ y: currentDirConfig.y - 5 })}>-5</button>
            <button className="btn-step" onClick={() => updateDirConfig({ y: currentDirConfig.y - 1 })}>-1</button>
            <input
              type="range"
              min={-30}
              max={30}
              value={currentDirConfig.y}
              onChange={(e) => updateDirConfig({ y: parseInt(e.target.value, 10) })}
              className="calibrator-slider"
            />
            <button className="btn-step" onClick={() => updateDirConfig({ y: currentDirConfig.y + 1 })}>+1</button>
            <button className="btn-step" onClick={() => updateDirConfig({ y: currentDirConfig.y + 5 })}>+5</button>
          </div>
        </div>

        {/* Controle Rotação */}
        <div className="control-group">
          <div className="control-label-row">
            <span className="control-label">Rotação da Lâmina</span>
            <span className="control-val">{currentDirConfig.rotation}°</span>
          </div>
          <div className="control-input-row">
            <button className="btn-step" onClick={() => updateDirConfig({ rotation: currentDirConfig.rotation - 15 })}>-15°</button>
            <button className="btn-step" onClick={() => updateDirConfig({ rotation: currentDirConfig.rotation - 1 })}>-1°</button>
            <input
              type="range"
              min={-180}
              max={180}
              value={currentDirConfig.rotation}
              onChange={(e) => updateDirConfig({ rotation: parseInt(e.target.value, 10) })}
              className="calibrator-slider"
            />
            <button className="btn-step" onClick={() => updateDirConfig({ rotation: currentDirConfig.rotation + 1 })}>+1°</button>
            <button className="btn-step" onClick={() => updateDirConfig({ rotation: currentDirConfig.rotation + 15 })}>+15°</button>
          </div>
        </div>

        {/* Controle Escala */}
        <div className="control-group">
          <div className="control-label-row">
            <span className="control-label">Escala / Tamanho</span>
            <span className="control-val">{currentDirConfig.scale.toFixed(2)}x</span>
          </div>
          <div className="control-input-row">
            <button className="btn-step" onClick={() => updateDirConfig({ scale: Math.max(0.2, Number((currentDirConfig.scale - 0.1).toFixed(2))) })}>-0.1</button>
            <input
              type="range"
              min={0.3}
              max={2.0}
              step={0.05}
              value={currentDirConfig.scale}
              onChange={(e) => updateDirConfig({ scale: parseFloat(e.target.value) })}
              className="calibrator-slider"
            />
            <button className="btn-step" onClick={() => updateDirConfig({ scale: Math.min(2.5, Number((currentDirConfig.scale + 0.1).toFixed(2))) })}>+0.1</button>
          </div>
        </div>

        {/* Toggles: Flip e Camada */}
        <div className="calibrator-toggles-grid">
          <label className="toggle-box">
            <input
              type="checkbox"
              checked={currentDirConfig.flipX}
              onChange={(e) => updateDirConfig({ flipX: e.target.checked })}
            />
            <span>↔️ Espelhar X (flipX)</span>
          </label>

          <label className="toggle-box">
            <input
              type="checkbox"
              checked={currentDirConfig.flipY}
              onChange={(e) => updateDirConfig({ flipY: e.target.checked })}
            />
            <span>↕️ Espelhar Y (flipY)</span>
          </label>

          <div className="layer-selector">
            <span className="layer-title">Camada:</span>
            <div className="layer-buttons">
              <button
                className={`btn-layer ${currentDirConfig.layer === 'behind' ? 'active' : ''}`}
                onClick={() => updateDirConfig({ layer: 'behind' })}
              >
                Atrás do Char
              </button>
              <button
                className={`btn-layer ${currentDirConfig.layer === 'in_front' ? 'active' : ''}`}
                onClick={() => updateDirConfig({ layer: 'in_front' })}
              >
                Frente do Char
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer com Ações */}
      <div className="calibrator-footer">
        {saveStatus && <div className="save-status-msg">{saveStatus}</div>}
        <div className="calibrator-actions-row">
          <button
            className="btn-action btn-test-attack"
            onClick={() => window.dispatchEvent(new CustomEvent('player-attack'))}
            title="Testar animação de golpe da espada"
          >
            ⚔️ Testar Golpe
          </button>
          <button className="btn-action btn-save" onClick={handleSaveToServer} title="Salva diretamente no arquivo JSON e TypeScript">
            💾 Salvar
          </button>
          <button className="btn-action btn-copy" onClick={handleCopyJson} title="Copiar configuração JSON">
            {copied ? '✅ Copiado' : '📋 Copiar'}
          </button>
        </div>
      </div>
    </div>
  );
}
