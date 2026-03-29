import { useCallback } from "react";
import { socket } from "../socket";
import { SOCKET_EVENTS } from "../lib/constants";

type SocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];

/**
 * Wrapper для socket.emit с автоматическим добавлением roomId и sessionToken
 */
export const useSocketEmit = (roomId: string, sessionToken: string) => {
  const emit = useCallback(
    (event: SocketEvent, data: Record<string, any> = {}) => {
      socket.emit(event, {
        roomId,
        sessionToken,
        ...data,
      });
    },
    [roomId, sessionToken],
  );

  return { emit };
};

