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
    valueInSilver: 10000, // 100 Ouros = 1 Cristal
  },
};

export interface WalletCoins {
  gold?: number;
  silver?: number;
  basalt?: number;
}

/** Valor total da carteira calculado na moeda base (Prata) */
export function getTotalSilverValue(wallet: WalletCoins): number {
  return (wallet.silver || 0) + (wallet.gold || 0) * 100 + (wallet.basalt || 0) * 10000;
}

/** Valor total formatado em Ouro (com fração decimal se tiver prata) */
export function getTotalGoldValue(wallet: WalletCoins): number {
  return (wallet.gold || 0) + (wallet.basalt || 0) * 100;
}

export function formatGoldNumber(num: number): string {
  return num.toLocaleString('pt-BR');
}
