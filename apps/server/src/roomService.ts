import { randomUUID } from "node:crypto";
import { type CardColor, type GameState, type Player, type RoomSummary } from "@ttr/shared";
import { GameEngine } from "./gameEngine.js";

type Room = {
  roomId: string;
  hostSessionToken: string;
  mapId: string;
  maxPlayers: number;
  timerSeconds: number | null;
  players: Player[];
  spectators: Player[];
  started: boolean;
  engine: GameEngine;
  state?: GameState;
  turnTimer?: NodeJS.Timeout;
};

export class RoomService {
  private readonly rooms = new Map<string, Room>();

  constructor(private readonly onStateChange?: (roomId: string, state: GameState) => void) {}

  list(): RoomSummary[] {
    return [...this.rooms.values()].map((room) => ({
      roomId: room.roomId,
      hostSessionToken: room.hostSessionToken,
      mapId: room.mapId,
      playersCount: room.players.length,
      maxPlayers: room.maxPlayers,
      started: room.started,
      timerSeconds: room.timerSeconds
    }));
  }

  create(payload: {
    nickname: string;
    sessionToken: string;
    mapId: string;
    maxPlayers: number;
    turnTimerSeconds: number | null;
  }): Room {
    const roomId = randomUUID().slice(0, 6).toUpperCase();
    const host: Player = {
      nickname: payload.nickname,
      sessionToken: payload.sessionToken,
      wagonsLeft: 45,
      stationsLeft: payload.mapId === "europe" ? 3 : 0,
      hand: [],
      destinations: [],
      points: 0
    };
    const room: Room = {
      roomId,
      hostSessionToken: payload.sessionToken,
      mapId: payload.mapId,
      maxPlayers: Math.max(2, Math.min(payload.maxPlayers, 5)),
      timerSeconds: payload.turnTimerSeconds,
      players: [host],
      spectators: [],
      started: false,
      engine: new GameEngine()
    };
    this.rooms.set(roomId, room);
    return room;
  }

  join(payload: {
    roomId: string;
    nickname: string;
    sessionToken: string;
    asSpectator?: boolean;
  }): Room {
    const room = this.rooms.get(payload.roomId);
    if (!room) throw new Error("Комната не найдена");

    if (payload.asSpectator) {
      if (!room.spectators.find((s) => s.sessionToken === payload.sessionToken)) {
        room.spectators.push({
          nickname: payload.nickname,
          sessionToken: payload.sessionToken,
          wagonsLeft: 45,
          stationsLeft: 0,
          hand: [],
          destinations: [],
          points: 0,
          isSpectator: true
        });
      }
      return room;
    }

    const existing = room.players.find((p) => p.sessionToken === payload.sessionToken);
    if (existing) {
      existing.nickname = payload.nickname;
      return room;
    }

    if (room.started) throw new Error("Игра уже началась");
    if (room.players.length >= room.maxPlayers) throw new Error("Комната заполнена");

    room.players.push({
      nickname: payload.nickname,
      sessionToken: payload.sessionToken,
      wagonsLeft: 45,
      stationsLeft: room.mapId === "europe" ? 3 : 0,
      hand: [],
      destinations: [],
      points: 0
    });
    return room;
  }

  start(roomId: string, sessionToken: string): Room {
    const room = this.rooms.get(roomId);
    if (!room) throw new Error("Комната не найдена");
    if (room.hostSessionToken !== sessionToken) throw new Error("Стартовать может только хост");
    if (room.players.length < 2) throw new Error("Нужно минимум 2 игрока");
    if (room.started) return room;

    room.state = room.engine.initGame(room.roomId, room.players, room.mapId, {
      maxPlayers: room.maxPlayers,
      turnTimerSeconds: room.timerSeconds
    });
    room.state.spectators = room.spectators;
    room.started = true;
    this.scheduleTurnTimer(room);
    return room;
  }

  reconnect(roomId: string, sessionToken: string): GameState {
    const room = this.rooms.get(roomId);
    if (!room || !room.state) throw new Error("Игра не найдена");
    const inPlayers = room.state.players.some((p) => p.sessionToken === sessionToken);
    const inSpectators = room.state.spectators.some((p) => p.sessionToken === sessionToken);
    if (!inPlayers && !inSpectators) throw new Error("Сессия не найдена");
    return this.maskStateForViewer(room.state, sessionToken);
  }

  drawCard(roomId: string, sessionToken: string, openIndex?: number): GameState {
    const room = this.rooms.get(roomId);
    if (!room?.state) throw new Error("Игра не запущена");
    room.state = room.engine.drawCard(room.state, sessionToken, openIndex);
    this.scheduleTurnTimer(room);
    return room.state;
  }

  drawTwoDeckCards(roomId: string, sessionToken: string): GameState {
    const room = this.rooms.get(roomId);
    if (!room?.state) throw new Error("Игра не запущена");
    // Draw first deck card
    room.state = room.engine.drawCard(room.state, sessionToken);
    // Draw second deck card (will also end the turn)
    room.state = room.engine.drawCard(room.state, sessionToken);
    this.scheduleTurnTimer(room);
    return room.state;
  }

  drawDestinations(roomId: string, sessionToken: string): GameState {
    const room = this.rooms.get(roomId);
    if (!room?.state) throw new Error("Игра не запущена");
    room.state = room.engine.drawDestinations(room.state, sessionToken);
    this.scheduleTurnTimer(room);
    return room.state;
  }

  chooseDestinations(roomId: string, sessionToken: string, keepIds: string[]): GameState {
    const room = this.rooms.get(roomId);
    if (!room?.state) throw new Error("Игра не запущена");
    room.state = room.engine.chooseDestinations(room.state, sessionToken, keepIds);
    this.scheduleTurnTimer(room);
    return room.state;
  }

  claimRoute(
    roomId: string,
    sessionToken: string,
    routeId: string,
    color: CardColor,
    useLocomotives?: number,
  ): GameState {
    const room = this.rooms.get(roomId);
    if (!room?.state) throw new Error("Игра не запущена");
    room.state = room.engine.claimRoute(room.state, sessionToken, routeId, color, useLocomotives);
    this.scheduleTurnTimer(room);
    return room.state;
  }

  buildStation(
    roomId: string,
    sessionToken: string,
    city: string,
    color: CardColor,
    useLocomotives?: number,
  ): GameState {
    const room = this.rooms.get(roomId);
    if (!room?.state) throw new Error("Игра не запущена");
    room.state = room.engine.buildStation(room.state, sessionToken, city, color, useLocomotives);
    this.scheduleTurnTimer(room);
    return room.state;
  }

  getState(roomId: string): GameState {
    const room = this.rooms.get(roomId);
    if (!room?.state) throw new Error("Игра не запущена");
    return room.state;
  }

  getStateForViewer(roomId: string, sessionToken: string): GameState {
    const room = this.rooms.get(roomId);
    if (!room?.state) throw new Error("Игра не запущена");
    return this.maskStateForViewer(room.state, sessionToken);
  }

  private maskStateForViewer(state: GameState, sessionToken: string): GameState {
    const masked = structuredClone(state);
    masked.players = masked.players.map((player) => {
      if (player.sessionToken === sessionToken) return player;
      return {
        ...player,
        // Preserve hand size for UI stats, but hide exact colors.
        hand: player.hand.map(() => ({ color: "locomotive" as const })),
      };
    });

    if (masked.pendingDestinationChoice && masked.pendingDestinationChoice.sessionToken !== sessionToken) {
      masked.pendingDestinationChoice = {
        ...masked.pendingDestinationChoice,
        cards: [],
      };
    }

    masked.events = masked.events.map((event) => {
      if (event.type !== "draw_card") return event;
      if (event.sessionToken === sessionToken) return event;
      return { ...event, cardColor: undefined };
    });

    return masked;
  }

  private scheduleTurnTimer(room: Room): void {
    if (room.turnTimer) {
      clearTimeout(room.turnTimer);
      room.turnTimer = undefined;
    }

    if (!room.state || room.state.finished) return;
    if (!room.timerSeconds || room.timerSeconds <= 0) return;

    room.turnTimer = setTimeout(() => {
      if (!room.state || room.state.finished) return;
      try {
        room.state = room.engine.skipTurn(room.state, "таймер");
        this.onStateChange?.(room.roomId, room.state);
      } catch {
        return;
      }
      this.scheduleTurnTimer(room);
    }, room.timerSeconds * 1000);
  }
}

