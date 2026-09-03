import type { Direction } from './types';

export interface ItemOffsetDirectionConfig {
  x: number;
  y: number;
  scale: number;
  flipX: boolean;
  flipY: boolean;
  rotation: number;
  layer: 'in_front' | 'behind';
  opacity: number;
  visible: boolean;
}

export interface ItemOffsetConfig {
  schemaVersion?: string;
  tool?: string;
  generatedAt?: string;
  metadata?: {
    itemName?: string;
    itemId?: number;
    resolution?: number;
    yConvention?: string;
  };
  offsets: Record<Direction, ItemOffsetDirectionConfig>;
}

export const ITEM_OFFSETS: Record<string, ItemOffsetConfig> = {
  sword_gold: {
    schemaVersion: '1.2',
    tool: 'Tibia Sprite Offset Studio',
    generatedAt: '2026-09-02T21:42:20.687Z',
    metadata: {
      itemName: 'sword_gold',
      itemId: 100,
      resolution: 32,
      yConvention: 'cartesian (positive Y is up)',
    },
    offsets: {
      down: {
        x: -9,
        y: -2,
        scale: 1,
        flipX: false,
        flipY: false,
        rotation: -177,
        layer: 'behind',
        opacity: 100,
        visible: true,
      },
      up: {
        x: 10,
        y: 4,
        scale: 0.8,
        flipX: false,
        flipY: false,
        rotation: 7,
        layer: 'behind',
        opacity: 100,
        visible: true,
      },
      left: {
        x: -3,
        y: -8,
        scale: 0.8,
        flipX: true,
        flipY: false,
        rotation: -85,
        layer: 'behind',
        opacity: 100,
        visible: true,
      },
      right: {
        x: 0,
        y: -10,
        scale: 0.8,
        flipX: false,
        flipY: false,
        rotation: 97,
        layer: 'in_front',
        opacity: 100,
        visible: true,
      },
    },
  },
  gold_sword: {
    schemaVersion: '1.2',
    tool: 'Tibia Sprite Offset Studio',
    generatedAt: '2026-09-02T21:42:20.687Z',
    metadata: {
      itemName: 'sword_gold',
      itemId: 100,
      resolution: 32,
      yConvention: 'cartesian (positive Y is up)',
    },
    offsets: {
      down: {
        x: -9,
        y: -2,
        scale: 1,
        flipX: false,
        flipY: false,
        rotation: -177,
        layer: 'behind',
        opacity: 100,
        visible: true,
      },
      up: {
        x: 10,
        y: 4,
        scale: 0.8,
        flipX: false,
        flipY: false,
        rotation: 7,
        layer: 'behind',
        opacity: 100,
        visible: true,
      },
      left: {
        x: -3,
        y: -8,
        scale: 0.8,
        flipX: true,
        flipY: false,
        rotation: -85,
        layer: 'behind',
        opacity: 100,
        visible: true,
      },
      right: {
        x: 0,
        y: -10,
        scale: 0.8,
        flipX: false,
        flipY: false,
        rotation: 97,
        layer: 'in_front',
        opacity: 100,
        visible: true,
      },
    },
  },
  sword_wood: {
    schemaVersion: '1.2',
    tool: 'Tibia Sprite Offset Studio',
    generatedAt: '2026-09-02T22:00:00.000Z',
    metadata: {
      itemName: 'sword_wood',
      itemId: 101,
      resolution: 32,
      yConvention: 'cartesian (positive Y is up)',
    },
    offsets: {
      down: {
        x: -9,
        y: -2,
        scale: 1,
        flipX: false,
        flipY: false,
        rotation: -177,
        layer: 'behind',
        opacity: 100,
        visible: true,
      },
      up: {
        x: 10,
        y: 4,
        scale: 0.8,
        flipX: false,
        flipY: false,
        rotation: 7,
        layer: 'behind',
        opacity: 100,
        visible: true,
      },
      left: {
        x: -3,
        y: -8,
        scale: 0.8,
        flipX: true,
        flipY: false,
        rotation: -85,
        layer: 'behind',
        opacity: 100,
        visible: true,
      },
      right: {
        x: 0,
        y: -10,
        scale: 0.8,
        flipX: false,
        flipY: false,
        rotation: 97,
        layer: 'in_front',
        opacity: 100,
        visible: true,
      },
    },
  },
  wood_sword: {
    schemaVersion: '1.2',
    tool: 'Tibia Sprite Offset Studio',
    generatedAt: '2026-09-02T22:00:00.000Z',
    metadata: {
      itemName: 'sword_wood',
      itemId: 101,
      resolution: 32,
      yConvention: 'cartesian (positive Y is up)',
    },
    offsets: {
      down: {
        x: -9,
        y: -2,
        scale: 1,
        flipX: false,
        flipY: false,
        rotation: -177,
        layer: 'behind',
        opacity: 100,
        visible: true,
      },
      up: {
        x: 10,
        y: 4,
        scale: 0.8,
        flipX: false,
        flipY: false,
        rotation: 7,
        layer: 'behind',
        opacity: 100,
        visible: true,
      },
      left: {
        x: -3,
        y: -8,
        scale: 0.8,
        flipX: true,
        flipY: false,
        rotation: -85,
        layer: 'behind',
        opacity: 100,
        visible: true,
      },
      right: {
        x: 0,
        y: -10,
        scale: 0.8,
        flipX: false,
        flipY: false,
        rotation: 97,
        layer: 'in_front',
        opacity: 100,
        visible: true,
      },
    },
  },
};

// Aliases for Radiant Sword
ITEM_OFFSETS['sword_light'] = ITEM_OFFSETS['sword_gold'];
ITEM_OFFSETS['radiant_sword'] = ITEM_OFFSETS['sword_gold'];
