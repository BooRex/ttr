import {
  type CardColor,
  type FinalStanding,
  type GameEvent,
  getMinRequiredLocomotives,
  getStationBuildCost,
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
    this.trainDeck = buildTrainDeck();
    this.discardDeck = [];
    const map = MAPS[mapId] ?? MAPS.usa;
    this.destinationDeck = shuffle([...map.destinationDeck]);

    const seededPlayers = players.map((p) => {
      const hand: TrainCard[] = DEV_FAT_HAND
        ? makeDevHand()
        : [this.drawTrainCard(), this.drawTrainCard(), this.drawTrainCard(), this.drawTrainCard()]
            .filter(Boolean) as TrainCard[];
      const destinations = [this.destinationDeck.pop(), this.destinationDeck.pop(), this.destinationDeck.pop()].filter(Boolean) as DestinationCard[];
      return {
        ...p,
        wagonsLeft: 45,
        stationsLeft: map.id === "europe" ? 3 : 0,
        hand,
        destinations,
        points: 0
      };
    });

    const openCards = [this.drawTrainCard(), this.drawTrainCard(), this.drawTrainCard(), this.drawTrainCard(), this.drawTrainCard()]
      .filter(Boolean) as TrainCard[];

    return {
      roomId,
      mapId: map.id,
      started: true,
      finished: false,
      routes: map.routes.map((route) => ({ ...route })),
      stations: [],
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
      ,
      turnActionState: { action: null, drawCardsTaken: 0 }
    };
  }

  drawCard(state: GameState, playerToken: string, openIndex?: number): GameState {
    this.assertGameInProgress(state);
    if (state.pendingDestinationChoice) throw new Error("Сначала выберите карты маршрутов");

    const activePlayer = state.players[state.activePlayerIndex];
    if (!activePlayer || activePlayer.sessionToken !== playerToken) {
      throw new Error("Сейчас не ваш ход");
    }
    if (state.turnActionState.action && state.turnActionState.action !== "draw_cards") {
      throw new Error("В этом ходу уже выбрано другое действие");
    }
    if (state.turnActionState.drawCardsTaken >= 2) {
      throw new Error("В этом ходу уже взяты 2 карты");
    }
    if (typeof openIndex === "number" && state.turnActionState.drawCardsTaken > 0) {
      throw new Error("Открытую карту можно взять только как первое и единственное действие добора");
    }
    const previousAction = state.turnActionState.action;
    state.turnActionState.action = "draw_cards";

    try {
      let card: TrainCard | null;
      if (typeof openIndex === "number") {
        card = state.openCards[openIndex] ?? null;
        if (!card) throw new Error("Карта не найдена");
        state.openCards.splice(openIndex, 1);
        const replacement = this.drawTrainCard();
        if (replacement) state.openCards.push(replacement);
      } else {
        card = this.drawTrainCard();
      }

      if (!card) throw new Error("Колода пуста");

      activePlayer.hand.push(card);
      state.log.unshift(`${activePlayer.nickname} берет карту`);
      pushEvent(state, { id: eventId(), type: "draw_card", sessionToken: activePlayer.sessionToken, nickname: activePlayer.nickname });
      state.turnActionState.drawCardsTaken += 1;
      const shouldEndTurn = typeof openIndex === "number" || state.turnActionState.drawCardsTaken >= 2;
      if (shouldEndTurn) {
        this.finishTurnAndMaybeEndGame(state);
      }
      this.syncDeckCounts(state);
      return state;
    } catch (error) {
      state.turnActionState.action = previousAction;
      throw error;
    }
  }

  drawDestinations(state: GameState, playerToken: string): GameState {
    this.assertGameInProgress(state);
    if (state.pendingDestinationChoice) throw new Error("Сначала завершите текущий выбор маршрутов");

    const activePlayer = state.players[state.activePlayerIndex];
    if (!activePlayer || activePlayer.sessionToken !== playerToken) {
      throw new Error("Сейчас не ваш ход");
    }
    if (state.turnActionState.action) {
      throw new Error("В этом ходу уже выбрано другое действие");
    }
    const previousAction = state.turnActionState.action;
    state.turnActionState.action = "draw_destinations";

    try {
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
    } catch (error) {
      state.turnActionState.action = previousAction;
      throw error;
    }
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
    if (state.turnActionState.action) {
      throw new Error("В этом ходу уже выбрано другое действие");
    }
    const previousAction = state.turnActionState.action;
    state.turnActionState.action = "claim_route";

    try {
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

      const minRequiredLocos = getMinRequiredLocomotives(route);
      if (requestedLoco < minRequiredLocos) {
        throw new Error(`Для этого маршрута нужно минимум ${minRequiredLocos} локомотив(а)`);
      }

      const colorAvailable = neededColor === "locomotive"
      ? 0
      : activePlayer.hand.filter((c) => c.color === neededColor).length;
      const locoAvailable = activePlayer.hand.filter((c) => c.color === "locomotive").length;

      let needColorCards = neededColor === "locomotive" ? 0 : (route.length - requestedLoco);
      let needLocoCards = neededColor === "locomotive" ? route.length : requestedLoco;

      if (needColorCards > colorAvailable || needLocoCards > locoAvailable) {
        throw new Error("Недостаточно карт");
      }

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
        points: pointsForRouteLength(route.length),
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
    } catch (error) {
      state.turnActionState.action = previousAction;
      throw error;
    }
  }

  buildStation(
    state: GameState,
    playerToken: string,
    city: string,
    color: CardColor,
    useLocomotives?: number,
  ): GameState {
    this.assertGameInProgress(state);
    if (state.pendingDestinationChoice) throw new Error("Сначала выберите карты маршрутов");
    if (state.mapId !== "europe") throw new Error("Станции доступны только на карте Europe");

    const activePlayer = state.players[state.activePlayerIndex];
    if (!activePlayer || activePlayer.sessionToken !== playerToken) {
      throw new Error("Сейчас не ваш ход");
    }
    if (state.turnActionState.action) {
      throw new Error("В этом ходу уже выбрано другое действие");
    }
    const previousAction = state.turnActionState.action;
    state.turnActionState.action = "build_station";

    try {
      const stationsLeft = activePlayer.stationsLeft ?? 0;
      if (stationsLeft <= 0) {
        throw new Error("У вас не осталось станций");
      }

      const map = MAPS[state.mapId] ?? MAPS.usa;
      if (!map.cities.includes(city)) {
        throw new Error("Город не найден на карте");
      }
      if (state.stations.some((station) => station.city === city)) {
        throw new Error("В этом городе уже есть станция");
      }

      const cost = getStationBuildCost(stationsLeft);
      const locoCards = activePlayer.hand.filter((c) => c.color === "locomotive").length;

      if (color !== "locomotive") {
      const colorCards = activePlayer.hand.filter((c) => c.color === color).length;
      if (colorCards + locoCards < cost) throw new Error("Недостаточно карт для постройки станции");
      if (typeof useLocomotives === "number") {
        if (useLocomotives < 0 || useLocomotives > cost) throw new Error("Некорректное число локомотивов");
        const needColor = cost - useLocomotives;
        if (locoCards < useLocomotives || colorCards < needColor) {
          throw new Error("Недостаточно карт для выбранной комбинации");
        }
      }
      } else if (locoCards < cost) {
        throw new Error("Недостаточно карт-локомотивов");
      }

      const requestedLoco = color === "locomotive"
      ? cost
      : Math.max(0, Math.min(cost, useLocomotives ?? (cost - Math.min(
        activePlayer.hand.filter((c) => c.color === color).length,
        cost,
      ))));

      const colorAvailable = color === "locomotive"
      ? 0
      : activePlayer.hand.filter((c) => c.color === color).length;
      const locoAvailable = activePlayer.hand.filter((c) => c.color === "locomotive").length;

      let needColorCards = color === "locomotive" ? 0 : (cost - requestedLoco);
      let needLocoCards = requestedLoco;

      if (needColorCards > colorAvailable || needLocoCards > locoAvailable) {
        throw new Error("Недостаточно карт для постройки станции");
      }

      const newHand: TrainCard[] = [];
      for (const card of activePlayer.hand) {
        if (needColorCards > 0 && card.color === color) {
          this.discardDeck.push(card);
          needColorCards -= 1;
          continue;
        }
        if (needLocoCards > 0 && card.color === "locomotive") {
          this.discardDeck.push(card);
          needLocoCards -= 1;
          continue;
        }
        newHand.push(card);
      }
      if (needColorCards > 0 || needLocoCards > 0) {
        throw new Error("Не удалось списать выбранную комбинацию карт");
      }

      activePlayer.hand = newHand;
      activePlayer.stationsLeft = stationsLeft - 1;
      state.stations.push({ city, ownerSessionToken: activePlayer.sessionToken });

      state.log.unshift(`${activePlayer.nickname} построил станцию в ${city}`);
      pushEvent(state, {
        id: eventId(),
        type: "build_station",
        sessionToken: activePlayer.sessionToken,
        nickname: activePlayer.nickname,
        city,
      });

      this.finishTurnAndMaybeEndGame(state);
      this.syncDeckCounts(state);
      return state;
    } catch (error) {
      state.turnActionState.action = previousAction;
      throw error;
    }
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
    state.turnActionState = { action: null, drawCardsTaken: 0 };
    if (state.lastRoundTriggered && state.lastRoundEndIndex !== null && state.activePlayerIndex === state.lastRoundEndIndex) {
      this.finalizeGame(state);
    }
  }

  private finalizeGame(state: GameState): void {
    if (state.finished) return;

    const standingsWithMeta = state.players.map((player) => {
      const destinationScore = this.scoreDestinations(state, player.sessionToken, player.destinations);
      player.points += destinationScore.delta;
      const stationPointsBonus = state.mapId === "europe" ? (player.stationsLeft ?? 0) * 4 : 0;
      if (state.mapId === "europe") {
        player.points += stationPointsBonus;
      }
      return {
        player,
        completedDestinations: destinationScore.completed,
        totalDestinations: player.destinations.length,
        destinationPointsDelta: destinationScore.delta,
        stationPointsBonus,
      };
    });

    const finalStandings: FinalStanding[] = standingsWithMeta
      .map(({ player, completedDestinations, totalDestinations, destinationPointsDelta, stationPointsBonus }) => ({
        sessionToken: player.sessionToken,
        nickname: player.nickname,
        points: player.points,
        completedDestinations,
        totalDestinations,
        destinationPointsDelta,
        stationPointsBonus,
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
    let delta = 0;
    let completed = 0;

    for (const destination of destinations) {
      if (this.isDestinationConnected(state, sessionToken, destination.from, destination.to)) {
        delta += destination.points;
        completed += 1;
      } else {
        delta -= destination.points;
      }
    }

    return { delta, completed };
  }

  private isDestinationConnected(state: GameState, sessionToken: string, from: string, to: string): boolean {
    const baseAdjacency = buildAdjacency(state, sessionToken);
    if (isConnected(baseAdjacency, from, to)) return true;

    const stationCities = state.stations
      .filter((station) => station.ownerSessionToken === sessionToken)
      .map((station) => station.city);
    if (stationCities.length === 0) return false;

    const stationOptions = stationCities.map((city) => {
      const options = state.routes.filter((route) => {
        if (!route.ownerSessionToken || route.ownerSessionToken === sessionToken) return false;
        return route.from === city || route.to === city;
      });
      return [null, ...options];
    });

    const tryCombination = (index: number, picked: Route[]): boolean => {
      if (index >= stationOptions.length) {
        const adjacency = new Map<string, Set<string>>();
        for (const [city, neighbors] of baseAdjacency.entries()) {
          adjacency.set(city, new Set(neighbors));
        }
        for (const route of picked) {
          if (!adjacency.has(route.from)) adjacency.set(route.from, new Set<string>());
          if (!adjacency.has(route.to)) adjacency.set(route.to, new Set<string>());
          adjacency.get(route.from)?.add(route.to);
          adjacency.get(route.to)?.add(route.from);
        }
        return isConnected(adjacency, from, to);
      }

      for (const option of stationOptions[index]) {
        if (option && tryCombination(index + 1, [...picked, option])) return true;
        if (!option && tryCombination(index + 1, picked)) return true;
      }
      return false;
    };

    return tryCombination(0, []);
  }

  private advanceTurn(state: GameState): void {
    state.activePlayerIndex = (state.activePlayerIndex + 1) % state.players.length;
  }

  private syncDeckCounts(state: GameState): void {
    state.trainDeckCount = this.trainDeck.length;
    state.discardDeckCount = this.discardDeck.length;
    state.destinationDeckCount = this.destinationDeck.length;
  }

  private drawTrainCard(): TrainCard | null {
    if (this.trainDeck.length === 0) {
      if (this.discardDeck.length > 0) {
        this.trainDeck = shuffle(this.discardDeck);
        this.discardDeck = [];
      } else {
        // Infinite deck mode: when all cards are exhausted, generate a fresh shuffled pack.
        this.trainDeck = buildTrainDeck();
      }
    }

    return drawFromDeck(this.trainDeck);
  }

}

