import { describe, expect, it } from "vitest";
import { GameEngine } from "../src/gameEngine.js";
import { MAPS } from "@ttr/shared";

const sameRoutePair = (
  route: { from: string; to: string },
  from: string,
  to: string,
): boolean => (
  (route.from === from && route.to === to) || (route.from === to && route.to === from)
);

const findRoute = (
  routes: Array<{ from: string; to: string; color: string; routeType?: string; id: string; ownerSessionToken?: string }>,
  from: string,
  to: string,
  color?: string,
  routeType?: string,
) => routes.find((route) => (
  sameRoutePair(route, from, to)
  && (color ? route.color === color : true)
  && (routeType ? route.routeType === routeType : true)
));

describe("GameEngine", () => {
  it("раздает карты и запускает игру", () => {
    const engine = new GameEngine();
    const state = engine.initGame(
      "ROOM1",
      [
        { sessionToken: "a", nickname: "A", wagonsLeft: 45, hand: [], destinations: [], points: 0 },
        { sessionToken: "b", nickname: "B", wagonsLeft: 45, hand: [], destinations: [], points: 0 }
      ],
      "europe",
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
      "europe",
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
      "europe",
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
      "europe",
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
      "europe",
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
      "europe",
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
      "europe",
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
      "europe",
      { maxPlayers: 5, turnTimerSeconds: null }
    );

    state.players[0]!.destinations = [{ id: "x", from: "London", to: "Athina", points: 9 }];
    state.players[1]!.destinations = [{ id: "y", from: "Madrid", to: "Pamplona", points: 4 }];

    // Дать игроку a очки за маршруты чтобы он гарантированно выиграл
    state.players[0]!.points = 25;
    state.players[1]!.points = 0;
    state.players[0]!.stationsLeft = 0;
    state.players[1]!.stationsLeft = 0;

    state.lastRoundTriggered = true;
    state.lastRoundEndIndex = 0;
    state.activePlayerIndex = 1;

    engine.drawCard(state, "b");
    engine.drawCard(state, "b");

    expect(state.finished).toBe(true);
    // a: 25 - 9 = 16, b: 0 - 4 = -4
    expect(state.winnerSessionToken).toBe("a");
    expect(state.finalStandings[0]?.sessionToken).toBe("a");
    expect(state.players[0]?.points).toBe(16);
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
      "europe",
      { maxPlayers: 5, turnTimerSeconds: null }
    );

    state.finished = true;

    expect(() => engine.drawCard(state, "a")).toThrow("Игра уже завершена");
    expect(() => engine.claimRoute(state, "a", "r1", "red")).toThrow("Игра уже завершена");
  });

  it("использует карту Europe с полноценной колодой маршрутов", () => {
    expect(MAPS.europe.cities.length).toBeGreaterThanOrEqual(40);
    expect(MAPS.europe.routes.length).toBeGreaterThanOrEqual(70);
    expect(MAPS.europe.destinationDeck.length).toBeGreaterThanOrEqual(30);
  });

  it("карта Europe не содержит битых ссылок и изолированных городов", () => {
    const europe = MAPS.europe;
    const cities = new Set(europe.cities);
    const adjacency = new Map<string, Set<string>>();

    for (const city of europe.cities) {
      adjacency.set(city, new Set());
    }

    for (const route of europe.routes) {
      expect(cities.has(route.from)).toBe(true);
      expect(cities.has(route.to)).toBe(true);
      adjacency.get(route.from)?.add(route.to);
      adjacency.get(route.to)?.add(route.from);
    }

    for (const card of europe.destinationDeck) {
      expect(cities.has(card.from)).toBe(true);
      expect(cities.has(card.to)).toBe(true);
    }

    for (const city of europe.cities) {
      expect(adjacency.get(city)?.size ?? 0).toBeGreaterThan(0);
    }

    const start = europe.cities[0];
    expect(start).toBeTruthy();
    const visited = new Set<string>(start ? [start] : []);
    const queue = start ? [start] : [];

    while (queue.length > 0) {
      const current = queue.shift() as string;
      for (const next of Array.from(adjacency.get(current) ?? [])) {
        if (visited.has(next)) continue;
        visited.add(next);
        queue.push(next);
      }
    }

    expect(visited.size).toBe(europe.cities.length);
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
      "europe",
      { maxPlayers: 5, turnTimerSeconds: null }
    );

    const stateB = engineB.initGame(
      "ROOM_B",
      [
        { sessionToken: "b1", nickname: "B1", wagonsLeft: 45, hand: [], destinations: [], points: 0 },
        { sessionToken: "b2", nickname: "B2", wagonsLeft: 45, hand: [], destinations: [], points: 0 }
      ],
      "europe",
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
      "europe",
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
    const route = findRoute(state.routes, "Pamplona", "Marseille", "red");
    expect(route).toBeTruthy();
    engine.claimRoute(state, "a", route!.id, "red", 2);

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

    const first = findRoute(state.routes, "Berlin", "Warszawa", "yellow");
    const second = findRoute(state.routes, "Berlin", "Warszawa", "pink");

    expect(first).toBeTruthy();
    expect(second).toBeTruthy();

    first!.ownerSessionToken = "a";
    state.activePlayerIndex = 1;
    state.players[1]!.hand = [{ color: "pink" }, { color: "pink" }, { color: "pink" }, { color: "pink" }];

    expect(() => engine.claimRoute(state, "b", second!.id, "pink", 0)).toThrow("При 2–3 игроках второй параллельный путь недоступен");
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

    const first = findRoute(state.routes, "Berlin", "Warszawa", "yellow");
    const second = findRoute(state.routes, "Berlin", "Warszawa", "pink");

    expect(first).toBeTruthy();
    expect(second).toBeTruthy();

    first.ownerSessionToken = "a";
    state.activePlayerIndex = 1;
    state.players[1]!.hand = [{ color: "pink" }, { color: "pink" }, { color: "pink" }, { color: "pink" }];

    engine.claimRoute(state, "b", second!.id, "pink", 0);
    expect(second!.ownerSessionToken).toBe("b");
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

    // Палермо-Смирна: паром длиной 6 — должен требовать минимум 2 локомотива
    state.players[0]!.hand = [
      { color: "orange" }, { color: "orange" }, { color: "orange" },
      { color: "orange" }, { color: "orange" },
      { color: "locomotive" },
    ];
    const ferryRoute = findRoute(state.routes, "Palermo", "Smyrna", "gray", "ferry");
    expect(ferryRoute).toBeTruthy();
    expect(() => engine.claimRoute(state, "a", ferryRoute!.id, "orange", 1)).toThrow("Для этого маршрута нужно минимум 2 локомотив(а)");
  });

  it("требует минимум 1 локомотив для туннеля", () => {
    const engine = new GameEngine();
    const state = engine.initGame(
      "ROOM_EURO_TUNNEL_LOCO_REQ",
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
    ];
    const tunnelRoute = findRoute(state.routes, "Barcelona", "Pamplona", "gray", "tunnel");
    expect(tunnelRoute).toBeTruthy();
    expect(() => engine.claimRoute(state, "a", tunnelRoute!.id, "yellow", 0)).toThrow("Для этого маршрута нужно минимум 1 локомотив(а)");
  });

  it("строит станцию в Europe и списывает карты по стоимости", () => {
    const engine = new GameEngine();
    const state = engine.initGame(
      "ROOM_EURO_STATION_BUILD",
      [
        { sessionToken: "a", nickname: "A", wagonsLeft: 45, hand: [], destinations: [], points: 0 },
        { sessionToken: "b", nickname: "B", wagonsLeft: 45, hand: [], destinations: [], points: 0 }
      ],
      "europe",
      { maxPlayers: 2, turnTimerSeconds: null }
    );

    state.players[0]!.hand = [{ color: "blue" }, { color: "red" }];

    engine.buildStation(state, "a", "Paris", "blue", 0);

    expect(state.stations).toContainEqual({ city: "Paris", ownerSessionToken: "a" });
    expect(state.players[0]!.stationsLeft).toBe(2);
    expect(state.players[0]!.hand).toEqual([{ color: "red" }]);
    expect(state.activePlayerIndex).toBe(1);
  });

  it("учитывает +4 очка за каждую неиспользованную станцию в конце игры", () => {
    const engine = new GameEngine();
    const state = engine.initGame(
      "ROOM_EURO_STATION_SCORE",
      [
        { sessionToken: "a", nickname: "A", wagonsLeft: 45, hand: [], destinations: [], points: 0 },
        { sessionToken: "b", nickname: "B", wagonsLeft: 45, hand: [], destinations: [], points: 0 }
      ],
      "europe",
      { maxPlayers: 2, turnTimerSeconds: null }
    );

    state.players[0]!.destinations = [];
    state.players[1]!.destinations = [];
    state.players[0]!.stationsLeft = 0;
    state.players[1]!.stationsLeft = 0;
    state.players[0]!.points = 0;
    state.players[1]!.points = 0;
    state.players[0]!.stationsLeft = 2;
    state.players[1]!.stationsLeft = 1;

    state.lastRoundTriggered = true;
    state.lastRoundEndIndex = 0;
    state.activePlayerIndex = 1;

    engine.drawCard(state, "b");
    engine.drawCard(state, "b");

    expect(state.finished).toBe(true);
    const a = state.finalStandings.find((s) => s.sessionToken === "a");
    const b = state.finalStandings.find((s) => s.sessionToken === "b");
    expect(a?.points).toBe(8);
    expect(b?.points).toBe(4);
  });

  it("начисляет +10 очков игроку с самым длинным непрерывным путем", () => {
    const engine = new GameEngine();
    const state = engine.initGame(
      "ROOM_LONGEST_PATH",
      [
        { sessionToken: "a", nickname: "A", wagonsLeft: 45, hand: [], destinations: [], points: 0 },
        { sessionToken: "b", nickname: "B", wagonsLeft: 45, hand: [], destinations: [], points: 0 }
      ],
      "europe",
      { maxPlayers: 2, turnTimerSeconds: null }
    );

    state.players[0]!.destinations = [];
    state.players[1]!.destinations = [];

    // A: непрерывная цепочка Seattle -> Portland -> San Francisco -> Los Angeles = 1+5+3 = 9
    const a1 = findRoute(state.routes, "Dieppe", "Paris", "pink");
    const a2 = findRoute(state.routes, "Paris", "Frankfurt", "white");
    const a3 = findRoute(state.routes, "Frankfurt", "Berlin", "red");
    expect(a1).toBeTruthy();
    expect(a2).toBeTruthy();
    expect(a3).toBeTruthy();
    a1!.ownerSessionToken = "a";
    a2!.ownerSessionToken = "a";
    a3!.ownerSessionToken = "a";

    const b1 = findRoute(state.routes, "Sofia", "Constantinople", "blue");
    expect(b1).toBeTruthy();
    b1!.ownerSessionToken = "b";

    state.lastRoundTriggered = true;
    state.lastRoundEndIndex = 0;
    state.activePlayerIndex = 1;

    engine.drawCard(state, "b");
    engine.drawCard(state, "b");

    expect(state.finished).toBe(true);
    const a = state.finalStandings.find((s) => s.sessionToken === "a");
    const b = state.finalStandings.find((s) => s.sessionToken === "b");

    expect(a?.longestPathLength).toBe(7);
    expect(a?.longestPathBonus).toBe(10);
    expect(b?.longestPathBonus).toBe(0);
    expect(a?.points).toBe(22);
  });

  it("финальный раунд триггерится когда нельзя построить ни один маршрут по вагонам", () => {
    const engine = new GameEngine();
    const state = engine.initGame(
      "ROOM_FINAL_TRIGGER",
      [
        { sessionToken: "a", nickname: "A", wagonsLeft: 45, hand: [], destinations: [], points: 0 },
        { sessionToken: "b", nickname: "B", wagonsLeft: 45, hand: [], destinations: [], points: 0 }
      ],
      "europe",
      { maxPlayers: 2, turnTimerSeconds: null }
    );

    // При 1 вагоне существует маршрут длиной 1 (Vienna-Budapest) — триггера нет
    const player = state.players[0]!;
    player.wagonsLeft = 1;
    // claimRoute проверяет canBuildAnyRoute ПОСЛЕ захвата — симулируем вручную
    // При wagonsLeft=1 есть маршруты длиной 1 → canBuildAnyRoute = true
    const shortRoutes = state.routes.filter((r) => r.length === 1 && !r.ownerSessionToken);
    expect(shortRoutes.length).toBeGreaterThan(0);

    // При wagonsLeft=0 ни один маршрут не доступен → canBuildAnyRoute = false
    player.wagonsLeft = 0;
    // Нет ни одного маршрута длиной 0 → функция должна вернуть false
    let canBuild = false;
    for (const route of state.routes) {
      if (route.ownerSessionToken) continue;
      if (player.wagonsLeft >= route.length) { canBuild = true; break; }
    }
    expect(canBuild).toBe(false);

    // Финальный раунд триггерится через claimRoute когда после хода вагонов не хватает
    // Готовим игрока a с ровно 2 вагонами и картами для маршрута длиной 2
    player.wagonsLeft = 2;
    // Найдем маршрут длиной 2 с фиксированным цветом (не gray, не tunnel/ferry)
    const targetRoute = state.routes.find(
      (r) => r.length === 2 && !r.ownerSessionToken && r.color !== "gray" && r.routeType === "normal"
    );
    expect(targetRoute).toBeTruthy();

    player.hand = Array.from({ length: 4 }, () => ({ color: targetRoute!.color as any }));

    engine.claimRoute(state, "a", targetRoute!.id, targetRoute!.color as any, 0);

    // После захвата wagonsLeft = 0 → ни одного маршрута → финальный раунд
    expect(player.wagonsLeft).toBe(0);
    expect(state.lastRoundTriggered).toBe(true);
    expect(state.lastRoundEndIndex).toBe(0);
  });

  it("не ломается при полном исчерпании колоды поездов (бесконечная колода)", () => {    const engine = new GameEngine();
    const state = engine.initGame(
      "ROOM_INFINITE_DECK",
      [
        { sessionToken: "a", nickname: "A", wagonsLeft: 45, hand: [], destinations: [], points: 0 },
        { sessionToken: "b", nickname: "B", wagonsLeft: 45, hand: [], destinations: [], points: 0 }
      ],
      "europe",
      { maxPlayers: 2, turnTimerSeconds: null }
    );

    for (let i = 0; i < 80; i += 1) {
      const current = state.players[state.activePlayerIndex]!;
      engine.drawCard(state, current.sessionToken);
      engine.drawCard(state, current.sessionToken);
    }

    expect(state.players[0]!.hand.length + state.players[1]!.hand.length).toBeGreaterThan(100);
    expect(state.trainDeckCount).toBeGreaterThanOrEqual(0);
  });

  it("не залипает действие хода после неудачного захвата маршрута", () => {
    const engine = new GameEngine();
    const state = engine.initGame(
      "ROOM_ACTION_ROLLBACK",
      [
        { sessionToken: "a", nickname: "A", wagonsLeft: 45, hand: [], destinations: [], points: 0 },
        { sessionToken: "b", nickname: "B", wagonsLeft: 45, hand: [], destinations: [], points: 0 }
      ],
      "europe",
      { maxPlayers: 2, turnTimerSeconds: null }
    );

    state.players[0]!.hand = [];

    const route = findRoute(state.routes, "Dieppe", "Paris", "pink");
    expect(route).toBeTruthy();
    expect(() => engine.claimRoute(state, "a", route!.id, "pink", 0)).toThrow("Недостаточно карт");
    expect(state.turnActionState.action).toBeNull();

    expect(() => engine.drawDestinations(state, "a")).not.toThrow();
  });

  it("считает выполненный маршрут через станцию в финальном подсчете", () => {
    const engine = new GameEngine();
    const state = engine.initGame(
      "ROOM_EURO_STATION_DESTINATION",
      [
        { sessionToken: "a", nickname: "A", wagonsLeft: 45, hand: [], destinations: [], points: 0 },
        { sessionToken: "b", nickname: "B", wagonsLeft: 45, hand: [], destinations: [], points: 0 }
      ],
      "europe",
      { maxPlayers: 2, turnTimerSeconds: null }
    );

    state.players[0]!.destinations = [{ id: "zd1", from: "Dieppe", to: "Frankfurt", points: 8 }];
    state.players[1]!.destinations = [];
    state.players[0]!.points = 0;
    state.players[1]!.points = 0;

    const mine = findRoute(state.routes, "Dieppe", "Paris");
    const enemy = findRoute(state.routes, "Paris", "Frankfurt");
    expect(mine).toBeTruthy();
    expect(enemy).toBeTruthy();
    mine!.ownerSessionToken = "a";
    enemy!.ownerSessionToken = "b";

    state.stations.push({ city: "Paris", ownerSessionToken: "a" });
    state.players[0]!.stationsLeft = 2;

    state.lastRoundTriggered = true;
    state.lastRoundEndIndex = 0;
    state.activePlayerIndex = 1;

    engine.drawCard(state, "b");
    engine.drawCard(state, "b");

    expect(state.finished).toBe(true);
    const aStanding = state.finalStandings.find((s) => s.sessionToken === "a");
    expect(aStanding?.completedDestinations).toBe(1);
    expect(aStanding?.totalDestinations).toBe(1);
    expect(aStanding?.destinationPointsDelta).toBe(8);
    expect(aStanding?.stationPointsBonus).toBe(8);
  });
});

