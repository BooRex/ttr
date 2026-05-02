import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { TrainCard, CardColor } from "@ttr/shared";
import { CardChip } from "./CardChip";

type Props = {
  cards: TrainCard[];
};

export const HandCards = ({ cards }: Props) => {
  const sameOrder = (a: CardColor[], b: CardColor[]) => (
    a.length === b.length && a.every((color, idx) => color === b[idx])
  );

  const counts: Partial<Record<CardColor, number>> = {};
  for (const card of cards) {
    counts[card.color] = (counts[card.color] ?? 0) + 1;
  }

  const sorted = (Object.entries(counts) as [CardColor, number][]).sort(([, ca], [, cb]) => cb - ca);
  const sortedColors = sorted.map(([color]) => color);

  const [renderedOrder, setRenderedOrder] = useState<CardColor[]>(sortedColors);
  const reorderTimerRef = useRef<number | null>(null);
  const endSlotIndex = Math.min(renderedOrder.length, 9);

  const cardRefs = useRef<Partial<Record<CardColor, HTMLDivElement | null>>>({});
  const prevRectsRef = useRef<Partial<Record<CardColor, DOMRect>>>({});
  const prevCountsRef = useRef<Partial<Record<CardColor, number>>>({});
  const countsHydratedRef = useRef(false);

  useEffect(() => {
    if (sameOrder(renderedOrder, sortedColors)) {
      return;
    }

    const keepCurrentOrder = renderedOrder.filter((color) => sortedColors.includes(color));
    const appendNewColors = sortedColors.filter((color) => !keepCurrentOrder.includes(color));
    const preReorder = [...keepCurrentOrder, ...appendNewColors];

    if (!sameOrder(renderedOrder, preReorder)) {
      setRenderedOrder(preReorder);
    }

    if (reorderTimerRef.current !== null) {
      window.clearTimeout(reorderTimerRef.current);
    }

    reorderTimerRef.current = window.setTimeout(() => {
      setRenderedOrder(sortedColors);
      reorderTimerRef.current = null;
    }, 1000);

    return () => {
      if (reorderTimerRef.current !== null) {
        window.clearTimeout(reorderTimerRef.current);
      }
    };
  }, [renderedOrder, sortedColors]);

  const countPulseMap = useMemo(() => {
    const map: Partial<Record<CardColor, boolean>> = {};
    for (const color of renderedOrder) {
      const count = counts[color] ?? 0;
      const prevCount = prevCountsRef.current[color];
      map[color] = countsHydratedRef.current && prevCount !== undefined && prevCount !== count;
    }
    return map;
  }, [counts, renderedOrder]);

  useLayoutEffect(() => {
    const nextRects: Partial<Record<CardColor, DOMRect>> = {};

    for (const color of renderedOrder) {
      const el = cardRefs.current[color];
      if (!el) continue;
      const nextRect = el.getBoundingClientRect();
      nextRects[color] = nextRect;

      const prevRect = prevRectsRef.current[color];
      if (!prevRect) continue;

      const dx = prevRect.left - nextRect.left;
      const dy = prevRect.top - nextRect.top;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue;

      el.animate(
        [
          { transform: `translate(${dx}px, ${dy}px)` },
          { transform: "translate(0, 0)" },
        ],
        {
          duration: 300,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
        },
      );
    }

    prevRectsRef.current = nextRects;
  }, [renderedOrder]);

  useEffect(() => {
    const nextCounts: Partial<Record<CardColor, number>> = {};
    for (const [color, count] of sorted) {
      nextCounts[color] = count;
    }
    prevCountsRef.current = nextCounts;
    countsHydratedRef.current = true;
  }, [sorted]);

  useEffect(() => {
    return () => {
      if (reorderTimerRef.current !== null) {
        window.clearTimeout(reorderTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="relative h-full w-full" data-hand-cards-anchor="true">
      <div className="grid h-full w-full grid-cols-5 grid-rows-2 gap-2">
        {renderedOrder.map((color) => (
          <div
            key={color}
            data-hand-card-color={color}
            className="h-full w-full"
            ref={(el) => {
              cardRefs.current[color] = el;
            }}
          >
            <CardChip color={color} count={counts[color]} pulseCount={Boolean(countPulseMap[color])} size="panel" fluid />
          </div>
        ))}
      </div>

      {/* Hidden fixed grid to anchor animation into the "end" slot when color is absent in hand */}
      <div className="pointer-events-none absolute inset-0 grid grid-cols-5 grid-rows-2 gap-2 opacity-0" aria-hidden="true">
        {Array.from({ length: 10 }).map((_, idx) => (
          <div
            key={`anchor-end-${idx}`}
            data-hand-end-slot-anchor={idx === endSlotIndex ? "true" : undefined}
            className="h-full w-full"
          />
        ))}
      </div>
    </div>
  );
};
