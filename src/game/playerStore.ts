/**
 * playerStore.ts
 * Central persistence module for player accounts and characters.
 * All data is stored in localStorage under the "tibia-explorer:" namespace.
 *
 * XP Formula — identical to OT Tibia:
 *   XP to reach level L = (50/3) * (L³ - 6L² + 17L - 12)
 */

import type { CharacterId } from './characters';
import {
  DEFAULT_EQUIPPED_GEAR,
  DEFAULT_INVENTORY_ITEMS,
  type EquippedGear,
  type ItemDef,
} from './items';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PlayerWallet {
  gold: number;
  silver: number;
  basalt: number;
}

export function getDefaultWallet(): PlayerWallet {
  return { gold: 0, silver: 0, basalt: 0 };
}

export interface PlayerCharacter {
  characterId: CharacterId;
  xp: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  wallet?: PlayerWallet;
  lastZone: string;
  lastPos: { x: number; y: number } | null;
  equippedGear?: EquippedGear;
  inventory?: ItemDef[];
  createdAt: number;
}

export interface PlayerAccount {
  name: string;
  characters: PlayerCharacter[];
  activeCharacterIndex: number;
  createdAt: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const ACCOUNTS_KEY = 'tibia-explorer:accounts';
const SESSION_KEY = 'tibia-explorer:session';
export const MAX_CHARACTERS = 2;

export const CHARACTER_BASE_STATS: Record<CharacterId, { hp: number; mp: number }> = {
  luxio:       { hp: 150, mp:  80 },
  archer:      { hp: 110, mp:  90 },
  magician:    { hp:  95, mp: 200 },
  necromancer: { hp: 105, mp: 180 },
  paladin:     { hp: 160, mp: 120 },
};

export const CHARACTER_HP_PER_LEVEL: Record<CharacterId, number> = {
  luxio:       15,
  archer:      10,
  magician:     5,
  necromancer:  8,
  paladin:     14,
};

export const CHARACTER_MP_PER_LEVEL: Record<CharacterId, number> = {
  luxio:        6,
  archer:       8,
  magician:    25,
  necromancer: 20,
  paladin:     10,
};

// ─── Tibia XP Formula ────────────────────────────────────────────────────────

export function xpRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor((50 / 3) * (level ** 3 - 6 * level ** 2 + 17 * level - 12));
}

export function getLevelFromXP(xp: number): number {
  if (xp <= 0) return 1;
  let level = 1;
  while (xpRequiredForLevel(level + 1) <= xp) {
    level++;
    if (level > 1000) break;
  }
  return level;
}

export function getLevelProgress(xp: number): number {
  const level = getLevelFromXP(xp);
  const currentLevelXP = xpRequiredForLevel(level);
  const nextLevelXP = xpRequiredForLevel(level + 1);
  const span = nextLevelXP - currentLevelXP;
  if (span <= 0) return 1;
  return Math.min(1, (xp - currentLevelXP) / span);
}

export function getXPToNextLevel(xp: number): number {
  const level = getLevelFromXP(xp);
  return xpRequiredForLevel(level + 1) - xp;
}

export function computeMaxHp(charId: CharacterId, level: number): number {
  const base = CHARACTER_BASE_STATS[charId]?.hp ?? 100;
  const perLevel = CHARACTER_HP_PER_LEVEL[charId] ?? 10;
  return base + perLevel * (level - 1);
}

export function computeMaxMp(charId: CharacterId, level: number): number {
  const base = CHARACTER_BASE_STATS[charId]?.mp ?? 50;
  const perLevel = CHARACTER_MP_PER_LEVEL[charId] ?? 5;
  return base + perLevel * (level - 1);
}

// ─── LocalStorage Helpers ────────────────────────────────────────────────────

function loadAllAccounts(): Record<string, PlayerAccount> {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, PlayerAccount>;
  } catch {
    return {};
  }
}

function saveAllAccounts(accounts: Record<string, PlayerAccount>): void {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    console.warn('[playerStore] Failed to save accounts to localStorage');
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export function getAllAccounts(): Record<string, PlayerAccount> {
  return loadAllAccounts();
}

export function loadAccount(name: string): PlayerAccount | null {
  const accounts = loadAllAccounts();
  return accounts[name.toLowerCase()] ?? null;
}

export function createAccount(name: string): PlayerAccount | null {
  const key = name.toLowerCase().trim();
  if (!key || key.length < 2 || key.length > 20) return null;
  const accounts = loadAllAccounts();
  if (accounts[key]) return null;
  const account: PlayerAccount = {
    name: name.trim(),
    characters: [],
    activeCharacterIndex: 0,
    createdAt: Date.now(),
  };
  accounts[key] = account;
  saveAllAccounts(accounts);
  return account;
}

export function createCharacter(
  accountName: string,
  charId: CharacterId
): PlayerAccount | null {
  const key = accountName.toLowerCase();
  const accounts = loadAllAccounts();
  const account = accounts[key];
  if (!account) return null;
  if (account.characters.length >= MAX_CHARACTERS) return null;
  const maxHp = computeMaxHp(charId, 1);
  const maxMp = computeMaxMp(charId, 1);
  const newChar: PlayerCharacter = {
    characterId: charId,
    xp: 0,
    hp: maxHp,
    maxHp,
    mp: maxMp,
    maxMp,
    wallet: getDefaultWallet(),
    lastZone: 'map1',
    lastPos: null,
    equippedGear: { ...DEFAULT_EQUIPPED_GEAR },
    inventory: DEFAULT_INVENTORY_ITEMS.map((it) => ({ ...it })),
    createdAt: Date.now(),
  };
  account.characters.push(newChar);
  account.activeCharacterIndex = account.characters.length - 1;
  accounts[key] = account;
  saveAllAccounts(accounts);
  return account;
}

export function saveAccount(account: PlayerAccount): void {
  const accounts = loadAllAccounts();
  accounts[account.name.toLowerCase()] = account;
  saveAllAccounts(accounts);
}

export function addCoinsToCharacter(
  account: PlayerAccount,
  charIndex: number,
  coins: { gold?: number; silver?: number; basalt?: number }
): { account: PlayerAccount; wallet: PlayerWallet } {
  const char = account.characters[charIndex];
  if (!char) return { account, wallet: getDefaultWallet() };

  const currentWallet = char.wallet || getDefaultWallet();
  const wallet: PlayerWallet = {
    gold: Math.max(0, (currentWallet.gold || 0) + (coins.gold || 0)),
    silver: Math.max(0, (currentWallet.silver || 0) + (coins.silver || 0)),
    basalt: Math.max(0, (currentWallet.basalt || 0) + (coins.basalt || 0)),
  };

  // As moedas NÃO se transformam automaticamente; cada recurso é acumulado genuinamente.

  const updatedCharacters = [...account.characters];
  updatedCharacters[charIndex] = {
    ...char,
    wallet: { ...wallet },
  };
  const updatedAccount: PlayerAccount = {
    ...account,
    characters: updatedCharacters,
  };

  saveAccount(updatedAccount);
  return { account: updatedAccount, wallet: { ...wallet } };
}

export type ExchangeOperation =
  | 'silver_to_gold'
  | 'gold_to_silver'
  | 'gold_to_crystal'
  | 'crystal_to_gold'
  | 'optimize_all';

export function exchangeCharacterCoins(
  account: PlayerAccount,
  charIndex: number,
  operation: ExchangeOperation,
  count: number = 1
): { account: PlayerAccount; wallet: PlayerWallet; success: boolean; message: string } {
  const char = account.characters[charIndex];
  if (!char) return { account, wallet: getDefaultWallet(), success: false, message: 'Personagem não encontrado' };

  const currentWallet = char.wallet || getDefaultWallet();
  const wallet: PlayerWallet = {
    gold: currentWallet.gold || 0,
    silver: currentWallet.silver || 0,
    basalt: currentWallet.basalt || 0,
  };

  let success = false;
  let message = '';

  switch (operation) {
    case 'silver_to_gold': {
      // 100 Pratas = 1 Ouro
      const requiredSilver = count * 100;
      if (wallet.silver >= requiredSilver) {
        wallet.silver -= requiredSilver;
        wallet.gold += count;
        success = true;
        message = `Trocou ${requiredSilver} Pratas por ${count} Ouro(s)!`;
      } else {
        message = `Prata insuficiente. Necessário: ${requiredSilver} Pratas.`;
      }
      break;
    }
    case 'gold_to_silver': {
      // 1 Ouro = 100 Pratas
      if (wallet.gold >= count) {
        wallet.gold -= count;
        wallet.silver += count * 100;
        success = true;
        message = `Trocou ${count} Ouro(s) por ${count * 100} Pratas!`;
      } else {
        message = `Ouro insuficiente. Necessário: ${count} Ouro(s).`;
      }
      break;
    }
    case 'gold_to_crystal': {
      // 500 Ouros = 1 Cristal
      const requiredGold = count * 500;
      if (wallet.gold >= requiredGold) {
        wallet.gold -= requiredGold;
        wallet.basalt += count;
        success = true;
        message = `Trocou ${requiredGold} Ouros por ${count} Cristal(is)!`;
      } else {
        message = `Ouro insuficiente. Necessário: ${requiredGold} Ouros.`;
      }
      break;
    }
    case 'crystal_to_gold': {
      // 1 Cristal = 500 Ouros
      if (wallet.basalt >= count) {
        wallet.basalt -= count;
        wallet.gold += count * 500;
        success = true;
        message = `Trocou ${count} Cristal(is) por ${count * 500} Ouros!`;
      } else {
        message = `Cristal insuficiente. Necessário: ${count} Cristal(is).`;
      }
      break;
    }
    case 'optimize_all': {
      // Converte o máximo de prata em ouro e o máximo de ouro em cristal
      let converted = false;
      if (wallet.silver >= 100) {
        const extraGold = Math.floor(wallet.silver / 100);
        wallet.silver %= 100;
        wallet.gold += extraGold;
        converted = true;
      }
      if (wallet.gold >= 500) {
        const extraBasalt = Math.floor(wallet.gold / 500);
        wallet.gold %= 500;
        wallet.basalt += extraBasalt;
        converted = true;
      }
      if (converted) {
        success = true;
        message = 'Carteira otimizada com sucesso!';
      } else {
        message = 'Nada para converter no momento.';
      }
      break;
    }
  }

  if (success) {
    const updatedCharacters = [...account.characters];
    updatedCharacters[charIndex] = {
      ...char,
      wallet: { ...wallet },
    };
    const updatedAccount: PlayerAccount = {
      ...account,
      characters: updatedCharacters,
    };
    saveAccount(updatedAccount);
    return { account: updatedAccount, wallet: { ...wallet }, success: true, message };
  }

  return { account, wallet: { ...wallet }, success: false, message };
}

export function savePlayerWallet(
  account: PlayerAccount,
  charIndex: number,
  wallet: PlayerWallet
): void {
  const char = account.characters[charIndex];
  if (!char) return;
  char.wallet = wallet;
  saveAccount(account);
}

export function addXPToCharacter(
  account: PlayerAccount,
  charIndex: number,
  amount: number
): { account: PlayerAccount; didLevelUp: boolean; newLevel: number } {
  const char = account.characters[charIndex];
  if (!char) return { account, didLevelUp: false, newLevel: 1 };
  const oldLevel = getLevelFromXP(char.xp);
  char.xp += amount;
  const newLevel = getLevelFromXP(char.xp);
  const didLevelUp = newLevel > oldLevel;
  if (didLevelUp) {
    char.maxHp = computeMaxHp(char.characterId, newLevel);
    char.maxMp = computeMaxMp(char.characterId, newLevel);
    char.hp = char.maxHp;
    char.mp = char.maxMp;
  }
  saveAccount(account);
  return { account, didLevelUp, newLevel };
}

export function savePlayerPosition(
  account: PlayerAccount,
  charIndex: number,
  zone: string,
  pos: { x: number; y: number }
): void {
  const char = account.characters[charIndex];
  if (!char) return;
  char.lastZone = zone;
  char.lastPos = pos;
  saveAccount(account);
}

export function savePlayerGear(
  account: PlayerAccount,
  charIndex: number,
  gear: EquippedGear
): void {
  const char = account.characters[charIndex];
  if (!char) return;
  char.equippedGear = { ...gear };
  saveAccount(account);
}

export function savePlayerInventory(
  account: PlayerAccount,
  charIndex: number,
  inventory: ItemDef[]
): void {
  const char = account.characters[charIndex];
  if (!char) return;
  char.inventory = inventory.map((it) => ({ ...it }));
  saveAccount(account);
}

export function savePlayerVitals(
  account: PlayerAccount,
  charIndex: number,
  hp: number,
  mp: number
): void {
  const char = account.characters[charIndex];
  if (!char) return;
  char.hp = Math.max(0, hp);
  char.mp = Math.max(0, mp);
  saveAccount(account);
}

export interface DeathPenaltyResult {
  account: PlayerAccount;
  lostXp: number;
  oldLevel: number;
  newLevel: number;
}

export function applyDeathPenalty(
  account: PlayerAccount,
  charIndex: number
): DeathPenaltyResult {
  const char = account.characters[charIndex];
  if (!char) {
    return { account, lostXp: 0, oldLevel: 1, newLevel: 1 };
  }
  const oldLevel = getLevelFromXP(char.xp);

  // Tibia standard death penalty: lose 10% of total XP
  const lostXp = Math.floor(char.xp * 0.10);
  char.xp = Math.max(0, char.xp - lostXp);

  const newLevel = getLevelFromXP(char.xp);

  // Recalculate stats on new level if leveled down
  char.maxHp = computeMaxHp(char.characterId, newLevel);
  char.maxMp = computeMaxMp(char.characterId, newLevel);

  // Fully restore vitals at temple
  char.hp = char.maxHp;
  char.mp = char.maxMp;

  // Reset spawn to temple (map1, 0, 0)
  char.lastZone = 'map1';
  char.lastPos = { x: 0, y: 0 };

  saveAccount(account);
  return { account, lostXp, oldLevel, newLevel };
}

export function saveSession(name: string): void {
  try { localStorage.setItem(SESSION_KEY, name); } catch { /* noop */ }
}

export function loadSession(): string | null {
  try { return localStorage.getItem(SESSION_KEY); } catch { return null; }
}

export function clearSession(): void {
  try { localStorage.removeItem(SESSION_KEY); } catch { /* noop */ }
}
