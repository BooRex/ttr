import { memo } from "react";
import type { GameState } from "@ttr/shared";
import { PLAYER_COLORS } from "../lib/colors";
import { t, type Lang } from "../lib/i18n";
import { LocomotiveStatIcon } from "../components/StatIcons";
import { LobbyLogo } from "../components/LobbyLogo";

interface WaitingRoomScreenProps {
  game: GameState;
  lang: Lang;
  sessionToken: string;
  onStartGame: () => void;
  onLeave: () => void;
}

const WaitingRoomScreenComponent = ({
  game,
  lang,
  sessionToken,
  onStartGame,
  onLeave,
}: WaitingRoomScreenProps) => {
  const hostSessionToken = game.players[0]?.sessionToken ?? "";
  const isHost = hostSessionToken === sessionToken;

  return (
    <div className="lobby-screen waiting-room-screen-wrap" data-testid="waiting-room-screen">
      <h1 className="lobby-logo-title">
        <LobbyLogo lang={lang} />
      </h1>

      <section className="card lobby-card waiting-room-card">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h2>
            {t(lang, "ui.room")} {game.roomId}
          </h2>
          <button onClick={onLeave}>← {t(lang, "ui.back")}</button>
        </div>


        <div className="waiting-room-players" role="list" aria-label={t(lang, "ui.players")}>
          {game.players.map((p: any, i: number) => (
            <div key={p.sessionToken} className="waiting-room-player" role="listitem">
              <span
                className="waiting-room-player-dot"
                data-testid={`waiting-player-dot-${p.sessionToken}`}
                style={{ ["--dot-color" as string]: PLAYER_COLORS[i % PLAYER_COLORS.length] }}
                aria-hidden="true"
              >
                <span>{i + 1}</span>
              </span>
              <span className="waiting-room-player-name">
                {p.nickname}{" "}
                {p.sessionToken === sessionToken ? `(${t(lang, "ui.youShort")})` : ""}
              </span>
            </div>
          ))}
        </div>

        <p className="hint">
          {t(lang, "ui.playersConnected", {
            need: game.settings.maxPlayers,
            current: game.players.length,
          })}
        </p>

        {isHost ? (
          <button
            className="waiting-room-start-btn"
            data-testid="start-game-btn"
            onClick={onStartGame}
            disabled={game.players.length < 2}
          >
            <span className="inline-flex items-center gap-1"><LocomotiveStatIcon />{t(lang, "ui.startGame")}</span>
          </button>
        ) : (
          <p className="hint">{t(lang, "ui.waitingHostStart")}</p>
        )}
      </section>
    </div>
  );
};

export const WaitingRoomScreen = memo(WaitingRoomScreenComponent);

