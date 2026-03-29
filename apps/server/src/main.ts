import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "@ttr/shared";
import { RoomService } from "./roomService.js";

const PORT = Number(process.env.PORT ?? 3000);
const app = express();
app.use(cors({ origin: true, credentials: true }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

const httpServer = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: "*" }
});

const rooms = new RoomService((roomId, state) => {
  io.to(roomId).emit("game:state", state);
});

io.on("connection", (socket) => {
  socket.on("room:list", () => {
    socket.emit("room:list", rooms.list());
  });

  socket.on("room:create", (payload) => {
    try {
      const room = rooms.create(payload);
      socket.join(room.roomId);
      socket.emit("room:joined", {
        roomId: room.roomId,
        mapId: room.mapId,
        started: false,
        finished: false,
        routes: [],
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
        log: ["Комната создана"],
        events: [],
        settings: { maxPlayers: room.maxPlayers, turnTimerSeconds: room.timerSeconds }
      });
      io.emit("room:list", rooms.list());
    } catch (error) {
      socket.emit("room:error", (error as Error).message);
    }
  });

  socket.on("room:join", (payload) => {
    try {
      const room = rooms.join(payload);
      socket.join(room.roomId);
      const state = room.state ?? {
        roomId: room.roomId,
        mapId: room.mapId,
        started: room.started,
        finished: false,
        routes: [],
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
        settings: { maxPlayers: room.maxPlayers, turnTimerSeconds: room.timerSeconds }
      };
      io.to(room.roomId).emit("game:state", state);
      socket.emit("room:joined", state);
      io.emit("room:list", rooms.list());
    } catch (error) {
      socket.emit("room:error", (error as Error).message);
    }
  });

  socket.on("room:start", (payload) => {
    try {
      const room = rooms.start(payload.roomId, payload.sessionToken);
      if (!room.state) throw new Error("Не удалось запустить игру");
      io.to(room.roomId).emit("game:state", room.state);
      io.emit("room:list", rooms.list());
    } catch (error) {
      socket.emit("room:error", (error as Error).message);
    }
  });

  socket.on("game:draw-card", (payload) => {
    try {
      const state = rooms.drawCard(payload.roomId, payload.sessionToken, payload.fromOpenIndex);
      io.to(payload.roomId).emit("game:state", state);
    } catch (error) {
      socket.emit("room:error", (error as Error).message);
    }
  });

  socket.on("game:claim-route", (payload) => {
    try {
      const state = rooms.claimRoute(
        payload.roomId,
        payload.sessionToken,
        payload.routeId,
        payload.color,
        payload.useLocomotives,
      );
      io.to(payload.roomId).emit("game:state", state);
    } catch (error) {
      socket.emit("room:error", (error as Error).message);
    }
  });

  socket.on("game:draw-destinations", (payload) => {
    try {
      const state = rooms.drawDestinations(payload.roomId, payload.sessionToken);
      io.to(payload.roomId).emit("game:state", state);
    } catch (error) {
      socket.emit("room:error", (error as Error).message);
    }
  });

  socket.on("game:choose-destinations", (payload) => {
    try {
      const state = rooms.chooseDestinations(payload.roomId, payload.sessionToken, payload.keepIds);
      io.to(payload.roomId).emit("game:state", state);
    } catch (error) {
      socket.emit("room:error", (error as Error).message);
    }
  });

  socket.on("reconnect", (payload) => {
    try {
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

