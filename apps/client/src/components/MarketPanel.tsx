import type { CardColor, GameState } from "@ttr/shared";
import { CardChip } from "./CardChip";
import { t, type Lang } from "../lib/i18n";

type Props = {
  game: GameState;
  lang: Lang;
  isMyTurn: boolean;
  canAct: boolean;
  onDrawCard: (index?: number) => void;
};

export const MarketPanel = ({ game, lang, isMyTurn, canAct, onDrawCard }: Props) => {
  const drawInProgress = game.turnActionState.action === "draw_cards";
  const disabledAll = !isMyTurn || !canAct || game.finished || Boolean(game.pendingDestinationChoice);

  return (
    <div className="grid grid-cols-6 auto-rows-fr gap-2 h-full">
      {game.openCards.map((card, i) => (
        <CardChip
          key={i}
          color={card.color as CardColor}
          size="panel"
          fluid
          disabled={disabledAll || drawInProgress}
          onClick={() => onDrawCard(i)}
        />
      ))}

      <button
        type="button"
        onClick={() => onDrawCard()}
        disabled={disabledAll || game.trainDeckCount === 0}
        className={[
          "relative flex flex-col items-center justify-center overflow-visible",
          "w-full h-full min-h-16 rounded-xl border-[3px] border-slate-600",
          "bg-slate-800 text-slate-200 font-bold select-none",
          "transition-all duration-100 cursor-pointer",
          "active:scale-90 disabled:opacity-40 disabled:cursor-default",
          "hover:border-slate-400",
        ].join(" ")}
        style={{ boxShadow: "rgb(41 41 41) 2px 2px 0px, rgb(66 66 66) 4px 4px 0px" }}
        title={`${t(lang, "ui.drawDeck")} (${game.trainDeckCount})`}
      >
        {!drawInProgress && !disabledAll && (
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2  text-white text-[16px] font-black rounded-full w-5 h-5 flex items-center justify-center leading-none">
            ×2
          </span>
        )}
      </button>
    </div>
  );
};
