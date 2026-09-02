import { type ItemDef } from '../game/items';

interface ItemIconProps {
  item?: ItemDef | null;
  wingType?: string;
  size?: number;
  className?: string;
  fallbackIcon?: string;
}

export default function ItemIcon({
  item,
  wingType,
  size = 32,
  className = '',
  fallbackIcon = '📦',
}: ItemIconProps) {
  const currentWingType = item?.wingType || wingType;

  // 1. Wings item (render single front-facing cropped frame)
  if (item?.slotType === 'wings' || currentWingType) {
    const isAngelic = currentWingType === 'angelic' || item?.id === 'wing_angelic';

    if (isAngelic) {
      return (
        <div
          className={`item-icon-wing angelic ${className}`}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            backgroundImage: "url('/assets/itens/asas angelicais.webp')",
            backgroundSize: '200% 200%',
            backgroundPosition: '0% 100%', // Frame frontal (down)
            backgroundRepeat: 'no-repeat',
            imageRendering: 'pixelated',
            flexShrink: 0,
            filter: 'drop-shadow(0 0 6px rgba(250, 204, 21, 0.6))',
          }}
        />
      );
    }

    if (currentWingType === 'thunder' || item?.id === 'wing_thunder') {
      return (
        <div
          className={`item-icon-wing thunder ${className}`}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            backgroundImage: "url('/assets/itens/asas angelicais.webp')",
            backgroundSize: '200% 200%',
            backgroundPosition: '0% 100%',
            backgroundRepeat: 'no-repeat',
            imageRendering: 'pixelated',
            flexShrink: 0,
            filter: 'hue-rotate(180deg) drop-shadow(0 0 6px rgba(56, 189, 248, 0.8))',
          }}
        />
      );
    }

    return (
      <span className={`item-icon-emoji ${className}`} style={{ fontSize: `${Math.round(size * 0.7)}px` }}>
        🪽
      </span>
    );
  }

  // 2. Regular item with image (non-spritesheet)
  if (item?.image) {
    return (
      <img
        src={item.image}
        alt={item.name}
        className={`item-icon-img ${className}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          objectFit: 'contain',
          flexShrink: 0,
        }}
      />
    );
  }

  // 3. Item with emoji icon
  if (item?.icon) {
    return (
      <span
        className={`item-icon-emoji ${className}`}
        style={{ fontSize: `${Math.round(size * 0.68)}px`, lineHeight: 1 }}
      >
        {item.icon}
      </span>
    );
  }

  // 4. Fallback
  return (
    <span
      className={`item-icon-emoji fallback ${className}`}
      style={{ fontSize: `${Math.round(size * 0.6)}px`, opacity: 0.35 }}
    >
      {fallbackIcon}
    </span>
  );
}
