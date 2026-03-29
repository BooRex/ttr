import type { DestinationCard, GameState, Player } from "@ttr/shared";
import { HandCards } from "../../../components/HandCards";
import { DestinationBadge } from "../../../components/DestinationBadge";
import { EventLog } from "../../../components/EventLog";
import { t, type Lang } from "../../../lib/i18n";

type Props = {
  game: GameState;
  me: Player | undefined;
  winner: Player | null;
  lang: Lang;
  onHoverDestination: (d: DestinationCard) => void;
  onLeaveDestination: () => void;
  onHoverConnection: (from: string, to: string) => void;
  onLeaveConnection: () => void;
  onBackToLobby: () => void;
};

export const GameRightPanel = ({
  game,
  me,
  winner,
  lang,
  onHoverDestination,
  onLeaveDestination,
  onHoverConnection,
  onLeaveConnection,
  onBackToLobby,
}: Props) => {
  return (
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
                  onMouseEnter={() => onHoverDestination(d)}
                  onMouseLeave={onLeaveDestination}
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
          onHoverConnection={onHoverConnection}
          onLeaveConnection={onLeaveConnection}
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
          <button onClick={onBackToLobby}>← {t(lang, "ui.toLobby")}</button>
        </div>
      )}
    </aside>
  );
};

