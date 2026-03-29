import type { TrainCard, CardColor } from "@ttr/shared";
import { CardChip } from "./CardChip";

type Props = {
  cards: TrainCard[];
  compact?: boolean;
};

export const HandCards = ({ cards, compact = false }: Props) => {
  const counts: Partial<Record<CardColor, number>> = {};
  for (const card of cards) {
    counts[card.color] = (counts[card.color] ?? 0) + 1;
  }

  const sorted = (Object.entries(counts) as [CardColor, number][]).sort(([a, ca], [b, cb]) => {
    if (a === "locomotive") return 1;
    if (b === "locomotive") return -1;
    return cb - ca;
  });

  return (
    <div className="flex flex-wrap gap-1.5">
      {sorted.map(([color, count]) => (
        <CardChip key={color} color={color} count={count} size={compact ? "sm" : "md"} />
      ))}
    </div>
  );
};
