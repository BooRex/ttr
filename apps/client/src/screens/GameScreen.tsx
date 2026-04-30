import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { DestinationCard, CardColor, GameState, GameEvent } from "@ttr/shared";
import { GameTopbar } from "../widgets/game-topbar";
import { GameBoardSlot } from "../widgets/game-board";
import { GameRightPanel } from "../widgets/game-right-panel";
import { ActionPanel } from "../components/ActionPanel";
import { StationPanel } from "../components/StationPanel";
import { MarketPanel } from "../components/MarketPanel";
import { PanelShell } from "../components/PanelShell";
import type { ClaimOpt } from "../entities/game/claimOptions";
import { EventLog } from "../components/EventLog";
import { ScoringHelpModal } from "../components/ScoringHelpModal";
import { t, type Lang } from "../lib/i18n";
import { CARD_CFG, PLAYER_COLORS } from "../lib/colors";
import { LocomotiveStatIcon } from "../components/StatIcons";

interface GameScreenProps {
  game: GameState;
  lang: Lang;
  sessionToken: string;
  isMyTurn: boolean;
  turnPulse: boolean;
  canAct: boolean;
  isMobileLayout: boolean;
  isPortrait: boolean;
  isEventsOpen: boolean;
  onToggleEvents: () => void;
  isScoringHelpOpen: boolean;
  onToggleScoringHelp: () => void;
  me: any;
  activePlayer: any;
  winner: any;
  pendingChoice: any;
  isMyPendingChoice: boolean;
  selectedRouteId: string;
  onSelectRoute: (id: string) => void;
  selectedColor: CardColor;
  selectedLocoCount: number;
  selectedDestinationIds: string[];
  onToggleDestination: (id: string) => void;
  onHoverPendingDestination: (dest: DestinationCard | null) => void;
  highlightOwnerSessionToken: string | null;
  onHoverOwner: (token: string | null) => void;
  onToggleOwner: (token: string) => void;
  highlightRouteIds: string[];
  highlightCityNames: string[];
  onHoverDestination: (dest: DestinationCard | null) => void;
  onHoverConnection: (from: string, to: string) => void;
  onLeaveConnection: () => void;
  onDrawCard: (index?: number) => void;
  onClaimRoute: () => void;
  onBuildStation: (city: string, color: CardColor, useLocomotives?: number) => void;
  selectedStationCity: string;
  onSelectStationCity: (city: string) => void;
  onSelectClaim: (opt: ClaimOpt) => void;
  onDrawDestinations: () => void;
  onConfirmDestinations: () => void;
  onDeselectRoute: () => void;
  onSetLang: (lang: Lang) => void;
  onBackToLobby: () => void;
}

type DeckDrawFxState = {
  id: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  cardW: number;
  cardH: number;
  cards: CardColor[];
  phase: "reveal" | "fly" | "settle";
};

const GameScreenComponent = ({
  game,
  lang,
  sessionToken,
  isMyTurn,
  turnPulse,
  canAct,
  isMobileLayout,
  isPortrait,
  isEventsOpen,
  onToggleEvents,
  isScoringHelpOpen,
  onToggleScoringHelp,
  me,
  activePlayer,
  winner,
  pendingChoice,
  isMyPendingChoice,
  selectedRouteId,
  onSelectRoute,
  selectedColor,
  selectedLocoCount,
  selectedDestinationIds,
  onToggleDestination,
  onHoverPendingDestination,
  highlightOwnerSessionToken,
  onHoverOwner,
  onToggleOwner,
  highlightRouteIds,
  highlightCityNames,
  onHoverDestination,
  onHoverConnection,
  onLeaveConnection,
  onDrawCard,
  onClaimRoute,
  onBuildStation,
  selectedStationCity,
  onSelectStationCity,
  onSelectClaim,
  onDrawDestinations,
  onConfirmDestinations,
  onDeselectRoute,
  onSetLang,
  onBackToLobby,
}: GameScreenProps) => {
  const [deckDrawFx, setDeckDrawFx] = useState<DeckDrawFxState | null>(null);
  const processedDrawEventIdsRef = useRef<Set<string>>(new Set());
  const drawFxQueueRef = useRef<CardColor[][]>([]);
  const canUseLeftActions =
    (isMyTurn && !game.finished && (!pendingChoice || isMyPendingChoice)) ||
    Boolean(selectedRouteId);
  const canInteractWithBoard = isMyTurn && canAct && !game.finished;
  const activePlayerIndex = activePlayer
    ? game.players.findIndex((p) => p.sessionToken === activePlayer.sessionToken)
    : -1;
  const activePlayerColor = activePlayerIndex >= 0
    ? PLAYER_COLORS[activePlayerIndex % PLAYER_COLORS.length]
    : "#94a3b8";
  const finalStandings = game.finished
    ? [...game.finalStandings].sort((a, b) => b.points - a.points)
    : [];

  const startNextDeckDrawFx = useCallback((cardsOverride?: CardColor[]) => {
    const cards = cardsOverride ?? drawFxQueueRef.current.shift();
    if (!cards || cards.length === 0) return;
    const deckBtn = document.querySelector("[data-draw-deck-btn='true']") as HTMLElement | null;
    const handAnchor = document.querySelector("[data-hand-cards-anchor='true']") as HTMLElement | null;
    if (!deckBtn || !handAnchor) return;

    const deckRect = deckBtn.getBoundingClientRect();
    const handRect = handAnchor.getBoundingClientRect();

    const cardW = Math.max(28, Math.min(46, Math.round(deckRect.width * 0.34)));
    const cardH = Math.round(cardW * 1.5);
    const startX = deckRect.left + (deckRect.width - cardW) / 2;
    const startY = deckRect.top - cardH - 6;
    const targetX = handRect.left + handRect.width * 0.5 - cardW / 2;
    const targetY = handRect.top + handRect.height * 0.45 - cardH / 2;

    setDeckDrawFx({
      id: Date.now(),
      startX,
      startY,
      targetX,
      targetY,
      cardW,
      cardH,
      cards,
      phase: "reveal",
    });
  }, []);

  useEffect(() => {
    if (!game.started || game.finished) return;
    const newDeckDrawEvents = (game.events ?? [])
      .filter((event): event is Extract<GameEvent, { type: "draw_card" }> => event.type === "draw_card")
      .filter((event) => (
        event.sessionToken === sessionToken
        && event.from === "deck"
        && Boolean(event.cardColor)
        && !processedDrawEventIdsRef.current.has(event.id)
      ));

    if (newDeckDrawEvents.length === 0) return;

    for (const event of newDeckDrawEvents) {
      processedDrawEventIdsRef.current.add(event.id);
    }

    const cards = newDeckDrawEvents
      .slice()
      .reverse()
      .map((event) => event.cardColor as CardColor);

    drawFxQueueRef.current.push(cards);
    if (!deckDrawFx) {
      startNextDeckDrawFx();
    }
  }, [deckDrawFx, game.events, game.finished, game.started, sessionToken, startNextDeckDrawFx]);

  useEffect(() => {
    if (!deckDrawFx) return;
    if (deckDrawFx.phase === "reveal") {
      const t1 = window.setTimeout(() => {
        setDeckDrawFx((prev) => (prev ? { ...prev, phase: "fly" } : null));
      }, 1000);
      return () => window.clearTimeout(t1);
    }
    if (deckDrawFx.phase === "fly") {
      const t2 = window.setTimeout(() => {
        setDeckDrawFx((prev) => (prev ? { ...prev, phase: "settle" } : null));
      }, 620);
      return () => window.clearTimeout(t2);
    }
    const t3 = window.setTimeout(() => {
      setDeckDrawFx(null);
      startNextDeckDrawFx();
    }, 1000);
    return () => window.clearTimeout(t3);
  }, [deckDrawFx, startNextDeckDrawFx]);

  return (
    <div className="game-screen" data-testid="game-screen">
      {isPortrait && (
        <div className="orientation-overlay">
          <div className="orientation-card">
            <div className="text-4xl mb-2">📱↻</div>
            <h2>{t(lang, "ui.onlyLandscape")}</h2>
            <p>{t(lang, "ui.rotateDevice")}</p>
          </div>
        </div>
      )}

      {/* Header bar */}
      <GameTopbar
        game={game}
        lang={lang}
        isMyTurn={isMyTurn}
        turnPulse={turnPulse}
        sessionToken={sessionToken}
        highlightOwnerSessionToken={highlightOwnerSessionToken}
        onHoverOwner={onHoverOwner}
        onToggleOwner={onToggleOwner}
        onSetLang={onSetLang}
        onOpenScoringHelp={onToggleScoringHelp}
      />

      <div className={["game-layout", game.finished ? "game-layout-finished" : ""].join(" ")}>
        <aside className="game-side side-left">
          {game.finished ? (
            <PanelShell title={t(lang, "results.finalStandings")} className="card side-card h-full">
              <div className="final-side-list">
                {finalStandings.map((standing, idx) => {
                  const playerIndex = game.players.findIndex((p) => p.sessionToken === standing.sessionToken);
                  const color = PLAYER_COLORS[Math.max(0, playerIndex) % PLAYER_COLORS.length] ?? "#94a3b8";
                  return (
                    <div key={standing.sessionToken} className="final-side-item">
                      <span className="final-side-rank">#{idx + 1}</span>
                      <span className="final-side-name" style={{ color }}>{standing.nickname}</span>
                      <strong className="final-side-points">{standing.points} {t(lang, "ui.pointsShort")}</strong>
                      <span className="final-side-meta">
                        {standing.completedDestinations}/{standing.totalDestinations}
                      </span>
                    </div>
                  );
                })}
              </div>
            </PanelShell>
          ) : canUseLeftActions ? (
            <>
              <PanelShell
                title={t(lang, "ui.routes")}
                className="card side-card side-ratio-2"
              >
                <ActionPanel
                  game={game}
                  me={me}
                  lang={lang}
                  sessionToken={sessionToken}
                  selectedRouteId={selectedRouteId}
                  selectedColor={selectedColor}
                  selectedLocoCount={selectedLocoCount}
                  canAct={canAct}
                  isMyTurn={isMyTurn}
                  activePlayer={activePlayer}
                  pendingChoice={pendingChoice}
                  isMyPendingChoice={isMyPendingChoice}
                  selectedDestinationIds={selectedDestinationIds}
                  onToggleDestination={onToggleDestination}
                  onHoverPendingDestination={onHoverPendingDestination}
                  onConfirmDestinations={onConfirmDestinations}
                  onSelectClaim={onSelectClaim}
                  onDrawDestinations={onDrawDestinations}
                  onClaimRoute={onClaimRoute}
                  onDeselectRoute={onDeselectRoute}
                />
              </PanelShell>

              <PanelShell
                title={t(lang, "ui.buildStation")}
                className="card side-card side-ratio-2"
              >
                <StationPanel
                  game={game}
                  me={me}
                  lang={lang}
                  selectedCity={selectedStationCity}
                  onSelectCity={onSelectStationCity}
                  onBuildStation={onBuildStation}
                />
              </PanelShell>
            </>
          ) : (
            <PanelShell
              title={t(lang, "ui.waiting")}
              className="card side-card h-full"
            >
              <div className="h-full flex flex-col items-center justify-center gap-2 text-sm text-slate-300 font-medium">
                <span>{t(lang, "ui.waitingOtherTurn")}</span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1.5">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: activePlayerColor }}
                  />
                  <span className="text-slate-200">{activePlayer?.nickname ?? "—"}</span>
                </span>
              </div>
            </PanelShell>
          )}
        </aside>

        <div className="board-center-col">
          <GameBoardSlot
            mapId={game.mapId}
            lang={lang}
            routes={game.routes}
            stations={game.stations}
            players={game.players}
            selectedRouteId={selectedRouteId}
            highlightOwnerSessionToken={highlightOwnerSessionToken}
            highlightRouteIds={highlightRouteIds}
            highlightCityNames={highlightCityNames}
            selectedStationCity={selectedStationCity}
            onSelectCity={canInteractWithBoard ? onSelectStationCity : undefined}
            onSelectRoute={canInteractWithBoard ? onSelectRoute : () => {}}
          />
          {!game.finished && (
            <div className="market-strip card">
              <MarketPanel
                game={game}
                lang={lang}
                isMyTurn={isMyTurn}
                canAct={canAct}
                onDrawCard={onDrawCard}
              />
            </div>
          )}
        </div>

        {game.finished ? (
          <aside className="game-side side-right">
            <PanelShell title={t(lang, "ui.gameOver")} className="card side-card h-full">
              <div className="h-full flex items-center justify-center">
                <button type="button" className="mt-2" onClick={onBackToLobby}>
                  {t(lang, "ui.toLobby")}
                </button>
              </div>
            </PanelShell>
          </aside>
        ) : (
          <GameRightPanel
            game={game}
            me={me}
            winner={winner}
            lang={lang}
            onHoverDestination={onHoverDestination}
            onLeaveDestination={() => onHoverDestination(null)}
            onHoverConnection={onHoverConnection}
            onLeaveConnection={onLeaveConnection}
            onBackToLobby={onBackToLobby}
          />
        )}
      </div>

      <button className="events-fab" onClick={onToggleEvents}>
        {t(lang, "ui.openEvents")}
      </button>

      {isMobileLayout && isEventsOpen && (
        <div className="events-modal">
          <div className="events-modal-head">
            <h3>{t(lang, "ui.events")}</h3>
            <button onClick={onToggleEvents}>{t(lang, "ui.close")}</button>
          </div>
          <div className="events-scroll-area">
            <EventLog
              events={game.events ?? []}
              players={game.players}
              lang={lang}
              onHoverConnection={onHoverConnection}
              onLeaveConnection={onLeaveConnection}
            />
          </div>
        </div>
      )}

      <ScoringHelpModal
        open={isScoringHelpOpen}
        lang={lang}
        game={game}
        sessionToken={sessionToken}
        onClose={onToggleScoringHelp}
      />

      {deckDrawFx && (
        <div className="deck-draw-fx-layer" aria-hidden="true">
          {deckDrawFx.cards.map((color, idx) => {
            const spread = deckDrawFx.cardW + 8;
            const centeredOffset = idx - (deckDrawFx.cards.length - 1) / 2;
            const fromX = deckDrawFx.startX + centeredOffset * spread;
            const fromY = deckDrawFx.startY;
            const toX = deckDrawFx.targetX + centeredOffset * spread;
            const toY = deckDrawFx.targetY;
            const dx = toX - fromX;
            const dy = toY - fromY;
            const cfg = CARD_CFG[color];
            return (
              <span
                key={`${deckDrawFx.id}-${idx}`}
                className={[
                  "deck-draw-fx-card",
                  deckDrawFx.phase === "reveal" ? "deck-draw-fx-card-reveal" : "",
                  deckDrawFx.phase === "fly" ? "deck-draw-fx-card-fly" : "",
                  deckDrawFx.phase === "settle" ? "deck-draw-fx-card-settle" : "",
                ].join(" ")}
                style={{
                  left: `${fromX}px`,
                  top: `${fromY}px`,
                  width: `${deckDrawFx.cardW}px`,
                  height: `${deckDrawFx.cardH}px`,
                  transform: (deckDrawFx.phase === "fly" || deckDrawFx.phase === "settle")
                    ? `translate(${dx}px, ${dy}px) scale(0.92)`
                    : "translate(0,0) scale(1)",
                  transitionDelay: deckDrawFx.phase === "fly" ? `${idx * 35}ms` : "0ms",
                  background: cfg.gradient ?? cfg.bg,
                  borderColor: cfg.border,
                  color: cfg.text,
                }}
              >
                <span className="deck-draw-fx-icon">
                  {color === "locomotive" ? <LocomotiveStatIcon className="w-5 h-5" /> : cfg.icon}
                </span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const GameScreen = memo(GameScreenComponent);

