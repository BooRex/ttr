import type { TrainCard, CardColor } from "@ttr/shared";
import { CardChip } from "./CardChip";

type Props = {
  cards: TrainCard[];
  onDraw?: (index: number) => void;
  deckCount?: number;
  onDrawFromDeck?: () => void;
  disabled?: boolean;
};

export const OpenMarket = ({ cards, onDraw, deckCount = 0, onDrawFromDeck, disabled }: Props) => {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-1.5 font-medium">Рынок карт</p>
      <div className="flex flex-wrap gap-2 items-end">
        {cards.map((card, i) => (
          <CardChip
            key={i}
            color={card.color as CardColor}
            size="md"
            disabled={disabled}
            onClick={() => onDraw?.(i)}
          />
        ))}

        {/* Draw from deck */}
        <button
          disabled={disabled || deckCount === 0}
          onClick={() => onDrawFromDeck?.()}
          title={`Взять из колоды (${deckCount})`}
          className={[
            "flex flex-col items-center justify-center gap-0.5",
            "w-11 h-14 rounded-xl border-2 border-slate-600",
            "bg-slate-800 text-slate-200 font-bold select-none",
            "transition-all duration-100 cursor-pointer",
            "active:scale-90 disabled:opacity-40 disabled:cursor-default",
          ].join(" ")}
        >
          <span className="text-xl leading-none">🂠</span>
          <span className="text-[10px] font-black opacity-80">{deckCount}</span>
        </button>
      </div>
    </div>
  );
};
