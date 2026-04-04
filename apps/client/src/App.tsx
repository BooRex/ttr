import { useEffect, useMemo, useState } from "react";
import type { DestinationCard } from "@ttr/shared";
import { useAppStore } from "./store";
import { useGameSession } from "./processes/game-session/useGameSession";
import { ToastHost } from "./components/ToastHost";
import { t } from "./lib/i18n";
import { startKeepAlive } from "./lib/keepAlive";
import { GAME_DEFAULTS } from "./lib/constants";
import {
  useMediaQueries,
  useToasts,
  useTurnPulse,
  useLobbyLogic,
  useGameLogic,
  useGameBodyLock,
  useBoardHighlight,
  useLang,
  useHoverState,
} from "./hooks";
import { LobbyScreen, WaitingRoomScreen, GameScreen, ResultsScreen } from "./screens";

export const App = () => {
  const {
    nickname,
    sessionToken,
    rooms,
    game,
    roomId,
    error,
    setNickname,
    setSessionToken,
    setRooms,
    setRoomId,
    setGame,
    setError,
  } = useAppStore();

  // ── Lobby form state ───────────────────────────────────────────────────────
  const [maxPlayers, setMaxPlayers] = useState<number>(GAME_DEFAULTS.MAX_PLAYERS);
  const [timer, setTimer] = useState<number>(GAME_DEFAULTS.TIMER_DEFAULT);
  const [mapId, setMapId] = useState<string>(GAME_DEFAULTS.MAP_DEFAULT);
  const [isEventsOpen, setIsEventsOpen] = useState(false);
  const [isScoringHelpOpen, setIsScoringHelpOpen] = useState(false);
  const [hoveredPendingDestination, setHoveredPendingDestination] = useState<DestinationCard | null>(null);
  const [selectedStationCity, setSelectedStationCity] = useState("");

  // ── Hooks ──────────────────────────────────────────────────────────────────
  const { isMobileLayout, isPortrait } = useMediaQueries();
  const { toasts, addToast, dismissToast } = useToasts();
  const [lang, setLang] = useLang();
  const {
    hoveredDestination,
    setHoveredDestination,
    hoveredConnection,
    setHoveredConnection,
    highlightOwnerSessionToken,
    setHighlightOwnerSessionToken,
  } = useHoverState();

  const activePlayer = game?.players[game.activePlayerIndex] ?? null;
  const { turnPulse } = useTurnPulse(activePlayer?.sessionToken, sessionToken);
  const { createRoom, joinRoom } = useLobbyLogic({ nickname, sessionToken });
  const gameLogic = useGameLogic({ game, roomId, sessionToken });

  useGameBodyLock(Boolean(game?.started));

  // ── Keep-Alive: ping backend каждые 5 минут ─────────────────────────────
  useEffect(() => {
    startKeepAlive();
  }, []);

  const selectedPendingDestinations = useMemo(() => {
    if (!gameLogic.pendingChoice || gameLogic.selectedDestinationIds.length === 0) return [];
    return gameLogic.pendingChoice.cards.filter((card) => gameLogic.selectedDestinationIds.includes(card.id));
  }, [gameLogic.pendingChoice, gameLogic.selectedDestinationIds]);

  const boardHighlight = useBoardHighlight(
    game,
    sessionToken,
    hoveredPendingDestination ?? hoveredDestination,
    hoveredConnection,
    selectedPendingDestinations,
  );

  // ── Game session setup ─────────────────────────────────────────────────────
  useGameSession({
    roomId,
    sessionToken,
    setSessionToken,
    setRooms,
    setRoomId,
    setGame,
    setError,
    addToast,
  });

  // ── Screen routing ─────────────────────────────────────────────────────────
  const inRoom = Boolean(game);
  const gameStarted = game?.started ?? false;


  useEffect(() => {
    if (!gameLogic.pendingChoice) {
      setHoveredPendingDestination(null);
    }
  }, [gameLogic.pendingChoice]);

  useEffect(() => {
    if (!gameStarted) {
      setSelectedStationCity("");
    }
  }, [gameStarted]);

  const handleExitGame = () => {
    setRoomId("");
    setError("");
  };


  return (
    <div className={gameStarted ? "page page-game" : "page"}>
      {/* Top controls (lang selector for lobby) */}
      {!gameStarted && (
        <div className="global-top-controls">
          <label className="lang-select-wrap">
            <select value={lang} onChange={(e) => setLang(e.target.value as any)}>
              {(["ru", "uk", "en", "de"] as const).map((code) => (
                <option key={code} value={code}>
                  {t(lang, `lang.${code}`)}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {/* Lobby Screen */}
      {!inRoom && (
        <LobbyScreen
          nickname={nickname}
          onNicknameChange={setNickname}
          rooms={rooms}
          maxPlayers={maxPlayers}
          onMaxPlayersChange={setMaxPlayers}
          timer={timer}
          onTimerChange={setTimer}
          mapId={mapId}
          onMapIdChange={setMapId}
          lang={lang}
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
        />
      )}

      {/* Waiting Room Screen */}
      {game && !gameStarted && (
        <WaitingRoomScreen
          game={game}
          lang={lang}
          sessionToken={sessionToken}
          onStartGame={gameLogic.startGame}
          onLeave={handleExitGame}
        />
      )}

      {/* Game Screen */}
      {gameStarted && !game?.finished && game !== null && (
        <GameScreen
          game={game}
          lang={lang}
          sessionToken={sessionToken}
          isMyTurn={gameLogic.isMyTurn}
          turnPulse={turnPulse}
          canAct={gameLogic.canAct}
          isMobileLayout={isMobileLayout}
          isPortrait={isPortrait}
          isEventsOpen={isEventsOpen}
          onToggleEvents={() => setIsEventsOpen((c) => !c)}
          isScoringHelpOpen={isScoringHelpOpen}
          onToggleScoringHelp={() => setIsScoringHelpOpen((c) => !c)}
          me={gameLogic.me}
          activePlayer={gameLogic.activePlayer}
          winner={gameLogic.winner}
          pendingChoice={gameLogic.pendingChoice}
          isMyPendingChoice={gameLogic.isMyPendingChoice}
          selectedRouteId={gameLogic.selectedRouteId}
          onSelectRoute={gameLogic.setSelectedRouteId}
          selectedColor={gameLogic.selectedColor}
          selectedLocoCount={gameLogic.selectedLocoCount}
          selectedDestinationIds={gameLogic.selectedDestinationIds}
          onToggleDestination={(id) =>
            gameLogic.setSelectedDestinationIds((c) =>
              c.includes(id) ? c.filter((x) => x !== id) : [...c, id],
            )
          }
          onHoverPendingDestination={setHoveredPendingDestination}
          highlightOwnerSessionToken={highlightOwnerSessionToken}
          onHoverOwner={setHighlightOwnerSessionToken}
          onToggleOwner={(token) =>
            setHighlightOwnerSessionToken((c) => (c === token ? null : token))
          }
          highlightRouteIds={boardHighlight.routeIds}
          highlightCityNames={boardHighlight.cityNames}
          onHoverDestination={setHoveredDestination}
          onHoverConnection={(from, to) => setHoveredConnection({ from, to })}
          onLeaveConnection={() => setHoveredConnection(null)}
          onDrawCard={gameLogic.drawCardFrom}
          onClaimRoute={gameLogic.claimRoute}
          onBuildStation={gameLogic.buildStation}
          selectedStationCity={selectedStationCity}
          onSelectStationCity={setSelectedStationCity}
          onSelectClaim={(opt) => gameLogic.onSelectClaim(opt.baseColor, opt.locoCount)}
          onDrawDestinations={gameLogic.drawDestinations}
          onConfirmDestinations={gameLogic.confirmDestinations}
          onDeselectRoute={() => gameLogic.setSelectedRouteId("")}
          onSetLang={setLang}
          onBackToLobby={handleExitGame}
        />
      )}

      {/* Results Screen */}
      {game?.finished && game !== null && (
        <ResultsScreen
          game={game}
          lang={lang}
          sessionToken={sessionToken}
          onBackToLobby={handleExitGame}
        />
      )}

      {/* Error message */}
      {error && <p className="error" style={{ marginTop: 8 }}>⚠ {error}</p>}

      {/* Toast notifications */}
      <ToastHost toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

