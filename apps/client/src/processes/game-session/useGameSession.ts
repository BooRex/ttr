import { useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import type { GameState, RoomSummary } from "@ttr/shared";
import { socket } from "../../socket";

type Params = {
  roomId: string;
  sessionToken: string;
  setSessionToken: (token: string) => void;
  setRooms: (rooms: RoomSummary[]) => void;
  setRoomId: (roomId: string) => void;
  setGame: (game: GameState) => void;
  setError: (error: string) => void;
  addToast: (kind: "error" | "info", message: string) => void;
  onServerResponse?: () => void;
};

export const useGameSession = ({
  roomId,
  sessionToken,
  setSessionToken,
  setRooms,
  setRoomId,
  setGame,
  setError,
  addToast,
  onServerResponse,
}: Params): void => {
  useEffect(() => {
    if (!socket.connected) socket.connect();

    socket.on("room:list", (rooms) => {
      setRooms(rooms);
      onServerResponse?.();
    });
    socket.on("room:error", (msg) => {
      setError(msg);
      addToast("error", msg);
      onServerResponse?.();
    });
    socket.on("room:joined", (state) => {
      setError("");
      setGame(state);
      setRoomId(state.roomId);
      onServerResponse?.();
    });
    socket.on("game:state", (state) => {
      setError("");
      setGame(state);
      onServerResponse?.();
    });
    socket.on("reconnect:success", (state) => {
      setError("");
      setGame(state);
      onServerResponse?.();
    });
    socket.on("reconnect:fail", (msg) => {
      setError(msg);
      addToast("error", msg);
      onServerResponse?.();
    });

    socket.emit("room:list");

    return () => {
      socket.removeAllListeners();
    };
  }, [addToast, onServerResponse, setError, setGame, setRoomId, setRooms]);

  useEffect(() => {
    if (!sessionToken) setSessionToken(uuidv4());
  }, [sessionToken, setSessionToken]);

  useEffect(() => {
    if (roomId && sessionToken) socket.emit("reconnect", { roomId, sessionToken });
  }, [roomId, sessionToken]);
};

