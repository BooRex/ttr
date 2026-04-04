import type { Player } from "@ttr/shared";
import { CardStatIcon, StationStatIcon, WagonStatIcon } from "./StatIcons";

type Props = {
  player: Player;
  lang?: string;
  className?: string;
  hidePoints?: boolean;
};

export const PlayerPillMeta = ({ player, className }: Props) => {
  return (
    <span className={["player-pill-meta", className ?? ""].join(" ").trim()}>
      <span className="meta-chip">
        <span className="meta-value">{player.hand.length}</span>
        <CardStatIcon className="meta-icon" />
      </span>
      <span className="meta-sep">·</span>
      <span className="meta-chip">
        <span className="meta-value">{player.wagonsLeft}</span>
        <WagonStatIcon className="meta-icon" />
      </span>
      <span className="meta-sep">·</span>
      <span className="meta-chip">
        <span className="meta-value">{player.stationsLeft ?? 0}</span>
        <StationStatIcon className="meta-icon" />
      </span>
    </span>
  );
};
