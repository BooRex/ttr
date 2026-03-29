import type { GameEvent } from "@ttr/shared";
import { PLAYER_COLORS } from "../lib/colors";
import { cardLabel, t, type Lang } from "../lib/i18n";
import { CardChip } from "./CardChip";
import { DestinationBadge } from "./DestinationBadge";

type PlayerMeta = { sessionToken: string; nickname: string };

type Props = {
  events: GameEvent[];
  lang: Lang;
  players: PlayerMeta[];
  limit?: number;
  onHoverConnection?: (from: string, to: string) => void;
  onLeaveConnection?: () => void;
};

const PlayerName = ({ sessionToken, nickname, players }: { sessionToken: string; nickname: string; players: PlayerMeta[] }) => {
  const idx = players.findIndex((p) => p.sessionToken === sessionToken);
  const color = PLAYER_COLORS[idx >= 0 ? idx : 0] ?? "#e2e8f0";
  return <strong style={{ color }}>{nickname}</strong>;
};

export const EventLog = ({ events, lang, players, limit, onHoverConnection, onLeaveConnection }: Props) => {
  const items = limit ? events.slice(0, limit) : events;

  return (
    <ol className="event-log-rich">
      {items.map((event) => {
        if (event.type === "game_started") {
          return <li key={event.id} className="event-entry">🎲 {t(lang, "events.gameStarted")}</li>;
        }

        if (event.type === "draw_card") {
          return (
            <li key={event.id} className="event-entry event-entry-inline">
              <PlayerName sessionToken={event.sessionToken} nickname={event.nickname} players={players} />
              <span>{t(lang, "events.drawCard")}</span>
              <CardChip color={event.cardColor} size="sm" />
              <span className="event-muted">({cardLabel(lang, event.cardColor)})</span>
            </li>
          );
        }

        if (event.type === "draw_destinations") {
          return (
            <li key={event.id} className="event-entry event-entry-inline">
              <PlayerName sessionToken={event.sessionToken} nickname={event.nickname} players={players} />
              <span>{t(lang, "events.drawDestinations")}</span>
            </li>
          );
        }

        if (event.type === "choose_destinations") {
          return (
            <li key={event.id} className="event-entry event-entry-inline">
              <PlayerName sessionToken={event.sessionToken} nickname={event.nickname} players={players} />
              <span>{t(lang, "events.chooseDestinations", { count: event.keepCount })}</span>
            </li>
          );
        }

        if (event.type === "claim_route") {
          return (
            <li key={event.id} className="event-entry event-entry-inline">
              <PlayerName sessionToken={event.sessionToken} nickname={event.nickname} players={players} />
              <span>{t(lang, "events.claimRoute")}</span>
              <DestinationBadge
                lang={lang}
                compact
                hidePoints
                card={{ from: event.from, to: event.to }}
                onMouseEnter={onHoverConnection ? () => onHoverConnection(event.from, event.to) : undefined}
                onMouseLeave={onLeaveConnection}
              />
            </li>
          );
        }

        if (event.type === "final_round") {
          return (
            <li key={event.id} className="event-entry event-entry-inline">
              <PlayerName sessionToken={event.sessionToken} nickname={event.nickname} players={players} />
              <span>{t(lang, "events.finalRound", { wagonsLeft: event.wagonsLeft })}</span>
            </li>
          );
        }

        if (event.type === "turn_skipped") {
          return (
            <li key={event.id} className="event-entry event-entry-inline">
              <PlayerName sessionToken={event.sessionToken} nickname={event.nickname} players={players} />
              <span>{t(lang, "events.turnSkipped", { reason: event.reason })}</span>
            </li>
          );
        }

        return (
          <li key={event.id} className="event-entry event-entry-inline">
            <span>🏁 {t(lang, "events.gameFinished")}</span>
            {event.winnerNickname && (
              <span>
                · {t(lang, "events.winner")}: <PlayerName sessionToken={event.winnerSessionToken ?? ""} nickname={event.winnerNickname} players={players} />
                {typeof event.winnerPoints === "number" ? ` (${event.winnerPoints})` : ""}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
};

