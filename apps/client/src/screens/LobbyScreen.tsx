import { memo } from "react";
import { MAPS } from "@ttr/shared";
import { socket } from "../socket";
import { t, type Lang } from "../lib/i18n";
import { GAME_DEFAULTS, SOCKET_EVENTS } from "../lib/constants";
import { LocomotiveStatIcon } from "../components/StatIcons";

interface LobbyScreenProps {
  nickname: string;
  onNicknameChange: (value: string) => void;
  rooms: any[];
  maxPlayers: number;
  onMaxPlayersChange: (value: number) => void;
  timer: number;
  onTimerChange: (value: number) => void;
  mapId: string;
  onMapIdChange: (value: string) => void;
  lang: Lang;
  onCreateRoom: (mapId: string, maxPlayers: number, timer: number) => void;
  onJoinRoom: (roomId: string, asSpectator: boolean) => void;
}

const LobbyScreenComponent = ({
  nickname,
  onNicknameChange,
  rooms,
  maxPlayers,
  onMaxPlayersChange,
  timer,
  onTimerChange,
  mapId,
  onMapIdChange,
  lang,
  onCreateRoom,
  onJoinRoom,
}: LobbyScreenProps) => {
  return (
    <>
      <h1><span className="inline-flex items-center gap-2"><LocomotiveStatIcon className="w-6 h-6" />Ticket to Ride</span></h1>

      {/* Profile */}
      <section className="card">
        <h2>{t(lang, "ui.profile")}</h2>
        <div className="row">
          <input
            data-testid="nickname-input"
            value={nickname}
            onChange={(e) => onNicknameChange(e.target.value)}
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
            <input
              type="number"
              min={GAME_DEFAULTS.MIN_PLAYERS}
              max={GAME_DEFAULTS.MAX_PLAYERS_LIMIT}
              value={maxPlayers}
              onChange={(e) => onMaxPlayersChange(Number(e.target.value || GAME_DEFAULTS.MAX_PLAYERS))}
              style={{ width: 52 }}
            />
          </label>
          <label>
            {t(lang, "ui.timer")}:
            <input
              type="number"
              min={0}
              max={180}
              value={timer}
              onChange={(e) => onTimerChange(Number(e.target.value || 0))}
              style={{ width: 60 }}
            />
          </label>
          <label>
            {t(lang, "ui.map")}:
            <select value={mapId} onChange={(e) => onMapIdChange(e.target.value)}>
              {Object.values(MAPS).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <button
            data-testid="create-room-btn"
            onClick={() => onCreateRoom(mapId, maxPlayers, timer)}
          >
            {t(lang, "ui.createRoom")}
          </button>
          <button onClick={() => socket.emit(SOCKET_EVENTS.ROOM_LIST)}>
            ↻ {t(lang, "ui.refresh")}
          </button>
        </div>

        <div className="rooms" data-testid="rooms-list">
          {rooms.length === 0 && <p className="hint">{t(lang, "ui.noRooms")}</p>}
          {rooms.map((r) => (
            <div className="room" key={r.roomId} data-testid={`room-row-${r.roomId}`}>
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
                <button
                  data-testid={`join-room-btn-${r.roomId}`}
                  onClick={() => onJoinRoom(r.roomId, false)}
                >
                  {t(lang, "ui.join")}
                </button>
                <button onClick={() => onJoinRoom(r.roomId, true)}>
                  👁 {t(lang, "ui.watch")}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

export const LobbyScreen = memo(LobbyScreenComponent);

