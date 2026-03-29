import { useCallback } from "react";
import { useSocketEmit } from "./useSocketEmit";
import { useToasts } from "./useToasts";
import { t } from "../lib/i18n";
import { SOCKET_EVENTS, GAME_DEFAULTS } from "../lib/constants";

interface UseLobbyLogicProps {
  nickname: string;
  sessionToken: string;
}

export const useLobbyLogic = ({ nickname, sessionToken }: UseLobbyLogicProps) => {
  const { addToast } = useToasts();
  const { emit } = useSocketEmit("", sessionToken); // roomId не нужен для room:create/join

  const createRoom = useCallback(
    (mapId: string, maxPlayers: number, timer: number) => {
      if (!nickname.trim()) {
        addToast("error", t("ru", "errors.enterNickname"));
        return;
      }
      emit(SOCKET_EVENTS.ROOM_CREATE, {
        nickname,
        mapId,
        maxPlayers,
        turnTimerSeconds: timer > 0 ? timer : null,
      });
    },
    [nickname, emit, addToast],
  );

  const joinRoom = useCallback(
    (roomId: string, asSpectator = false) => {
      if (!nickname.trim()) {
        addToast("error", t("ru", "errors.enterNickname"));
        return;
      }
      emit(SOCKET_EVENTS.ROOM_JOIN, { roomId, nickname, asSpectator });
    },
    [nickname, emit, addToast],
  );

  return { createRoom, joinRoom };
};

