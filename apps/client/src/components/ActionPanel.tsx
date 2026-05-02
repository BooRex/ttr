import {
  getMinRequiredLocomotives,
  type CardColor,
  type DestinationCard,
  type GameState,
  type Player,
} from "@ttr/shared";
import type { PendingDestinationChoice } from "@ttr/shared";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { CARD_CFG, PLAYER_COLORS, ROUTE_COLOR } from "../lib/colors";
import { cityLabel, t, type Lang } from "../lib/i18n";
import { buildClaimOptions, type ClaimOpt } from "../entities/game/claimOptions";
import { CardStatIcon, LocomotiveStatIcon, RouteMapStatIcon, WagonStatIcon } from "./StatIcons";

// ── sub-components ─────────────────────────────────────────────────────────

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-2">{children}</p>
);

/** Tiny card tile used inside claim option rows */
const MiniCard = ({ color }: { color: CardColor }) => {
  const cfg = CARD_CFG[color];
  return (
    <span
      className="w-5.5 h-7.5 rounded-md flex items-center justify-center text-[13px] border shrink-0 shadow-sm"
      style={{
        background: cfg.gradient ?? cfg.bg,
        borderColor: cfg.border,
        color: cfg.text,
        boxShadow: "inset 0 1px 1px rgba(255,255,255,0.2)",
      }}
    >
      {color === "locomotive" ? <LocomotiveStatIcon className="w-4 h-4" /> : cfg.icon}
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
  return (
    <button
      onClick={onClick}
      className={[
        "claim-option-btn",
        "flex items-center gap-2 rounded-xl border-2 px-2.5 py-2 w-full transition-all duration-100 text-left",
        "cursor-pointer active:scale-[0.98]",
        selected
          ? "border-orange-400 bg-orange-500/10 shadow-[0_0_0_1px_rgba(251,146,60,0.2)]"
          : "border-slate-700 bg-slate-800/60 hover:border-slate-500",
      ].join(" ")}
    >
      {/* Mini card preview */}
      <div className="flex flex-wrap gap-1 flex-1 min-w-0">
        {allCards.map((c, i) => <MiniCard key={i} color={c} />)}
      </div>


      {selected && (
        <span className="text-orange-400 text-lg">✓</span>
      )}
    </button>
  );
};

const BigActionBtn = ({
  icon, label, sub, onClick, disabled, accent,
}: {
  icon: ReactNode; label: string; sub?: string;
  onClick: () => void; disabled?: boolean; accent?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={[
      "action-big-btn",
      "flex items-center justify-between gap-2 rounded-2xl border-2",
      "px-3 py-2.5 font-semibold select-none transition-all duration-100",
      "min-h-17 flex-1",
      !disabled ? "cursor-pointer active:scale-95" : "cursor-default opacity-40",
      accent
        ? "bg-orange-500/20 border-orange-400 text-orange-300 shadow-[0_0_12px_rgba(249,115,22,.25)]"
        : "bg-slate-800/80 border-slate-600 text-slate-200 hover:border-slate-400",
    ].join(" ")}
  >
    <span className="min-w-0 text-left">
      <span className="block text-sm leading-tight">{label}</span>
      {sub && <span className="block text-xs text-slate-400 leading-tight mt-0.5">{sub}</span>}
    </span>
    <span className="text-xl leading-none shrink-0">{icon}</span>
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
  onHoverPendingDestination: (card: DestinationCard | null) => void;
  onConfirmDestinations: () => void;
  onSelectClaim: (opt: ClaimOpt) => void;
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
  onToggleDestination, onHoverPendingDestination, onConfirmDestinations,
  onSelectClaim, onDrawDestinations,
  onClaimRoute, onDeselectRoute,
}: Props) => {
  const [isDrawRoutesConfirmOpen, setIsDrawRoutesConfirmOpen] = useState(false);
  const selectedRoute = game.routes.find(r => r.id === selectedRouteId) ?? null;
  const hand = me?.hand ?? [];
  const routeClaimOpts = selectedRoute
    ? buildClaimOptions(hand, selectedRoute)
    : [];
  const drawInProgress = game.turnActionState.action === "draw_cards";
  const canDrawDestinations = game.destinationDeckCount > 0 && !drawInProgress;

  // Keep selection valid when user switches route; defaults to first valid option.
  useEffect(() => {
    if (!selectedRoute || selectedRoute.ownerSessionToken || routeClaimOpts.length === 0) return;
    const hasSelected = routeClaimOpts.some((opt) => opt.baseColor === selectedColor && opt.locoCount === selectedLocoCount);
    if (!hasSelected) onSelectClaim(routeClaimOpts[0]);
  }, [onSelectClaim, routeClaimOpts, selectedColor, selectedLocoCount, selectedRoute]);

  // ── Destination choice overlay ───────────────────────────────────────────
  if (pendingChoice) {
    return (
      <div className="h-full flex flex-col gap-3 min-h-0">
        <div className="rounded-xl border border-slate-700 bg-slate-800/70 px-3 py-2 flex items-center gap-2">
          <RouteMapStatIcon className="w-4 h-4 text-slate-200" />
          <span className="font-semibold text-slate-100 text-sm">
            {isMyPendingChoice
              ? t(lang, "ui.keepMinimum", { count: pendingChoice.minKeep })
              : t(lang, "ui.anotherPlayerChoosing")}
          </span>
        </div>

        {isMyPendingChoice && (
          <>
            <div className="pending-choice-list flex-1 min-h-0 flex flex-col gap-2.5">
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
                    onMouseEnter={() => onHoverPendingDestination(card)}
                    onMouseLeave={() => onHoverPendingDestination(null)}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => onToggleDestination(card.id)}
                      onFocus={() => onHoverPendingDestination(card)}
                      onBlur={() => onHoverPendingDestination(null)}
                      className="w-4 h-4 accent-orange-400 shrink-0"
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
      <div>
        <div
          className="rounded-2xl border-2 px-4 py-3 flex items-center gap-3"
          style={{ borderColor: `${color}55`, background: `${color}11` }}
        >
          <span
            className="w-3 h-3 rounded-full shrink-0 animate-pulse"
            style={{ background: color, boxShadow: `0 0 8px ${color}` }}
          />
          <span className="text-slate-300 text-sm">
            {t(lang, "ui.waitingOtherTurn")}
          </span>
          <div className="ml-auto flex gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1 font-bold">{activePlayer?.wagonsLeft ?? "—"}<WagonStatIcon /></span>
            <span className="inline-flex items-center gap-1 font-bold">{activePlayer?.hand.length ?? "—"}<CardStatIcon /></span>
          </div>
        </div>
      </div>
    );
  }

  // ── My turn, route selected → claim options ──────────────────────────────
  if (selectedRoute) {
    const routeColor = selectedRoute.ownerSessionToken
      ? undefined
      : ROUTE_COLOR[selectedRoute.color];
    const minSpecialLocos = getMinRequiredLocomotives(selectedRoute);

    const claimOpts = selectedRoute.ownerSessionToken ? [] : routeClaimOpts;

    const selectedOpt = claimOpts.find(o => o.baseColor === selectedColor) ?? null;
    const canClaim = selectedOpt !== null && !selectedRoute.ownerSessionToken && !drawInProgress;

    return (
      <div className="bg-slate-900 border-2 border-slate-600 rounded-2xl p-4 space-y-4">
        {/* Route info */}
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full shrink-0"
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

        {(selectedRoute.routeType === "tunnel" || selectedRoute.routeType === "ferry") && (
          <div className="rounded-xl border border-sky-400/50 bg-sky-500/10 px-3 py-2 text-xs text-sky-100">
            <div className="font-semibold">
              {selectedRoute.routeType === "tunnel" ? t(lang, "ui.tunnel") : t(lang, "ui.ferry")}
            </div>
            {minSpecialLocos > 0 && (
              <div className="mt-0.5 text-sky-100/90">
                {t(lang, "ui.minLocomotives", { count: minSpecialLocos })}
              </div>
            )}
          </div>
        )}

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
                <span className="inline-flex items-center justify-center gap-1"><LocomotiveStatIcon />{t(lang, "ui.claimRoute")}</span>
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
    <div className="action-panel space-y-4">

      {/* Other actions */}
      <div className="flex flex-col gap-2.5">
        <BigActionBtn
          icon={<RouteMapStatIcon className="w-5 h-5" />}
          label={t(lang, "ui.routes")}
          sub={`${game.destinationDeckCount} ${t(lang, "ui.deckCount")}`}
          onClick={() => setIsDrawRoutesConfirmOpen(true)}
          disabled={!canDrawDestinations}
        />
        <BigActionBtn
          icon={<LocomotiveStatIcon className="w-5 h-5" />}
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

      {isDrawRoutesConfirmOpen && (
        <div className="fixed inset-0 z-120 bg-black/65 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-600 bg-slate-900 p-4 space-y-3 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-100">
              {t(lang, "ui.drawRoutesConfirmTitle")}
            </h3>
            <p className="text-sm text-slate-300">
              {t(lang, "ui.drawRoutesConfirmBody")}
            </p>
            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                className="rounded-xl border border-slate-600 px-3 py-2 text-sm text-slate-300 hover:border-slate-400"
                onClick={() => setIsDrawRoutesConfirmOpen(false)}
              >
                {t(lang, "ui.cancel")}
              </button>
              <button
                type="button"
                className="rounded-xl border border-orange-400 bg-orange-500/20 px-3 py-2 text-sm font-bold text-orange-200 hover:bg-orange-500/30"
                onClick={() => {
                  setIsDrawRoutesConfirmOpen(false);
                  onDrawDestinations();
                }}
              >
                {t(lang, "ui.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
