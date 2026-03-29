import { memo } from "react";
import type { GameState } from "@ttr/shared";
import { PLAYER_COLORS } from "../lib/colors";
import { t, type Lang } from "../lib/i18n";

interface ResultsScreenProps {
  game: GameState;
  lang: Lang;
  sessionToken: string;
  onBackToLobby: () => void;
}

const ResultsScreenComponent = ({
  game,
  lang,
  sessionToken,
  onBackToLobby,
}: ResultsScreenProps) => {
  // Find winner event
  const winnerEvent = game.events?.find((e) => e.type === "game_finished");
  const isWinner = winnerEvent && winnerEvent.type === "game_finished" && winnerEvent.winnerSessionToken === sessionToken;

  // Calculate final standings
  const standings = game.players
    .map((player, index) => ({
      nickname: player.nickname,
      points: player.points,
      completedDestinations: player.destinations.filter((d) => {
        // Check if destination is connected
        const fromClaimed = game.routes.some(
          (r) => r.ownerSessionToken === player.sessionToken && (r.from === d.from || r.from === d.to),
        );
        const toClaimed = game.routes.some(
          (r) => r.ownerSessionToken === player.sessionToken && (r.to === d.from || r.to === d.to),
        );
        return fromClaimed && toClaimed;
      }).length,
      color: PLAYER_COLORS[index],
      isMe: player.sessionToken === sessionToken,
      isWinner: winnerEvent && winnerEvent.type === "game_finished" && winnerEvent.winnerSessionToken === player.sessionToken,
    }))
    .sort((a, b) => b.points - a.points);

  return (
    <div className="results-screen" data-testid="results-screen">
      {/* Winner banner */}
      {isWinner && (
        <div className="results-winner-banner">
          <div className="results-trophy">🏆</div>
          <h1>{t(lang, "results.youWon")}</h1>
          <p className="results-points">{standings[0].points} {t(lang, "results.points")}</p>
        </div>
      )}

      {/* Final standings */}
      <section className="card results-standings">
        <h2>{t(lang, "results.finalStandings")}</h2>
        
        <table className="results-table">
          <thead>
            <tr>
              <th>{t(lang, "results.place")}</th>
              <th>{t(lang, "results.player")}</th>
              <th>{t(lang, "results.points")}</th>
              <th>{t(lang, "results.destinations")}</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((standing, index) => (
              <tr key={standing.nickname} className={standing.isMe ? "results-row-me" : ""}>
                <td className="results-place">
                  {index === 0 && "🥇"}
                  {index === 1 && "🥈"}
                  {index === 2 && "🥉"}
                  {index > 2 && `#${index + 1}`}
                </td>
                <td className="results-player">
                  <span 
                    className="results-player-name" 
                    style={{ color: standing.color }}
                  >
                    {standing.nickname}
                  </span>
                  {standing.isMe && <span className="results-badge"> ({t(lang, "results.you")})</span>}
                </td>
                <td className="results-points-cell">
                  <strong>{standing.points}</strong>
                </td>
                <td className="results-destinations-cell">
                  {standing.completedDestinations} / {game.players.find((p) => p.nickname === standing.nickname)?.destinations.length || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Game stats */}
      <section className="card results-stats">
        <h3>{t(lang, "results.gameStats")}</h3>
        <div className="results-stats-grid">
          <div className="results-stat">
            <div className="results-stat-label">{t(lang, "results.totalRoutes")}</div>
            <div className="results-stat-value">
              {game.routes.filter((r) => r.ownerSessionToken).length} / {game.routes.length}
            </div>
          </div>
          <div className="results-stat">
            <div className="results-stat-label">{t(lang, "results.roundsPlayed")}</div>
            <div className="results-stat-value">{game.events?.filter((e) => e.type === "draw_card").length || 0}</div>
          </div>
          <div className="results-stat">
            <div className="results-stat-label">{t(lang, "results.map")}</div>
            <div className="results-stat-value">{game.mapId}</div>
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="results-actions">
        <button className="btn btn-primary" onClick={onBackToLobby}>
          ← {t(lang, "results.backToLobby")}
        </button>
      </div>
    </div>
  );
};

export const ResultsScreen = memo(ResultsScreenComponent);

