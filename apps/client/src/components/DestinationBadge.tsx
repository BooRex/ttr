import type { DestinationCard } from "@ttr/shared";
import { cityLabel, t, type Lang } from "../lib/i18n";

type Props = {
  card: Pick<DestinationCard, "from" | "to"> & Partial<Pick<DestinationCard, "points">>;
  lang: Lang;
  compact?: boolean;
  hidePoints?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};

export const DestinationBadge = ({
  card,
  lang,
  compact = false,
  hidePoints = false,
  onMouseEnter,
  onMouseLeave,
}: Props) => {
  return (
    <span
      className={[
        "dest-badge",
        compact ? "dest-badge-compact" : "",
        onMouseEnter ? "dest-badge-interactive" : "",
      ].join(" ").trim()}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      title={`${cityLabel(lang, card.from)} → ${cityLabel(lang, card.to)}`}
    >
      <span className="dest-badge-route">
        {cityLabel(lang, card.from)}
        <span className="dest-badge-arrow">→</span>
        {cityLabel(lang, card.to)}
      </span>
      {!hidePoints && typeof card.points === "number" && (
        <span className="dest-badge-points">{card.points} {t(lang, "ui.pointsShort")}</span>
      )}
    </span>
  );
};

