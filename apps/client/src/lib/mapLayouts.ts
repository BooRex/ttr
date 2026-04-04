type Point = { x: number; y: number };
type LabelOffset = { dx: number; dy: number };
type GeoPoint = { lat: number; lon: number };
type LandPolygon = Point[];

export type MapLayout = {
  board: { width: number; height: number };
  cityPoints: Record<string, Point>;
  cityLabelOffsets?: Record<string, LabelOffset>;
  landPolygons: LandPolygon[];
  backgroundSvg?: string;
  /** Natural dimensions of the SVG file (viewBox width/height) */
  backgroundSvgSize?: { width: number; height: number };
  /** How much to shift the SVG image to align with board coordinates.
   *  Board origin (0,0) corresponds to SVG point (offset.x, offset.y). */
  backgroundOffset?: { x: number; y: number };
};

const usaCityPoints: Record<string, Point> = {
  Seattle: { x: 90, y: 80 },
  Portland: { x: 105, y: 140 },
  "San Francisco": { x: 95, y: 260 },
  "Los Angeles": { x: 120, y: 380 },
  "Las Vegas": { x: 180, y: 330 },
  "Salt Lake City": { x: 250, y: 260 },
  Phoenix: { x: 220, y: 390 },
  "Santa Fe": { x: 330, y: 355 },
  "El Paso": { x: 315, y: 460 },
  Denver: { x: 350, y: 265 },
  Helena: { x: 320, y: 170 },
  Calgary: { x: 240, y: 80 },
  Winnipeg: { x: 430, y: 110 },
  "Sault St. Marie": { x: 600, y: 135 },
  Duluth: { x: 525, y: 175 },
  Omaha: { x: 455, y: 255 },
  "Kansas City": { x: 485, y: 315 },
  "Oklahoma City": { x: 465, y: 380 },
  Dallas: { x: 485, y: 470 },
  Houston: { x: 560, y: 520 },
  "New Orleans": { x: 650, y: 510 },
  "Little Rock": { x: 560, y: 390 },
  "Saint Louis": { x: 585, y: 320 },
  Chicago: { x: 635, y: 250 },
  Pittsburgh: { x: 760, y: 255 },
  Toronto: { x: 710, y: 200 },
  Montreal: { x: 805, y: 175 },
  Boston: { x: 900, y: 175 },
  "New York": { x: 860, y: 235 },
  Washington: { x: 850, y: 290 },
  Raleigh: { x: 810, y: 350 },
  Charleston: { x: 835, y: 410 },
  Nashville: { x: 690, y: 340 },
  Atlanta: { x: 740, y: 410 },
  Miami: { x: 825, y: 585 },
};

const EUROPE_BOARD = { width: 1335, height: 872 };

// Calibrated board from City Calibrator
// All 44 cities placed with bounding box: X 85–1320, Y 476–1248
// Board size: 1335 × 872, offset: (35, 426)
//
// Game-area bounding box in SVG space: X 173–728, Y 142–561 (all 44 cities)
// Board offset (50 px padding):  svgOffsetX = 123, svgOffsetY = 92
// → Board formula: x = 274 + lon * 11.0 - 123 = 151 + lon * 11.0
//                  y = 1215 - lat * 17.9 - 92  = 1123 - lat * 17.9
const projectEurope = (geo: GeoPoint): Point => ({
  x: Math.round(151 + geo.lon * 11.0),
  y: Math.round(1123 - geo.lat * 17.9),
});

const mapGeoPath = (path: GeoPoint[]): LandPolygon => path.map(projectEurope);

const europeCityPoints: Record<string, Point> = {
  "Edinburgh": { x: 268, y: 232 },
  "London": { x: 309, y: 392 },
  "Amsterdam": { x: 410, y: 369 },
  "Bruxelles": { x: 404, y: 428 },
  "Dieppe": { x: 323, y: 449 },
  "Paris": { x: 380, y: 509 },
  "Brest": { x: 215, y: 488 },
  "Essen": { x: 485, y: 411 },
  "Frankfurt": { x: 487, y: 475 },
  "Berlin": { x: 567, y: 373 },
  "Danzig": { x: 645, y: 310 },
  "Copenhagen": { x: 558, y: 268 },
  "Stockholm": { x: 650, y: 136 },
  "Zurich": { x: 486, y: 552 },
  "Munich": { x: 560, y: 500 },
  "Vienna": { x: 644, y: 529 },
  "Budapest": { x: 720, y: 534 },
  "Warszawa": { x: 732, y: 352 },
  "Wilno": { x: 840, y: 287 },
  "Riga": { x: 775, y: 197 },
  "Petrograd": { x: 854, y: 85 },
  "Smolensk": { x: 947, y: 223 },
  "Moskva": { x: 1007, y: 151 },
  "Kyiv": { x: 943, y: 385 },
  "Kharkov": { x: 1063, y: 371 },
  "Bucharest": { x: 902, y: 595 },
  "Sofia": { x: 837, y: 668 },
  "Athina": { x: 834, y: 804 },
  "Sarajevo": { x: 720, y: 648 },
  "Zagreb": { x: 633, y: 612 },
  "Venezia": { x: 562, y: 600 },
  "Roma": { x: 568, y: 721 },
  "Brindisi": { x: 703, y: 757 },
  "Palermo": { x: 610, y: 856 },
  "Barcelona": { x: 284, y: 734 },
  "Pamplona": { x: 223, y: 665 },
  "Madrid": { x: 162, y: 748 },
  "Cadiz": { x: 96, y: 857 },
  "Lisboa": { x: 25, y: 744 },
  "Marseille": { x: 397, y: 665 },
  "Constantinople": { x: 982, y: 688 },
  "Ankara": { x: 1114, y: 693 },
  "Smyrna": { x: 971, y: 812 },
  "Erzurum": { x: 1260, y: 639 },
  "Sochi": { x: 1170, y: 520 },
  "Sevastopol": { x: 1058, y: 550 },
  "Rostov": { x: 1151, y: 432 },
};

const europeCityLabelOffsets: Record<string, LabelOffset> = {
  Edinburgh: { dx: 10, dy: -18 },
  London: { dx: -90, dy: -10 },
  Amsterdam: { dx: 12, dy: -16 },
  Bruxelles: { dx: 12, dy: 10 },
  Dieppe: { dx: 0, dy: -30 },
  Paris: { dx: -80, dy: 10 },
  Brest: { dx: -70, dy: -10 },
  Essen: { dx: 8, dy: 12 },
  Frankfurt: { dx: -60, dy: 20 },
  Berlin: { dx: -10, dy: -30 },
  Danzig: { dx: 10, dy: -18 },
  Copenhagen: { dx: 8, dy: -2 },
  Stockholm: { dx: -120, dy: -20 },
  Zurich: { dx: -55, dy: 10 },
  Munich: { dx: 5, dy: -25 },
  Vienna: { dx: -25, dy: 15 },
  Budapest: { dx: 5, dy: -30 },
  Warszawa: { dx: 10, dy: 10 },
  Wilno: { dx: 10, dy: -20 },
  Riga: { dx: 10, dy: 0 },
  Petrograd: { dx: 10, dy: -20 },
  Smolensk: { dx: 10, dy: 0 },
  Moskva: { dx: 10, dy: -10 },
  Kyiv: { dx: 10, dy: 15 },
  Kharkov: { dx: 15, dy: -20 },
  Bucharest: { dx: 10, dy: 12 },
  Sofia: { dx: 10, dy: 15 },
  Athina: { dx: -35, dy: 10 },
  Sarajevo: { dx: -40, dy: 12 },
  Zagreb: { dx: 5, dy: -30 },
  Venezia: { dx: -100, dy: 5 },
  Roma: { dx: -50, dy: 10 },
  Brindisi: { dx: -60, dy: 10 },
  Palermo: { dx: -30, dy: 15 },
  Barcelona: { dx: 8, dy: 14 },
  Pamplona: { dx: 8, dy: -18 },
  Madrid: { dx: -35, dy: -35 },
  Cadiz: { dx: 8, dy: 0 },
  Lisboa: { dx: -20, dy: 20 },
  Marseille: { dx: -100, dy: -20 },
  Constantinople: { dx: 0, dy: -30 },
  Ankara: { dx: 10, dy: 12 },
  Smyrna: { dx: 20, dy: 10 },
  Erzurum: { dx: -30, dy: 20 },
  Sochi: { dx: 10, dy: 8 },
  Sevastopol: { dx: 10, dy: -10 },
  Rostov: { dx: 20, dy: -10 },
};

const usaLand: LandPolygon[] = [
  [
    { x: 40, y: 40 },
    { x: 180, y: 40 },
    { x: 250, y: 80 },
    { x: 380, y: 60 },
    { x: 560, y: 65 },
    { x: 760, y: 90 },
    { x: 930, y: 130 },
    { x: 1050, y: 190 },
    { x: 1080, y: 280 },
    { x: 1030, y: 360 },
    { x: 930, y: 420 },
    { x: 900, y: 600 },
    { x: 780, y: 640 },
    { x: 610, y: 640 },
    { x: 460, y: 610 },
    { x: 320, y: 560 },
    { x: 220, y: 520 },
    { x: 130, y: 430 },
    { x: 70, y: 330 },
    { x: 45, y: 210 },
  ],
];

const europeLand: LandPolygon[] = [
  mapGeoPath([
    { lat: 36.1, lon: -9.8 },
    { lat: 42.5, lon: -8.8 },
    { lat: 43.8, lon: -1.5 },
    { lat: 44.1, lon: 4.5 },
    { lat: 45.9, lon: 9.8 },
    { lat: 47.9, lon: 12.8 },
    { lat: 45.7, lon: 14.5 },
    { lat: 43.8, lon: 18.4 },
    { lat: 41.2, lon: 20.4 },
    { lat: 39.2, lon: 21.8 },
    { lat: 38.2, lon: 24.8 },
    { lat: 40.2, lon: 26.8 },
    { lat: 41.1, lon: 28.9 },
    { lat: 40.4, lon: 32.0 },
    { lat: 40.1, lon: 36.5 },
    { lat: 41.7, lon: 40.5 },
    { lat: 44.0, lon: 41.2 },
    { lat: 47.5, lon: 40.4 },
    { lat: 50.5, lon: 43.5 },
    { lat: 54.5, lon: 40.0 },
    { lat: 58.4, lon: 35.0 },
    { lat: 60.6, lon: 29.0 },
    { lat: 60.2, lon: 22.0 },
    { lat: 59.8, lon: 17.0 },
    { lat: 58.0, lon: 10.0 },
    { lat: 56.0, lon: 6.0 },
    { lat: 58.0, lon: 2.0 },
    { lat: 58.2, lon: -5.0 },
    { lat: 54.5, lon: -8.0 },
    { lat: 50.8, lon: -5.0 },
    { lat: 47.8, lon: -5.0 },
    { lat: 43.5, lon: -8.5 },
  ]),
  mapGeoPath([
    { lat: 46.6, lon: 12.1 },
    { lat: 45.8, lon: 13.7 },
    { lat: 44.5, lon: 15.3 },
    { lat: 42.1, lon: 16.8 },
    { lat: 39.5, lon: 17.9 },
    { lat: 38.2, lon: 16.0 },
    { lat: 40.0, lon: 15.1 },
    { lat: 42.2, lon: 14.2 },
    { lat: 44.1, lon: 12.7 },
    { lat: 45.7, lon: 11.8 },
  ]),
  mapGeoPath([
    { lat: 38.9, lon: 12.0 },
    { lat: 38.9, lon: 15.5 },
    { lat: 37.0, lon: 15.3 },
    { lat: 36.8, lon: 12.6 },
  ]),
  mapGeoPath([
    { lat: 50.0, lon: -7.8 },
    { lat: 52.0, lon: -8.6 },
    { lat: 55.3, lon: -8.0 },
    { lat: 58.2, lon: -5.3 },
    { lat: 57.6, lon: -2.0 },
    { lat: 54.5, lon: 0.0 },
    { lat: 51.0, lon: 0.6 },
    { lat: 50.0, lon: -2.5 },
  ]),
];

export const MAP_LAYOUTS: Record<string, MapLayout> = {
  usa: {
    board: { width: 1200, height: 680 },
    cityPoints: usaCityPoints,
    landPolygons: usaLand,
  },
  europe: {
    board: EUROPE_BOARD,
    cityPoints: europeCityPoints,
    cityLabelOffsets: europeCityLabelOffsets,
    landPolygons: europeLand,
    backgroundSvg: "/assets/maps/europe.svg",
    backgroundSvgSize: { width: 1613, height: 1417 },
    backgroundOffset: { x: 70, y: 470 },
  },
};

