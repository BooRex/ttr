import { pointsForRouteLength, type GameState } from "@ttr/shared";
import { cityLabel, t, type Lang } from "../lib/i18n";

type Props = {
  open: boolean;
  lang: Lang;
  game: GameState;
  sessionToken: string;
  onClose: () => void;
};

const ROUTE_LENGTHS = [1, 2, 3, 4, 5, 6] as const;

export const ScoringHelpModal = ({ open, lang, game, sessionToken, onClose }: Props) => {
  if (!open) return null;

  const myFinalStanding = game.finalStandings.find((standing) => standing.sessionToken === sessionToken);

  const scoreHistory = [...(game.events ?? [])]
    .reverse()
    .flatMap((event) => {
      if (event.type === "claim_route" && event.sessionToken === sessionToken) {
        const delta = event.points ?? 0;
        return [{
          id: event.id,
          label: `${t(lang, "events.claimRoute")}: ${cityLabel(lang, event.from)} - ${cityLabel(lang, event.to)}`,
          delta,
        }];
      }
      if (event.type === "build_station" && event.sessionToken === sessionToken) {
        return [{
          id: event.id,
          label: `${t(lang, "events.buildStation", { city: cityLabel(lang, event.city) })}`,
          delta: -4,
        }];
      }
      return [];
    });

  if (game.finished && myFinalStanding) {
    scoreHistory.push({
      id: `destinations-${sessionToken}`,
      label: `${t(lang, "ui.scoreDestinations")}: ${myFinalStanding.completedDestinations}/${myFinalStanding.totalDestinations}`,
      delta: myFinalStanding.destinationPointsDelta,
    });

    if (myFinalStanding.stationPointsBonus !== 0) {
      scoreHistory.push({
        id: `stations-${sessionToken}`,
        label: t(lang, "ui.scoreStations"),
        delta: myFinalStanding.stationPointsBonus,
      });
    }
  }

  let running = 0;
  const historyWithRunning = scoreHistory.map((item) => {
    running += item.delta;
    return { ...item, running };
  });

  const me = game.players.find((player) => player.sessionToken === sessionToken);

  return (
    <div className="events-modal" role="dialog" aria-modal="true" aria-label={t(lang, "ui.scoreHelpTitle")}>
      <div className="events-modal-head">
        <h3>{t(lang, "ui.scoreHelpTitle")}</h3>
        <button type="button" onClick={onClose}>{t(lang, "ui.close")}</button>
      </div>

      <div className="events-scroll-area text-slate-200">
        <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-3 mb-3">
          <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">{t(lang, "ui.scoreRoutes")}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ROUTE_LENGTHS.map((length) => (
              <div key={length} className="rounded-lg border border-slate-700 bg-slate-800/70 px-2 py-1 text-sm">
                {t(lang, "ui.scoreLength", { length })}: <strong>{pointsForRouteLength(length)}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-3 space-y-2 text-sm leading-5">
          <p><strong>{t(lang, "ui.scoreDestinations")}</strong> — {t(lang, "ui.scoreDestinationsHint")}</p>
          <p><strong>{t(lang, "ui.scoreStations")}</strong> — {t(lang, "ui.scoreStationsHint")}</p>
          <p><strong>{t(lang, "ui.scoreTie")}</strong> — {t(lang, "ui.scoreTieHint")}</p>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900/80 p-3 mt-3">
          <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">{t(lang, "ui.scoreHistory")}</p>
          {historyWithRunning.length === 0 ? (
            <p className="text-sm text-slate-400">{t(lang, "ui.noScoreHistory")}</p>
          ) : (
            <ol className="event-log-rich">
              {historyWithRunning.map((entry) => (
                <li key={entry.id} className="event-entry event-entry-inline">
                  <span className={entry.delta >= 0 ? "text-emerald-300" : "text-rose-300"}>
                    {entry.delta >= 0 ? `+${entry.delta}` : entry.delta}
                  </span>
                  <span>{entry.label}</span>
                  <span className="event-muted">= {entry.running}</span>
                </li>
              ))}
            </ol>
          )}
          <p className="text-sm text-slate-200 mt-2">
            <strong>{t(lang, "ui.pointsShort")}: {me?.points ?? 0}</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

