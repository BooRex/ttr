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
}: Params): void => {
  useEffect(() => {
    if (!socket.connected) socket.connect();

    socket.on("room:list", setRooms);
    socket.on("room:error", (msg) => {
      setError(msg);
      addToast("error", msg);
    });
    socket.on("room:joined", (state) => {
      setGame(state);
      setRoomId(state.roomId);
    });
    socket.on("game:state", setGame);
    socket.on("reconnect:success", setGame);
    socket.on("reconnect:fail", (msg) => {
      setError(msg);
      addToast("error", msg);
    });

    socket.emit("room:list");

    return () => {
      socket.removeAllListeners();
    };
  }, [addToast, setError, setGame, setRoomId, setRooms]);

  useEffect(() => {
    if (!sessionToken) setSessionToken(uuidv4());
  }, [sessionToken, setSessionToken]);

  useEffect(() => {
    if (roomId && sessionToken) socket.emit("reconnect", { roomId, sessionToken });
  }, [roomId, sessionToken]);
};

