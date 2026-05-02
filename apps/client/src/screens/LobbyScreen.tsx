import { memo } from "react";
import { socket } from "../socket";
import { t, type Lang } from "../lib/i18n";
import { SOCKET_EVENTS } from "../lib/constants";
import { LobbyLogo } from "../components/LobbyLogo";
import { PlayerCountPicker } from "../components/PlayerCountPicker";

interface LobbyScreenProps {
  nickname: string;
  onNicknameChange: (value: string) => void;
  rooms: any[];
  maxPlayers: number;
  onMaxPlayersChange: (value: number) => void;
  lang: Lang;
  onCreateRoom: (maxPlayers: number) => void;
  onJoinRoom: (roomId: string, asSpectator: boolean) => void;
}

const LobbyScreenComponent = ({
  nickname,
  onNicknameChange,
  rooms,
  maxPlayers,
  onMaxPlayersChange,
  lang,
  onCreateRoom,
  onJoinRoom,
}: LobbyScreenProps) => {
  const nicknameTrimmed = nickname.trim();
  const isNicknameValid = nicknameTrimmed.length > 0;

  return (
    <div className="lobby-screen">
      <h1 className="lobby-logo-title">
        <LobbyLogo lang={lang} />
      </h1>

      {/* Profile */}
      <section className="card lobby-card">
        <h2>{t(lang, "ui.profile")}</h2>
        <div className="row">
          <input
            data-testid="nickname-input"
            className={`nickname-input ${isNicknameValid ? "" : "nickname-input-error"}`.trim()}
            value={nickname}
            onChange={(e) => onNicknameChange(e.target.value)}
            placeholder={t(lang, "ui.nickname")}
            aria-invalid={!isNicknameValid}
            aria-describedby="nickname-help"
            style={{ flex: 1 }}
          />
        </div>
        {!isNicknameValid && (
          <p id="nickname-help" className="field-error">
            ⚠ {t(lang, "errors.enterNickname")}
          </p>
        )}
      </section>

      {/* Create / list rooms */}
      <section className="card lobby-card">
        <h2>{t(lang, "ui.lobby")}</h2>
        <div className="lobby-settings">
          <span className="lobby-settings-label">{t(lang, "ui.players")}</span>
          <PlayerCountPicker value={maxPlayers} onChange={onMaxPlayersChange} />
        </div>
        <div className="row wrap lobby-actions">
          <button
            data-testid="create-room-btn"
            disabled={!isNicknameValid}
            onClick={() => onCreateRoom(maxPlayers)}
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
                  disabled={!isNicknameValid}
                  onClick={() => onJoinRoom(r.roomId, false)}
                >
                  {t(lang, "ui.join")}
                </button>
                <button disabled={!isNicknameValid} onClick={() => onJoinRoom(r.roomId, true)}>
                  👁 {t(lang, "ui.watch")}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export const LobbyScreen = memo(LobbyScreenComponent);

