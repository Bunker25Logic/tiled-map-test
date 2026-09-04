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
import CurrencyExchangeModal from './components/CurrencyExchangeModal';
import WeaponOffsetCalibrator from './components/WeaponOffsetCalibrator';
import type { Direction } from './game/types';
import { ITEM_OFFSETS, type ItemOffsetConfig } from './game/itemOffsets';
import {
  type ItemDef,
  type EquippedGear,
  DEFAULT_INVENTORY_ITEMS,
  DEFAULT_EQUIPPED_GEAR,
  ALL_ITEMS,
  getGearStatBonuses,
} from './game/items';
import {
  type PlayerAccount,
  applyDeathPenalty,
  createCharacter,
  savePlayerPosition,
  savePlayerGear,
  savePlayerInventory,
  savePlayerVitals,
  saveSession,
  clearSession,
  addXPToCharacter,
  addCoinsToCharacter,
  exchangeCharacterCoins,
  type ExchangeOperation,
  getLevelFromXP,
  loadSession,
  loadAccount,
} from './game/playerStore';
import { usePWA } from './game/usePWA';
import { InstallModal } from './components/InstallModal';
import { AssetDownloadModal } from './components/AssetDownloadModal';
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

  const [graphicStyle, setGraphicStyle] = useState<GraphicStyle>('modern-hd');
  const [enableParticles, setEnableParticles] = useState<boolean>(false);
  const [debugColliders, setDebugColliders] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(false);
  const [equippedWings, setEquippedWings] = useState<WingType>('angelic');

  // Combat & Targeting settings
  const [autoAttackEnabled, setAutoAttackEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('rpg_setting_auto_attack');
    return saved !== null ? saved === 'true' : true;
  });
  const [autoTargetNearbyEnabled, setAutoTargetNearbyEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('rpg_setting_auto_target');
    return saved !== null ? saved === 'true' : true;
  });

  const handleToggleAutoAttack = () => {
    setAutoAttackEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('rpg_setting_auto_attack', String(next));
      return next;
    });
  };

  const handleToggleAutoTargetNearby = () => {
    setAutoTargetNearbyEnabled((prev) => {
      const next = !prev;
      localStorage.setItem('rpg_setting_auto_target', String(next));
      return next;
    });
  };

  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isSpellbookOpen, setIsSpellbookOpen] = useState<boolean>(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState<boolean>(false);
  const [isExchangeOpen, setIsExchangeOpen] = useState<boolean>(false);
  const [isCalibratorOpen, setIsCalibratorOpen] = useState<boolean>(false);
  const [calibratorDirection, setCalibratorDirection] = useState<Direction | null>(null);
  const [weaponOffsets, setWeaponOffsets] = useState<ItemOffsetConfig>(() =>
    JSON.parse(JSON.stringify(ITEM_OFFSETS['sword_gold'] || ITEM_OFFSETS['gold_sword']))
  );

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
  const lastCastTimeRef = useRef(0);

  const accountRef = useRef<PlayerAccount | null>(account);
  const activeCharIndexRef = useRef(activeCharIndex);
  const currentZoneRef = useRef(currentZoneId);
  const playerCoordsRef = useRef(playerCoords);
  const equippedGearRef = useRef(equippedGear);

  useEffect(() => { accountRef.current = account; }, [account]);
  useEffect(() => { activeCharIndexRef.current = activeCharIndex; }, [activeCharIndex]);
  useEffect(() => { currentZoneRef.current = currentZoneId; }, [currentZoneId]);
  useEffect(() => { playerCoordsRef.current = playerCoords; }, [playerCoords]);
  useEffect(() => { equippedGearRef.current = equippedGear; }, [equippedGear]);

  // Auto-login from session
  useEffect(() => {
    const savedName = loadSession();
    if (savedName) {
      const savedAccount = loadAccount(savedName);
      if (savedAccount) { handleLogin(savedAccount); }
    }
  }, []);

  // Shortcut to toggle weapon offset calibrator (Key 'O') and attack feedback
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'o' || e.key === 'O') {
        setIsCalibratorOpen((prev) => !prev);
      }
      if (e.key === 'c' || e.key === 'C') {
        setIsExchangeOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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

  // Periodic & unload position saving
  useEffect(() => {
    if (screen !== 'game') return;

    const saveCurrentState = () => {
      const acc = accountRef.current;
      if (!acc) return;
      const pos = playerCoordsRef.current;
      if (pos) {
        savePlayerPosition(acc, activeCharIndexRef.current, currentZoneRef.current, { x: pos.x, y: pos.y });
      }
    };

    const interval = setInterval(saveCurrentState, 2000);
    window.addEventListener('beforeunload', saveCurrentState);
    window.addEventListener('pagehide', saveCurrentState);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', saveCurrentState);
      window.removeEventListener('pagehide', saveCurrentState);
      saveCurrentState();
    };
  }, [screen]);

  // Passive HP & Mana regeneration over time (Tibia classic mechanic com bônus de anéis)
  useEffect(() => {
    if (screen !== 'game') return;
    const regenInterval = setInterval(() => {
      // Calcula bônus de regeneração concedidos por anéis e equipamentos
      const gear = equippedGearRef.current;
      const bonuses = getGearStatBonuses(gear);
      const bonusHpRegen = bonuses.hpRegen;
      const bonusMpRegen = bonuses.mpRegen;

      setPlayerMp((curMp) => {
        const acc = accountRef.current;
        if (!acc) return curMp;
        const char = acc.characters[activeCharIndexRef.current];
        if (!char) return curMp;
        const maxMp = (char.maxMp || 80) + bonuses.maxMp;
        if (curMp >= maxMp) return curMp;
        const nextMp = Math.min(maxMp, curMp + 2 + bonusMpRegen);
        char.mp = nextMp;
        savePlayerVitals(acc, activeCharIndexRef.current, char.hp, nextMp);
        return nextMp;
      });

      setPlayerHp((curHp) => {
        const acc = accountRef.current;
        if (!acc) return curHp;
        const char = acc.characters[activeCharIndexRef.current];
        if (!char) return curHp;
        const maxHp = (char.maxHp || 100) + bonuses.maxHp;
        if (curHp <= 0 || curHp >= maxHp) return curHp;
        const nextHp = Math.min(maxHp, curHp + 1 + bonusHpRegen);
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

  const handleReturnToCharacterSelect = useCallback(() => {
    const acc = accountRef.current;
    if (acc && screen === 'game') {
      const pos = playerCoordsRef.current;
      const zone = currentZoneRef.current;
      if (pos) {
        savePlayerPosition(acc, activeCharIndexRef.current, zone, { x: pos.x, y: pos.y });
      }
      savePlayerVitals(acc, activeCharIndexRef.current, playerHp, playerMp);
    }
    setScreen('character-select');
  }, [playerHp, playerMp, screen]);

  function handleLogout() {
    const acc = accountRef.current;
    if (acc && screen === 'game') {
      const pos = playerCoordsRef.current;
      const zone = currentZoneRef.current;
      if (pos) {
        savePlayerPosition(acc, activeCharIndexRef.current, zone, { x: pos.x, y: pos.y });
      }
      savePlayerVitals(acc, activeCharIndexRef.current, playerHp, playerMp);
    }
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
    // 1. Restore or initialize equipped gear
    const savedGear: EquippedGear = char.equippedGear
      ? { ...char.equippedGear }
      : { ...DEFAULT_EQUIPPED_GEAR };
    setEquippedGear(savedGear);
    equippedGearRef.current = savedGear;
    setEquippedWings(savedGear.wings || 'none');
    if (savedGear.weapon) {
      const offsets = ITEM_OFFSETS[savedGear.weapon] || ITEM_OFFSETS['sword_gold'] || ITEM_OFFSETS['gold_sword'];
      if (offsets) {
        setWeaponOffsets(JSON.parse(JSON.stringify(offsets)));
      }
    }
    if (!char.equippedGear) {
      savePlayerGear(resolvedAcc, charIndex, savedGear);
    }

    const gearBonuses = getGearStatBonuses(savedGear);
    const effMaxHp = (char.maxHp || 100) + gearBonuses.maxHp;
    const effMaxMp = (char.maxMp || 80) + gearBonuses.maxMp;
    setPlayerHp(Math.min(effMaxHp, char.hp || effMaxHp));
    setPlayerMaxHp(effMaxHp);
    setPlayerMp(Math.min(effMaxMp, char.mp || effMaxMp));
    setPlayerMaxMp(effMaxMp);

    // 2. Restore or initialize inventory (respeita inventário vazio)
    const savedInventory: ItemDef[] = char.inventory
      ? char.inventory.map((item) => ({ ...item }))
      : DEFAULT_INVENTORY_ITEMS.map((item) => ({ ...item }));
    setInventoryItems(savedInventory);
    if (!char.inventory) {
      savePlayerInventory(resolvedAcc, charIndex, savedInventory);
    }

    // 3. Restore last location & zone
    const zone = char.lastZone || 'map1';
    const pos = char.lastPos || (ZONES[zone]?.defaultSpawn ?? { x: 0, y: 0 });
    setCurrentZoneId(zone);
    currentZoneRef.current = zone;
    setInitialSpawnCoords({ x: pos.x, y: pos.y });
    playerCoordsRef.current = {
      x: pos.x,
      y: pos.y,
      tileX: Math.floor(pos.x / 32),
      tileY: Math.floor(pos.y / 32),
    };

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
    playerCoordsRef.current = { x, y, tileX, tileY };
    setPlayerCoords({ x, y, tileX, tileY });
  }, []);

  const handleZoneTransition = useCallback((targetMapId: string, spawnX: number, spawnY: number) => {
    setInitialSpawnCoords({ x: spawnX, y: spawnY });
    setCurrentZoneId(targetMapId);
    currentZoneRef.current = targetMapId;
    playerCoordsRef.current = {
      x: spawnX,
      y: spawnY,
      tileX: Math.floor(spawnX / 32),
      tileY: Math.floor(spawnY / 32),
    };
    const acc = accountRef.current;
    if (acc) {
      savePlayerPosition(acc, activeCharIndexRef.current, targetMapId, { x: spawnX, y: spawnY });
    }
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
    let defense = 0;
    const gear = equippedGearRef.current;
    if (gear) {
      for (const slot of Object.keys(gear) as (keyof EquippedGear)[]) {
        const itemId = gear[slot];
        if (itemId && ALL_ITEMS[itemId]?.stats?.defense) {
          defense += ALL_ITEMS[itemId].stats!.defense!;
        }
      }
    }
    // Mitigação de dano por armaduras, escudos e anéis de poder (ex: Might Ring com +25 def)
    const mitigation = Math.min(0.65, defense / (defense + 100));
    const finalDamage = Math.max(1, Math.round(amount * (1 - mitigation)));

    setPlayerHp((prev) => {
      const next = Math.max(0, prev - finalDamage);
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
      const bonuses = getGearStatBonuses(equippedGearRef.current);
      const effMaxHp = char.maxHp + bonuses.maxHp;
      const effMaxMp = char.maxMp + bonuses.maxMp;
      setPlayerHp(char.hp);
      setPlayerMaxHp(effMaxHp);
      setPlayerMp(char.mp);
      setPlayerMaxMp(effMaxMp);
    }
    if (didLevelUp) {
      setLevelUpMsg(`🎉 LEVEL UP! Você atingiu o nível ${newLevel}!`);
      setTimeout(() => setLevelUpMsg(null), 4000);
    }
  }, []);

  const handleCollectCoins = useCallback(
    (coins: { gold?: number; silver?: number; basalt?: number }) => {
      setAccount((currentAcc) => {
        const acc = currentAcc || accountRef.current;
        if (!acc || acc.characters.length === 0) return currentAcc;
        const charIdx = activeCharIndexRef.current;
        const { account: updatedAccount } = addCoinsToCharacter(acc, charIdx, coins);
        accountRef.current = updatedAccount;
        return updatedAccount;
      });
    },
    []
  );

  const handleExchangeCoins = useCallback(
    (operation: ExchangeOperation, count: number = 1) => {
      const acc = accountRef.current;
      if (!acc || acc.characters.length === 0) {
        return { success: false, message: 'Conta não encontrada' };
      }
      const charIdx = activeCharIndexRef.current;
      const res = exchangeCharacterCoins(acc, charIdx, operation, count);
      if (res.success) {
        setAccount(res.account);
        accountRef.current = res.account;
      }
      return { success: res.success, message: res.message };
    },
    []
  );

  const handleCollectLoot = useCallback(
    (silver: number, itemId?: string) => {
      if (silver > 0) {
        handleCollectCoins({ silver });
      }
      if (itemId && ALL_ITEMS[itemId]) {
        const itemDef = ALL_ITEMS[itemId];
        setInventoryItems((prev) => {
          let next: ItemDef[];
          const existing = prev.find((i) => i.id === itemDef.id);
          if (existing && existing.slotType === 'potion') {
            next = prev.map((i) =>
              i.id === itemDef.id ? { ...i, quantity: (i.quantity || 1) + 1 } : i
            );
          } else if (!existing) {
            next = [...prev, { ...itemDef, quantity: 1 }];
          } else {
            next = prev;
          }
          const acc = accountRef.current;
          if (acc) {
            savePlayerInventory(acc, activeCharIndexRef.current, next);
          }
          return next;
        });
      }
    },
    [handleCollectCoins]
  );

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
    const now = performance.now();
    if (now - lastCastTimeRef.current < 350) return;
    lastCastTimeRef.current = now;

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
    let nextGear: EquippedGear;
    if (item.slotType === 'wings') {
      const wType = item.wingType || 'none';
      setEquippedWings(wType);
      nextGear = { ...equippedGearRef.current, wings: wType };
    } else {
      if (item.slotType === 'weapon') {
        const offsets = ITEM_OFFSETS[item.id] || ITEM_OFFSETS['sword_gold'] || ITEM_OFFSETS['gold_sword'];
        if (offsets) {
          setWeaponOffsets(JSON.parse(JSON.stringify(offsets)));
        }
      }
      nextGear = { ...equippedGearRef.current, [item.slotType]: item.id };
    }
    setEquippedGear(nextGear);
    equippedGearRef.current = nextGear;
    const acc = accountRef.current;
    if (acc) {
      savePlayerGear(acc, activeCharIndexRef.current, nextGear);
      const char = acc.characters[activeCharIndexRef.current];
      if (char) {
        const bonuses = getGearStatBonuses(nextGear);
        const newMaxHp = (char.maxHp || 100) + bonuses.maxHp;
        const newMaxMp = (char.maxMp || 80) + bonuses.maxMp;
        setPlayerMaxHp(newMaxHp);
        setPlayerMaxMp(newMaxMp);
        setPlayerHp((cur) => Math.min(newMaxHp, cur));
        setPlayerMp((cur) => Math.min(newMaxMp, cur));
      }
    }
  };

  const handleUnequipSlot = (slot: keyof EquippedGear) => {
    let nextGear: EquippedGear;
    if (slot === 'wings') {
      setEquippedWings('none');
      nextGear = { ...equippedGearRef.current, wings: 'none' };
    } else {
      nextGear = { ...equippedGearRef.current, [slot]: null };
    }
    setEquippedGear(nextGear);
    equippedGearRef.current = nextGear;
    const acc = accountRef.current;
    if (acc) {
      savePlayerGear(acc, activeCharIndexRef.current, nextGear);
      const char = acc.characters[activeCharIndexRef.current];
      if (char) {
        const bonuses = getGearStatBonuses(nextGear);
        const newMaxHp = (char.maxHp || 100) + bonuses.maxHp;
        const newMaxMp = (char.maxMp || 80) + bonuses.maxMp;
        setPlayerMaxHp(newMaxHp);
        setPlayerMaxMp(newMaxMp);
        setPlayerHp((cur) => Math.min(newMaxHp, cur));
        setPlayerMp((cur) => Math.min(newMaxMp, cur));
      }
    }
  };

  const handleUsePotion = (item: ItemDef) => {
    if (item.effect?.healHp) {
      setPlayerHp((cur) => Math.min(playerMaxHp, cur + (item.effect?.healHp || 0)));
    }
    if (item.effect?.healMp) {
      setPlayerMp((cur) => Math.min(playerMaxMp, cur + (item.effect?.healMp || 0)));
    }
    setInventoryItems((prev) => {
      const next = prev
        .map((it) => {
          if (it.id === item.id) {
            const nextQty = (it.quantity || 1) - 1;
            return nextQty > 0 ? { ...it, quantity: nextQty } : null;
          }
          return it;
        })
        .filter(Boolean) as ItemDef[];
      const acc = accountRef.current;
      if (acc) {
        savePlayerInventory(acc, activeCharIndexRef.current, next);
      }
      return next;
    });
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
            onClick={handleReturnToCharacterSelect}
            title="Voltar ao Lobby / Trocar Herói"
          >
            <div className="hero-avatar-header-box">
              <CharacterSpriteAvatar charId={selectedCharacterId} size={22} />
            </div>
            <div className="hero-mini-info">
              <strong>{curCharDef.name}</strong>
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
              onOpenExchange={() => setIsExchangeOpen(true)}
            />
          )}
        </div>

        <div className="header-right">
          <button
            className="btn-header-action btn-spellbook"
            onClick={() => setIsSpellbookOpen(true)}
          >
            <span className="header-btn-icon">📖</span>
            <span className="header-btn-text">Grimório</span>
          </button>

          <button
            className={`btn-header-action btn-header-calibrator ${isCalibratorOpen ? 'active' : ''}`}
            onClick={() => setIsCalibratorOpen((prev) => !prev)}
            title="Calibrador de Posição da Arma (Atalho: O)"
          >
            <span className="header-btn-icon">🎯</span>
            <span className="header-btn-text">Calibrar</span>
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
          equippedWeapon={equippedGear.weapon}
          equippedGear={equippedGear}
          autoAttackEnabled={autoAttackEnabled}
          autoTargetNearbyEnabled={autoTargetNearbyEnabled}
          weaponOffsets={weaponOffsets}
          overrideDirection={isCalibratorOpen ? calibratorDirection : null}
          equippedSpellIds={equippedSpellIds}
          playerHp={playerHp}
          playerMaxHp={playerMaxHp}
          playerMp={playerMp}
          playerMaxMp={playerMaxMp}
          playerLevel={xpLevel}
          onPlayerPosChange={handlePosChange}
          onZoneTransition={handleZoneTransition}
          onPlayerDamage={handlePlayerDamage}
          onMonsterKill={handleMonsterKill}
          onPlayerDeath={handlePlayerDeath}
          onConsumeMana={handleConsumeMana}
          onOpenInventory={() => setIsInventoryOpen(true)}
          onCollectLoot={handleCollectLoot}
          onCollectCoins={handleCollectCoins}
        />

        <Minimap
          mapData={mapData}
          playerPos={playerCoords}
          colliders={mapData ? buildCollisionRects(mapData) : []}
          portals={getMapPortals(currentZoneId, mapData)}
          mapId={currentZoneId}
        />

        <div className="action-bar-5slots">
          <div className="action-bar-slots-row">
            {equippedSpellIds.map((spellId, idx) => {
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
                  onTouchStart={(e) => {
                    e.preventDefault();
                    handleCastSpell(spell);
                  }}
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
          <div className="key-hint" onClick={() => setIsCalibratorOpen((prev) => !prev)} style={{ cursor: 'pointer' }} title="Calibrador de Posição da Arma">
            <kbd>O</kbd>
            <span className="key-desc">Calibrar</span>
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

      <WeaponOffsetCalibrator
        isOpen={isCalibratorOpen}
        onClose={() => {
          setIsCalibratorOpen(false);
          setCalibratorDirection(null);
        }}
        currentDirection={calibratorDirection || 'down'}
        onSetDirection={(dir) => setCalibratorDirection(dir)}
        offsets={weaponOffsets}
        onOffsetsChange={setWeaponOffsets}
      />

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
        playerWallet={account?.characters[activeCharIndex]?.wallet}
        onEquipItem={handleEquipItem}
        onUnequipSlot={handleUnequipSlot}
        onUsePotion={handleUsePotion}
        onOpenExchange={() => setIsExchangeOpen(true)}
      />
      <CurrencyExchangeModal
        isOpen={isExchangeOpen}
        onClose={() => setIsExchangeOpen(false)}
        wallet={account?.characters[activeCharIndex]?.wallet}
        onExchange={handleExchangeCoins}
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
        autoAttackEnabled={autoAttackEnabled}
        onToggleAutoAttack={handleToggleAutoAttack}
        autoTargetNearbyEnabled={autoTargetNearbyEnabled}
        onToggleAutoTargetNearby={handleToggleAutoTargetNearby}
        equippedWings={equippedWings}
        equippedGear={equippedGear}
        onReloadMap={handleReloadClick}
        isReloadingMap={isReloading}
        onReturnToLobby={handleReturnToCharacterSelect}
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

      {/* ── PWA System ── */}
      <PWASystem />
    </div>
  );
}

// ── PWA System Component ──────────────────────────────────────────────────────
function PWASystem() {
  const { showInstallModal, isIOS, canInstall, needRefresh, promptInstall, applyUpdate } = usePWA();
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [downloadDone, setDownloadDone] = useState(() =>
    localStorage.getItem('pwa_assets_downloaded') === 'true'
  );

  // Após instalar, perguntar se quer baixar assets
  useEffect(() => {
    if (!showInstallModal && !downloadDone) {
      const timer = setTimeout(() => setShowDownloadModal(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [showInstallModal, downloadDone]);

  const handleDownloadComplete = () => {
    localStorage.setItem('pwa_assets_downloaded', 'true');
    setDownloadDone(true);
    setShowDownloadModal(false);
  };

  const handleSkipDownload = () => {
    setShowDownloadModal(false);
  };

  return (
    <>
      {/* Modal de instalação obrigatório no mobile */}
      {showInstallModal && (
        <InstallModal
          isIOS={isIOS}
          canInstall={canInstall}
          onInstall={promptInstall}
        />
      )}

      {/* Modal de download de assets */}
      {!showInstallModal && showDownloadModal && (
        <AssetDownloadModal
          onComplete={handleDownloadComplete}
          onSkip={handleSkipDownload}
        />
      )}

      {/* Banner de atualização disponível */}
      {needRefresh && (
        <div style={updateBannerStyle}>
          <span style={{ fontSize: 13, color: '#e0e8ff' }}>🔄 Nova versão disponível!</span>
          <button
            id="pwa-update-btn"
            onClick={applyUpdate}
            style={updateBtnStyle}
          >
            Atualizar
          </button>
        </div>
      )}
    </>
  );
}

const updateBannerStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 16,
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 99997,
  display: 'flex',
  alignItems: 'center',
  gap: 16,
  background: 'linear-gradient(135deg, #1a1a3a, #0e0e22)',
  border: '1px solid rgba(100,150,255,0.4)',
  borderRadius: 12,
  padding: '12px 20px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
  whiteSpace: 'nowrap',
};

const updateBtnStyle: React.CSSProperties = {
  padding: '6px 16px',
  background: 'linear-gradient(135deg, #1565c0, #1976d2)',
  border: 'none',
  borderRadius: 8,
  color: '#fff',
  fontSize: 13,
  fontWeight: 700,
  cursor: 'pointer',
};
