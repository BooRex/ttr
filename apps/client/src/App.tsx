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
import { BoardCanvas } from "./components/BoardCanvas";
import { HandCards } from "./components/HandCards";
import { ActionPanel, type ClaimOpt } from "./components/ActionPanel";
import { DestinationBadge } from "./components/DestinationBadge";
import { EventLog } from "./components/EventLog";
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
    if (!nickname.trim()) { addToast("error", "Введите ник"); return; }
    socket.emit("room:create", { nickname, sessionToken, mapId, maxPlayers, turnTimerSeconds: timer > 0 ? timer : null });
  };

  const joinRoom = (id: string, asSpectator = false) => {
    if (!nickname.trim()) { addToast("error", "Введите ник"); return; }
    socket.emit("room:join", { roomId: id, nickname, sessionToken, asSpectator });
  };

  const startGame = () => socket.emit("room:start", { roomId, sessionToken });

  const drawCardFrom = (index?: number) => {
    socket.emit("game:draw-card", { roomId, sessionToken, fromOpenIndex: index });
  };

  const claimRoute = () => {
    if (!selectedRouteId) { addToast("error", "Сначала выберите маршрут на карте"); return; }
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
                    {r.timerSeconds ? ` • ${r.timerSeconds}с` : ""}
                    {" "}
                    <span className={r.started ? "badge started" : "badge waiting"}>
                      {r.started ? "Идёт игра" : "Ожидание"}
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
                {p.nickname} {p.sessionToken === sessionToken ? "(вы)" : ""}
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
          <div className="game-topbar">
            <span className="room-badge">{game.roomId}</span>
            {activePlayer && !game.finished && (
              <span className={["text-xs inline-flex items-center gap-1.5", turnPulse ? "turn-pulse text-green-300" : "text-slate-300"].join(" ")}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: PLAYER_COLORS[game.activePlayerIndex] }} />
                {isMyTurn ? t(lang, "ui.yourTurn") : t(lang, "ui.waiting")}
              </span>
            )}

            <div className="players-strip ml-auto">
              {game.players.map((player, idx) => {
                const color = PLAYER_COLORS[idx];
                const isActive = idx === game.activePlayerIndex && !game.finished;
                const isMe = player.sessionToken === sessionToken;
                const isHighlighted = highlightOwnerSessionToken === player.sessionToken;
                return (
                  <button
                    key={player.sessionToken}
                    className={["player-pill", isActive ? "active" : "", isHighlighted ? "highlighted" : ""].join(" ")}
                    onMouseEnter={() => setHighlightOwnerSessionToken(player.sessionToken)}
                    onMouseLeave={() => setHighlightOwnerSessionToken(null)}
                    onClick={() => setHighlightOwnerSessionToken((c) => c === player.sessionToken ? null : player.sessionToken)}
                    title={player.nickname}
                  >
                    <div
                      className={[
                        "player-avatar",
                        "w-7 h-7 rounded-full border-2 flex items-center justify-center",
                        "text-[11px] font-black select-none transition-transform",
                        isActive ? "scale-110" : "opacity-85",
                      ].join(" ")}
                      style={{
                        background: color,
                        borderColor: isActive ? "rgba(255,255,255,0.8)" : `${color}60`,
                        boxShadow: isActive ? `0 0 10px ${color}, 0 0 20px ${color}55` : "none",
                        color: idx === 3 ? "#111827" : "#fff",
                      }}
                    >
                      {isMe ? "★" : String(idx + 1)}
                    </div>
                    <span className="player-pill-meta">
                      {player.points}{t(lang, "ui.pointsShort")} · {player.wagonsLeft}🚃 · {player.hand.length}🃏
                    </span>
                  </button>
                );
              })}
            </div>

            <label className="lang-select-wrap">
              <select value={lang} onChange={(e) => setLang(e.target.value as Lang)}>
                {(["ru", "uk", "en", "de"] as Lang[]).map((code) => (
                  <option key={code} value={code}>{t(lang, `lang.${code}`)}</option>
                ))}
              </select>
            </label>
          </div>

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

            <div className="board-slot">
              <div className="board-square">
                <BoardCanvas
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
              </div>
            </div>

            <aside className="game-side side-right">
              {me && !me.isSpectator && (
                <div className="player-hand card side-card right-half">
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <strong>{t(lang, "ui.yourCards")}</strong>
                    <span className="hint">{me.wagonsLeft} {t(lang, "ui.wagons")} · {me.points} {t(lang, "ui.pointsShort")}</span>
                  </div>
                  <HandCards cards={me.hand} compact />
                  {me.destinations.length > 0 && (
                    <div className="my-destinations">
                      {me.destinations.map((d) => (
                        <DestinationBadge
                          key={d.id}
                          card={d}
                          lang={lang}
                          onMouseEnter={() => setHoveredDestination(d)}
                          onMouseLeave={() => setHoveredDestination(null)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="scoreboard card side-card desktop-events right-half">
                <h3>{t(lang, "ui.events")}</h3>
                <EventLog
                  events={game.events ?? []}
                  players={game.players}
                  lang={lang}
                  limit={20}
                  onHoverConnection={(from, to) => setHoveredConnection({ from, to })}
                  onLeaveConnection={() => setHoveredConnection(null)}
                />
              </div>

              {game.finished && (
                <div className="game-over card side-card">
                  <h2>🏁 {t(lang, "ui.gameOver")}</h2>
                  {winner && <p className="winner">🥇 {t(lang, "ui.winner")}: {winner.nickname}</p>}
                  <ol className="standings">
                    {game.finalStandings.map((s, i) => (
                      <li key={s.sessionToken}>
                        {i + 1}. {s.nickname} — {s.points} {t(lang, "ui.pointsShort")}
                        · {t(lang, "ui.builtRoutes")}: {s.completedDestinations}
                      </li>
                    ))}
                  </ol>
                  <button onClick={() => { setRoomId(""); setGame({ ...game }); }}>← {t(lang, "ui.toLobby")}</button>
                </div>
              )}
            </aside>
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

