import type { DestinationCard, GameState, Player, TrainCard } from "@ttr/shared";
import { HandCards } from "../../../components/HandCards";
import { DestinationBadge } from "../../../components/DestinationBadge";
import { EventLog } from "../../../components/EventLog";
import { PanelShell } from "../../../components/PanelShell";
import { t, type Lang } from "../../../lib/i18n";
import { isDestinationCompleted } from "../../../entities/game/model";

type Props = {
  game: GameState;
  me: Player | undefined;
  handCards?: TrainCard[];
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
  handCards,
  winner,
  lang,
  onHoverDestination,
  onLeaveDestination,
  onHoverConnection,
  onLeaveConnection,
  onBackToLobby,
}: Props) => {
  const destinations = me?.destinations ?? [];

  return (
    <aside className="game-side side-right">
      {me && !me.isSpectator && (
        <PanelShell
          title={t(lang, "ui.yourCards")}
          infoText={t(lang, "ui.panelHelp.yourCards")}
          className="player-hand card side-card side-ratio-eq"
        >
          <HandCards cards={handCards ?? me.hand} />
        </PanelShell>
      )}

      {me && !me.isSpectator && (
        <PanelShell
          title={t(lang, "ui.yourRoutes")}
          infoText={t(lang, "ui.panelHelp.yourRoutes")}
          className="scoreboard card side-card side-ratio-eq"
        >
          {destinations.length === 0 ? (
            <p className="hint">—</p>
          ) : (
            <div className="my-destinations my-destinations-vertical">
              {destinations.map((d) => {
                const completed = isDestinationCompleted(game, me.sessionToken, d);
                return (
                  <div
                    key={d.id}
                    className={[
                      "my-destination-row",
                      completed ? "is-completed" : "",
                    ].join(" ").trim()}
                  >
                    <DestinationBadge
                      card={d}
                      lang={lang}
                      onMouseEnter={() => onHoverDestination(d)}
                      onMouseLeave={onLeaveDestination}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </PanelShell>
      )}

      <PanelShell
        title={t(lang, "ui.events")}
        infoText={t(lang, "ui.panelHelp.events")}
        className="scoreboard card side-card desktop-events side-ratio-eq"
      >
        <EventLog
          events={game.events ?? []}
          players={game.players}
          lang={lang}
          onHoverConnection={onHoverConnection}
          onLeaveConnection={onLeaveConnection}
        />
      </PanelShell>

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

