import type { TrainCard, CardColor } from "@ttr/shared";
import { CardChip } from "./CardChip";

type Props = {
  cards: TrainCard[];
};

export const HandCards = ({ cards }: Props) => {
  const counts: Partial<Record<CardColor, number>> = {};
  for (const card of cards) {
    counts[card.color] = (counts[card.color] ?? 0) + 1;
  }

  const sorted = (Object.entries(counts) as [CardColor, number][]).sort(([, ca], [, cb]) => cb - ca);

  return (
    <div className="grid h-full w-full grid-cols-5 grid-rows-2 gap-2" data-hand-cards-anchor="true">
      {sorted.map(([color, count]) => (
        <CardChip key={color} color={color} count={count} size="panel" fluid />
      ))}
    </div>
  );
};
