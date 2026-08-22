import { useState, useEffect, useCallback } from 'react';
import GameCanvas from './GameCanvas';
import type { TiledMap } from './game/types';
import { ALL_SPELLS, type SpellDef } from './game/magic';
import { PLAYABLE_CHARACTERS, type CharacterId } from './game/characters';
import { fetchZoneMap, ZONES, getMapPortals } from './game/zones';
import { buildCollisionRects } from './game/mapUtils';
import type { GraphicStyle } from './game/graphics';
import CharacterLobby from './components/CharacterLobby';
import CharacterSpriteAvatar from './components/CharacterSpriteAvatar';
import Minimap from './components/Minimap';
import SpellbookModal from './components/SpellbookModal';
import SettingsModal from './components/SettingsModal';
import OrientationLockModal from './components/OrientationLockModal';
import './App.css';

// Default starting 5-slot loadouts per character
const DEFAULT_CLASS_SPELLS: Record<CharacterId, string[]> = {
  mark: ['firelion', 'lightning', 'iceshield', 'whirlwind', 'sparkling'],
  archer: ['floral', 'lightning', 'sparkling', 'ancient', 'snakebite'],
  barbarian: ['whirlwind', 'turtleshell', 'stoneleaf', 'firelion', 'iceshield'],
  magician: ['cosmic', 'arcanenova', 'lightning', 'abyssal', 'firelion'],
  necromancer: ['snakebite', 'arcanegaze', 'spore', 'abyssal', 'astralshield'],
  paladin: ['iceshield', 'astralshield', 'emerald', 'turtleshell', 'floral'],
};

export default function App() {
  // Lobby vs World State
  const [isInLobby, setIsInLobby] = useState<boolean>(true);

  // Selected Zone & Character
  const [currentZoneId, setCurrentZoneId] = useState<string>('map1');
  const [selectedCharacterId, setSelectedCharacterId] = useState<CharacterId>('mark');
  const [initialSpawnCoords, setInitialSpawnCoords] = useState<{ x: number; y: number } | null>(null);
  const [mapData, setMapData] = useState<TiledMap | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Graphics & Viewport Settings (Default: Pixel Sharp)
  const [graphicStyle, setGraphicStyle] = useState<GraphicStyle>('pixel-sharp');
  const [enableParticles, setEnableParticles] = useState<boolean>(true);
  const [debugColliders, setDebugColliders] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [hasWings, setHasWings] = useState<boolean>(true); // Equipamento: Asas Trovão (+45% velocidade)

  // Modals State
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isSpellbookOpen, setIsSpellbookOpen] = useState<boolean>(false);

  // 5 Active Equipped Spells
  const [equippedSpellIds, setEquippedSpellIds] = useState<string[]>(
    DEFAULT_CLASS_SPELLS['mark']
  );

  // Player live coords report
  const [playerCoords, setPlayerCoords] = useState({ x: 0, y: 0, tileX: 0, tileY: 0 });
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [isReloading, setIsReloading] = useState(false);
  const [activeCastId, setActiveCastId] = useState<string | null>(null);

  // Update starting spells when character changes in lobby
  const handleSelectCharacter = (charId: CharacterId) => {
    setSelectedCharacterId(charId);
    setEquippedSpellIds(DEFAULT_CLASS_SPELLS[charId] || DEFAULT_CLASS_SPELLS['mark']);
  };

  useEffect(() => {
    let ignore = false;

    fetchZoneMap(currentZoneId)
      .then((data) => {
        if (!ignore) {
          setMapData(data);
          setError(null);
          setIsReloading(false);
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          console.error(err);
          setError(err instanceof Error ? err.message : 'Falha ao carregar o mapa da zona');
          setIsReloading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [currentZoneId, reloadTrigger]);

  const handleReloadClick = useCallback(() => {
    setIsReloading(true);
    setReloadTrigger((prev) => prev + 1);
  }, []);

  const handlePosChange = useCallback((x: number, y: number, tileX: number, tileY: number) => {
    setPlayerCoords({ x, y, tileX, tileY });
  }, []);

  const handleZoneTransition = useCallback((targetMapId: string, spawnX: number, spawnY: number) => {
    setInitialSpawnCoords({ x: spawnX, y: spawnY });
    setCurrentZoneId(targetMapId);
  }, []);

  const handleCastSpell = (spell: SpellDef) => {
    setActiveCastId(spell.id);
    setTimeout(() => setActiveCastId(null), 300);

    window.dispatchEvent(
      new CustomEvent('cast-magic-spell', {
        detail: { spellId: spell.id },
      })
    );
  };

  const handleEquipSpell = (slotIndex: number, spellId: string) => {
    setEquippedSpellIds((prev) => {
      const next = [...prev];
      // If already equipped in another slot, swap it
      const existingIdx = next.indexOf(spellId);
      if (existingIdx !== -1 && existingIdx !== slotIndex) {
        next[existingIdx] = next[slotIndex];
      }
      next[slotIndex] = spellId;
      return next;
    });
  };

  const currentZoneDef = ZONES[currentZoneId] || ZONES['map1'];
  const curCharDef =
    PLAYABLE_CHARACTERS.find((c) => c.id === selectedCharacterId) || PLAYABLE_CHARACTERS[0];

  // ── Render Lobby Screen ──────────────────────────────────────────────────
  if (isInLobby) {
    return (
      <div className="rpg-app-container">
        <CharacterLobby
          selectedCharacterId={selectedCharacterId}
          onSelectCharacter={handleSelectCharacter}
          onStartGame={() => setIsInLobby(false)}
        />
        <OrientationLockModal />
      </div>
    );
  }

  if (error) {
    return (
      <div className="game-screen-center">
        <div className="error-card">
          <div className="error-icon">⚠️</div>
          <h2>Erro ao carregar zona</h2>
          <p>{error}</p>
          <button className="btn-retry" onClick={handleReloadClick}>
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  if (!mapData) {
    return (
      <div className="game-screen-center">
        <div className="loading-card">
          <div className="tibian-spinner" />
          <h2>Carregando {currentZoneDef.name}...</h2>
          <p>Lendo camadas, colisões e monstros da zona</p>
        </div>
      </div>
    );
  }

  // ── Render Active Game Screen ────────────────────────────────────────────
  return (
    <div className="rpg-app-container">
      {/* Sleek Minimal Header */}
      <header className="rpg-header-clean">
        <div className="header-left">
          <button
            className="btn-header-hero"
            onClick={() => setIsInLobby(true)}
            title="Voltar ao Lobby / Trocar Herói"
          >
            <div className="hero-avatar-header-box">
              <CharacterSpriteAvatar charId={selectedCharacterId} size={22} />
            </div>
            <div className="hero-mini-info">
              <strong>{curCharDef.name}</strong>
              <span>{curCharDef.className}</span>
            </div>
          </button>

          <div className="zone-indicator-badge">
            <span className="zone-icon">{currentZoneId === 'map1' ? '🌲' : '🕳️'}</span>
            <span className="zone-name">{currentZoneDef.name}</span>
          </div>
        </div>

        {/* Header Center (Player Coords) */}
        <div className="header-center">
          <div className="coord-chip">
            <span className="coord-label">Pos:</span>
            <span className="coord-value">
              {playerCoords.x} | {playerCoords.y}
            </span>
            <span className="coord-tile">
              [Tile: {playerCoords.tileX}, {playerCoords.tileY}]
            </span>
          </div>
        </div>

        {/* Header Right: Wings, Spellbook & Settings */}
        <div className="header-right">
          <button
            className={`btn-header-action btn-wings ${hasWings ? 'active' : ''}`}
            onClick={() => setHasWings(!hasWings)}
            title="Equipar / Desequipar Asas Trovão (+45% Velocidade)"
          >
            <span className="header-btn-icon">⚡</span>
            <span className="header-btn-text">{hasWings ? 'Asas ON' : 'Asas OFF'}</span>
          </button>

          <button
            className="btn-header-action btn-spellbook"
            onClick={() => setIsSpellbookOpen(true)}
            title="Abrir Grimório de Magias"
          >
            <span className="header-btn-icon">📖</span>
            <span className="header-btn-text">Grimório</span>
          </button>

          <button
            className="btn-header-action btn-settings"
            onClick={() => setIsSettingsOpen(true)}
            title="Abrir Configurações do Jogo"
          >
            <span className="header-btn-icon">⚙️</span>
            <span className="header-btn-text">Configurações</span>
          </button>
        </div>
      </header>

      {/* Main Canvas Viewport */}
      <main className="rpg-canvas-wrapper">
        <GameCanvas
          mapId={currentZoneId}
          mapData={mapData}
          initialSpawn={initialSpawnCoords}
          selectedCharacterId={selectedCharacterId}
          graphicStyle={graphicStyle}
          enableParticles={enableParticles}
          debugColliders={debugColliders}
          showGrid={showGrid}
          zoomLevel={zoomLevel}
          hasWings={hasWings}
          onPlayerPosChange={handlePosChange}
          onZoneTransition={handleZoneTransition}
        />

        {/* Minimap in top-right HUD */}
        <Minimap
          mapData={mapData}
          playerPos={playerCoords}
          colliders={mapData ? buildCollisionRects(mapData) : []}
          portals={getMapPortals(currentZoneId, mapData)}
          mapId={currentZoneId}
        />

        {/* ─── Sleek 5-Slot Action Bar (HUD Inferior) ────────────────────────── */}
        <div className="action-bar-5slots">
          <div className="action-bar-slots-row">
            {equippedSpellIds.map((spellId, idx) => {
              const spell = ALL_SPELLS.find((s) => s.id === spellId);
              if (!spell) return null;

              const isCasting = activeCastId === spell.id;

              return (
                <button
                  key={spell.id}
                  className={`btn-action-slot ${isCasting ? 'casting' : ''}`}
                  onClick={() => handleCastSpell(spell)}
                  style={{ '--slot-glow': spell.color } as React.CSSProperties}
                  title={`${spell.name} (Tecla ${idx + 1}) - ${spell.description}`}
                >
                  <span className="slot-key-hint">{idx + 1}</span>
                  <span className="slot-spell-icon">{spell.icon}</span>
                  <span className="slot-spell-title">{spell.name}</span>
                </button>
              );
            })}

            {/* Quick Spellbook Switcher Button */}
            <button
              className="btn-action-slot btn-slot-spellbook"
              onClick={() => setIsSpellbookOpen(true)}
              title="Trocar Magias da Barra (Abrir Grimório)"
            >
              <span className="slot-spell-icon">📖</span>
              <span className="slot-spell-title">Trocar</span>
            </button>
          </div>
        </div>
      </main>

      {/* Compact Bottom Controls Footer */}
      <footer className="rpg-footer-clean">
        <div className="keyboard-controls-hints">
          <div className="key-hint">
            <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> / <kbd>Toque</kbd>
            <span className="key-desc">Mover</span>
          </div>

          <div className="key-divider" />

          <div className="key-hint">
            <kbd>1</kbd>..<kbd>5</kbd>
            <span className="key-desc">5 Magias Ativas</span>
          </div>

          <div className="key-divider" />

          <div className="key-hint">
            <kbd>ESPAÇO</kbd>
            <span className="key-desc">Ataque Físico</span>
          </div>

          <div className="key-divider" />

          <div className="key-hint">
            <kbd>E</kbd>
            <span className="key-desc">Entrar em Buracos</span>
          </div>
        </div>

        <div className="footer-status-pill">
          <span>{currentZoneDef.name} • {graphicStyle}</span>
        </div>
      </footer>

      {/* ─── Modals ───────────────────────────────────────────────────────── */}
      <SpellbookModal
        isOpen={isSpellbookOpen}
        onClose={() => setIsSpellbookOpen(false)}
        equippedSpellIds={equippedSpellIds}
        onEquipSpell={handleEquipSpell}
        onCastPreview={handleCastSpell}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        graphicStyle={graphicStyle}
        onSelectGraphicStyle={setGraphicStyle}
        enableParticles={enableParticles}
        onToggleParticles={() => setEnableParticles((p) => !p)}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid((g) => !g)}
        debugColliders={debugColliders}
        onToggleDebugColliders={() => setDebugColliders((d) => !d)}
        zoomLevel={zoomLevel}
        onSelectZoomLevel={setZoomLevel}
        hasWings={hasWings}
        onToggleWings={() => setHasWings((w) => !w)}
        onReloadMap={handleReloadClick}
        isReloadingMap={isReloading}
        onReturnToLobby={() => setIsInLobby(true)}
      />

      <OrientationLockModal />
    </div>
  );
}
