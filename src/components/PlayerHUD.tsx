import { getLevelFromXP, getLevelProgress, getXPToNextLevel } from '../game/playerStore';
import type { PlayerCharacter } from '../game/playerStore';
import { formatGoldNumber } from '../game/currency';
import CoinIcon from './CoinIcon';

interface PlayerHUDProps {
  character: PlayerCharacter;
  playerName: string;
  currentHp?: number;
  currentMp?: number;
  onXPGainDebug?: () => void;
  onOpenExchange?: () => void;
}

export default function PlayerHUD({
  character,
  currentHp,
  currentMp,
  onOpenExchange,
}: PlayerHUDProps) {
  const hp = currentHp !== undefined ? currentHp : character.hp;
  const mp = currentMp !== undefined ? currentMp : character.mp;
  const maxHp = character.maxHp > 0 ? character.maxHp : 100;
  const maxMp = character.maxMp > 0 ? character.maxMp : 100;

  const currentLevel = getLevelFromXP(character.xp);
  const xpProgress = getLevelProgress(character.xp);
  const xpNeeded = getXPToNextLevel(character.xp);
  const wallet = character.wallet || { gold: 0, silver: 0, basalt: 0 };

  const hpPercent = maxHp > 0 ? hp / maxHp : 1;
  const mpPercent = maxMp > 0 ? mp / maxMp : 1;

  const hpColor =
    hpPercent > 0.6 ? '#22c55e' :
    hpPercent > 0.3 ? '#f59e0b' :
    '#ef4444';

  return (
    <div className="player-hud">
      {/* Nível do Herói */}
      <div className="hud-level-badge" title={`Nível ${currentLevel} • Faltam ${xpNeeded.toLocaleString()} XP para o próximo nível`}>
        <span className="hud-level-tag">Nv.</span>
        <span className="hud-level-number">{currentLevel}</span>
      </div>

      {/* HP Bar */}
      <div className="hud-bar-row hud-hp-row" title={`Vida: ${hp} / ${maxHp} (${Math.round(hpPercent * 100)}%)`}>
        <span className="hud-bar-label">❤️</span>
        <div className="hud-bar-track">
          <div
            className="hud-bar-fill hud-hp-fill"
            style={{ width: `${Math.max(0, Math.min(1, hpPercent)) * 100}%`, backgroundColor: hpColor }}
          />
        </div>
        <span className="hud-bar-value">{hp}<span className="hud-bar-max">/{maxHp}</span></span>
      </div>

      {/* MP Bar */}
      <div className="hud-bar-row hud-mp-row" title={`Mana: ${mp} / ${maxMp} (${Math.round(mpPercent * 100)}%)`}>
        <span className="hud-bar-label">🔷</span>
        <div className="hud-bar-track">
          <div
            className="hud-bar-fill hud-mp-fill"
            style={{ width: `${Math.max(0, Math.min(1, mpPercent)) * 100}%` }}
          />
        </div>
        <span className="hud-bar-value">{mp}<span className="hud-bar-max">/{maxMp}</span></span>
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
