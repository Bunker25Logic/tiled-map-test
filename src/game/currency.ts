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
  { name: string; shortName: string; color: string; imagePath: string; assetKey: string; valueInGold: number }
> = {
  gold: {
    name: 'Moeda de Ouro (Gold Coin)',
    shortName: 'Gold',
    color: '#facc15',
    imagePath: '/assets/itens/gold.png',
    assetKey: 'coin_gold',
    valueInGold: 1,
  },
  silver: {
    name: 'Moeda de Prata (Silver Coin)',
    shortName: 'Silver',
    color: '#cbd5e1',
    imagePath: '/assets/itens/silver.png',
    assetKey: 'coin_silver',
    valueInGold: 100,
  },
  basalt: {
    name: 'Moeda de Cristal (Basalt/Crystal Coin)',
    shortName: 'Cristal',
    color: '#38bdf8',
    imagePath: '/assets/itens/basalt.png',
    assetKey: 'coin_basalt',
    valueInGold: 10000,
  },
};
