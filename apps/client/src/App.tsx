import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MAPS, type CardColor, type DestinationCard } from "@ttr/shared";
import { socket } from "./socket";
import { useAppStore } from "./store";
import { useGameSession } from "./processes/game-session/useGameSession";
import {
  buildConnectionHighlight,
  buildOwnedDestinationHighlight,
  selectActivePlayer,
  selectCanAct,
  selectIsMyPendingChoice,
  selectIsMyTurn,
  selectMe,
  selectWinner,
  type RouteHighlight,
} from "./entities/game/model";
import { ActionPanel, type ClaimOpt } from "./components/ActionPanel";
import { EventLog } from "./components/EventLog";
import { GameTopbar } from "./widgets/game-topbar";
import { GameBoardSlot } from "./widgets/game-board";
import { GameRightPanel } from "./widgets/game-right-panel";
import { ToastHost } from "./components/ToastHost";
import { PLAYER_COLORS } from "./lib/colors";
import { defaultLang, getInitialLang, setLangStorage, t, type Lang } from "./lib/i18n";

type Toast = { id: string; kind: "error" | "info"; message: string };

export const App = () => {
  const {
    nickname, sessionToken, rooms, game, roomId, error,
    setNickname, setSessionToken, setRooms, setRoomId, setGame, setError,
  } = useAppStore();

  const [selectedRouteId, setSelectedRouteId] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<CardColor>("red");
  const [selectedLocoCount, setSelectedLocoCount] = useState<number>(0);
  const [selectedDestinationIds, setSelectedDestinationIds] = useState<string[]>([]);
  const [hoveredDestination, setHoveredDestination] = useState<DestinationCard | null>(null);
  const [hoveredConnection, setHoveredConnection] = useState<{ from: string; to: string } | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [maxPlayers, setMaxPlayers] = useState<number>(2);
  const [timer, setTimer] = useState<number>(0);
  const [mapId, setMapId] = useState("europe");
  const [lang, setLang] = useState<Lang>(() => {
    try {
      return getInitialLang();
    } catch {
      return defaultLang;
    }
  });
  const [highlightOwnerSessionToken, setHighlightOwnerSessionToken] = useState<string | null>(null);
  const [isEventsOpen, setIsEventsOpen] = useState(false);
  const [isMobileLayout, setIsMobileLayout] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 900px)").matches : false,
  );
  const [turnPulse, setTurnPulse] = useState(false);
  const audioUnlocked = useRef(false);
  const prevActiveTokenRef = useRef<string | null>(null);
  const [isPortrait, setIsPortrait] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.matchMedia("(orientation: portrait)").matches : false,
  );

  const addToast = useCallback((kind: Toast["kind"], message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((c) => [...c, { id, kind, message }]);
    window.setTimeout(() => setToasts((c) => c.filter((t) => t.id !== id)), 4500);
  }, []);

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

  useEffect(() => {
    const media = window.matchMedia("(orientation: portrait)");
    const onChange = () => setIsPortrait(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 900px)");
    const onChange = () => setIsMobileLayout(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    setLangStorage(lang);
  }, [lang]);

  useEffect(() => {
    const unlock = () => {
      audioUnlocked.current = true;
      window.removeEventListener("pointerdown", unlock);
    };
    window.addEventListener("pointerdown", unlock);
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  useEffect(() => {
    const lock = Boolean(game?.started);
    document.body.classList.toggle("game-scroll-lock", lock);
    return () => document.body.classList.remove("game-scroll-lock");
  }, [game?.started]);

  // ── derived state ──────────────────────────────────────────────────────────
  const me = useMemo(() => selectMe(game ?? null, sessionToken), [game, sessionToken]);
  const activePlayer = useMemo(() => selectActivePlayer(game ?? null), [game]);
  const isMyTurn = useMemo(() => selectIsMyTurn(game ?? null, sessionToken), [game, sessionToken]);
  const pendingChoice = game?.pendingDestinationChoice;
  const isMyPendingChoice = useMemo(() => selectIsMyPendingChoice(game ?? null, sessionToken), [game, sessionToken]);

  const winner = useMemo(() => selectWinner(game ?? null) ?? null, [game]);
  const canAct = useMemo(() => selectCanAct(game ?? null, sessionToken), [game, sessionToken]);

  useEffect(() => {
    const activeToken = activePlayer?.sessionToken ?? null;
    if (!game?.started || game.finished || !activeToken) {
      prevActiveTokenRef.current = activeToken;
      return;
    }
    const changed = prevActiveTokenRef.current && prevActiveTokenRef.current !== activeToken;
    if (changed && activeToken === sessionToken) {
      setTurnPulse(true);
      window.setTimeout(() => setTurnPulse(false), 1100);
      if (audioUnlocked.current) {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(640, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(980, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.09, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.82);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.85);
        osc.onended = () => void ctx.close();
      }
    }
    prevActiveTokenRef.current = activeToken;
  }, [activePlayer?.sessionToken, game?.finished, game?.started, sessionToken]);


  // ── destination choice cleanup ─────────────────────────────────────────────
  useEffect(() => {
    if (!pendingChoice || pendingChoice.sessionToken !== sessionToken) {
      setSelectedDestinationIds([]);
    } else {
      setSelectedDestinationIds((c) => c.filter((id) => pendingChoice.cards.some((card) => card.id === id)));
    }
  }, [pendingChoice, sessionToken]);

  // Drop selected route after it gets claimed (or otherwise becomes unavailable).
  useEffect(() => {
    if (!game?.started || !selectedRouteId) return;
    const route = game.routes.find((r) => r.id === selectedRouteId);
    if (!route || route.ownerSessionToken) {
      setSelectedRouteId("");
      setSelectedLocoCount(0);
    }
  }, [game?.routes, game?.started, selectedRouteId]);

  // ── actions ────────────────────────────────────────────────────────────────
  const createRoom = () => {
    if (!nickname.trim()) { addToast("error", t(lang, "errors.enterNickname")); return; }
    socket.emit("room:create", { nickname, sessionToken, mapId, maxPlayers, turnTimerSeconds: timer > 0 ? timer : null });
  };

  const joinRoom = (id: string, asSpectator = false) => {
    if (!nickname.trim()) { addToast("error", t(lang, "errors.enterNickname")); return; }
    socket.emit("room:join", { roomId: id, nickname, sessionToken, asSpectator });
  };

  const startGame = () => socket.emit("room:start", { roomId, sessionToken });

  const drawCardFrom = (index?: number) => {
    socket.emit("game:draw-card", { roomId, sessionToken, fromOpenIndex: index });
  };

  const claimRoute = () => {
    if (!selectedRouteId) { addToast("error", t(lang, "errors.selectRouteFirst")); return; }
    socket.emit("game:claim-route", {
      roomId,
      sessionToken,
      routeId: selectedRouteId,
      color: selectedColor,
      useLocomotives: selectedLocoCount,
    });
  };

  const onSelectClaim = (opt: ClaimOpt) => {
    setSelectedColor(opt.baseColor);
    setSelectedLocoCount(opt.locoCount);
  };

  const drawDestinations = () => socket.emit("game:draw-destinations", { roomId, sessionToken });

  const confirmDestinations = () => {
    if (!pendingChoice) return;
    socket.emit("game:choose-destinations", { roomId, sessionToken, keepIds: selectedDestinationIds });
  };

  // ── screen: lobby ──────────────────────────────────────────────────────────
  const inRoom = Boolean(game);

  // ── render ─────────────────────────────────────────────────────────────────
  const destinationHighlight = useMemo<RouteHighlight>(() => {
    if (!game || !hoveredDestination) return { routeIds: [], cityNames: [] };
    return buildOwnedDestinationHighlight(game.routes, sessionToken, hoveredDestination);
  }, [game, hoveredDestination, sessionToken]);

  const connectionHighlight = useMemo<RouteHighlight>(() => {
    if (!game || !hoveredConnection) return { routeIds: [], cityNames: [] };
    return buildConnectionHighlight(game.routes, hoveredConnection.from, hoveredConnection.to);
  }, [game, hoveredConnection]);

  const boardHighlight = hoveredDestination ? destinationHighlight : connectionHighlight;

  return (
    <div className={game?.started ? "page page-game" : "page"}>
      {!game?.started && (
        <div className="global-top-controls">
          <label className="lang-select-wrap">
            <select value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
              {(["ru", "uk", "en", "de"] as Lang[]).map((code) => (
                <option key={code} value={code}>{t(lang, `lang.${code}`)}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      {/* ── LOBBY / WAITING screen ─────────────────────────────────────────── */}
      {!inRoom && (
        <>
          <h1>🚂 Ticket to Ride</h1>

          {/* Profile */}
          <section className="card">
            <h2>{t(lang, "ui.profile")}</h2>
            <div className="row">
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder={t(lang, "ui.nickname")}
                style={{ flex: 1 }}
              />
            </div>
          </section>

          {/* Create / list rooms */}
          <section className="card">
            <h2>{t(lang, "ui.lobby")}</h2>
            <div className="row wrap">
              <label>
                {t(lang, "ui.players")}:
                <input type="number" min={2} max={5} value={maxPlayers}
                  onChange={(e) => setMaxPlayers(Number(e.target.value || 2))}
                  style={{ width: 52 }} />
              </label>
              <label>
                {t(lang, "ui.timer")}:
                <input type="number" min={0} max={180} value={timer}
                  onChange={(e) => setTimer(Number(e.target.value || 0))}
                  style={{ width: 60 }} />
              </label>
              <label>
                {t(lang, "ui.map")}:
                <select value={mapId} onChange={(e) => setMapId(e.target.value)}>
                  {Object.values(MAPS).map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </label>
              <button onClick={createRoom}>{t(lang, "ui.createRoom")}</button>
              <button onClick={() => socket.emit("room:list")}>↻ {t(lang, "ui.refresh")}</button>
            </div>

            <div className="rooms">
              {rooms.length === 0 && <p className="hint">{t(lang, "ui.noRooms")}</p>}
              {rooms.map((r) => (
                <div className="room" key={r.roomId}>
                  <span className="room-info">
                    <strong>{r.roomId}</strong>
                    {" "}— {r.playersCount}/{r.maxPlayers} {t(lang, "ui.players")}
                    {r.timerSeconds ? ` • ${r.timerSeconds}${t(lang, "ui.secondsShort")}` : ""}
                    {" "}
                    <span className={r.started ? "badge started" : "badge waiting"}>
                      {r.started ? t(lang, "ui.roomStarted") : t(lang, "ui.roomWaiting")}
                    </span>
                  </span>
                  <div className="row">
                    <button onClick={() => joinRoom(r.roomId)}>{t(lang, "ui.join")}</button>
                    <button onClick={() => joinRoom(r.roomId, true)}>👁 {t(lang, "ui.watch")}</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      {/* ── WAITING room (joined but not started) ──────────────────────────── */}
      {game && !game.started && (
        <section className="card">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h2>{t(lang, "ui.room")} {game.roomId}</h2>
            <button onClick={() => { setGame({ ...game }); setRoomId(""); setError(""); }}>← {t(lang, "ui.leave")}</button>
          </div>
          <p>{t(lang, "ui.map")}: {MAPS[game.mapId]?.name ?? game.mapId}</p>
          <ul>
            {game.players.map((p, i) => (
              <li key={p.sessionToken} style={{ color: PLAYER_COLORS[i] }}>
                {p.nickname} {p.sessionToken === sessionToken ? `(${t(lang, "ui.youShort")})` : ""}
              </li>
            ))}
          </ul>
          <p className="hint">{t(lang, "ui.playersConnected", { need: game.settings.maxPlayers, current: game.players.length })}</p>
          <button onClick={startGame} disabled={game.players.length < 2}>
            🚂 {t(lang, "ui.startGame")}
          </button>
        </section>
      )}

      {/* ── GAME screen ────────────────────────────────────────────────────── */}
      {game?.started && (
        <div className="game-screen">

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
            onHoverOwner={setHighlightOwnerSessionToken}
            onToggleOwner={(token) => setHighlightOwnerSessionToken((c) => c === token ? null : token)}
            onSetLang={setLang}
          />

          <div className="game-layout">
            <aside className="game-side side-left">
              <div className="card side-card side-scroll">
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
                  onToggleDestination={(id) =>
                    setSelectedDestinationIds((c) =>
                      c.includes(id) ? c.filter((x) => x !== id) : [...c, id]
                    )
                  }
                  onConfirmDestinations={confirmDestinations}
                  onSelectClaim={onSelectClaim}
                  onDrawCard={drawCardFrom}
                  onDrawDestinations={drawDestinations}
                  onClaimRoute={claimRoute}
                  onDeselectRoute={() => setSelectedRouteId("")}
                />
              </div>
            </aside>

            <GameBoardSlot
              mapId={game.mapId}
              lang={lang}
              routes={game.routes}
              players={game.players}
              selectedRouteId={selectedRouteId}
              highlightOwnerSessionToken={highlightOwnerSessionToken}
              highlightRouteIds={boardHighlight.routeIds}
              highlightCityNames={boardHighlight.cityNames}
              onSelectRoute={setSelectedRouteId}
            />

            <GameRightPanel
              game={game}
              me={me}
              winner={winner}
              lang={lang}
              onHoverDestination={setHoveredDestination}
              onLeaveDestination={() => setHoveredDestination(null)}
              onHoverConnection={(from, to) => setHoveredConnection({ from, to })}
              onLeaveConnection={() => setHoveredConnection(null)}
              onBackToLobby={() => { setRoomId(""); setGame({ ...game }); }}
            />
          </div>

          <button className="events-fab" onClick={() => setIsEventsOpen(true)}>
            {t(lang, "ui.openEvents")}
          </button>

          {isMobileLayout && isEventsOpen && (
            <div className="events-modal">
              <div className="events-modal-head">
                <h3>{t(lang, "ui.events")}</h3>
                <button onClick={() => setIsEventsOpen(false)}>{t(lang, "ui.close")}</button>
              </div>
              <EventLog
                events={game.events ?? []}
                players={game.players}
                lang={lang}
                onHoverConnection={(from, to) => setHoveredConnection({ from, to })}
                onLeaveConnection={() => setHoveredConnection(null)}
              />
            </div>
          )}
        </div>
      )}

      {error && <p className="error" style={{ marginTop: 8 }}>⚠ {error}</p>}
      <ToastHost toasts={toasts} onDismiss={(id) => setToasts((c) => c.filter((t) => t.id !== id))} />
    </div>
  );
};

