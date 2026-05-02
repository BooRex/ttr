import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { DestinationCard, CardColor, GameState, GameEvent, TrainCard } from "@ttr/shared";
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
import { GameTutorialModal } from "../components/GameTutorialModal";
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
  isTutorialOpen: boolean;
  onToggleTutorial: () => void;
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
  sourceKind: "deck" | "open";
  sourceColor?: CardColor;
  sourceOpenIndex?: number;
  hideFace: boolean;
  targetKind: "hand" | "player";
  phase: "reveal" | "fly" | "settle" | "fade";
};

type DeckDrawFxJob = {
  cards: CardColor[];
  sourceKind: "deck" | "open";
  sourceColor?: CardColor;
  sourceOpenIndex?: number;
  hideFace: boolean;
  targetKind: "hand" | "player";
  targetSessionToken?: string;
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
  isTutorialOpen,
  onToggleTutorial,
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
  const [scoreModalSessionToken, setScoreModalSessionToken] = useState<string | null>(null);
  const [displayedHandCards, setDisplayedHandCards] = useState<TrainCard[]>(me?.hand ?? []);
  const processedDrawEventIdsRef = useRef<Set<string>>(new Set());
  const isDrawFxHydratedRef = useRef(false);
  const drawFxQueueRef = useRef<DeckDrawFxJob[]>([]);
  const pendingMyOpenDrawIndicesRef = useRef<number[]>([]);
  const pendingMyOpenDrawColorsRef = useRef<CardColor[]>([]);
  const prevOpenCardsRef = useRef<CardColor[]>(game.openCards.map((card) => card.color as CardColor));
  const isHandBufferingRef = useRef(false);
  const pendingHandCardsRef = useRef<TrainCard[] | null>(null);
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

  const openScoringForPlayer = useCallback((playerSessionToken: string) => {
    setScoreModalSessionToken(playerSessionToken);
    if (!isScoringHelpOpen) {
      onToggleScoringHelp();
    }
  }, [isScoringHelpOpen, onToggleScoringHelp]);

  const handleOpenMyScoringHelp = useCallback(() => {
    setScoreModalSessionToken(null);
    onToggleScoringHelp();
  }, [onToggleScoringHelp]);

  const handleCloseScoringHelp = useCallback(() => {
    setScoreModalSessionToken(null);
    onToggleScoringHelp();
  }, [onToggleScoringHelp]);

  const flushBufferedHandCards = useCallback(() => {
    isHandBufferingRef.current = false;
    if (pendingHandCardsRef.current) {
      setDisplayedHandCards(pendingHandCardsRef.current);
      pendingHandCardsRef.current = null;
    }
  }, []);

  const startNextDeckDrawFx = useCallback((jobOverride?: DeckDrawFxJob) => {
    const job = jobOverride ?? drawFxQueueRef.current[0];
    if (!job || job.cards.length === 0) return false;
    const sourceEl = job.sourceKind === "deck"
      ? document.querySelector("[data-draw-deck-btn='true']") as HTMLElement | null
      : (
        job.sourceOpenIndex !== undefined
          ? document.querySelector(`[data-open-card-index='${job.sourceOpenIndex}']`) as HTMLElement | null
          : document.querySelector(`[data-open-card-color='${job.sourceColor ?? ""}']`) as HTMLElement | null
      );
    const fallbackOpenAnchor = job.sourceKind === "open"
      ? document.querySelector("[data-open-market-anchor='true']") as HTMLElement | null
      : null;
    const effectiveSourceEl = sourceEl ?? fallbackOpenAnchor;
    if (!effectiveSourceEl) return false;
    if (!jobOverride) {
      drawFxQueueRef.current.shift();
    }

    const sourceRect = effectiveSourceEl.getBoundingClientRect();
    const targetEl = job.targetKind === "hand"
      ? document.querySelector("[data-hand-cards-anchor='true']") as HTMLElement | null
      : document.querySelector(`[data-player-pill-token='${job.targetSessionToken ?? ""}']`) as HTMLElement | null;
    if (!targetEl) return false;
    const targetRect = targetEl.getBoundingClientRect();

    const cardW = Math.max(28, Math.min(46, Math.round(sourceRect.width * 0.34)));
    const cardH = Math.round(cardW * 1.5);
    const startX = sourceRect.left + (sourceRect.width - cardW) / 2;
    const startY = job.sourceKind === "deck"
      ? sourceRect.top - cardH - 6
      : sourceRect.top + sourceRect.height * 0.5 - cardH * 0.5;
    const targetX = targetRect.left + targetRect.width * 0.5 - cardW / 2;
    const targetY = targetRect.top + targetRect.height * 0.5 - cardH / 2;

    setDeckDrawFx({
      id: Date.now(),
      startX,
      startY,
      targetX,
      targetY,
      cardW,
      cardH,
      cards: job.cards,
      sourceKind: job.sourceKind,
      sourceColor: job.sourceColor,
      sourceOpenIndex: job.sourceOpenIndex,
      hideFace: job.hideFace,
      targetKind: job.targetKind,
      phase: "reveal",
    });
    return true;
  }, []);

  useEffect(() => {
    if (!game.started || game.finished) return;

    // На первом входе/ре-коннекте не проигрываем исторические анимации добора.
    if (!isDrawFxHydratedRef.current) {
      const existingDrawIds = (game.events ?? [])
        .filter((event): event is Extract<GameEvent, { type: "draw_card" }> => event.type === "draw_card")
        .map((event) => event.id);
      processedDrawEventIdsRef.current = new Set(existingDrawIds);
      isDrawFxHydratedRef.current = true;
      return;
    }

    const newDrawEvents = (game.events ?? [])
      .filter((event): event is Extract<GameEvent, { type: "draw_card" }> => event.type === "draw_card")
      .filter((event) => (
        (event.from === "deck" || event.from === "open")
        && !processedDrawEventIdsRef.current.has(event.id)
      ));

    if (newDrawEvents.length === 0) return;

    for (const event of newDrawEvents) {
      processedDrawEventIdsRef.current.add(event.id);
    }

    const currentOpenColors = game.openCards.map((card) => card.color as CardColor);
    const inferredOpenColorsPool = prevOpenCardsRef.current
      .map((prevColor, idx) => (prevColor !== currentOpenColors[idx] ? prevColor : null))
      .filter((c): c is CardColor => Boolean(c));
    const changedOpenIndicesPool = prevOpenCardsRef.current
      .map((prevColor, idx) => (prevColor !== currentOpenColors[idx] ? idx : -1))
      .filter((idx) => idx >= 0);

    const takeChangedOpenIndex = (eventColor?: CardColor): number | undefined => {
      if (changedOpenIndicesPool.length === 0) return undefined;
      if (!eventColor) {
        return changedOpenIndicesPool.shift();
      }
      const matchedPos = changedOpenIndicesPool.findIndex((idx) => prevOpenCardsRef.current[idx] === eventColor);
      if (matchedPos >= 0) {
        const [slot] = changedOpenIndicesPool.splice(matchedPos, 1);
        return slot;
      }
      return changedOpenIndicesPool.shift();
    };

    const takeInferredOpenColor = (eventColor?: CardColor): CardColor | undefined => {
      if (eventColor) return eventColor;
      return inferredOpenColorsPool.shift();
    };

    const myDeckCards = newDrawEvents
      .filter((event) => event.sessionToken === sessionToken)
      .filter((event) => event.from === "deck")
      .map((event) => event.cardColor)
      .filter((c): c is CardColor => Boolean(c));

    const myOpenEvents = newDrawEvents
      .filter((event) => event.sessionToken === sessionToken)
      .filter((event) => event.from === "open");

    const otherByPlayer = new Map<string, number>();
    for (const event of newDrawEvents) {
      if (event.from !== "deck") continue;
      if (event.sessionToken === sessionToken) continue;
      otherByPlayer.set(event.sessionToken, (otherByPlayer.get(event.sessionToken) ?? 0) + 1);
    }

    const otherOpenJobs = newDrawEvents
      .filter((event) => event.from === "open" && event.sessionToken !== sessionToken)
      .map((event) => {
        const resolvedColor = takeInferredOpenColor(event.cardColor);
        const sourceOpenIndex = typeof event.openIndex === "number"
          ? event.openIndex
          : takeChangedOpenIndex(event.cardColor);
        return {
          cards: [resolvedColor ?? "locomotive"] as CardColor[],
        sourceKind: "open" as const,
          sourceColor: resolvedColor,
          sourceOpenIndex,
          hideFace: !resolvedColor,
        targetKind: "player" as const,
        targetSessionToken: event.sessionToken,
        };
      });

    if (myDeckCards.length > 0) {
      isHandBufferingRef.current = true;
      drawFxQueueRef.current.push({
        cards: myDeckCards,
        sourceKind: "deck",
        hideFace: false,
        targetKind: "hand",
      });
    }

    for (const event of myOpenEvents) {
      const color = event.cardColor
        ?? (pendingMyOpenDrawColorsRef.current.length > 0 ? pendingMyOpenDrawColorsRef.current.shift() : undefined)
        ?? takeInferredOpenColor();
      if (!color) continue;
      const sourceOpenIndex = pendingMyOpenDrawIndicesRef.current.length > 0
        ? pendingMyOpenDrawIndicesRef.current.shift()
        : event.openIndex;
      isHandBufferingRef.current = true;
      drawFxQueueRef.current.push({
        cards: [color],
        sourceKind: "open",
        sourceColor: color,
        sourceOpenIndex,
        hideFace: false,
        targetKind: "hand",
      });
    }

    for (const [playerToken, count] of otherByPlayer.entries()) {
      drawFxQueueRef.current.push({
        cards: Array<CardColor>(count).fill("locomotive"),
        sourceKind: "deck",
        hideFace: true,
        targetKind: "player",
        targetSessionToken: playerToken,
      });
    }

    for (const job of otherOpenJobs) {
      drawFxQueueRef.current.push(job);
    }

    if (!deckDrawFx) {
      const started = startNextDeckDrawFx();
      if (!started) {
        drawFxQueueRef.current = [];
        flushBufferedHandCards();
      }
    }
  }, [
    deckDrawFx,
    flushBufferedHandCards,
    game.events,
    game.finished,
    game.started,
    sessionToken,
    startNextDeckDrawFx,
  ]);

  useEffect(() => {
    prevOpenCardsRef.current = game.openCards.map((card) => card.color as CardColor);
  }, [game.openCards]);

  useEffect(() => {
    const nextHand = me?.isSpectator ? [] : (me?.hand ?? []);
    if (isHandBufferingRef.current) {
      pendingHandCardsRef.current = nextHand;
      return;
    }
    setDisplayedHandCards(nextHand);
  }, [me?.hand, me?.isSpectator]);

  useEffect(() => {
    if (!deckDrawFx) return;
    if (deckDrawFx.phase === "reveal") {
      const isSingleDeckCard = deckDrawFx.cards.length === 1;
      const revealMs = deckDrawFx.sourceKind === "open"
        ? 220
        : ((deckDrawFx.targetKind === "player" || isSingleDeckCard) ? 360 : 1000);
      const t1 = window.setTimeout(() => {
        setDeckDrawFx((prev) => (prev ? { ...prev, phase: "fly" } : null));
      }, revealMs);
      return () => window.clearTimeout(t1);
    }
    if (deckDrawFx.phase === "fly") {
      if (deckDrawFx.targetKind === "player") {
        const tQuick = window.setTimeout(() => {
          setDeckDrawFx(null);
          const hasQueued = drawFxQueueRef.current.length > 0;
          if (hasQueued) {
            const started = startNextDeckDrawFx();
            if (started) {
              return;
            }
            drawFxQueueRef.current = [];
          }
          flushBufferedHandCards();
        }, 420);
        return () => window.clearTimeout(tQuick);
      }
      const t2 = window.setTimeout(() => {
        setDeckDrawFx((prev) => (prev ? { ...prev, phase: "settle" } : null));
      }, 620);
      return () => window.clearTimeout(t2);
    }
    if (deckDrawFx.phase === "settle") {
      const t3 = window.setTimeout(() => {
        setDeckDrawFx((prev) => (prev ? { ...prev, phase: "fade" } : null));
      }, 320);
      return () => window.clearTimeout(t3);
    }

    const t4 = window.setTimeout(() => {
      setDeckDrawFx(null);
      const hasQueued = drawFxQueueRef.current.length > 0;
      if (hasQueued) {
        const started = startNextDeckDrawFx();
        if (started) {
          return;
        }
        drawFxQueueRef.current = [];
        flushBufferedHandCards();
        return;
      }
      flushBufferedHandCards();
    }, 260);
    return () => window.clearTimeout(t4);
  }, [deckDrawFx, flushBufferedHandCards, startNextDeckDrawFx]);

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
        sessionToken={sessionToken}
        highlightOwnerSessionToken={highlightOwnerSessionToken}
        onHoverOwner={onHoverOwner}
        onToggleOwner={onToggleOwner}
        onSetLang={onSetLang}
        onOpenScoringHelp={handleOpenMyScoringHelp}
        onOpenTutorial={onToggleTutorial}
      />

      <div className={["game-layout", game.finished ? "game-layout-finished" : ""].join(" ")}>
        <aside className="game-side side-left">
          {game.finished ? (
            <PanelShell
              title={t(lang, "results.finalStandings")}
              infoText={t(lang, "ui.panelHelp.finalStandings")}
              className="card side-card h-full"
            >
              <div className="final-side-list">
                {finalStandings.map((standing, idx) => {
                  const playerIndex = game.players.findIndex((p) => p.sessionToken === standing.sessionToken);
                  const color = PLAYER_COLORS[Math.max(0, playerIndex) % PLAYER_COLORS.length] ?? "#94a3b8";
                  return (
                    <div
                      key={standing.sessionToken}
                      className="final-side-item"
                    >
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
                infoText={t(lang, "ui.panelHelp.routes")}
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
                infoText={t(lang, "ui.panelHelp.buildStation")}
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
              infoText={t(lang, "ui.panelHelp.waiting")}
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
                onOpenCardDrawFxStart={(index) => {
                  pendingMyOpenDrawIndicesRef.current.push(index);
                  const openCard = game.openCards[index];
                  if (openCard?.color) {
                    pendingMyOpenDrawColorsRef.current.push(openCard.color as CardColor);
                  }
                }}
                onDrawCard={onDrawCard}
              />
            </div>
          )}
        </div>

        {game.finished ? (
          <aside className="game-side side-right">
            <PanelShell
              title={t(lang, "results.gameStats")}
              className="card side-card h-full"
            >
              <div className="h-full min-h-0 flex flex-col gap-2">
                <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2">
                  {finalStandings.map((standing) => {
                    const playerIndex = game.players.findIndex((p) => p.sessionToken === standing.sessionToken);
                    const color = PLAYER_COLORS[Math.max(0, playerIndex) % PLAYER_COLORS.length] ?? "#94a3b8";
                    const routeCapturePoints = standing.points
                      - standing.destinationPointsDelta
                      - standing.stationPointsBonus
                      - standing.longestPathBonus;
                    return (
                      <div key={standing.sessionToken} className="rounded-xl border border-slate-700 bg-slate-900/70 p-2">
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <span className="font-semibold" style={{ color }}>{standing.nickname}</span>
                          <strong className="text-slate-100">{standing.points} {t(lang, "ui.pointsShort")}</strong>
                        </div>
                        <div className="mt-1 text-[11px] text-slate-300 grid grid-cols-1 gap-0.5">
                          <span>{t(lang, "ui.scoreRoutes")}: {routeCapturePoints >= 0 ? `+${routeCapturePoints}` : routeCapturePoints}</span>
                          <span>{t(lang, "ui.scoreDestinations")}: {standing.destinationPointsDelta >= 0 ? `+${standing.destinationPointsDelta}` : standing.destinationPointsDelta}</span>
                          <span>{t(lang, "ui.scoreStations")}: {standing.stationPointsBonus >= 0 ? `+${standing.stationPointsBonus}` : standing.stationPointsBonus}</span>
                          <span>{t(lang, "ui.scoreLongestPath")}: {standing.longestPathBonus >= 0 ? `+${standing.longestPathBonus}` : standing.longestPathBonus}</span>
                          <span>{t(lang, "results.destinations")}: {standing.completedDestinations}/{standing.totalDestinations}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button type="button" className="mt-1" onClick={onBackToLobby}>
                  {t(lang, "ui.toLobby")}
                </button>
              </div>
            </PanelShell>
          </aside>
        ) : (
          <GameRightPanel
            game={game}
            me={me}
            handCards={displayedHandCards}
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
        targetSessionToken={scoreModalSessionToken ?? undefined}
        onClose={handleCloseScoringHelp}
      />

      <GameTutorialModal
        open={isTutorialOpen}
        lang={lang}
        onClose={onToggleTutorial}
      />

      {deckDrawFx && (
        <div className="deck-draw-fx-layer" aria-hidden="true">
          {deckDrawFx.cards.map((color, idx) => {
            const spread = deckDrawFx.cardW + 8;
            const centeredOffset = idx - (deckDrawFx.cards.length - 1) / 2;
            const fromX = deckDrawFx.startX + centeredOffset * spread;
            const fromY = deckDrawFx.startY;
            const fallbackToX = deckDrawFx.targetX + centeredOffset * spread;
            const fallbackToY = deckDrawFx.targetY;
            let toX = fallbackToX;
            let toY = fallbackToY;

            if (deckDrawFx.targetKind === "hand" && !deckDrawFx.hideFace) {
              const handColorAnchor = document.querySelector(`[data-hand-card-color='${color}']`) as HTMLElement | null;
              if (handColorAnchor) {
                const anchorRect = handColorAnchor.getBoundingClientRect();
                toX = anchorRect.left + anchorRect.width * 0.5 - deckDrawFx.cardW / 2;
                toY = anchorRect.top + anchorRect.height * 0.5 - deckDrawFx.cardH / 2;
              } else {
                const handEndAnchor = document.querySelector("[data-hand-end-slot-anchor='true']") as HTMLElement | null;
                if (handEndAnchor) {
                  const endRect = handEndAnchor.getBoundingClientRect();
                  toX = endRect.left + endRect.width * 0.5 - deckDrawFx.cardW / 2;
                  toY = endRect.top + endRect.height * 0.5 - deckDrawFx.cardH / 2;
                }
              }
            }
            const dx = toX - fromX;
            const dy = toY - fromY;
            const cfg = CARD_CFG[color];
            return (
              <span
                key={`${deckDrawFx.id}-${idx}`}
                className={[
                  "deck-draw-fx-card",
                  deckDrawFx.targetKind === "player" ? "deck-draw-fx-card-quick" : "",
                  deckDrawFx.phase === "reveal" ? "deck-draw-fx-card-reveal" : "",
                  deckDrawFx.phase === "fly" ? "deck-draw-fx-card-fly" : "",
                  deckDrawFx.phase === "settle" ? "deck-draw-fx-card-settle" : "",
                  deckDrawFx.phase === "fade" ? "deck-draw-fx-card-fade" : "",
                ].join(" ")}
                style={{
                  left: `${fromX}px`,
                  top: `${fromY}px`,
                  width: `${deckDrawFx.cardW}px`,
                  height: `${deckDrawFx.cardH}px`,
                  transform: (deckDrawFx.phase === "fly" || deckDrawFx.phase === "settle" || deckDrawFx.phase === "fade")
                    ? `translate(${dx}px, ${dy}px) scale(0.92)`
                    : "translate(0,0) scale(1)",
                  transitionDelay: deckDrawFx.phase === "fly" && deckDrawFx.targetKind === "hand" ? `${idx * 35}ms` : "0ms",
                  background: deckDrawFx.hideFace ? "linear-gradient(160deg,#1e293b,#0f172a)" : (cfg.gradient ?? cfg.bg),
                  borderColor: deckDrawFx.hideFace ? "#475569" : cfg.border,
                  color: deckDrawFx.hideFace ? "#e2e8f0" : cfg.text,
                }}
              >
                <span className="deck-draw-fx-icon">
                  {deckDrawFx.hideFace
                    ? null
                    : (color === "locomotive"
                      ? <LocomotiveStatIcon className="w-5 h-5" />
                      : <span className="deck-draw-fx-icon-glyph">{cfg.icon}</span>)}
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

