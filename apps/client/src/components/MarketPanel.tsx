import type { CardColor, GameState } from "@ttr/shared";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CardChip } from "./CardChip";
import { t, type Lang } from "../lib/i18n";

type OpenCardSlotProps = {
  index: number;
  color: CardColor;
  isHidden: boolean;
  disabled: boolean;
  onPick: (index: number, color: CardColor) => void;
  onSetRef: (index: number, el: HTMLDivElement | null) => void;
};

const OpenCardSlot = memo(({ index, color, isHidden, disabled, onPick, onSetRef }: OpenCardSlotProps) => {
  const setRef = useCallback((el: HTMLDivElement | null) => {
    onSetRef(index, el);
  }, [index, onSetRef]);

  const handleClick = useCallback(() => {
    onPick(index, color);
  }, [index, color, onPick]);

  return (
    <div
      data-open-card-color={color}
      data-open-card-index={index}
      className="h-full w-full"
      ref={setRef}
    >
      {isHidden ? (
        <div className="open-card-empty-slot" aria-hidden="true" />
      ) : (
        <CardChip
          color={color}
          size="panel"
          fluid
          disabled={disabled}
          onClick={handleClick}
        />
      )}
    </div>
  );
});

type Props = {
  game: GameState;
  lang: Lang;
  isMyTurn: boolean;
  canAct: boolean;
  onDeckDrawFxStart?: () => void;
  onOpenCardDrawFxStart?: (index: number, color: CardColor) => void;
  onDrawCard: (index?: number) => void;
};

export const MarketPanel = ({ game, lang, isMyTurn, canAct, onDeckDrawFxStart, onOpenCardDrawFxStart, onDrawCard }: Props) => {
  const OPEN_REFILL_START_DELAY_MS = 30;
  const OPEN_WAIT_FOR_PICK_ANIMATION_MS = 640;
  const OPEN_REFILL_FLY_MS = 620;
  const OPEN_REFILL_CLEANUP_BUFFER_MS = 80;

  type OpenRefillFx = {
    id: number;
    index: number;
    color: CardColor;
    startX: number;
    startY: number;
    targetX: number;
    targetY: number;
    w: number;
    h: number;
    active: boolean;
  };

  const drawInProgress = game.turnActionState.action === "draw_cards";
  const disabledAll = !isMyTurn || !canAct || game.finished || Boolean(game.pendingDestinationChoice);
  const [displayOpenColors, setDisplayOpenColors] = useState<CardColor[]>(
    game.openCards.map((card) => card.color as CardColor),
  );
  const [hiddenOpenSlots, setHiddenOpenSlots] = useState<number[]>([]);
  const [openRefillFx, setOpenRefillFx] = useState<OpenRefillFx[]>([]);
  const deckBtnRef = useRef<HTMLButtonElement | null>(null);
  const slotRefs = useRef<Array<HTMLDivElement | null>>([]);
  const processedOpenEventIdsRef = useRef<Set<string>>(new Set());
  const openEventHydratedRef = useRef(false);
  const pendingOpenEventsRef = useRef<Array<{ index: number; replacementColor?: CardColor }>>([]);
  const hydratedRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  const runOpenRefillAnimation = useCallback((targetIndex: number, color: CardColor) => {
    const deckBtn = deckBtnRef.current;
    const slotEl = slotRefs.current[targetIndex];
    if (!deckBtn || !slotEl) return;

    const deckRect = deckBtn.getBoundingClientRect();
    const slotRect = slotEl.getBoundingClientRect();
    const w = Math.max(30, Math.min(54, Math.round(slotRect.width * 0.62)));
    const h = Math.round(w * 1.5);
    const startX = deckRect.left + (deckRect.width - w) / 2;
    const startY = deckRect.top - h - 6;
    const targetX = slotRect.left + (slotRect.width - w) / 2;
    const targetY = slotRect.top + (slotRect.height - h) / 2;
    const id = Date.now() + targetIndex;

    setHiddenOpenSlots((prev) => (prev.includes(targetIndex) ? prev : [...prev, targetIndex]));

    const startAfterPickTimer = window.setTimeout(() => {
      setOpenRefillFx((prev) => ([
        ...prev,
        {
          id,
          index: targetIndex,
          color,
          startX,
          startY,
          targetX,
          targetY,
          w,
          h,
          active: false,
        },
      ]));

      const rafTimer = window.setTimeout(() => {
        setOpenRefillFx((prev) => prev.map((fx) => (fx.id === id ? { ...fx, active: true } : fx)));
      }, OPEN_REFILL_START_DELAY_MS);
      timersRef.current.push(rafTimer);
    }, OPEN_WAIT_FOR_PICK_ANIMATION_MS);
    timersRef.current.push(startAfterPickTimer);

    const finishTimer = window.setTimeout(() => {
      setOpenRefillFx((prev) => prev.filter((fx) => fx.id !== id));
      setHiddenOpenSlots((prev) => prev.filter((slotIdx) => slotIdx !== targetIndex));
    }, OPEN_WAIT_FOR_PICK_ANIMATION_MS + OPEN_REFILL_FLY_MS + OPEN_REFILL_CLEANUP_BUFFER_MS);
    timersRef.current.push(finishTimer);
  }, [OPEN_REFILL_CLEANUP_BUFFER_MS, OPEN_REFILL_FLY_MS, OPEN_REFILL_START_DELAY_MS, OPEN_WAIT_FOR_PICK_ANIMATION_MS]);

  useEffect(() => {
    type DrawCardEvent = Extract<GameState["events"][number], { type: "draw_card" }>;
    const openEvents = (game.events ?? []).filter(
      (event): event is DrawCardEvent => (
        event.type === "draw_card" && event.from === "open"
      ),
    );

    if (!openEventHydratedRef.current) {
      processedOpenEventIdsRef.current = new Set(openEvents.map((event) => event.id));
      openEventHydratedRef.current = true;
      return;
    }

    for (const event of openEvents) {
      if (processedOpenEventIdsRef.current.has(event.id)) continue;
      processedOpenEventIdsRef.current.add(event.id);
      if (typeof event.openIndex === "number") {
        pendingOpenEventsRef.current.push({
          index: event.openIndex,
          replacementColor: event.replacementColor,
        });
      }
    }
  }, [game.events]);

  const setSlotRef = useCallback((index: number, el: HTMLDivElement | null) => {
    slotRefs.current[index] = el;
  }, []);

  const handlePickOpenCard = useCallback((index: number, color: CardColor) => {
    onOpenCardDrawFxStart?.(index, color);
    onDrawCard(index);
  }, [onDrawCard, onOpenCardDrawFxStart]);

  const openCardSlots = useMemo(() => {
    return displayOpenColors.map((color, i) => (
      <OpenCardSlot
        key={i}
        index={i}
        color={color}
        isHidden={hiddenOpenSlots.includes(i)}
        disabled={disabledAll || drawInProgress}
        onPick={handlePickOpenCard}
        onSetRef={setSlotRef}
      />
    ));
  }, [displayOpenColors, drawInProgress, disabledAll, handlePickOpenCard, hiddenOpenSlots, setSlotRef]);

  useEffect(() => {
    return () => {
      for (const id of timersRef.current) {
        window.clearTimeout(id);
      }
      timersRef.current = [];
    };
  }, []);

  useEffect(() => {
    const serverColors = game.openCards.map((card) => card.color as CardColor);

    if (!hydratedRef.current) {
      setDisplayOpenColors(serverColors);
      hydratedRef.current = true;
      return;
    }

    const pending = [...pendingOpenEventsRef.current];
    pendingOpenEventsRef.current = [];
    if (pending.length === 0) {
      return;
    }

    setDisplayOpenColors((prev) => {
      const next = [...prev];
      for (const ev of pending) {
        if (ev.index < 0 || ev.index >= next.length) continue;
        const replacementColor = ev.replacementColor ?? serverColors[ev.index] ?? serverColors[serverColors.length - 1];
        if (!replacementColor) continue;
        next[ev.index] = replacementColor;
      }
      return next;
    });

    for (const ev of pending) {
      if (ev.index < 0 || ev.index >= serverColors.length) continue;
      const replacementColor = ev.replacementColor ?? serverColors[ev.index] ?? serverColors[serverColors.length - 1];
      if (!replacementColor) continue;
      runOpenRefillAnimation(ev.index, replacementColor);
    }
  }, [game.openCards, runOpenRefillAnimation]);

  return (
    <div className="grid grid-cols-6 auto-rows-fr gap-2 h-full" data-open-market-anchor="true">
        {openCardSlots}

        <button
          type="button"
          onClick={() => {
            onDeckDrawFxStart?.();
            onDrawCard();
          }}
          disabled={disabledAll}
          ref={deckBtnRef}
          data-draw-deck-btn="true"
          className={[
            "relative flex flex-col items-center justify-center overflow-visible",
            "w-full h-full min-h-16 rounded-xl border-[3px] border-slate-600",
            "bg-slate-800 text-slate-200 font-bold select-none",
            "transition-all duration-100 cursor-pointer",
            "active:scale-90 disabled:opacity-40 disabled:cursor-default",
            "hover:border-slate-400",
          ].join(" ")}
          style={{ boxShadow: "rgb(41 41 41) 2px 2px 0px, rgb(66 66 66) 4px 4px 0px" }}
          title={t(lang, "ui.drawDeck")}
        >
          {!drawInProgress && !disabledAll && (
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2  text-white text-[16px] font-black rounded-full w-5 h-5 flex items-center justify-center leading-none">
              ×2
            </span>
          )}
        </button>

        {openRefillFx.length > 0 && (
          <div className="open-refill-fx-layer" aria-hidden="true">
            {openRefillFx.map((fx) => {
              const dx = fx.targetX - fx.startX;
              const dy = fx.targetY - fx.startY;
              return (
                <span
                  key={fx.id}
                  className={["open-refill-fx-card", fx.active ? "active" : ""].join(" ")}
                  style={{
                    left: `${fx.startX}px`,
                    top: `${fx.startY}px`,
                    width: `${fx.w}px`,
                    height: `${fx.h}px`,
                    transform: fx.active
                      ? `translate(${dx}px, ${dy}px) scale(0.96)`
                      : "translate(0,0) scale(1)",
                    background: "linear-gradient(160deg,#1e293b,#0f172a)",
                    borderColor: "#475569",
                    color: "#e2e8f0",
                  }}
                />
              );
            })}
          </div>
        )}
    </div>
  );
};
