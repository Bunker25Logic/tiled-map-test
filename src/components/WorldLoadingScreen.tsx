import { useState, useEffect } from 'react';
import type { CharacterId } from '../game/characters';
import { PLAYABLE_CHARACTERS } from '../game/characters';
import CharacterSpriteAvatar from './CharacterSpriteAvatar';
import { preloadAllGameAssets } from '../game/assetManager';

interface WorldLoadingScreenProps {
  zoneName?: string;
  characterId?: CharacterId;
  playerName?: string;
  onLoadComplete?: () => void;
}

const LOADING_TIPS = [
  'Dica: Inimigos vermelhos como Orcs e Dragões avançam assim que você se aproxima!',
  'Dica: Animais como Esquilos e Dodos são pacíficos até que você os ataque.',
  'Dica: O XP necessário para cada nível segue a fórmula exata do Tibia clássico.',
  'Dica: Ao derrotar monstros, eles dropam pilhas de moedas (Ouro, Prata e Cristal)!',
  'Dica: Pressione ESPAÇO ou J para desferir golpes corpo a corpo.',
  'Dica: Pressione 1 a 5 no teclado para conjurar magias do seu Grimório.',
  'Dica: 100 Moedas de Ouro equivalem a 1 Moeda de Prata. 100 de Prata valem 1 Cristal!',
  'Dica: Você pode explorar cavernas descendo em buracos interativos com a tecla E ou clique.',
];

export default function WorldLoadingScreen({
  zoneName = 'Superfície de Tibia',
  characterId = 'luxio',
  playerName,
  onLoadComplete,
}: WorldLoadingScreenProps) {
  const [tipIndex, setTipIndex] = useState(0);
  const [progress, setProgress] = useState(15);
  const [assetsReady, setAssetsReady] = useState(false);

  const charDef = PLAYABLE_CHARACTERS.find((c) => c.id === characterId) || PLAYABLE_CHARACTERS[0];

  useEffect(() => {
    // Real asset preloading in background
    let isMounted = true;
    preloadAllGameAssets()
      .then(() => {
        if (isMounted) setAssetsReady(true);
      })
      .catch((err) => {
        console.warn('Preload warning:', err);
        if (isMounted) setAssetsReady(true);
      });

    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % LOADING_TIPS.length);
    }, 2800);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        const next = prev + Math.floor(Math.random() * 15) + 10;
        return next > 100 ? 100 : next;
      });
    }, 90);

    return () => {
      isMounted = false;
      clearInterval(tipInterval);
      clearInterval(progressInterval);
    };
  }, []);

  useEffect(() => {
    if (progress >= 100 && assetsReady && onLoadComplete) {
      const timer = setTimeout(() => {
        onLoadComplete();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [progress, assetsReady, onLoadComplete]);

  return (
    <div className="world-loading-overlay">
      {/* Ambient background particles */}
      <div className="world-loading-bg">
        <div className="world-loading-rune rune-left">⚔️</div>
        <div className="world-loading-rune rune-right">🛡️</div>
      </div>

      <div className="world-loading-card">
        {/* Creator Brand Badge */}
        <div className="creator-badge">
          <span className="creator-sparkle">✨</span>
          <span className="creator-text">
            Desenvolvido por <strong>Wellinton Oliveira</strong>
          </span>
          <span className="creator-sparkle">✨</span>
        </div>

        {/* Logo & Game Title */}
        <div className="world-loading-header">
          <div className="world-loading-logo-icon">⚔️</div>
          <h2>Tibia Tiled Explorer</h2>
          <p className="world-loading-zone">Carregando: <strong>{zoneName}</strong></p>
        </div>

        {/* Character Card Preview */}
        <div className="world-loading-hero-box">
          <div className="world-loading-avatar">
            <CharacterSpriteAvatar charId={characterId} size={42} />
          </div>
          <div className="world-loading-hero-info">
            <strong>{playerName ? `${playerName}` : charDef.name}</strong>
            <span>{charDef.icon} {charDef.className}</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="world-loading-progress-container">
          <div className="world-loading-progress-bar">
            <div
              className="world-loading-progress-fill"
              style={{ width: `${progress}%` }}
            />
            <div className="world-loading-progress-shimmer" />
          </div>
          <div className="world-loading-status-row">
            <span className="world-loading-status-text">
              {progress < 40 ? 'Lendo mapas e camadas...' :
               progress < 70 ? 'Invocando monstros e biomas...' :
               progress < 90 ? 'Compilando feitiços e colisões...' :
               'Entrando no mundo...'}
            </span>
            <span className="world-loading-pct">{progress}%</span>
          </div>
        </div>

        {/* Dynamic Tip */}
        <div className="world-loading-tip-card">
          <span className="tip-icon">💡</span>
          <span className="tip-text">{LOADING_TIPS[tipIndex]}</span>
        </div>

        <div className="world-loading-footer">
          <span>Tibia Tiled 2D Engine · Criado por Wellinton Oliveira</span>
        </div>
      </div>
    </div>
  );
}
