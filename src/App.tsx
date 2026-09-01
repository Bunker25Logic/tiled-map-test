import { useState, useEffect, useCallback, useRef } from 'react';
import GameCanvas from './GameCanvas';
import type { WingType } from './game/types';
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
import InventoryModal from './components/InventoryModal';
import SettingsModal from './components/SettingsModal';
import OrientationLockModal from './components/OrientationLockModal';
import LoginScreen from './components/LoginScreen';
import CharacterSelectScreen from './components/CharacterSelectScreen';
import PlayerHUD from './components/PlayerHUD';
import WorldLoadingScreen from './components/WorldLoadingScreen';
import DeathModal from './components/DeathModal';
import {
  type ItemDef,
  type EquippedGear,
  DEFAULT_INVENTORY_ITEMS,
  DEFAULT_EQUIPPED_GEAR,
  ALL_ITEMS,
} from './game/items';
import {
  type PlayerAccount,
  applyDeathPenalty,
  createCharacter,
  savePlayerPosition,
  savePlayerVitals,
  saveSession,
  clearSession,
  addXPToCharacter,
  getLevelFromXP,
  loadSession,
  loadAccount,
} from './game/playerStore';
import './App.css';

// Default starting 3-slot loadouts per character
const DEFAULT_CLASS_SPELLS: Record<CharacterId, string[]> = {
  luxio: ['firelion', 'lightningclaw', 'sparkling_fireball'],
  archer: ['snakebite', 'wind_fireball', 'leaf_tempest'],
  magician: ['fireball', 'arcane_nova', 'arcane_astral'],
  necromancer: ['necro_orb', 'necro_reaper', 'fireball'],
  paladin: ['lightningclaw', 'arcane_sanctuary', 'iceshield'],
};

type AppScreen = 'login' | 'character-select' | 'character-lobby' | 'loading' | 'game';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('login');
  const [account, setAccount] = useState<PlayerAccount | null>(null);
  const [activeCharIndex, setActiveCharIndex] = useState(0);

  const [currentZoneId, setCurrentZoneId] = useState<string>('map1');
  const [selectedCharacterId, setSelectedCharacterId] = useState<CharacterId>('luxio');
  const [initialSpawnCoords, setInitialSpawnCoords] = useState<{ x: number; y: number } | null>(null);
  const [mapData, setMapData] = useState<TiledMap | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [graphicStyle, setGraphicStyle] = useState<GraphicStyle>('pixel-sharp');
  const [enableParticles, setEnableParticles] = useState<boolean>(false);
  const [debugColliders, setDebugColliders] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [equippedWings, setEquippedWings] = useState<WingType>('angelic');

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isSpellbookOpen, setIsSpellbookOpen] = useState<boolean>(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState<boolean>(false);

  const [inventoryItems, setInventoryItems] = useState<ItemDef[]>(DEFAULT_INVENTORY_ITEMS);
  const [equippedGear, setEquippedGear] = useState<EquippedGear>(DEFAULT_EQUIPPED_GEAR);

  const [equippedSpellIds, setEquippedSpellIds] = useState<string[]>(DEFAULT_CLASS_SPELLS['luxio']);
  const [playerCoords, setPlayerCoords] = useState({ x: 0, y: 0, tileX: 0, tileY: 0 });
  const [playerHp, setPlayerHp] = useState(100);
  const [playerMaxHp, setPlayerMaxHp] = useState(100);
  const [playerMp, setPlayerMp] = useState(80);
  const [playerMaxMp, setPlayerMaxMp] = useState(80);
  const [levelUpMsg, setLevelUpMsg] = useState<string | null>(null);
  const [deathResult, setDeathResult] = useState<{ lostXp: number; oldLevel: number; newLevel: number } | null>(null);

  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [isReloading, setIsReloading] = useState(false);
  const [activeCastId, setActiveCastId] = useState<string | null>(null);

  const accountRef = useRef<PlayerAccount | null>(account);
  const activeCharIndexRef = useRef(activeCharIndex);
  const currentZoneRef = useRef(currentZoneId);
  const playerCoordsRef = useRef(playerCoords);

  useEffect(() => { accountRef.current = account; }, [account]);
  useEffect(() => { activeCharIndexRef.current = activeCharIndex; }, [activeCharIndex]);
  useEffect(() => { currentZoneRef.current = currentZoneId; }, [currentZoneId]);
  useEffect(() => { playerCoordsRef.current = playerCoords; }, [playerCoords]);

  // Auto-login from session
  useEffect(() => {
    const savedName = loadSession();
    if (savedName) {
      const savedAccount = loadAccount(savedName);
      if (savedAccount) { handleLogin(savedAccount); }
    }
  }, []);

  // Map loading
  useEffect(() => {
    if (screen !== 'game') return;
    let ignore = false;
    fetchZoneMap(currentZoneId)
      .then((data) => { if (!ignore) { setMapData(data); setError(null); setIsReloading(false); } })
      .catch((err: unknown) => {
        if (!ignore) {
          setError(err instanceof Error ? err.message : 'Falha ao carregar o mapa da zona');
          setIsReloading(false);
        }
      });
    return () => { ignore = true; };
  }, [currentZoneId, reloadTrigger, screen]);

  // Periodic position saving
  useEffect(() => {
    if (screen !== 'game') return;
    const interval = setInterval(() => {
      const acc = accountRef.current;
      if (!acc) return;
      const pos = playerCoordsRef.current;
      savePlayerPosition(acc, activeCharIndexRef.current, currentZoneRef.current, { x: pos.x, y: pos.y });
    }, 5000);
    return () => clearInterval(interval);
  }, [screen]);

  // Passive HP & Mana regeneration over time (Tibia classic mechanic)
  useEffect(() => {
    if (screen !== 'game') return;
    const regenInterval = setInterval(() => {
      setPlayerMp((curMp) => {
        const acc = accountRef.current;
        if (!acc) return curMp;
        const char = acc.characters[activeCharIndexRef.current];
        if (!char) return curMp;
        const maxMp = char.maxMp || 80;
        if (curMp >= maxMp) return curMp;
        const nextMp = Math.min(maxMp, curMp + 2);
        char.mp = nextMp;
        savePlayerVitals(acc, activeCharIndexRef.current, char.hp, nextMp);
        return nextMp;
      });

      setPlayerHp((curHp) => {
        const acc = accountRef.current;
        if (!acc) return curHp;
        const char = acc.characters[activeCharIndexRef.current];
        if (!char) return curHp;
        const maxHp = char.maxHp || 100;
        if (curHp <= 0 || curHp >= maxHp) return curHp;
        const nextHp = Math.min(maxHp, curHp + 1);
        char.hp = nextHp;
        savePlayerVitals(acc, activeCharIndexRef.current, nextHp, char.mp);
        return nextHp;
      });
    }, 2000);
    return () => clearInterval(regenInterval);
  }, [screen]);

  function handleLogin(loggedAccount: PlayerAccount) {
    setAccount(loggedAccount);
    accountRef.current = loggedAccount;
    saveSession(loggedAccount.name);
    if (loggedAccount.characters.length === 0) {
      setScreen('character-lobby');
    } else {
      setScreen('character-select');
    }
  }

  function handleLogout() {
    clearSession();
    setAccount(null);
    accountRef.current = null;
    setScreen('login');
  }

  function handleSelectActiveCharacter(charIndex: number, acc?: PlayerAccount) {
    const resolvedAcc = acc ?? accountRef.current;
    if (!resolvedAcc) return;
    const char = resolvedAcc.characters[charIndex];
    if (!char) return;
    setActiveCharIndex(charIndex);
    activeCharIndexRef.current = charIndex;
    setSelectedCharacterId(char.characterId);
    setEquippedSpellIds(DEFAULT_CLASS_SPELLS[char.characterId] || DEFAULT_CLASS_SPELLS['luxio']);
    setPlayerHp(char.hp);
    setPlayerMaxHp(char.maxHp);
    setPlayerMp(char.mp);
    setPlayerMaxMp(char.maxMp);
    const zone = char.lastZone || 'map1';
    const pos = char.lastPos || { x: 0, y: 0 };
    setCurrentZoneId(zone);
    setInitialSpawnCoords(pos);
    setScreen('loading');
  }

  function handleStartGameFromLobby(charId: CharacterId) {
    const acc = accountRef.current;
    if (!acc) return;
    const updatedAccount = createCharacter(acc.name, charId);
    if (!updatedAccount) return;
    const charIndex = updatedAccount.characters.length - 1;
    const cloned = { ...updatedAccount, characters: [...updatedAccount.characters] };
    setAccount(cloned);
    accountRef.current = cloned;
    handleSelectActiveCharacter(charIndex, cloned);
  }

  function handleAddNewCharacter() {
    setScreen('character-lobby');
  }

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

  const handlePlayerDeath = useCallback(() => {
    const acc = accountRef.current;
    if (!acc) return;
    const charIdx = activeCharIndexRef.current;
    const { account: updatedAccount, lostXp, oldLevel, newLevel } = applyDeathPenalty(acc, charIdx);
    const cloned = { ...updatedAccount, characters: [...updatedAccount.characters] };
    setAccount(cloned);
    accountRef.current = cloned;
    const char = cloned.characters[charIdx];
    if (char) {
      setPlayerHp(char.maxHp);
      setPlayerMaxHp(char.maxHp);
      setPlayerMp(char.maxMp);
      setPlayerMaxMp(char.maxMp);
    }
    setDeathResult({ lostXp, oldLevel, newLevel });
  }, []);

  const handleRespawnAtTemple = useCallback(() => {
    setDeathResult(null);
    setCurrentZoneId('map1');
    setInitialSpawnCoords({ x: 0, y: 0 });
    const acc = accountRef.current;
    if (acc) {
      const char = acc.characters[activeCharIndexRef.current];
      if (char) {
        setPlayerHp(char.maxHp);
        setPlayerMaxHp(char.maxHp);
        setPlayerMp(char.maxMp);
        setPlayerMaxMp(char.maxMp);
      }
    }
  }, []);

  const handlePlayerDamage = useCallback((amount: number) => {
    setPlayerHp((prev) => {
      const next = Math.max(0, prev - amount);
      const acc = accountRef.current;
      if (acc) {
        const char = acc.characters[activeCharIndexRef.current];
        if (char) {
          char.hp = next;
          savePlayerVitals(acc, activeCharIndexRef.current, next, char.mp);
        }
      }
      if (next <= 0) {
        setTimeout(() => handlePlayerDeath(), 0);
      }
      return next;
    });
  }, [handlePlayerDeath]);

  const handleMonsterKill = useCallback((xpReward: number) => {
    const acc = accountRef.current;
    if (!acc || acc.characters.length === 0) return;
    const charIdx = activeCharIndexRef.current;
    const { account: updatedAccount, didLevelUp, newLevel } = addXPToCharacter(acc, charIdx, xpReward);
    const cloned = { ...updatedAccount, characters: [...updatedAccount.characters] };
    setAccount(cloned);
    accountRef.current = cloned;
    const char = cloned.characters[charIdx];
    if (char) {
      setPlayerHp(char.hp);
      setPlayerMaxHp(char.maxHp);
      setPlayerMp(char.mp);
      setPlayerMaxMp(char.maxMp);
    }
    if (didLevelUp) {
      setLevelUpMsg(`🎉 LEVEL UP! Você atingiu o nível ${newLevel}!`);
      setTimeout(() => setLevelUpMsg(null), 4000);
    }
  }, []);

  const handleCollectLoot = useCallback((_gold: number, itemId?: string) => {
    if (itemId && ALL_ITEMS[itemId]) {
      const itemDef = ALL_ITEMS[itemId];
      setInventoryItems((prev) => {
        const existing = prev.find((i) => i.id === itemDef.id);
        if (existing && existing.slotType === 'potion') {
          return prev.map((i) =>
            i.id === itemDef.id ? { ...i, quantity: (i.quantity || 1) + 1 } : i
          );
        }
        if (!existing) {
          return [...prev, { ...itemDef, quantity: 1 }];
        }
        return prev;
      });
    }
  }, []);

  const handleConsumeMana = useCallback((amount: number): boolean => {
    setPlayerMp((curMp) => {
      const nextMp = Math.max(0, curMp - amount);
      const acc = accountRef.current;
      if (acc) {
        const char = acc.characters[activeCharIndexRef.current];
        if (char) {
          char.mp = nextMp;
          savePlayerVitals(acc, activeCharIndexRef.current, char.hp, nextMp);
        }
      }
      return nextMp;
    });
    return true;
  }, []);

  const handleCastSpell = (spell: SpellDef) => {
    const cost = spell.manaCost || 0;
    if (cost > 0 && playerMp < cost) {
      setLevelUpMsg(`⚠️ Mana insuficiente! (${playerMp}/${cost} MP)`);
      setTimeout(() => setLevelUpMsg(null), 1800);
      return;
    }
    setActiveCastId(spell.id);
    setTimeout(() => setActiveCastId(null), 300);
    window.dispatchEvent(new CustomEvent('cast-magic-spell', { detail: { spellId: spell.id } }));
  };

  const handleEquipSpell = (slotIndex: number, spellId: string) => {
    if (slotIndex < 0 || slotIndex >= 3) return;
    setEquippedSpellIds((prev) => {
      const next = [...prev].slice(0, 3);
      while (next.length < 3) next.push('');
      const existingIdx = next.indexOf(spellId);
      if (existingIdx !== -1 && existingIdx !== slotIndex) next[existingIdx] = next[slotIndex];
      next[slotIndex] = spellId;
      return next;
    });
  };

  const handleUnequipSpell = (slotIndex: number) => {
    if (slotIndex < 0 || slotIndex >= 3) return;
    setEquippedSpellIds((prev) => {
      const next = [...prev].slice(0, 3);
      while (next.length < 3) next.push('');
      next[slotIndex] = '';
      return next;
    });
  };

  const handleEquipItem = (item: ItemDef) => {
    if (item.slotType === 'wings') {
      const wType = item.wingType || 'none';
      setEquippedWings(wType);
      setEquippedGear((prev) => ({ ...prev, wings: wType }));
      return;
    }
    setEquippedGear((prev) => ({ ...prev, [item.slotType]: item.id }));
  };

  const handleUnequipSlot = (slot: keyof EquippedGear) => {
    if (slot === 'wings') {
      setEquippedWings('none');
      setEquippedGear((prev) => ({ ...prev, wings: 'none' }));
      return;
    }
    setEquippedGear((prev) => ({ ...prev, [slot]: null }));
  };

  const handleUsePotion = (item: ItemDef) => {
    if (item.effect?.healHp) {
      setPlayerHp((cur) => Math.min(playerMaxHp, cur + (item.effect?.healHp || 0)));
    }
    if (item.effect?.healMp) {
      setPlayerMp((cur) => Math.min(playerMaxMp, cur + (item.effect?.healMp || 0)));
    }
    setInventoryItems((prev) => {
      return prev
        .map((it) => {
          if (it.id === item.id) {
            const nextQty = (it.quantity || 1) - 1;
            return nextQty > 0 ? { ...it, quantity: nextQty } : null;
          }
          return it;
        })
        .filter(Boolean) as ItemDef[];
    });
  };

  const handleCycleWings = () => {
    const nextWing: WingType = equippedWings === 'angelic' ? 'thunder' : equippedWings === 'thunder' ? 'none' : 'angelic';
    setEquippedWings(nextWing);
    setEquippedGear((prev) => ({ ...prev, wings: nextWing }));
  };

  const currentZoneDef = ZONES[currentZoneId] || ZONES['map1'];
  const activeChar = account?.characters[activeCharIndex] ?? null;
  const curCharDef = PLAYABLE_CHARACTERS.find((c) => c.id === selectedCharacterId) || PLAYABLE_CHARACTERS[0];
  const xpLevel = activeChar ? getLevelFromXP(activeChar.xp) : 1;

  // ── Screens ──────────────────────────────────────────────────────────────────

  if (screen === 'login') {
    return (
      <div className="rpg-app-container">
        <LoginScreen onLogin={handleLogin} />
        <OrientationLockModal />
      </div>
    );
  }

  if (screen === 'character-select') {
    return (
      <div className="rpg-app-container">
        <CharacterSelectScreen
          account={account!}
          onSelectCharacter={(idx) => handleSelectActiveCharacter(idx)}
          onAddNewCharacter={handleAddNewCharacter}
          onLogout={handleLogout}
        />
        <OrientationLockModal />
      </div>
    );
  }

  if (screen === 'character-lobby') {
    const isFirstTimeChoice = !account || account.characters.length === 0;
    return (
      <div className="rpg-app-container">
        <CharacterLobby
          selectedCharacterId={selectedCharacterId}
          onSelectCharacter={(charId) => setSelectedCharacterId(charId)}
          onStartGame={() => handleStartGameFromLobby(selectedCharacterId)}
          isFirstTimeChoice={isFirstTimeChoice}
        />
        <OrientationLockModal />
      </div>
    );
  }

  if (screen === 'loading') {
    return (
      <div className="rpg-app-container">
        <WorldLoadingScreen
          characterId={selectedCharacterId}
          playerName={account?.name ?? ''}
          onLoadComplete={() => setScreen('game')}
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
          <button className="btn-retry" onClick={handleReloadClick}>Tentar Novamente</button>
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

  // ── Render Active Game Screen ────────────────────────────────────────────────
  return (
    <div className="rpg-app-container">
      <header className="rpg-header-clean">
        <div className="header-left">
          <button
            className="btn-header-hero"
            onClick={() => setScreen('character-select')}
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

        {/* HUD: HP, MP, Level, XP */}
        <div className="header-center">
          {activeChar && account && (
            <PlayerHUD
              character={activeChar}
              playerName={account.name}
              currentHp={playerHp}
              currentMp={playerMp}
            />
          )}
        </div>

        <div className="header-right">
          <button
            className={`btn-header-action btn-wings ${equippedWings}`}
            onClick={handleCycleWings}
            title="Trocar Asas (Angelicais / Trovão / Sem Asas)"
          >
            <span className="header-btn-icon">
              {equippedWings === 'angelic' ? '🪽' : equippedWings === 'thunder' ? '⚡' : '❌'}
            </span>
            <span className="header-btn-text">
              {equippedWings === 'angelic' ? 'Asas Angelicais' : equippedWings === 'thunder' ? 'Asas Trovão' : 'Sem Asas'}
            </span>
          </button>

          <button
            className="btn-header-action btn-spellbook"
            onClick={() => setIsSpellbookOpen(true)}
          >
            <span className="header-btn-icon">📖</span>
            <span className="header-btn-text">Grimório</span>
          </button>

          <button
            className="btn-header-action btn-settings"
            onClick={() => setIsSettingsOpen(true)}
          >
            <span className="header-btn-icon">⚙️</span>
            <span className="header-btn-text">Configurações</span>
          </button>
        </div>
      </header>

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
          equippedWings={equippedWings}
          equippedSpellIds={equippedSpellIds}
          playerHp={playerHp}
          playerMaxHp={playerMaxHp}
          playerMp={playerMp}
          playerMaxMp={playerMaxMp}
          onPlayerPosChange={handlePosChange}
          onZoneTransition={handleZoneTransition}
          onPlayerDamage={handlePlayerDamage}
          onMonsterKill={handleMonsterKill}
          onPlayerDeath={handlePlayerDeath}
          onConsumeMana={handleConsumeMana}
          onOpenInventory={() => setIsInventoryOpen(true)}
          onCollectLoot={handleCollectLoot}
        />

        <Minimap
          mapData={mapData}
          playerPos={playerCoords}
          colliders={mapData ? buildCollisionRects(mapData) : []}
          portals={getMapPortals(currentZoneId, mapData)}
          mapId={currentZoneId}
        />

        <div className="action-bar-3slots action-bar-5slots">
          <div className="action-bar-slots-row">
            {equippedSpellIds.slice(0, 3).map((spellId, idx) => {
              const spell = ALL_SPELLS.find((s) => s.id === spellId);
              if (!spell) return null;
              const isCasting = activeCastId === spell.id;
              const manaCost = spell.manaCost || 0;
              const notEnoughMana = manaCost > playerMp;
              return (
                <button
                  key={spell.id}
                  className={`btn-action-slot ${isCasting ? 'casting' : ''} ${notEnoughMana ? 'no-mana' : ''}`}
                  onClick={() => handleCastSpell(spell)}
                  style={{ '--slot-glow': spell.color } as React.CSSProperties}
                  title={`${spell.name} (${manaCost} MP - Tecla ${idx + 1})`}
                >
                  <span className="slot-key-hint">{idx + 1}</span>
                  <span className="slot-spell-icon">{spell.icon}</span>
                  <span className="slot-spell-title">{spell.name}</span>
                  {manaCost > 0 && (
                    <span className="slot-mana-cost">{manaCost}</span>
                  )}
                </button>
              );
            })}
            <button className="btn-action-slot btn-slot-spellbook" onClick={() => setIsSpellbookOpen(true)} title="Abrir Grimório de Magias">
              <span className="slot-spell-icon">📖</span>
              <span className="slot-spell-title">Grimório</span>
            </button>
            <button className="btn-action-slot btn-slot-bag" onClick={() => setIsInventoryOpen(true)} title="Abrir Mochila & Equipamentos (Tecla B)">
              <span className="slot-spell-icon">🎒</span>
              <span className="slot-spell-title">Mochila</span>
            </button>
          </div>
        </div>
      </main>

      <footer className="rpg-footer-clean">
        <div className="keyboard-controls-hints">
          <div className="key-hint">
            <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> / <kbd>Toque</kbd>
            <span className="key-desc">Mover</span>
          </div>
          <div className="key-divider" />
          <div className="key-hint">
            <kbd>ESPAÇO</kbd>
            <span className="key-desc">Atacar</span>
          </div>
          <div className="key-divider" />
          <div className="key-hint">
            <kbd>1</kbd>..<kbd>3</kbd>
            <span className="key-desc">3 Magias</span>
          </div>
          <div className="key-divider" />
          <div className="key-hint">
            <kbd>B</kbd>
            <span className="key-desc">Mochila</span>
          </div>
          <div className="key-divider" />
          <div className="key-hint">
            <kbd>E</kbd>
            <span className="key-desc">Entrar</span>
          </div>
        </div>

        <div className="footer-status-pill">
          <span>{account?.name} • Nv.{xpLevel} • {currentZoneDef.name} • {graphicStyle}</span>
        </div>
      </footer>

      {levelUpMsg && <div className="levelup-toast">{levelUpMsg}</div>}

      <SpellbookModal
        isOpen={isSpellbookOpen}
        onClose={() => setIsSpellbookOpen(false)}
        equippedSpellIds={equippedSpellIds}
        onEquipSpell={handleEquipSpell}
        onUnequipSpell={handleUnequipSpell}
        onCastPreview={handleCastSpell}
        characterId={selectedCharacterId}
      />
      <InventoryModal
        isOpen={isInventoryOpen}
        onClose={() => setIsInventoryOpen(false)}
        characterId={selectedCharacterId}
        playerName={account?.name || 'Aventureiro'}
        playerLevel={xpLevel}
        playerHp={playerHp}
        playerMaxHp={playerMaxHp}
        playerMp={playerMp}
        playerMaxMp={playerMaxMp}
        inventoryItems={inventoryItems}
        equippedGear={equippedGear}
        onEquipItem={handleEquipItem}
        onUnequipSlot={handleUnequipSlot}
        onUsePotion={handleUsePotion}
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
        equippedWings={equippedWings}
        onSelectWings={setEquippedWings}
        onReloadMap={handleReloadClick}
        isReloadingMap={isReloading}
        onReturnToLobby={() => setScreen('character-select')}
      />
      {deathResult && account && (
        <DeathModal
          playerName={account.name}
          lostXp={deathResult.lostXp}
          oldLevel={deathResult.oldLevel}
          newLevel={deathResult.newLevel}
          onRespawn={handleRespawnAtTemple}
        />
      )}
      <OrientationLockModal />
    </div>
  );
}
