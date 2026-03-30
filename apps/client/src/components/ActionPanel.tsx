import type { CardColor, DestinationCard, GameState, Player, TrainCard } from "@ttr/shared";
import type { PendingDestinationChoice } from "@ttr/shared";
import { useEffect } from "react";
import { CARD_CFG, PLAYER_COLORS, ROUTE_COLOR } from "../lib/colors";
import { cityLabel, t, type Lang } from "../lib/i18n";
import { CardChip } from "./CardChip";

// ── constants ──────────────────────────────────────────────────────────────

const ALL_COLORS: CardColor[] = ["red","blue","green","yellow","black","white","orange","pink","locomotive"];

// ── claim option types & helpers ───────────────────────────────────────────

export type ClaimOpt = {
  /** Color to send to server */
  baseColor: CardColor;
  /** How many baseColor cards will be deducted */
  colorCount: number;
  /** How many locomotive wildcards will be deducted */
  locoCount: number;
};

/**
 * Returns one option per eligible base color.
 * Server logic: deduct colored cards first, fill remainder with locos.
 * Special: for gray routes, "locomotive" base = pure loco claim.
 */
function buildClaimOptions(hand: TrainCard[], routeColor: string, routeLength: number): ClaimOpt[] {
  const locoInHand = hand.filter(c => c.color === "locomotive").length;
  const opts: ClaimOpt[] = [];

  if (routeColor === "gray") {
    for (const color of ALL_COLORS.filter(c => c !== "locomotive")) {
      const colorInHand = hand.filter(c => c.color === color).length;
      const minColor = Math.max(1, routeLength - locoInHand);
      const maxColor = Math.min(routeLength, colorInHand);
      for (let colorCount = maxColor; colorCount >= minColor; colorCount -= 1) {
        const locoCount = routeLength - colorCount;
        if (locoCount <= locoInHand) {
          opts.push({ baseColor: color, colorCount, locoCount });
        }
      }
    }
    // Pure loco option for gray routes
    if (locoInHand >= routeLength) {
      opts.push({ baseColor: "locomotive", colorCount: 0, locoCount: routeLength });
    }
  } else {
    const routeCardColor = routeColor as CardColor;
    const colorInHand = hand.filter(c => c.color === routeCardColor).length;
    const minColor = Math.max(0, routeLength - locoInHand);
    const maxColor = Math.min(routeLength, colorInHand);
    for (let colorCount = maxColor; colorCount >= minColor; colorCount -= 1) {
      const locoCount = routeLength - colorCount;
      if (locoCount <= locoInHand) {
        opts.push({ baseColor: routeCardColor, colorCount, locoCount });
      }
    }
  }

  return opts.filter((opt, idx, arr) =>
    arr.findIndex((x) => x.baseColor === opt.baseColor && x.locoCount === opt.locoCount) === idx,
  );
}

// ── sub-components ─────────────────────────────────────────────────────────

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">{children}</p>
);

/** Tiny card tile used inside claim option rows */
const MiniCard = ({ color }: { color: CardColor }) => {
  const cfg = CARD_CFG[color];
  return (
    <span
      className="w-[22px] h-[30px] rounded-md flex items-center justify-center text-[13px] border flex-shrink-0 shadow-sm"
      style={{
        background: cfg.gradient ?? cfg.bg,
        borderColor: cfg.border,
        color: cfg.text,
        boxShadow: "inset 0 1px 1px rgba(255,255,255,0.2)",
      }}
    >
      {cfg.icon}
    </span>
  );
};

/** A full claim option row — shows mini cards + selectable highlight */
const ClaimOptionBtn = ({
  opt, selected, onClick,
}: { opt: ClaimOpt; selected: boolean; onClick: () => void }) => {
  const baseCards = Array<CardColor>(opt.colorCount).fill(opt.baseColor);
  const locoCards = Array<CardColor>(opt.locoCount).fill("locomotive");
  const allCards = [...baseCards, ...locoCards];
  const cfg = CARD_CFG[opt.baseColor];

  return (
    <button
      onClick={onClick}
      className={[
        "flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 w-full transition-all duration-100 text-left",
        "cursor-pointer active:scale-[0.98]",
        selected
          ? "border-orange-400 bg-orange-500/10 shadow-[0_0_0_1px_rgba(251,146,60,0.2)]"
          : "border-slate-700 bg-slate-800/60 hover:border-slate-500",
      ].join(" ")}
    >
      {/* Mini card preview */}
      <div className="flex gap-1 flex-shrink-0">
        {allCards.map((c, i) => <MiniCard key={i} color={c} />)}
      </div>

      {/* Label */}
      <span className="flex-1 text-sm font-medium" style={{ color: cfg.text === "#fff" ? cfg.border : cfg.text }}>
        {opt.colorCount > 0 && opt.baseColor !== "locomotive"
          ? `${opt.colorCount}×${cfg.icon}`
          : ""}
        {opt.colorCount > 0 && opt.locoCount > 0 ? " + " : ""}
        {opt.locoCount > 0 ? `${opt.locoCount}×🚂` : ""}
      </span>

      {selected && (
        <span className="text-orange-400 text-lg">✓</span>
      )}
    </button>
  );
};

const BigActionBtn = ({
  icon, label, sub, onClick, disabled, accent,
}: {
  icon: string; label: string; sub?: string;
  onClick: () => void; disabled?: boolean; accent?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={[
      "flex flex-col items-center justify-center gap-0.5 rounded-2xl border-2",
      "px-3 py-3 font-semibold select-none transition-all duration-100",
      "min-h-[68px] flex-1",
      !disabled ? "cursor-pointer active:scale-95" : "cursor-default opacity-40",
      accent
        ? "bg-orange-500/20 border-orange-400 text-orange-300 shadow-[0_0_12px_rgba(249,115,22,.25)]"
        : "bg-slate-800/80 border-slate-600 text-slate-200 hover:border-slate-400",
    ].join(" ")}
  >
    <span className="text-2xl leading-none">{icon}</span>
    <span className="text-sm leading-tight text-center">{label}</span>
    {sub && <span className="text-xs text-slate-400 leading-tight">{sub}</span>}
  </button>
);

// ── main component ─────────────────────────────────────────────────────────

type Props = {
  game: GameState;
  me: Player | undefined;
  lang: Lang;
  sessionToken: string;
  selectedRouteId: string;
  selectedColor: CardColor;
  selectedLocoCount: number;
  canAct: boolean;
  isMyTurn: boolean;
  activePlayer: Player | undefined;
  pendingChoice: PendingDestinationChoice | null | undefined;
  isMyPendingChoice: boolean;
  selectedDestinationIds: string[];
  onToggleDestination: (id: string) => void;
  onConfirmDestinations: () => void;
  onSelectClaim: (opt: ClaimOpt) => void;
  onDrawCard: (index?: number) => void;
  onDrawDestinations: () => void;
  onClaimRoute: () => void;
  onDeselectRoute: () => void;
};

export const ActionPanel = ({
  game, me,
  lang,
  selectedRouteId, selectedColor, selectedLocoCount,
  isMyTurn, activePlayer,
  pendingChoice, isMyPendingChoice,
  selectedDestinationIds,
  onToggleDestination, onConfirmDestinations,
  onSelectClaim, onDrawCard, onDrawDestinations,
  onClaimRoute, onDeselectRoute,
}: Props) => {
  const selectedRoute = game.routes.find(r => r.id === selectedRouteId) ?? null;
  const hand = me?.hand ?? [];
  const routeClaimOpts = selectedRoute
    ? buildClaimOptions(hand, selectedRoute.color, selectedRoute.length)
    : [];
  const drawInProgress = game.turnActionState.action === "draw_cards";

  // Keep selection valid when user switches route; defaults to first valid option.
  useEffect(() => {
    if (!selectedRoute || selectedRoute.ownerSessionToken || routeClaimOpts.length === 0) return;
    const hasSelected = routeClaimOpts.some((opt) => opt.baseColor === selectedColor && opt.locoCount === selectedLocoCount);
    if (!hasSelected) onSelectClaim(routeClaimOpts[0]);
  }, [onSelectClaim, routeClaimOpts, selectedColor, selectedLocoCount, selectedRoute]);

  // ── Destination choice overlay ───────────────────────────────────────────
  if (pendingChoice) {
    return (
      <div className="bg-[#10182c] border border-slate-700 rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">🗺</span>
          <span className="font-semibold text-slate-100">
            {isMyPendingChoice
              ? t(lang, "ui.keepMinimum", { count: pendingChoice.minKeep })
              : t(lang, "ui.anotherPlayerChoosing")}
          </span>
        </div>

        {isMyPendingChoice && (
          <>
            <div className="flex flex-col gap-2.5 mb-4">
              {pendingChoice.cards.map((card: DestinationCard) => {
                const selected = selectedDestinationIds.includes(card.id);
                return (
                  <label
                    key={card.id}
                    className={[
                      "flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 cursor-pointer",
                      "transition-all duration-100",
                      selected
                        ? "border-orange-400 bg-orange-500/10"
                        : "border-slate-700 bg-slate-800/60",
                    ].join(" ")}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => onToggleDestination(card.id)}
                      className="w-4 h-4 accent-orange-400 flex-shrink-0"
                    />
                    <span className="flex-1 text-sm font-medium">
                      {cityLabel(lang, card.from)} <span className="text-slate-400">→</span> {cityLabel(lang, card.to)}
                    </span>
                    <span className={`text-sm font-bold ${selected ? "text-orange-300" : "text-slate-400"}`}>
                      {card.points} {t(lang, "ui.pointsShort")}
                    </span>
                  </label>
                );
              })}
            </div>
            <button
              onClick={onConfirmDestinations}
              disabled={selectedDestinationIds.length < pendingChoice.minKeep}
              className={[
                "w-full rounded-xl py-2.5 font-bold text-sm transition-all",
                selectedDestinationIds.length >= pendingChoice.minKeep
                  ? "bg-orange-500 text-white active:scale-95"
                  : "bg-slate-700 text-slate-500 cursor-not-allowed",
              ].join(" ")}
            >
              {t(lang, "ui.confirm")} ({selectedDestinationIds.length}/{pendingChoice.cards.length}) ✓
            </button>
          </>
        )}
      </div>
    );
  }

  // ── Not my turn ──────────────────────────────────────────────────────────
  if (!isMyTurn || game.finished) {
    const playerIdx = activePlayer
      ? game.players.findIndex(p => p.sessionToken === activePlayer.sessionToken)
      : 0;
    const color = PLAYER_COLORS[playerIdx] ?? "#6b7280";

    return (
      <div
        className="rounded-2xl border-2 px-4 py-3 flex items-center gap-3"
        style={{ borderColor: `${color}55`, background: `${color}11` }}
      >
        <span
          className="w-3 h-3 rounded-full flex-shrink-0 animate-pulse"
          style={{ background: color, boxShadow: `0 0 8px ${color}` }}
        />
        <span className="text-slate-300 text-sm">
          {t(lang, "ui.waitingOtherTurn")}
        </span>
        <div className="ml-auto flex gap-2 text-xs text-slate-500">
          <span>{activePlayer?.wagonsLeft ?? "—"}🚃</span>
          <span>{activePlayer?.hand.length ?? "—"}🃏</span>
        </div>
      </div>
    );
  }

  // ── My turn, route selected → claim options ──────────────────────────────
  if (selectedRoute) {
    const routeColor = selectedRoute.ownerSessionToken
      ? undefined
      : ROUTE_COLOR[selectedRoute.color];

    const claimOpts = selectedRoute.ownerSessionToken ? [] : routeClaimOpts;

    const selectedOpt = claimOpts.find(o => o.baseColor === selectedColor) ?? null;
    const canClaim = selectedOpt !== null && !selectedRoute.ownerSessionToken && !drawInProgress;

    return (
      <div className="bg-slate-900 border-2 border-slate-600 rounded-2xl p-4 space-y-4">
        {/* Route info */}
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ background: routeColor ?? "#6b7280" }}
          />
          <span className="font-bold text-slate-100 text-sm">
            {cityLabel(lang, selectedRoute.from)} → {cityLabel(lang, selectedRoute.to)}
          </span>
          <span className="text-slate-400 text-xs">· {selectedRoute.length} {t(lang, "ui.carsCount")}</span>
          {selectedRoute.ownerSessionToken ? (
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-red-900/40 text-red-300 border border-red-800">{t(lang, "ui.occupied")}</span>
          ) : (
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-green-900/40 text-green-300 border border-green-800">{t(lang, "ui.free")}</span>
          )}
        </div>

        {/* Claim options */}
        {!selectedRoute.ownerSessionToken && (
          <>
            {claimOpts.length === 0 ? (
              <div className="rounded-xl bg-red-900/20 border border-red-800/50 px-3 py-3 text-sm text-red-300">
                😔 {t(lang, "ui.insufficientCards")}
              </div>
            ) : (
              <div>
                <SectionLabel>{t(lang, "ui.claimOptions")} ({selectedRoute.length} {t(lang, "ui.carsCount")})</SectionLabel>
                <div className="flex flex-col gap-2">
                  {claimOpts.map(opt => (
                    <ClaimOptionBtn
                      key={`${opt.baseColor}-${opt.locoCount}`}
                      opt={opt}
                      selected={selectedColor === opt.baseColor && selectedLocoCount === opt.locoCount}
                      onClick={() => onSelectClaim(opt)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Claim + cancel */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={onClaimRoute}
                disabled={!canClaim}
                className={[
                  "flex-1 rounded-xl py-2.5 font-bold text-sm transition-all",
                  "border-2 border-orange-400 bg-orange-500/20 text-orange-200",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                  canClaim ? "active:scale-95 hover:bg-orange-500/30" : "",
                ].join(" ")}
              >
                🚂 {t(lang, "ui.claimRoute")}
              </button>
              <button
                onClick={onDeselectRoute}
                className="rounded-xl px-3 py-2.5 text-sm border border-slate-600 text-slate-400 hover:border-slate-400 active:scale-95"
              >
                ✕
              </button>
            </div>
          </>
        )}

        {selectedRoute.ownerSessionToken && (
          <button
            onClick={onDeselectRoute}
            className="w-full rounded-xl py-2 text-sm border border-slate-600 text-slate-400 active:scale-95"
          >
            ← {t(lang, "ui.selectAnotherRoute")}
          </button>
        )}
      </div>
    );
  }

  // ── My turn, no route selected → main actions ────────────────────────────
  return (
    <div className="space-y-4">

      {/* Market cards */}
      <div>
        <SectionLabel>{t(lang, "ui.marketTitle")}</SectionLabel>
        <div className="flex gap-2 flex-wrap">
          {game.openCards.map((card, i) => (
            <CardChip
              key={i}
              color={card.color as CardColor}
              size="md"
              disabled={drawInProgress}
              onClick={() => onDrawCard(i)}
            />
          ))}
          {/* Draw from deck */}
          <button
            onClick={() => onDrawCard()}
            disabled={game.trainDeckCount === 0}
            className={[
              "relative flex flex-col items-center justify-center",
              "w-[46px] h-[66px] rounded-xl border-[3px] border-slate-600",
              "bg-slate-800 text-slate-200 font-bold select-none",
              "transition-all duration-100 cursor-pointer",
              "active:scale-90 disabled:opacity-40 disabled:cursor-default",
              "hover:border-slate-400",
            ].join(" ")}
            title={`${t(lang, "ui.drawDeck")} (${game.trainDeckCount})`}
          >
            <span className="text-xl leading-none z-10">🂠</span>
            <span className="text-[11px] font-black absolute bottom-1 left-0 right-0 text-center leading-none opacity-90">
              {game.trainDeckCount}
            </span>
          </button>
        </div>
      </div>

      {/* Other actions */}
      <div className="flex gap-3">
        <BigActionBtn
          icon="🗺"
          label={t(lang, "ui.routes")}
          sub={`${game.destinationDeckCount} ${t(lang, "ui.deckCount")}`}
          onClick={onDrawDestinations}
          disabled={game.destinationDeckCount === 0 || drawInProgress}
        />
        <BigActionBtn
          icon="🚂"
          label={t(lang, "ui.claimRoute")}
          sub={t(lang, "ui.chooseOnMap")}
          onClick={() => {}}
          disabled
          accent
        />
      </div>

      <p className="text-xs text-slate-500 text-center">
        💡 {t(lang, "ui.selectRouteHint")}
      </p>
    </div>
  );
};
