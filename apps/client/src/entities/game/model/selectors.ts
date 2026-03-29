import type { GameState, Player } from "@ttr/shared";

export const selectMe = (game: GameState | null, sessionToken: string): Player | undefined => {
  if (!game) return undefined;
  return game.players.find((p) => p.sessionToken === sessionToken)
    ?? game.spectators.find((s) => s.sessionToken === sessionToken);
};

export const selectActivePlayer = (game: GameState | null): Player | undefined => {
  if (!game) return undefined;
  return game.players[game.activePlayerIndex];
};

export const selectIsMyTurn = (game: GameState | null, sessionToken: string): boolean => {
  const active = selectActivePlayer(game);
  return active?.sessionToken === sessionToken;
};

export const selectIsMyPendingChoice = (game: GameState | null, sessionToken: string): boolean => {
  return game?.pendingDestinationChoice?.sessionToken === sessionToken;
};

export const selectCanAct = (game: GameState | null, sessionToken: string): boolean => {
  if (!game || !game.started || game.finished) return false;
  if (game.pendingDestinationChoice) return false;
  return selectIsMyTurn(game, sessionToken);
};

export const selectWinner = (game: GameState | null): Player | undefined => {
  if (!game?.winnerSessionToken) return undefined;
  return game.players.find((p) => p.sessionToken === game.winnerSessionToken);
};

