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
            backgroundImage: "url('/assets/itens/asas/asas angelicais.webp')",
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

    return (
      <span className={`item-icon-emoji ${className}`} style={{ fontSize: `${Math.round(size * 0.7)}px` }}>
        🪽
      </span>
    );
  }

  // 2. Animated 4-frame power rings
  if (item?.image && item?.frameCount === 4) {
    // Rings have transparent padding in 32x32 frames (actual sprite is ~11-13px).
    // Scaling by 1.35x makes the ring prominent, crisp, and well-sized in slots.
    const ringSize = Math.round(size * 1.35);

    return (
      <div
        className={`item-icon-animated-ring ${className}`}
        style={
          {
            '--ring-size': `${ringSize}px`,
            width: `${ringSize}px`,
            height: `${ringSize}px`,
            backgroundImage: `url('${item.image}')`,
            backgroundSize: `${ringSize * 4}px ${ringSize}px`,
            backgroundRepeat: 'no-repeat',
            imageRendering: 'pixelated',
            flexShrink: 0,
          } as React.CSSProperties
        }
      />
    );
  }

  // 3. Regular item with image (non-spritesheet)
  if (item?.image) {
    const isRadiantSword = item?.id === 'sword_light' || item?.id === 'radiant_sword';

    return (
      <img
        src={item.image}
        alt={item.name}
        className={`item-icon-img ${isRadiantSword ? 'item-icon-radiant' : ''} ${className}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          objectFit: 'contain',
          flexShrink: 0,
          filter: isRadiantSword
            ? 'drop-shadow(0 0 3px #ffffff) drop-shadow(0 0 8px rgba(255, 255, 255, 0.95)) drop-shadow(0 0 15px rgba(255, 255, 255, 0.65))'
            : undefined,
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
