import { describe, expect, it } from "vitest";
import type { GameState } from "@ttr/shared";
import {
  selectActivePlayer,
  selectCanAct,
  selectIsMyPendingChoice,
  selectIsMyTurn,
  selectMe,
  selectWinner,
} from "../../../src/entities/game/model/selectors";

const makeGame = (): GameState => ({
  roomId: "R1",
  mapId: "europe",
  started: true,
  finished: false,
  routes: [],
  players: [
    { sessionToken: "p1", nickname: "A", wagonsLeft: 45, hand: [], destinations: [], points: 0 },
    { sessionToken: "p2", nickname: "B", wagonsLeft: 45, hand: [], destinations: [], points: 0 },
  ],
  spectators: [
    { sessionToken: "s1", nickname: "S", wagonsLeft: 0, hand: [], destinations: [], points: 0, isSpectator: true },
  ],
  activePlayerIndex: 0,
  openCards: [],
  trainDeckCount: 0,
  discardDeckCount: 0,
  destinationDeckCount: 0,
  pendingDestinationChoice: null,
  lastRoundTriggered: false,
  lastRoundEndIndex: null,
  winnerSessionToken: null,
  finalStandings: [],
  log: [],
  events: [],
  settings: { maxPlayers: 2, turnTimerSeconds: null },
});

describe("game selectors", () => {
  it("selectMe finds player and spectator", () => {
    const game = makeGame();
    expect(selectMe(game, "p2")?.nickname).toBe("B");
    expect(selectMe(game, "s1")?.nickname).toBe("S");
    expect(selectMe(game, "none")).toBeUndefined();
  });

  it("selectActivePlayer and selectIsMyTurn work", () => {
    const game = makeGame();
    expect(selectActivePlayer(game)?.sessionToken).toBe("p1");
    expect(selectIsMyTurn(game, "p1")).toBe(true);
    expect(selectIsMyTurn(game, "p2")).toBe(false);
  });

  it("selectCanAct blocks when pending choice exists", () => {
    const game = makeGame();
    expect(selectCanAct(game, "p1")).toBe(true);
    game.pendingDestinationChoice = { sessionToken: "p1", cards: [], minKeep: 1 };
    expect(selectCanAct(game, "p1")).toBe(false);
  });

  it("selectIsMyPendingChoice and selectWinner", () => {
    const game = makeGame();
    game.pendingDestinationChoice = { sessionToken: "p2", cards: [], minKeep: 1 };
    expect(selectIsMyPendingChoice(game, "p2")).toBe(true);
    expect(selectIsMyPendingChoice(game, "p1")).toBe(false);

    game.winnerSessionToken = "p2";
    expect(selectWinner(game)?.nickname).toBe("B");
  });
});

