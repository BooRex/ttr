import {
  type CardColor,
  type FinalStanding,
  type GameEvent,
  MAPS,
  pointsForRouteLength,
  TRAIN_COLORS,
  type DestinationCard,
  type GameSettings,
  type GameState,
  type Player,
  type Route,
  type TrainCard
} from "@ttr/shared";

const shuffle = <T>(items: T[]): T[] => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const buildTrainDeck = (): TrainCard[] => {
  const cards: TrainCard[] = [];
  for (const color of TRAIN_COLORS) {
    for (let i = 0; i < 12; i += 1) cards.push({ color });
  }
  for (let i = 0; i < 14; i += 1) cards.push({ color: "locomotive" });
  return shuffle(cards);
};

const drawFromDeck = (deck: TrainCard[]): TrainCard | null => deck.shift() ?? null;

const eventId = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const pushEvent = (state: GameState, event: GameEvent): void => {
  state.events.unshift(event);
};

const sameRoutePair = (a: Route, b: Route): boolean => (
  (a.from === b.from && a.to === b.to) || (a.from === b.to && a.to === b.from)
);

const buildAdjacency = (state: GameState, sessionToken: string): Map<string, Set<string>> => {
  const adjacency = new Map<string, Set<string>>();
  for (const route of state.routes) {
    if (route.ownerSessionToken !== sessionToken) continue;
    if (!adjacency.has(route.from)) adjacency.set(route.from, new Set<string>());
    if (!adjacency.has(route.to)) adjacency.set(route.to, new Set<string>());
    adjacency.get(route.from)?.add(route.to);
    adjacency.get(route.to)?.add(route.from);
  }
  return adjacency;
};

const isConnected = (adjacency: Map<string, Set<string>>, from: string, to: string): boolean => {
  if (from === to) return true;
  if (!adjacency.has(from) || !adjacency.has(to)) return false;

  const queue = [from];
  const visited = new Set<string>([from]);
  while (queue.length > 0) {
    const current = queue.shift() as string;
    const neighbors = adjacency.get(current);
    if (!neighbors) continue;
    for (const next of neighbors) {
      if (next === to) return true;
      if (visited.has(next)) continue;
      visited.add(next);
      queue.push(next);
    }
  }
  return false;
};

// ─────────────────────────────────────────────────────────────────────────────
// 🧪 LOCAL TEST MODE — set to true to start with 20 cards of every color
// ─────────────────────────────────────────────────────────────────────────────
const DEV_FAT_HAND = process.env.NODE_ENV === "development";

const makeDevHand = (): TrainCard[] =>
  ([...TRAIN_COLORS, "locomotive" as const] as const).flatMap(
    (color) => Array.from({ length: 20 }, () => ({ color }) as TrainCard),
  );
// ─────────────────────────────────────────────────────────────────────────────

export class GameEngine {
  private trainDeck: TrainCard[];

  private discardDeck: TrainCard[] = [];

  private destinationDeck: DestinationCard[] = [];

  constructor() {
    this.trainDeck = buildTrainDeck();
  }

  initGame(roomId: string, players: Player[], mapId: string, settings: GameSettings): GameState {
    const map = MAPS[mapId] ?? MAPS.usa;
    this.destinationDeck = shuffle([...map.destinationDeck]);

    const seededPlayers = players.map((p) => {
      const hand: TrainCard[] = DEV_FAT_HAND
        ? makeDevHand()
        : [drawFromDeck(this.trainDeck), drawFromDeck(this.trainDeck), drawFromDeck(this.trainDeck), drawFromDeck(this.trainDeck)]
            .filter(Boolean) as TrainCard[];
      const destinations = [this.destinationDeck.pop(), this.destinationDeck.pop(), this.destinationDeck.pop()].filter(Boolean) as DestinationCard[];
      return {
        ...p,
        wagonsLeft: 45,
        hand,
        destinations,
        points: 0
      };
    });

    const openCards = [drawFromDeck(this.trainDeck), drawFromDeck(this.trainDeck), drawFromDeck(this.trainDeck), drawFromDeck(this.trainDeck), drawFromDeck(this.trainDeck)]
      .filter(Boolean) as TrainCard[];

    return {
      roomId,
      mapId: map.id,
      started: true,
      finished: false,
      routes: map.routes.map((route) => ({ ...route })),
      players: seededPlayers,
      spectators: [],
      activePlayerIndex: 0,
      openCards,
      trainDeckCount: this.trainDeck.length,
      discardDeckCount: this.discardDeck.length,
      destinationDeckCount: this.destinationDeck.length,
      pendingDestinationChoice: null,
      lastRoundTriggered: false,
      lastRoundEndIndex: null,
      winnerSessionToken: null,
      finalStandings: [],
      settings,
      log: ["Игра началась"],
      events: [{ id: eventId(), type: "game_started" }]
    };
  }

  drawCard(state: GameState, playerToken: string, openIndex?: number): GameState {
    this.assertGameInProgress(state);
    if (state.pendingDestinationChoice) throw new Error("Сначала выберите карты маршрутов");

    const activePlayer = state.players[state.activePlayerIndex];
    if (!activePlayer || activePlayer.sessionToken !== playerToken) {
      throw new Error("Сейчас не ваш ход");
    }

    let card: TrainCard | null;
    if (typeof openIndex === "number") {
      card = state.openCards[openIndex] ?? null;
      if (!card) throw new Error("Карта не найдена");
      state.openCards.splice(openIndex, 1);
      const replacement = drawFromDeck(this.trainDeck);
      if (replacement) state.openCards.push(replacement);
    } else {
      card = drawFromDeck(this.trainDeck);
    }

    if (!card) throw new Error("Колода пуста");

    activePlayer.hand.push(card);
    state.log.unshift(`${activePlayer.nickname} берет карту ${card.color}`);
    pushEvent(state, { id: eventId(), type: "draw_card", sessionToken: activePlayer.sessionToken, nickname: activePlayer.nickname, cardColor: card.color });
    this.finishTurnAndMaybeEndGame(state);
    this.syncDeckCounts(state);
    return state;
  }

  drawDestinations(state: GameState, playerToken: string): GameState {
    this.assertGameInProgress(state);
    if (state.pendingDestinationChoice) throw new Error("Сначала завершите текущий выбор маршрутов");

    const activePlayer = state.players[state.activePlayerIndex];
    if (!activePlayer || activePlayer.sessionToken !== playerToken) {
      throw new Error("Сейчас не ваш ход");
    }

    const cards = [this.destinationDeck.pop(), this.destinationDeck.pop(), this.destinationDeck.pop()].filter(Boolean) as DestinationCard[];
    if (cards.length === 0) throw new Error("Колода маршрутов пуста");

    state.pendingDestinationChoice = {
      sessionToken: playerToken,
      cards,
      minKeep: Math.min(1, cards.length)
    };
    state.log.unshift(`${activePlayer.nickname} берет карты маршрутов`);
    pushEvent(state, { id: eventId(), type: "draw_destinations", sessionToken: activePlayer.sessionToken, nickname: activePlayer.nickname });
    this.syncDeckCounts(state);
    return state;
  }

  chooseDestinations(state: GameState, playerToken: string, keepIds: string[]): GameState {
    this.assertGameInProgress(state);
    const pending = state.pendingDestinationChoice;
    if (!pending) throw new Error("Нет активного выбора маршрутов");
    if (pending.sessionToken !== playerToken) throw new Error("Вы не можете подтвердить чужой выбор");

    const uniqueKeepIds = [...new Set(keepIds)];
    const kept = pending.cards.filter((card) => uniqueKeepIds.includes(card.id));
    if (kept.length < pending.minKeep) {
      throw new Error(`Нужно оставить минимум ${pending.minKeep} карт(ы)`);
    }
    if (kept.length !== uniqueKeepIds.length) {
      throw new Error("Переданы некорректные карты маршрутов");
    }

    const player = state.players.find((p) => p.sessionToken === playerToken);
    if (!player) throw new Error("Игрок не найден");

    const returned = pending.cards.filter((card) => !uniqueKeepIds.includes(card.id));
    player.destinations.push(...kept);
    this.destinationDeck.push(...returned);
    state.pendingDestinationChoice = null;

    state.log.unshift(`${player.nickname} оставляет ${kept.length} карт(ы) маршрутов`);
    pushEvent(state, { id: eventId(), type: "choose_destinations", sessionToken: player.sessionToken, nickname: player.nickname, keepCount: kept.length });
    this.finishTurnAndMaybeEndGame(state);
    this.syncDeckCounts(state);
    return state;
  }

  claimRoute(
    state: GameState,
    playerToken: string,
    routeId: string,
    color: CardColor,
    useLocomotives?: number,
  ): GameState {
    this.assertGameInProgress(state);
    if (state.pendingDestinationChoice) throw new Error("Сначала выберите карты маршрутов");

    const activePlayer = state.players[state.activePlayerIndex];
    if (!activePlayer || activePlayer.sessionToken !== playerToken) {
      throw new Error("Сейчас не ваш ход");
    }

    const route = state.routes.find((r) => r.id === routeId);
    if (!route) throw new Error("Маршрут не найден");
    if (route.ownerSessionToken) throw new Error("Маршрут уже занят");
    const parallelRoutes = state.routes.filter((r) => r.id !== route.id && sameRoutePair(r, route));
    if (state.players.length <= 3 && parallelRoutes.some((r) => r.ownerSessionToken)) {
      throw new Error("При 2–3 игроках второй параллельный путь недоступен");
    }
    if (activePlayer.wagonsLeft < route.length) throw new Error("Недостаточно вагонов");

    const neededColor = route.color === "gray" ? color : route.color;
    // For non-gray colored routes locomotive is not a valid base color
    if (neededColor === "locomotive" && route.color !== "gray") throw new Error("Неверный цвет");

    const locoCards = activePlayer.hand.filter((c) => c.color === "locomotive").length;

    if (neededColor === "locomotive") {
      // Pure locomotive claim on a gray route
      if (locoCards < route.length) throw new Error("Недостаточно карт-локомотивов");
    } else {
      const colorCards = activePlayer.hand.filter((c) => c.color === neededColor).length;
      if (colorCards + locoCards < route.length) throw new Error("Недостаточно карт");
      if (typeof useLocomotives === "number") {
        if (useLocomotives < 0 || useLocomotives > route.length) throw new Error("Некорректное число локомотивов");
        const needColor = route.length - useLocomotives;
        if (locoCards < useLocomotives || colorCards < needColor) {
          throw new Error("Недостаточно карт для выбранной комбинации");
        }
      }
    }

    const requestedLoco = neededColor === "locomotive"
      ? route.length
      : Math.max(0, Math.min(route.length, useLocomotives ?? (route.length - Math.min(
        activePlayer.hand.filter((c) => c.color === neededColor).length,
        route.length,
      ))));
    let needColorCards = route.length - requestedLoco;
    let needLocoCards = requestedLoco;
    const newHand: TrainCard[] = [];
    for (const c of activePlayer.hand) {
      if (needColorCards > 0 && c.color === neededColor) {
        this.discardDeck.push(c);
        needColorCards -= 1;
        continue;
      }
      if (needLocoCards > 0 && c.color === "locomotive") {
        this.discardDeck.push(c);
        needLocoCards -= 1;
        continue;
      }
      newHand.push(c);
    }
    if (needColorCards > 0 || needLocoCards > 0) {
      throw new Error("Не удалось списать выбранную комбинацию карт");
    }
    activePlayer.hand = newHand;

    route.ownerSessionToken = activePlayer.sessionToken;
    activePlayer.wagonsLeft -= route.length;
    activePlayer.points += pointsForRouteLength(route.length);

    state.log.unshift(`${activePlayer.nickname} захватил маршрут ${route.from} - ${route.to}`);
    pushEvent(state, {
      id: eventId(),
      type: "claim_route",
      sessionToken: activePlayer.sessionToken,
      nickname: activePlayer.nickname,
      routeId: route.id,
      from: route.from,
      to: route.to,
    });
    if (!state.lastRoundTriggered && activePlayer.wagonsLeft <= 2) {
      state.lastRoundTriggered = true;
      state.lastRoundEndIndex = state.activePlayerIndex;
      state.log.unshift(`Финальный раунд: у ${activePlayer.nickname} осталось ${activePlayer.wagonsLeft} вагонов`);
      pushEvent(state, {
        id: eventId(),
        type: "final_round",
        sessionToken: activePlayer.sessionToken,
        nickname: activePlayer.nickname,
        wagonsLeft: activePlayer.wagonsLeft,
      });
    }

    this.finishTurnAndMaybeEndGame(state);
    this.syncDeckCounts(state);
    return state;
  }

  skipTurn(state: GameState, reason: string): GameState {
    this.assertGameInProgress(state);
    const activePlayer = state.players[state.activePlayerIndex];
    if (!activePlayer) throw new Error("Активный игрок не найден");

    if (state.pendingDestinationChoice?.sessionToken === activePlayer.sessionToken) {
      const autoKeep = state.pendingDestinationChoice.cards.slice(0, state.pendingDestinationChoice.minKeep).map((c) => c.id);
      this.chooseDestinations(state, activePlayer.sessionToken, autoKeep);
      return state;
    }

    state.log.unshift(`${activePlayer.nickname}: ход пропущен (${reason})`);
    pushEvent(state, { id: eventId(), type: "turn_skipped", sessionToken: activePlayer.sessionToken, nickname: activePlayer.nickname, reason });
    this.finishTurnAndMaybeEndGame(state);
    this.syncDeckCounts(state);
    return state;
  }

  private assertGameInProgress(state: GameState): void {
    if (state.finished) throw new Error("Игра уже завершена");
  }

  private finishTurnAndMaybeEndGame(state: GameState): void {
    this.advanceTurn(state);
    if (state.lastRoundTriggered && state.lastRoundEndIndex !== null && state.activePlayerIndex === state.lastRoundEndIndex) {
      this.finalizeGame(state);
    }
  }

  private finalizeGame(state: GameState): void {
    if (state.finished) return;

    const standingsWithMeta = state.players.map((player) => {
      const destinationScore = this.scoreDestinations(state, player.sessionToken, player.destinations);
      player.points += destinationScore.delta;
      return {
        player,
        completedDestinations: destinationScore.completed
      };
    });

    const finalStandings: FinalStanding[] = standingsWithMeta
      .map(({ player, completedDestinations }) => ({
        sessionToken: player.sessionToken,
        nickname: player.nickname,
        points: player.points,
        completedDestinations
      }))
      .sort((a, b) => b.points - a.points || b.completedDestinations - a.completedDestinations || a.nickname.localeCompare(b.nickname));

    state.finished = true;
    state.finalStandings = finalStandings;
    state.winnerSessionToken = finalStandings[0]?.sessionToken ?? null;

    if (finalStandings[0]) {
      state.log.unshift(`Игра завершена. Победитель: ${finalStandings[0].nickname} (${finalStandings[0].points} очков)`);
    } else {
      state.log.unshift("Игра завершена");
    }
    pushEvent(state, {
      id: eventId(),
      type: "game_finished",
      winnerSessionToken: finalStandings[0]?.sessionToken ?? null,
      winnerNickname: finalStandings[0]?.nickname ?? null,
      winnerPoints: finalStandings[0]?.points ?? null,
    });
  }

  private scoreDestinations(state: GameState, sessionToken: string, destinations: DestinationCard[]): { delta: number; completed: number } {
    const adjacency = buildAdjacency(state, sessionToken);
    let delta = 0;
    let completed = 0;

    for (const destination of destinations) {
      if (isConnected(adjacency, destination.from, destination.to)) {
        delta += destination.points;
        completed += 1;
      } else {
        delta -= destination.points;
      }
    }

    return { delta, completed };
  }

  private advanceTurn(state: GameState): void {
    state.activePlayerIndex = (state.activePlayerIndex + 1) % state.players.length;
  }

  private syncDeckCounts(state: GameState): void {
    state.trainDeckCount = this.trainDeck.length;
    state.discardDeckCount = this.discardDeck.length;
    state.destinationDeckCount = this.destinationDeck.length;
  }
}

