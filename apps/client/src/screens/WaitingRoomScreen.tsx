import { memo } from "react";
import { MAPS } from "@ttr/shared";
import type { GameState } from "@ttr/shared";
import { PLAYER_COLORS } from "../lib/colors";
import { t, type Lang } from "../lib/i18n";
import { LocomotiveStatIcon } from "../components/StatIcons";

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
    <section className="card" data-testid="waiting-room-screen">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h2>
          {t(lang, "ui.room")} {game.roomId}
        </h2>
        <button onClick={onLeave}>← {t(lang, "ui.leave")}</button>
      </div>
      <p>
        {t(lang, "ui.map")}: {MAPS[game.mapId]?.name ?? game.mapId}
      </p>
      <ul>
        {game.players.map((p: any, i: number) => (
          <li key={p.sessionToken} style={{ color: PLAYER_COLORS[i] }}>
            {p.nickname}{" "}
            {p.sessionToken === sessionToken ? `(${t(lang, "ui.youShort")})` : ""}
          </li>
        ))}
      </ul>
      <p className="hint">
        {t(lang, "ui.playersConnected", {
          need: game.settings.maxPlayers,
          current: game.players.length,
        })}
      </p>
      {isHost ? (
        <button
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
  );
};

export const WaitingRoomScreen = memo(WaitingRoomScreenComponent);

