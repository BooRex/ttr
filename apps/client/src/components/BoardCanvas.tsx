import { useEffect, useMemo, useRef, useState } from "react";
import { Circle, Group, Image as KonvaImage, Layer, Line, Rect, Stage, Text } from "react-konva";
import type Konva from "konva";
import type { Route } from "@ttr/shared";
import { PLAYER_COLORS, ROUTE_COLOR } from "../lib/colors";
import { cityLabel, type Lang } from "../lib/i18n";
import { MAP_LAYOUTS } from "../lib/mapLayouts";

type Point = { x: number; y: number };

const PAN_MARGIN = 20;

/** Compute Konva dash pattern so N wagon-slot segments fill the route exactly */
const wagondash = (from: Point, to: Point, length: number): number[] => {
  if (length <= 1) return []; // solid for length-1 routes
  const dist = Math.hypot(to.x - from.x, to.y - from.y);
  const slot = dist / length;
  return [slot * 0.74, slot * 0.26];
};

const routeStroke = (route: Route, ownerIdx: number): string => {
  if (route.ownerSessionToken) {
    return PLAYER_COLORS[ownerIdx % PLAYER_COLORS.length] ?? "#f97316";
  }
  return ROUTE_COLOR[route.color] ?? ROUTE_COLOR.gray;
};

const sameRoutePair = (a: Route, b: Route): boolean => (
  (a.from === b.from && a.to === b.to) || (a.from === b.to && a.to === b.from)
);

const makeSegmentPoints = (
  from: Point,
  to: Point,
  offset: number,
  trimStart = 0,
  trimEnd = 0,
): number[] => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy) || 1;
  const ux = dx / dist;
  const uy = dy / dist;
  const px = -uy;
  const py = ux;

  const startX = from.x + px * offset + ux * trimStart;
  const startY = from.y + py * offset + uy * trimStart;
  const endX = to.x + px * offset - ux * trimEnd;
  const endY = to.y + py * offset - uy * trimEnd;
  return [startX, startY, endX, endY];
};

type Props = {
  mapId: string;
  lang: Lang;
  routes: Route[];
  players: { sessionToken: string }[];
  selectedRouteId: string;
  highlightOwnerSessionToken?: string | null;
  highlightRouteIds?: string[];
  highlightCityNames?: string[];
  onSelectRoute: (routeId: string) => void;
};

export const BoardCanvas = ({
  mapId,
  lang,
  routes,
  players,
  selectedRouteId,
  highlightOwnerSessionToken,
  highlightRouteIds,
  highlightCityNames,
  onSelectRoute,
}: Props) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stageRef     = useRef<Konva.Stage | null>(null);
  const pinchLastDist = useRef<number | null>(null);
  const prevOwners = useRef<Map<string, string | undefined>>(new Map());
  const animStartMs = useRef<number>(0);

  const [size,     setSize]     = useState({ w: 360, h: 320 });
  const [scale,    setScale]    = useState(0.3);
  const [pos,      setPos]      = useState({ x: 0, y: 0 });
  const [hoveredId, setHovered] = useState<string | null>(null);
  const [animRouteId, setAnimRouteId] = useState<string | null>(null);
  const [animNowMs, setAnimNowMs] = useState<number>(0);
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);

  const layout = MAP_LAYOUTS[mapId] ?? MAP_LAYOUTS.usa;
  const BOARD_W = layout.board.width;
  const BOARD_H = layout.board.height;
  const CITY_POINTS = layout.cityPoints;
  const CITY_LABEL_OFFSETS = layout.cityLabelOffsets ?? {};
  const CITIES = Object.entries(CITY_POINTS);
  const highlightedRouteSet = useMemo(() => new Set(highlightRouteIds ?? []), [highlightRouteIds]);
  const highlightedCitySet = useMemo(() => new Set(highlightCityNames ?? []), [highlightCityNames]);

  useEffect(() => {
    if (!layout.backgroundSvg) {
      setBgImage(null);
      return;
    }
    const image = new window.Image();
    image.decoding = "async";
    image.src = layout.backgroundSvg;
    image.onload = () => setBgImage(image);
    image.onerror = () => setBgImage(null);
  }, [layout.backgroundSvg]);

  const clampPos = (x: number, y: number, nextScale = scale): { x: number; y: number } => {
    const boardW = BOARD_W * nextScale;
    const boardH = BOARD_H * nextScale;

    const xMin = boardW + PAN_MARGIN * 2 <= size.w
      ? (size.w - boardW) / 2
      : size.w - boardW - PAN_MARGIN;
    const xMax = boardW + PAN_MARGIN * 2 <= size.w
      ? (size.w - boardW) / 2
      : PAN_MARGIN;

    const yMin = boardH + PAN_MARGIN * 2 <= size.h
      ? (size.h - boardH) / 2
      : size.h - boardH - PAN_MARGIN;
    const yMax = boardH + PAN_MARGIN * 2 <= size.h
      ? (size.h - boardH) / 2
      : PAN_MARGIN;

    return {
      x: Math.max(xMin, Math.min(x, xMax)),
      y: Math.max(yMin, Math.min(y, yMax)),
    };
  };

  // Fit board to container; re-fit on resize / orientation change
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w < 1 || h < 1) return;
      setSize({ w, h });
      const fit = Math.min(w / BOARD_W, h / BOARD_H) * 0.97;
      setScale(fit);
      setPos(clampPos((w - BOARD_W * fit) / 2, (h - BOARD_H * fit) / 2, fit));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [BOARD_H, BOARD_W]);

  useEffect(() => {
    const next = new Map<string, string | undefined>();
    for (const route of routes) {
      const prev = prevOwners.current.get(route.id);
      if (!prev && route.ownerSessionToken) {
        setAnimRouteId(route.id);
        animStartMs.current = performance.now();
      }
      next.set(route.id, route.ownerSessionToken);
    }
    prevOwners.current = next;
  }, [routes]);

  useEffect(() => {
    if (!animRouteId) return;
    let raf = 0;
    const tick = () => {
      const now = performance.now();
      setAnimNowMs(now);
      if (now - animStartMs.current > 950) {
        setAnimRouteId(null);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animRouteId]);

  const clamp = (v: number) => Math.max(0.22, Math.min(v, 3));

  const onWheel = (evt: Konva.KonvaEventObject<WheelEvent>) => {
    evt.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;
    const old  = stage.scaleX();
    const ptr  = stage.getPointerPosition();
    if (!ptr) return;
    const next = clamp(old * (evt.evt.deltaY < 0 ? 1.09 : 0.92));
    const nextPos = clampPos(
      ptr.x - ((ptr.x - stage.x()) / old) * next,
      ptr.y - ((ptr.y - stage.y()) / old) * next,
      next,
    );
    setScale(next);
    setPos(nextPos);
  };

  const onTouchMove = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const touches = stage.getPointersPositions();
    if (touches.length !== 2) { pinchLastDist.current = null; return; }
    const [a, b] = touches as [{ x: number; y: number }, { x: number; y: number }];
    const dist = Math.hypot(a.x - b.x, a.y - b.y);
    if (!pinchLastDist.current) { pinchLastDist.current = dist; return; }
    const nextScale = clamp(scale * (dist / (pinchLastDist.current as number)));
    setScale(nextScale);
    setPos((p) => clampPos(p.x, p.y, nextScale));
    pinchLastDist.current = dist;
  };

  // Cities that belong to the currently hovered route
  const hoveredRoute = routes.find(r => r.id === hoveredId);
  const hotCities = new Set<string>([
    ...(hoveredRoute ? [hoveredRoute.from, hoveredRoute.to] : []),
    ...highlightedCitySet,
  ]);

  const parallelOffsets = useMemo(() => {
    const map = new Map<string, number>();
    for (const route of routes) {
      const siblings = routes
        .filter((candidate) => sameRoutePair(candidate, route))
        .sort((a, b) => a.id.localeCompare(b.id));
      const index = siblings.findIndex((candidate) => candidate.id === route.id);
      const offset = siblings.length > 1 ? (index - (siblings.length - 1) / 2) * 10 : 0;
      map.set(route.id, offset);
    }
    return map;
  }, [routes]);

  return (
    <div className="board-card" ref={containerRef}>
      <Stage
        ref={stageRef}
        width={size.w}
        height={size.h}
        draggable
        scaleX={scale}
        scaleY={scale}
        x={pos.x}
        y={pos.y}
        onDragMove={e => {
          const clamped = clampPos(e.target.x(), e.target.y());
          e.target.x(clamped.x);
          e.target.y(clamped.y);
        }}
        onDragEnd={e => {
          const clamped = clampPos(e.target.x(), e.target.y());
          setPos(clamped);
        }}
        onWheel={onWheel}
        onTouchMove={onTouchMove}
      >
        <Layer listening={false}>
          {/* Background map: prefer SVG for realistic Europe, fallback to lightweight land/sea */}
          {bgImage ? (
            <KonvaImage
              image={bgImage}
              x={-(layout.backgroundOffset?.x ?? 0)}
              y={-(layout.backgroundOffset?.y ?? 0)}
              width={layout.backgroundSvgSize?.width ?? BOARD_W}
              height={layout.backgroundSvgSize?.height ?? BOARD_H}
              listening={false}
            />
          ) : (
            <>
              <Rect x={0} y={0} width={BOARD_W} height={BOARD_H} fill="#0b1e36" />
              {layout.landPolygons.map((poly, i) => (
                <Line
                  key={`land-${i}`}
                  points={poly.flatMap((p) => [p.x, p.y])}
                  fill="#265d37"
                  stroke="#7b8f5b"
                  strokeWidth={2}
                  opacity={0.9}
                  closed
                />
              ))}
            </>
          )}
        </Layer>

        <Layer>
          {/* ── Routes ── */}
          {routes.map(route => {
            const from = CITY_POINTS[route.from];
            const to   = CITY_POINTS[route.to];
            if (!from || !to) return null;

            const ownerIdx = route.ownerSessionToken
              ? players.findIndex(p => p.sessionToken === route.ownerSessionToken)
              : -1;

            const isSelected  = route.id === selectedRouteId;
            const isHovered   = route.id === hoveredId;
            const isOwned     = Boolean(route.ownerSessionToken);
            const stroke      = routeStroke(route, ownerIdx);
            const dash        = wagondash(from, to, route.length);
            const routeOffset = parallelOffsets.get(route.id) ?? 0;
            const points = makeSegmentPoints(
              from,
              to,
              routeOffset,
              !isOwned && route.length === 1 ? 11 : 0,
              !isOwned && route.length === 1 ? 11 : 0,
            );
            const isFocusedByPlayer = Boolean(highlightOwnerSessionToken) && route.ownerSessionToken === highlightOwnerSessionToken;
            const isDimmedByPlayer = Boolean(highlightOwnerSessionToken) && route.ownerSessionToken !== highlightOwnerSessionToken;
            const isFocusedByDestination = highlightedRouteSet.has(route.id);
            const isRelatedToHighlightedCity = highlightedCitySet.has(route.from) || highlightedCitySet.has(route.to);
            const isClaimAnim = route.id === animRouteId;
            const animProgress = isClaimAnim
              ? Math.max(0, Math.min((animNowMs - animStartMs.current) / 900, 1))
              : 0;

            return (
              <Group key={route.id}>
                <Line
                  points={points}
                  stroke={stroke}
                  strokeWidth={isSelected ? 12 : isHovered || isFocusedByPlayer || isFocusedByDestination ? 10 : 7}
                  hitStrokeWidth={30}
                  perfectDrawEnabled={false}
                  lineCap="butt"
                  lineJoin="round"
                  dash={isOwned && !isClaimAnim ? [] : dash}
                  opacity={
                    isDimmedByPlayer
                      ? 0.18
                      : isClaimAnim
                        ? 1 - animProgress * 0.75
                        : isFocusedByDestination
                          ? 1
                          : isRelatedToHighlightedCity
                            ? 0.88
                        : isOwned
                          ? 1
                          : isHovered || isFocusedByPlayer
                            ? 0.95
                            : 0.72
                  }
                  shadowColor={isSelected ? "#fff" : isHovered || isFocusedByPlayer || isFocusedByDestination ? stroke : undefined}
                  shadowBlur={isSelected ? 10 : isHovered || isFocusedByPlayer || isFocusedByDestination ? 8 : 0}
                  onClick={() => onSelectRoute(route.id)}
                  onTap={() => onSelectRoute(route.id)}
                  onMouseEnter={() => setHovered(route.id)}
                  onMouseLeave={() => setHovered(null)}
                />
                {isClaimAnim && (
                  <Line
                    points={points}
                    stroke={stroke}
                    strokeWidth={11}
                    perfectDrawEnabled={false}
                    lineCap="round"
                    lineJoin="round"
                    opacity={0.25 + animProgress * 0.75}
                    shadowColor="#fff"
                    shadowBlur={8 + animProgress * 14}
                    dash={[]}
                    listening={false}
                  />
                )}
              </Group>
            );
          })}
        </Layer>

        <Layer listening={false}>
          {/* ── Cities — draw after routes so they're on top ── */}
          {CITIES.map(([name, pt]) => {
            const hot = hotCities.has(name);
            return (
              <Circle
                key={name}
                x={pt.x}
                y={pt.y}
                radius={hot ? 9 : 6.5}
                fill={hot ? "#fde047" : "#f8fafc"}
                stroke={hot ? "#ca8a04" : "#0f172a"}
                strokeWidth={hot ? 2.5 : 2}
                shadowColor={hot ? "#fde047" : undefined}
                shadowBlur={hot ? 12 : 0}
              />
            );
          })}

          {/* City labels */}
          {CITIES.map(([name, pt]) => {
            const hot = hotCities.has(name);
            return (
              <Text
                key={`${name}-lbl`}
                x={pt.x + (CITY_LABEL_OFFSETS[name]?.dx ?? 10)}
                y={pt.y + (CITY_LABEL_OFFSETS[name]?.dy ?? -7)}
                text={cityLabel(lang, name)}
                fontSize={20}
                fontStyle="bold"
                fill="#000"
                stroke="#fff"
                strokeWidth={0.1}
                perfectDrawEnabled={false}
              />
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
};
