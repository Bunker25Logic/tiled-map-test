import { getLevelFromXP, getLevelProgress, getXPToNextLevel } from '../game/playerStore';
import type { PlayerCharacter } from '../game/playerStore';
import { formatGoldNumber } from '../game/currency';
import CoinIcon from './CoinIcon';

interface PlayerHUDProps {
  character: PlayerCharacter;
  playerName: string;
  onXPGainDebug?: () => void;
  onOpenExchange?: () => void;
}

export default function PlayerHUD({
  character,
  onOpenExchange,
}: PlayerHUDProps) {
  const currentLevel = getLevelFromXP(character.xp);
  const xpProgress = getLevelProgress(character.xp);
  const xpNeeded = getXPToNextLevel(character.xp);
  const wallet = character.wallet || { gold: 0, silver: 0, basalt: 0 };

  return (
    <div className="player-hud">
      {/* Nível do Herói */}
      <div className="hud-level-badge" title={`Nível ${currentLevel} • Faltam ${xpNeeded.toLocaleString()} XP para o próximo nível`}>
        <span className="hud-level-tag">Nv.</span>
        <span className="hud-level-number">{currentLevel}</span>
      </div>


      {/* XP Bar */}
      <div className="hud-bar-row hud-xp-row" title={`XP: ${character.xp.toLocaleString()} • Próximo nível em ${xpNeeded.toLocaleString()} XP`}>
        <span className="hud-bar-label">⭐</span>
        <div className="hud-bar-track hud-xp-track">
          <div
            className="hud-bar-fill hud-xp-fill"
            style={{ width: `${xpProgress * 100}%` }}
          />
          <span className="hud-xp-pct">{Math.round(xpProgress * 100)}%</span>
        </div>
        <span className="hud-bar-value hud-xp-value">{character.xp.toLocaleString()}</span>
      </div>

      {/* Coin Wallet com Denominações */}
      <div
        className={`hud-wallet ${onOpenExchange ? 'hud-wallet-clickable' : ''}`}
        onClick={onOpenExchange}
        title={`Carteira de Moedas (Clique para abrir Casa de Câmbio):\nCristal: ${formatGoldNumber(wallet.basalt || 0)}\nOuro: ${formatGoldNumber(wallet.gold || 0)}\nPrata: ${formatGoldNumber(wallet.silver || 0)}`}
      >
        {wallet.basalt > 0 && (
          <div className="hud-coin-slot" title={`${formatGoldNumber(wallet.basalt)}x Moeda(s) de Cristal`}>
            <CoinIcon type="basalt" amount={wallet.basalt} size={16} showAmount />
          </div>
        )}
        {wallet.gold > 0 && (
          <div className="hud-coin-slot" title={`${formatGoldNumber(wallet.gold)}x Moeda(s) de Ouro`}>
            <CoinIcon type="gold" amount={wallet.gold} size={16} showAmount />
          </div>
        )}
        <div className="hud-coin-slot" title={`${formatGoldNumber(wallet.silver)}x Moeda(s) de Prata`}>
          <CoinIcon type="silver" amount={wallet.silver} size={16} showAmount />
        </div>
      </div>
    </div>
  );
}
