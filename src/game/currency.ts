export type CoinType = 'gold' | 'silver' | 'basalt';

export function getCoinFrameIndex(count: number): number {
  if (count <= 1) return 0;
  if (count === 2) return 1;
  if (count === 3) return 2;
  if (count === 4) return 3;
  if (count < 10) return 4;
  if (count < 25) return 5;
  if (count < 50) return 6;
  return 7;
}

export const COIN_CONFIGS: Record<
  CoinType,
  { name: string; shortName: string; color: string; imagePath: string; assetKey: string; valueInSilver: number }
> = {
  silver: {
    name: 'Moeda de Prata (Silver Coin)',
    shortName: 'Prata',
    color: '#cbd5e1',
    imagePath: '/assets/itens/silver.png',
    assetKey: 'coin_silver',
    valueInSilver: 1,
  },
  gold: {
    name: 'Moeda de Ouro (Gold Coin)',
    shortName: 'Ouro',
    color: '#facc15',
    imagePath: '/assets/itens/gold.png',
    assetKey: 'coin_gold',
    valueInSilver: 100, // 100 Pratas = 1 Ouro
  },
  basalt: {
    name: 'Moeda de Cristal (Crystal Coin)',
    shortName: 'Cristal',
    color: '#38bdf8',
    imagePath: '/assets/itens/basalt.png',
    assetKey: 'coin_basalt',
    valueInSilver: 50000, // 500 Ouros = 1 Cristal (50.000 Pratas)
  },
};

export interface WalletCoins {
  gold?: number;
  silver?: number;
  basalt?: number;
}

/** Valor total da carteira calculado na moeda base (Prata) */
export function getTotalSilverValue(wallet: WalletCoins): number {
  return (wallet.silver || 0) + (wallet.gold || 0) * 100 + (wallet.basalt || 0) * 50000;
}

/** Valor total formatado em Ouro (com fração decimal se tiver prata) */
export function getTotalGoldValue(wallet: WalletCoins): number {
  return (wallet.gold || 0) + (wallet.basalt || 0) * 500;
}

export function formatGoldNumber(num: number): string {
  return num.toLocaleString('pt-BR');
}

/**
 * Formata quantidades de moedas no estilo Tibia/RPG dinâmico:
 * - < 1.000: número exato (ex: 20, 850)
 * - >= 1.000 e < 100.000: formato 'k' (ex: 1k, 1.3k, 25k)
 * - >= 100.000 e < 1.000.000: formato 'kk' (ex: 100.000 -> 1kk, 250.000 -> 2.5kk)
 * - >= 1.000.000: formato 'm' (ex: 1.000.000 -> 1m, 1.500.000 -> 1.5m)
 */
export function formatCompactCurrency(num: number): string {
  if (!num || num <= 0) return '0';
  if (num < 1_000) {
    return Math.floor(num).toString();
  }
  if (num < 100_000) {
    const k = num / 1_000;
    const formatted = k >= 10 ? Math.floor(k).toString() : (Math.floor(k * 10) / 10).toFixed(1).replace('.0', '');
    return `${formatted}k`;
  }
  if (num < 1_000_000) {
    const kk = num / 100_000;
    const formatted = kk >= 10 ? Math.floor(kk).toString() : (Math.floor(kk * 10) / 10).toFixed(1).replace('.0', '');
    return `${formatted}kk`;
  }
  const m = num / 1_000_000;
  const formatted = m >= 10 ? Math.floor(m).toString() : (Math.floor(m * 10) / 10).toFixed(1).replace('.0', '');
  return `${formatted}m`;
}
