import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "@ttr/shared";
import { RoomService } from "./roomService.js";

const PORT = Number(process.env.PORT ?? 3000);
const corsOrigin = process.env.CORS_ORIGIN?.trim() || "*";
const expressCorsOrigin = corsOrigin === "*" ? true : corsOrigin;
const app = express();
app.use(cors({ origin: expressCorsOrigin, credentials: true }));


app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: corsOrigin }
});

const toWaitingRoomState = (room: ReturnType<RoomService["create"]>) => ({
  roomId: room.roomId,
  mapId: room.mapId,
  started: room.started,
  finished: false,
  routes: [],
  stations: [],
  players: room.players,
  spectators: room.spectators,
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
  log: ["Ожидание старта"],
  events: [],
  settings: { maxPlayers: room.maxPlayers, turnTimerSeconds: room.timerSeconds },
  turnActionState: { action: null, drawCardsTaken: 0 }
});

const emitStateForRoom = (roomId: string): void => {
  void io.in(roomId).fetchSockets().then((sockets) => {
    for (const clientSocket of sockets) {
      const token = clientSocket.data?.sessionToken as string | undefined;
      if (!token) continue;
      try {
        const state = rooms.getStateForViewer(roomId, token);
        clientSocket.emit("game:state", state);
      } catch {
        // Ignore stale sockets for deleted/unfinished rooms.
      }
    }
  });
};

const rooms = new RoomService((roomId) => {
  emitStateForRoom(roomId);
});

io.on("connection", (socket) => {
  socket.on("room:list", () => {
    socket.emit("room:list", rooms.list());
  });

  socket.on("room:create", (payload) => {
    try {
      const room = rooms.create(payload);
      socket.data.sessionToken = payload.sessionToken;
      socket.join(room.roomId);
      io.to(room.roomId).emit("room:joined", toWaitingRoomState(room));
      io.emit("room:list", rooms.list());
    } catch (error) {
      socket.emit("room:error", (error as Error).message);
    }
  });

  socket.on("room:join", (payload) => {
    try {
      const room = rooms.join(payload);
      socket.data.sessionToken = payload.sessionToken;
      socket.join(room.roomId);

      if (room.state) {
        emitStateForRoom(room.roomId);
        socket.emit("room:joined", rooms.getStateForViewer(room.roomId, payload.sessionToken));
      } else {
        io.to(room.roomId).emit("room:joined", toWaitingRoomState(room));
      }

      io.emit("room:list", rooms.list());
    } catch (error) {
      socket.emit("room:error", (error as Error).message);
    }
  });

  socket.on("room:start", (payload) => {
    try {
      const room = rooms.start(payload.roomId, payload.sessionToken);
      if (!room.state) throw new Error("Не удалось запустить игру");
      emitStateForRoom(room.roomId);
      io.emit("room:list", rooms.list());
    } catch (error) {
      socket.emit("room:error", (error as Error).message);
    }
  });

  socket.on("game:draw-card", (payload) => {
    try {
      rooms.drawCard(payload.roomId, payload.sessionToken, payload.fromOpenIndex);
      emitStateForRoom(payload.roomId);
    } catch (error) {
      socket.emit("room:error", (error as Error).message);
    }
  });

  socket.on("game:draw-two-deck", (payload) => {
    try {
      rooms.drawTwoDeckCards(payload.roomId, payload.sessionToken);
      emitStateForRoom(payload.roomId);
    } catch (error) {
      socket.emit("room:error", (error as Error).message);
    }
  });

  socket.on("game:claim-route", (payload) => {
    try {
      rooms.claimRoute(
        payload.roomId,
        payload.sessionToken,
        payload.routeId,
        payload.color,
        payload.useLocomotives,
      );
      emitStateForRoom(payload.roomId);
    } catch (error) {
      socket.emit("room:error", (error as Error).message);
    }
  });

  socket.on("game:build-station", (payload) => {
    try {
      rooms.buildStation(
        payload.roomId,
        payload.sessionToken,
        payload.city,
        payload.color,
        payload.useLocomotives,
      );
      emitStateForRoom(payload.roomId);
    } catch (error) {
      socket.emit("room:error", (error as Error).message);
    }
  });

  socket.on("game:draw-destinations", (payload) => {
    try {
      rooms.drawDestinations(payload.roomId, payload.sessionToken);
      emitStateForRoom(payload.roomId);
    } catch (error) {
      socket.emit("room:error", (error as Error).message);
    }
  });

  socket.on("game:choose-destinations", (payload) => {
    try {
      rooms.chooseDestinations(payload.roomId, payload.sessionToken, payload.keepIds);
      emitStateForRoom(payload.roomId);
    } catch (error) {
      socket.emit("room:error", (error as Error).message);
    }
  });

  socket.on("reconnect", (payload) => {
    try {
      socket.data.sessionToken = payload.sessionToken;
      socket.join(payload.roomId);
      const state = rooms.reconnect(payload.roomId, payload.sessionToken);
      socket.emit("reconnect:success", state);
    } catch (error) {
      socket.emit("reconnect:fail", (error as Error).message);
    }
  });
});


httpServer.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${PORT}`);
});

