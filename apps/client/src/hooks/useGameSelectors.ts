import { useMemo } from "react";
import type { GameState } from "@ttr/shared";
import {
  selectActivePlayer,
  selectCanAct,
  selectIsMyPendingChoice,
  selectIsMyTurn,
  selectMe,
  selectWinner,
} from "../entities/game/model";

/**
 * Мемоизированные селекторы для текущего игрока
 * Избегает дублирования useMemo логики
 */
export const useGameSelectors = (game: GameState | null, sessionToken: string) => {
  const me = useMemo(() => selectMe(game, sessionToken), [game, sessionToken]);
  const activePlayer = useMemo(() => selectActivePlayer(game), [game]);
  const isMyTurn = useMemo(() => selectIsMyTurn(game, sessionToken), [game, sessionToken]);
  const isMyPendingChoice = useMemo(
    () => selectIsMyPendingChoice(game, sessionToken),
    [game, sessionToken],
  );
  const winner = useMemo(() => selectWinner(game) ?? null, [game]);
  const canAct = useMemo(() => selectCanAct(game, sessionToken), [game, sessionToken]);

  return {
    me,
    activePlayer,
    isMyTurn,
    isMyPendingChoice,
    winner,
    canAct,
  };
};

