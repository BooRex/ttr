import { describe, expect, it } from "vitest";
import { GameEngine } from "../src/gameEngine.js";
import { MAPS } from "@ttr/shared";

describe("GameEngine", () => {
  it("раздает карты и запускает игру", () => {
    const engine = new GameEngine();
    const state = engine.initGame(
      "ROOM1",
      [
        { sessionToken: "a", nickname: "A", wagonsLeft: 45, hand: [], destinations: [], points: 0 },
        { sessionToken: "b", nickname: "B", wagonsLeft: 45, hand: [], destinations: [], points: 0 }
      ],
      "usa",
      { maxPlayers: 5, turnTimerSeconds: null }
    );

    expect(state.started).toBe(true);
    expect(state.players).toHaveLength(2);
    expect(state.players[0]?.hand.length).toBe(4);
    expect(state.openCards.length).toBe(5);
  });

  it("позволяет взять карту активному игроку", () => {
    const engine = new GameEngine();
    const state = engine.initGame(
      "ROOM2",
      [
        { sessionToken: "a", nickname: "A", wagonsLeft: 45, hand: [], destinations: [], points: 0 },
        { sessionToken: "b", nickname: "B", wagonsLeft: 45, hand: [], destinations: [], points: 0 }
      ],
      "usa",
      { maxPlayers: 5, turnTimerSeconds: null }
    );

    const handBefore = state.players[0]?.hand.length ?? 0;
    engine.drawCard(state, "a");
    expect(state.players[0]?.hand.length).toBe(handBefore + 1);
    expect(state.activePlayerIndex).toBe(0);
    engine.drawCard(state, "a");
    expect(state.activePlayerIndex).toBe(1);
  });

  it("завершает ход после добора открытой карты рынка", () => {
    const engine = new GameEngine();
    const state = engine.initGame(
      "ROOM_OPEN_DRAW",
      [
        { sessionToken: "a", nickname: "A", wagonsLeft: 45, hand: [], destinations: [], points: 0 },
        { sessionToken: "b", nickname: "B", wagonsLeft: 45, hand: [], destinations: [], points: 0 }
      ],
      "usa",
      { maxPlayers: 5, turnTimerSeconds: null }
    );

    const handBefore = state.players[0]?.hand.length ?? 0;
    engine.drawCard(state, "a", 0);

    expect(state.players[0]?.hand.length).toBe(handBefore + 1);
    expect(state.activePlayerIndex).toBe(1);
  });

  it("дает взять карты маршрутов и подтвердить выбор", () => {
    const engine = new GameEngine();
    const state = engine.initGame(
      "ROOM_DEST_1",
      [
        { sessionToken: "a", nickname: "A", wagonsLeft: 45, hand: [], destinations: [], points: 0 },
        { sessionToken: "b", nickname: "B", wagonsLeft: 45, hand: [], destinations: [], points: 0 }
      ],
      "usa",
      { maxPlayers: 5, turnTimerSeconds: null }
    );

    const beforeCount = state.players[0]?.destinations.length ?? 0;
    engine.drawDestinations(state, "a");
    expect(state.pendingDestinationChoice?.sessionToken).toBe("a");

    const keepId = state.pendingDestinationChoice?.cards[0]?.id;
    expect(keepId).toBeTruthy();
    engine.chooseDestinations(state, "a", [keepId as string]);

    expect(state.pendingDestinationChoice).toBeNull();
    expect(state.players[0]?.destinations.length).toBe(beforeCount + 1);
    expect(state.activePlayerIndex).toBe(1);
  });

  it("блокирует другие действия, пока не подтвержден выбор маршрутов", () => {
    const engine = new GameEngine();
    const state = engine.initGame(
      "ROOM_DEST_2",
      [
        { sessionToken: "a", nickname: "A", wagonsLeft: 45, hand: [], destinations: [], points: 0 },
        { sessionToken: "b", nickname: "B", wagonsLeft: 45, hand: [], destinations: [], points: 0 }
      ],
      "usa",
      { maxPlayers: 5, turnTimerSeconds: null }
    );

    engine.drawDestinations(state, "a");

    expect(() => engine.drawCard(state, "a")).toThrow("Сначала выберите карты маршрутов");
    expect(() => engine.claimRoute(state, "a", "r1", "red")).toThrow("Сначала выберите карты маршрутов");
  });

  it("блокирует смену типа действия после первого добора карты", () => {
    const engine = new GameEngine();
    const state = engine.initGame(
      "ROOM_DRAW_LOCK",
      [
        { sessionToken: "a", nickname: "A", wagonsLeft: 45, hand: [], destinations: [], points: 0 },
        { sessionToken: "b", nickname: "B", wagonsLeft: 45, hand: [], destinations: [], points: 0 }
      ],
      "usa",
      { maxPlayers: 5, turnTimerSeconds: null }
    );

    engine.drawCard(state, "a");

    expect(() => engine.drawDestinations(state, "a")).toThrow("В этом ходу уже выбрано другое действие");
    expect(() => engine.claimRoute(state, "a", "r1", "red")).toThrow("В этом ходу уже выбрано другое действие");
  });

  it("не позволяет брать открытую карту вторым добором после колоды", () => {
    const engine = new GameEngine();
    const state = engine.initGame(
      "ROOM_DRAW_OPEN_SECOND",
      [
        { sessionToken: "a", nickname: "A", wagonsLeft: 45, hand: [], destinations: [], points: 0 },
        { sessionToken: "b", nickname: "B", wagonsLeft: 45, hand: [], destinations: [], points: 0 }
      ],
      "usa",
      { maxPlayers: 5, turnTimerSeconds: null }
    );

    engine.drawCard(state, "a");

    expect(() => engine.drawCard(state, "a", 0)).toThrow("Открытую карту можно взять только как первое и единственное действие добора");
  });

  it("завершает игру в финальном раунде и считает destination-очки", () => {
    const engine = new GameEngine();
    const state = engine.initGame(
      "ROOM3",
      [
        { sessionToken: "a", nickname: "A", wagonsLeft: 45, hand: [], destinations: [], points: 0 },
        { sessionToken: "b", nickname: "B", wagonsLeft: 45, hand: [], destinations: [], points: 0 }
      ],
      "usa",
      { maxPlayers: 5, turnTimerSeconds: null }
    );

    state.players[0]!.destinations = [{ id: "x", from: "Seattle", to: "Los Angeles", points: 9 }];
    state.players[1]!.destinations = [{ id: "y", from: "Seattle", to: "Portland", points: 4 }];

    for (const route of state.routes) {
      if (["r1", "r2", "r3"].includes(route.id)) {
        route.ownerSessionToken = "a";
      }
    }

    state.lastRoundTriggered = true;
    state.lastRoundEndIndex = 0;
    state.activePlayerIndex = 1;

    engine.drawCard(state, "b");
    engine.drawCard(state, "b");

    expect(state.finished).toBe(true);
    expect(state.winnerSessionToken).toBe("a");
    expect(state.finalStandings[0]?.sessionToken).toBe("a");
    expect(state.players[0]?.points).toBe(9);
    expect(state.players[1]?.points).toBe(-4);
  });

  it("не дает делать действия после завершения игры", () => {
    const engine = new GameEngine();
    const state = engine.initGame(
      "ROOM4",
      [
        { sessionToken: "a", nickname: "A", wagonsLeft: 45, hand: [], destinations: [], points: 0 },
        { sessionToken: "b", nickname: "B", wagonsLeft: 45, hand: [], destinations: [], points: 0 }
      ],
      "usa",
      { maxPlayers: 5, turnTimerSeconds: null }
    );

    state.finished = true;

    expect(() => engine.drawCard(state, "a")).toThrow("Игра уже завершена");
    expect(() => engine.claimRoute(state, "a", "r1", "red")).toThrow("Игра уже завершена");
  });

  it("использует расширенную USA карту с полноценной колодой маршрутов", () => {
    expect(MAPS.usa.cities.length).toBeGreaterThanOrEqual(30);
    expect(MAPS.usa.routes.length).toBeGreaterThanOrEqual(70);
    expect(MAPS.usa.destinationDeck.length).toBeGreaterThanOrEqual(30);
  });

  it("изолирует состояние маршрутов между разными комнатами", () => {
    const engineA = new GameEngine();
    const engineB = new GameEngine();

    const stateA = engineA.initGame(
      "ROOM_A",
      [
        { sessionToken: "a1", nickname: "A1", wagonsLeft: 45, hand: [], destinations: [], points: 0 },
        { sessionToken: "a2", nickname: "A2", wagonsLeft: 45, hand: [], destinations: [], points: 0 }
      ],
      "usa",
      { maxPlayers: 5, turnTimerSeconds: null }
    );

    const stateB = engineB.initGame(
      "ROOM_B",
      [
        { sessionToken: "b1", nickname: "B1", wagonsLeft: 45, hand: [], destinations: [], points: 0 },
        { sessionToken: "b2", nickname: "B2", wagonsLeft: 45, hand: [], destinations: [], points: 0 }
      ],
      "usa",
      { maxPlayers: 5, turnTimerSeconds: null }
    );

    stateA.routes[0]!.ownerSessionToken = "a1";

    expect(stateA.routes[0]!.ownerSessionToken).toBe("a1");
    expect(stateB.routes[0]!.ownerSessionToken).toBeUndefined();
  });

  it("списывает выбранный микс цветных и локомотивов при захвате", () => {
    const engine = new GameEngine();
    const state = engine.initGame(
      "ROOM_MIX",
      [
        { sessionToken: "a", nickname: "A", wagonsLeft: 45, hand: [], destinations: [], points: 0 },
        { sessionToken: "b", nickname: "B", wagonsLeft: 45, hand: [], destinations: [], points: 0 }
      ],
      "usa",
      { maxPlayers: 5, turnTimerSeconds: null }
    );

    const player = state.players[0]!;
    player.hand = [
      { color: "red" },
      { color: "red" },
      { color: "red" },
      { color: "locomotive" },
      { color: "locomotive" },
      { color: "blue" },
    ];

    // r29: El Paso -> Dallas, length 4, red
    engine.claimRoute(state, "a", "r29", "red", 2);

    const leftRed = player.hand.filter((c) => c.color === "red").length;
    const leftLoco = player.hand.filter((c) => c.color === "locomotive").length;
    expect(leftRed).toBe(1);
    expect(leftLoco).toBe(0);
  });

  it("блокирует второй параллельный путь при 2 игроках", () => {
    const engine = new GameEngine();
    const state = engine.initGame(
      "ROOM_EURO_DOUBLE_2P",
      [
        { sessionToken: "a", nickname: "A", wagonsLeft: 45, hand: [], destinations: [], points: 0 },
        { sessionToken: "b", nickname: "B", wagonsLeft: 45, hand: [], destinations: [], points: 0 }
      ],
      "europe",
      { maxPlayers: 2, turnTimerSeconds: null }
    );

    state.routes.find((r) => r.id === "e14")!.ownerSessionToken = "a";
    state.activePlayerIndex = 1;
    state.players[1]!.hand = [{ color: "pink" }, { color: "pink" }, { color: "pink" }, { color: "pink" }];

    expect(() => engine.claimRoute(state, "b", "e73", "pink", 0)).toThrow("При 2–3 игроках второй параллельный путь недоступен");
  });

  it("разрешает брать оба параллельных пути при 4 игроках", () => {
    const engine = new GameEngine();
    const state = engine.initGame(
      "ROOM_EURO_DOUBLE_4P",
      [
        { sessionToken: "a", nickname: "A", wagonsLeft: 45, hand: [], destinations: [], points: 0 },
        { sessionToken: "b", nickname: "B", wagonsLeft: 45, hand: [], destinations: [], points: 0 },
        { sessionToken: "c", nickname: "C", wagonsLeft: 45, hand: [], destinations: [], points: 0 },
        { sessionToken: "d", nickname: "D", wagonsLeft: 45, hand: [], destinations: [], points: 0 }
      ],
      "europe",
      { maxPlayers: 4, turnTimerSeconds: null }
    );

    const first = state.routes.find((r) => r.id === "e14")!;
    const second = state.routes.find((r) => r.id === "e73")!;
    first.ownerSessionToken = "a";
    state.activePlayerIndex = 1;
    state.players[1]!.hand = [{ color: "pink" }, { color: "pink" }, { color: "pink" }, { color: "pink" }];

    engine.claimRoute(state, "b", second.id, "pink", 0);
    expect(second.ownerSessionToken).toBe("b");
  });

  it("требует минимум локомотивов для парома", () => {
    const engine = new GameEngine();
    const state = engine.initGame(
      "ROOM_EURO_FERRY_REQ",
      [
        { sessionToken: "a", nickname: "A", wagonsLeft: 45, hand: [], destinations: [], points: 0 },
        { sessionToken: "b", nickname: "B", wagonsLeft: 45, hand: [], destinations: [], points: 0 }
      ],
      "europe",
      { maxPlayers: 2, turnTimerSeconds: null }
    );

    state.players[0]!.hand = [
      { color: "orange" }, { color: "orange" }, { color: "orange" }, { color: "orange" }, { color: "orange" },
      { color: "locomotive" },
    ];

    expect(() => engine.claimRoute(state, "a", "e59", "orange", 1)).toThrow("Для парома нужно минимум 2 локомотив(а)");
  });

  it("требует доплату при туннеле по открытым картам", () => {
    const engine = new GameEngine();
    const state = engine.initGame(
      "ROOM_EURO_TUNNEL_REQ",
      [
        { sessionToken: "a", nickname: "A", wagonsLeft: 45, hand: [], destinations: [], points: 0 },
        { sessionToken: "b", nickname: "B", wagonsLeft: 45, hand: [], destinations: [], points: 0 }
      ],
      "europe",
      { maxPlayers: 2, turnTimerSeconds: null }
    );

    state.players[0]!.hand = [
      { color: "yellow" },
      { color: "yellow" },
      { color: "locomotive" },
    ];

    (engine as any).trainDeck = [
      { color: "yellow" },
      { color: "blue" },
      { color: "locomotive" },
      ...((engine as any).trainDeck as Array<{ color: string }>),
    ];

    expect(() => engine.claimRoute(state, "a", "e9", "yellow", 0)).toThrow("Недостаточно карт для оплаты туннеля");
  });
});

