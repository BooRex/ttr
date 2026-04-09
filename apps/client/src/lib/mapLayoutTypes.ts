export type Point = { x: number; y: number };
export type LabelOffset = { dx: number; dy: number };
export type LandPolygon = Point[];

export type MapLayout = {
  board: { width: number; height: number };
  cityPoints: Record<string, Point>;
  cityLabelOffsets?: Record<string, LabelOffset>;
  landPolygons?: LandPolygon[];
  backgroundSvg?: string;
  /** Natural dimensions of the SVG file (viewBox width/height) */
  backgroundSvgSize?: { width: number; height: number };
  /** How much to shift the SVG image to align with board coordinates.
   *  Board origin (0,0) corresponds to SVG point (offset.x, offset.y). */
  backgroundOffset?: { x: number; y: number };
};

