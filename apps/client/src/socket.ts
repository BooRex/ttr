import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "@ttr/shared";

const url = (import.meta.env.VITE_SERVER_URL as string | undefined) ?? "http://localhost:3000";

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(url, {
  autoConnect: false
});

