import { useState } from 'react';
import type { PlayerWallet, ExchangeOperation } from '../game/playerStore';
import { formatGoldNumber, formatCompactCurrency } from '../game/currency';
import CoinIcon from './CoinIcon';

interface CurrencyExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallet?: PlayerWallet;
  onExchange: (operation: ExchangeOperation, count?: number) => { success: boolean; message: string };
}

export default function CurrencyExchangeModal({
  isOpen,
  onClose,
  wallet = { gold: 0, silver: 0, basalt: 0 },
  onExchange,
}: CurrencyExchangeModalProps) {
  const [toast, setToast] = useState<{ msg: string; success: boolean } | null>(null);

  if (!isOpen) return null;

  const silver = wallet.silver || 0;
  const gold = wallet.gold || 0;
  const basalt = wallet.basalt || 0;

  const handleAction = (op: ExchangeOperation, count: number = 1) => {
    const result = onExchange(op, count);
    setToast({ msg: result.message, success: result.success });
    setTimeout(() => setToast(null), 3000);
  };

  const maxGoldFromSilver = Math.floor(silver / 100);
  const maxBasaltFromGold = Math.floor(gold / 500);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="exchange-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-box">
            <span className="modal-header-icon">⚖️</span>
            <div>
              <h2>Casa de Câmbio Real</h2>
              <p>Troca oficial e manual de Moedas de Tibia</p>
            </div>
          </div>
          <button className="btn-modal-close" onClick={onClose} title="Fechar Câmbio">
            ✕
          </button>
        </div>

        {/* Current Balance Cards */}
        <div className="exchange-balance-bar">
          <div className="exchange-balance-card basalt-card" title={`${formatGoldNumber(basalt)} Moedas de Cristal`}>
            <div className="card-top">
              <CoinIcon type="basalt" size={24} />
              <span className="card-label">Cristal</span>
            </div>
            <div className="card-value">{formatCompactCurrency(basalt)}</div>
            <div className="card-full-value">{formatGoldNumber(basalt)} unidades</div>
          </div>

          <div className="exchange-balance-card gold-card" title={`${formatGoldNumber(gold)} Moedas de Ouro`}>
            <div className="card-top">
              <CoinIcon type="gold" size={24} />
              <span className="card-label">Ouro</span>
            </div>
            <div className="card-value">{formatCompactCurrency(gold)}</div>
            <div className="card-full-value">{formatGoldNumber(gold)} unidades</div>
          </div>

          <div className="exchange-balance-card silver-card" title={`${formatGoldNumber(silver)} Moedas de Prata`}>
            <div className="card-top">
              <CoinIcon type="silver" size={24} />
              <span className="card-label">Prata</span>
            </div>
            <div className="card-value">{formatCompactCurrency(silver)}</div>
            <div className="card-full-value">{formatGoldNumber(silver)} unidades</div>
          </div>
        </div>

        {/* Rate Banner */}
        <div className="exchange-rates-banner">
          <span className="rate-badge">🪙 100 Pratas = 1 Ouro</span>
          <span className="rate-separator">•</span>
          <span className="rate-badge">💎 500 Ouros = 1 Cristal</span>
        </div>

        {/* Toast Alert */}
        {toast && (
          <div className={`exchange-toast ${toast.success ? 'toast-success' : 'toast-error'}`}>
            {toast.success ? '✓' : '⚠️'} {toast.msg}
          </div>
        )}

        {/* Operations Panels */}
        <div className="exchange-panels-grid">
          {/* Section 1: Prata -> Ouro */}
          <div className="exchange-panel">
            <div className="panel-header">
              <span className="panel-icon">⚪➔🟡</span>
              <div>
                <h3>Prata para Ouro</h3>
                <small>100 Pratas ➔ 1 Ouro</small>
              </div>
            </div>
            <div className="panel-buttons">
              <button
                className="btn-exchange-action"
                disabled={silver < 100}
                onClick={() => handleAction('silver_to_gold', 1)}
              >
                +1 Ouro <span className="btn-cost">(100 Prata)</span>
              </button>
              <button
                className="btn-exchange-action"
                disabled={silver < 500}
                onClick={() => handleAction('silver_to_gold', 5)}
              >
                +5 Ouros <span className="btn-cost">(500 Prata)</span>
              </button>
              <button
                className="btn-exchange-action"
                disabled={silver < 1000}
                onClick={() => handleAction('silver_to_gold', 10)}
              >
                +10 Ouros <span className="btn-cost">(1k Prata)</span>
              </button>
              <button
                className="btn-exchange-action btn-max"
                disabled={maxGoldFromSilver <= 0}
                onClick={() => handleAction('silver_to_gold', maxGoldFromSilver)}
              >
                Trocar Máximo <span className="btn-cost">(+{maxGoldFromSilver} Ouro)</span>
              </button>
            </div>
          </div>

          {/* Section 2: Ouro -> Prata (Troco) */}
          <div className="exchange-panel">
            <div className="panel-header">
              <span className="panel-icon">🟡➔⚪</span>
              <div>
                <h3>Ouro para Prata (Troco)</h3>
                <small>1 Ouro ➔ 100 Pratas</small>
              </div>
            </div>
            <div className="panel-buttons">
              <button
                className="btn-exchange-action"
                disabled={gold < 1}
                onClick={() => handleAction('gold_to_silver', 1)}
              >
                1 Ouro ➔ <span className="btn-gain">+100 Prata</span>
              </button>
              <button
                className="btn-exchange-action"
                disabled={gold < 5}
                onClick={() => handleAction('gold_to_silver', 5)}
              >
                5 Ouros ➔ <span className="btn-gain">+500 Prata</span>
              </button>
              <button
                className="btn-exchange-action"
                disabled={gold < 10}
                onClick={() => handleAction('gold_to_silver', 10)}
              >
                10 Ouros ➔ <span className="btn-gain">+1k Prata</span>
              </button>
            </div>
          </div>

          {/* Section 3: Ouro -> Cristal */}
          <div className="exchange-panel">
            <div className="panel-header">
              <span className="panel-icon">🟡➔🔷</span>
              <div>
                <h3>Ouro para Cristal</h3>
                <small>500 Ouros ➔ 1 Cristal</small>
              </div>
            </div>
            <div className="panel-buttons">
              <button
                className="btn-exchange-action"
                disabled={gold < 500}
                onClick={() => handleAction('gold_to_crystal', 1)}
              >
                +1 Cristal <span className="btn-cost">(500 Ouro)</span>
              </button>
              <button
                className="btn-exchange-action"
                disabled={gold < 2500}
                onClick={() => handleAction('gold_to_crystal', 5)}
              >
                +5 Cristais <span className="btn-cost">(2.5k Ouro)</span>
              </button>
              <button
                className="btn-exchange-action btn-max"
                disabled={maxBasaltFromGold <= 0}
                onClick={() => handleAction('gold_to_crystal', maxBasaltFromGold)}
              >
                Trocar Máximo <span className="btn-cost">(+{maxBasaltFromGold} Cristal)</span>
              </button>
            </div>
          </div>

          {/* Section 4: Cristal -> Ouro (Troco) */}
          <div className="exchange-panel">
            <div className="panel-header">
              <span className="panel-icon">🔷➔🟡</span>
              <div>
                <h3>Cristal para Ouro (Troco)</h3>
                <small>1 Cristal ➔ 500 Ouros</small>
              </div>
            </div>
            <div className="panel-buttons">
              <button
                className="btn-exchange-action"
                disabled={basalt < 1}
                onClick={() => handleAction('crystal_to_gold', 1)}
              >
                1 Cristal ➔ <span className="btn-gain">+500 Ouro</span>
              </button>
              <button
                className="btn-exchange-action"
                disabled={basalt < 5}
                onClick={() => handleAction('crystal_to_gold', 5)}
              >
                5 Cristais ➔ <span className="btn-gain">+2.5k Ouro</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer / Quick Optimize */}
        <div className="exchange-modal-footer">
          <button
            className="btn-optimize-all"
            disabled={silver < 100 && gold < 500}
            onClick={() => handleAction('optimize_all')}
            title="Converte automaticamente todo o troco para moedas superiores"
          >
            ⚡ Otimizar Carteira (Subir Pratas e Ouros)
          </button>
          <button className="btn-exchange-done" onClick={onClose}>
            Concluir & Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
