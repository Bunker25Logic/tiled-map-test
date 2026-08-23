// Tiled map types
export interface TiledChunk {
  data: number[];
  height: number;
  width: number;
  x: number;
  y: number;
}

export interface TiledObject {
  id: number;
  name: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  gid?: number;
  point?: boolean;
  opacity?: number;
  rotation?: number;
  visible?: boolean;
  capsule?: boolean;
  ellipse?: boolean;
  polygon?: Array<{ x: number; y: number }>;
  properties?: Array<{ name: string; type: string; value: unknown }>;
}

export interface TiledLayer {
  chunks?: TiledChunk[];
  data?: number[];
  objects?: TiledObject[];
  type: 'tilelayer' | 'objectgroup';
  id: number;
  name: string;
  opacity: number;
  visible: boolean;
  x: number;
  y: number;
  offsetx?: number;
  offsety?: number;
  startx?: number;
  starty?: number;
  width?: number;
  height?: number;
  draworder?: string;
}

export interface TiledTileAnimation {
  duration: number;
  tileid: number;
}

export interface TiledTileData {
  id: number;
  animation?: TiledTileAnimation[];
  properties?: Array<{ name: string; type: string; value: unknown }>;
  type?: string;
}

export interface TiledTileset {
  columns: number;
  firstgid: number;
  image?: string;
  imageheight?: number;
  imagewidth?: number;
  margin?: number;
  name: string;
  spacing?: number;
  tilecount?: number;
  tileheight: number;
  tilewidth: number;
  source?: string;
  transparentcolor?: string;
  tiles?: TiledTileData[];
}

export interface TiledMap {
  compressionlevel: number;
  height: number;
  width: number;
  infinite: boolean;
  layers: TiledLayer[];
  nextlayerid: number;
  nextobjectid: number;
  orientation: string;
  renderorder: string;
  tileheight: number;
  tilewidth: number;
  tilesets: TiledTileset[];
  type: string;
  version: string;
}

// Game types
export type Direction = 'up' | 'down' | 'left' | 'right';
export type AnimationState = 'idle' | 'walk' | 'attack' | 'dead';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
  id?: number;
  name?: string;
  ellipse?: boolean;
  capsule?: boolean;
}

export interface Vec2 {
  x: number;
  y: number;
}

export type WingType = 'none' | 'thunder' | 'angelic';
