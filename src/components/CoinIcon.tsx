import {
  type CoinType,
  COIN_CONFIGS,
  getCoinFrameIndex,
  formatCompactCurrency,
  formatGoldNumber,
} from '../game/currency';

interface CoinIconProps {
  type: CoinType;
  amount?: number;
  size?: number;
  showAmount?: boolean;
  className?: string;
}

export default function CoinIcon({
  type,
  amount = 1,
  size = 24,
  showAmount = false,
  className = '',
}: CoinIconProps) {
  const config = COIN_CONFIGS[type];
  const frameIndex = getCoinFrameIndex(amount);

  // Original sheet is 256x32 (8 frames of 32x32)
  const scale = size / 32;
  const sheetW = 256 * scale;
  const sheetH = 32 * scale;
  const posX = -(frameIndex * size);

  return (
    <div
      className={`coin-icon-wrapper ${className}`}
      title={`${formatGoldNumber(amount)}x ${config.name}`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
    >
      <div
        className="coin-sprite-frame"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          backgroundImage: `url('${config.imagePath}')`,
          backgroundSize: `${sheetW}px ${sheetH}px`,
          backgroundPosition: `${posX}px 0px`,
          backgroundRepeat: 'no-repeat',
          imageRendering: 'pixelated',
          flexShrink: 0,
        }}
      />
      {showAmount && (
        <span
          className="coin-amount-text"
          style={{
            fontSize: `${Math.max(10, Math.round(size * 0.45))}px`,
            fontWeight: 700,
            color: config.color,
            fontFamily: 'monospace, sans-serif',
          }}
        >
          {formatCompactCurrency(amount)}
        </span>
      )}
    </div>
  );
}
