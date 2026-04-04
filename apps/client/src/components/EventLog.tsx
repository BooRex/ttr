import type { GameEvent } from "@ttr/shared";
import { PLAYER_COLORS } from "../lib/colors";
import { t, type Lang } from "../lib/i18n";
import { toEventViewModel } from "../features/event-log/model/formatters";
import { DestinationBadge } from "./DestinationBadge";
import { LocomotiveStatIcon, RouteMapStatIcon } from "./StatIcons";

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

const EventIcon = ({ icon }: { icon: string }) => {
  if (icon === "loco_svg") {
    return <LocomotiveStatIcon className="w-4 h-4 text-slate-200" />;
  }
  if (icon === "route_svg") {
    return <RouteMapStatIcon className="w-4 h-4 text-slate-200" />;
  }
  return <span>{icon}</span>;
};

export const EventLog = ({ events, lang, players, limit, onHoverConnection, onLeaveConnection }: Props) => {
  const items = limit ? events.slice(0, limit) : events;
  const models = items.map((event) => toEventViewModel(lang, event));

  return (
    <ol className="event-log-rich">
      {models.map((model) => {
        if (!model.player && !model.winner) {
          return <li key={model.id} className="event-entry"><EventIcon icon={model.icon} /> {model.message}</li>;
        }


        if (model.route) {
          return (
            <li key={model.id} className="event-entry event-entry-inline">
              <EventIcon icon={model.icon} />
              <PlayerName sessionToken={model.player?.sessionToken ?? ""} nickname={model.player?.nickname ?? ""} players={players} />
              <span>{model.message}</span>
              <DestinationBadge
                lang={lang}
                compact
                hidePoints
                card={{ from: model.route.from, to: model.route.to }}
                onMouseEnter={onHoverConnection ? () => onHoverConnection(model.route!.from, model.route!.to) : undefined}
                onMouseLeave={onLeaveConnection}
              />
            </li>
          );
        }

        if (model.player) {
          return (
            <li key={model.id} className="event-entry event-entry-inline">
              <EventIcon icon={model.icon} />
              <PlayerName sessionToken={model.player.sessionToken} nickname={model.player.nickname} players={players} />
              <span>{model.message}</span>
            </li>
          );
        }

        return (
          <li key={model.id} className="event-entry event-entry-inline">
            <span className="inline-flex items-center gap-1"><EventIcon icon={model.icon} />{model.message}</span>
            {model.winner && (
              <span>
                · {t(lang, "events.winner")}: <PlayerName sessionToken={model.winner.sessionToken ?? ""} nickname={model.winner.nickname} players={players} />
                {typeof model.winner.points === "number" ? ` (${model.winner.points})` : ""}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
};

