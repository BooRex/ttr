import { describe, expect, it } from "vitest";
import type { GameEvent } from "@ttr/shared";
import { toEventViewModel } from "../../../src/features/event-log/model/formatters";

const drawCardEvent: GameEvent = {
  id: "e1",
  type: "draw_card",
  sessionToken: "p1",
  nickname: "Alice",
};

describe("event-log formatters", () => {
  it("formats draw_card without revealing card color", () => {
    const vm = toEventViewModel("ru", drawCardEvent);
    expect(vm.icon).toBe("🃏");
    expect(vm.player?.nickname).toBe("Alice");
    expect(vm.message).toContain("карту");
  });

  it("formats claim_route with route payload", () => {
    const vm = toEventViewModel("en", {
      id: "e2",
      type: "claim_route",
      sessionToken: "p2",
      nickname: "Bob",
      routeId: "r10",
      from: "London",
      to: "Dieppe",
    });

    expect(vm.icon).toBe("🚂");
    expect(vm.route).toEqual({ from: "London", to: "Dieppe" });
    expect(vm.message.toLowerCase()).toContain("claimed");
  });

  it("formats game_finished winner info", () => {
    const vm = toEventViewModel("uk", {
      id: "e3",
      type: "game_finished",
      winnerSessionToken: "p1",
      winnerNickname: "Alice",
      winnerPoints: 123,
    });

    expect(vm.icon).toBe("🏁");
    expect(vm.winner?.nickname).toBe("Alice");
    expect(vm.winner?.points).toBe(123);
  });
});

