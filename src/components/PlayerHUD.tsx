import { getLevelFromXP, getLevelProgress, getXPToNextLevel } from '../game/playerStore';
import type { PlayerCharacter } from '../game/playerStore';
import { PLAYABLE_CHARACTERS } from '../game/characters';
import { getTotalSilverValue, formatGoldNumber } from '../game/currency';
import CoinIcon from './CoinIcon';

interface PlayerHUDProps {
  character: PlayerCharacter;
  playerName: string;
  currentHp?: number;
  currentMp?: number;
  onXPGainDebug?: () => void;
}

export default function PlayerHUD({
  character,
  playerName,
  currentHp,
  currentMp,
}: PlayerHUDProps) {
  const hp = currentHp !== undefined ? currentHp : character.hp;
  const mp = currentMp !== undefined ? currentMp : character.mp;
  const maxHp = character.maxHp > 0 ? character.maxHp : 100;
  const maxMp = character.maxMp > 0 ? character.maxMp : 100;

  const level = getLevelFromXP(character.xp);
  const xpProgress = getLevelProgress(character.xp);
  const xpToNext = getXPToNextLevel(character.xp);
  const hpPercent = maxHp > 0 ? hp / maxHp : 1;
  const mpPercent = maxMp > 0 ? mp / maxMp : 1;
  const charDef = PLAYABLE_CHARACTERS.find((c) => c.id === character.characterId);
  const wallet = character.wallet || { gold: 0, silver: 0, basalt: 0 };
  const totalSilver = getTotalSilverValue(wallet);

  // Color for HP bar based on percentage
  const hpColor =
    hpPercent > 0.6 ? '#22c55e' :
    hpPercent > 0.3 ? '#f59e0b' :
    '#ef4444';

  return (
    <div className="player-hud">
      {/* Character avatar + name + level */}
      <div className="hud-identity">
        <div className="hud-level-badge">
          <span className="hud-level-number">{level}</span>
        </div>
        <div className="hud-name-class">
          <span className="hud-player-name">{playerName}</span>
          <span className="hud-class-name">{charDef?.icon} {charDef?.className}</span>
        </div>
      </div>

      {/* HP Bar */}
      <div className="hud-bar-row">
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
      <div className="hud-bar-row">
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
      <div className="hud-bar-row">
        <span className="hud-bar-label">⭐</span>
        <div className="hud-bar-track hud-xp-track" title={`Faltam ${xpToNext.toLocaleString()} XP para o próximo nível`}>
          <div
            className="hud-bar-fill hud-xp-fill"
            style={{ width: `${xpProgress * 100}%` }}
          />
          <span className="hud-xp-pct">{Math.round(xpProgress * 100)}%</span>
        </div>
        <span className="hud-bar-value hud-xp-value">{character.xp.toLocaleString()}</span>
      </div>

      {/* Coin Wallet com Denominações e Total Geral */}
      <div
        className="hud-wallet"
        title={`Valor Total: ${formatGoldNumber(totalSilver)} Pratas\n(100 Prata = 1 Ouro | 100 Ouro = 1 Cristal)`}
      >
        {wallet.basalt > 0 && (
          <div className="hud-coin-slot" title={`${wallet.basalt}x Moeda(s) de Cristal (${formatGoldNumber(wallet.basalt * 100)} Ouro)`}>
            <CoinIcon type="basalt" amount={wallet.basalt} size={18} showAmount />
          </div>
        )}
        {wallet.gold > 0 && (
          <div className="hud-coin-slot" title={`${wallet.gold}x Moeda(s) de Ouro (${formatGoldNumber(wallet.gold * 100)} Prata)`}>
            <CoinIcon type="gold" amount={wallet.gold} size={18} showAmount />
          </div>
        )}
        <div className="hud-coin-slot" title={`${wallet.silver}x Moeda(s) de Prata`}>
          <CoinIcon type="silver" amount={wallet.silver} size={18} showAmount />
        </div>
        <div className="hud-wallet-total" title="Saldo total convertido">
          <span className="hud-total-label">Total:</span>
          <span className="hud-total-value">
            {wallet.gold > 0 || wallet.basalt > 0
              ? `${formatGoldNumber(wallet.gold + wallet.basalt * 100)}o ${wallet.silver}p`
              : `${wallet.silver}p`}
          </span>
          <span className="hud-total-symbol">🪙</span>
        </div>
      </div>
    </div>
  );
}
