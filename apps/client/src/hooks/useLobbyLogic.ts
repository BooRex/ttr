import { useCallback } from "react";
import { useSocketEmit } from "./useSocketEmit";
import { useToasts } from "./useToasts";
import { t } from "../lib/i18n";
import { SOCKET_EVENTS, GAME_DEFAULTS } from "../lib/constants";
import type { Lang } from "../lib/i18n";

interface UseLobbyLogicProps {
  nickname: string;
  sessionToken: string;
  lang: Lang;
}

export const useLobbyLogic = ({ nickname, sessionToken, lang }: UseLobbyLogicProps) => {
  const { addToast } = useToasts();
  const { emit } = useSocketEmit("", sessionToken); // roomId не нужен для room:create/join

  const createRoom = useCallback(
    (maxPlayers: number): boolean => {
      if (!nickname.trim()) {
        addToast("error", t(lang, "errors.enterNickname"));
        return false;
      }
      const safeMaxPlayers = Math.min(
        GAME_DEFAULTS.MAX_PLAYERS_LIMIT,
        Math.max(GAME_DEFAULTS.MIN_PLAYERS, maxPlayers),
      );
      emit(SOCKET_EVENTS.ROOM_CREATE, {
        nickname,
        mapId: GAME_DEFAULTS.MAP_DEFAULT,
        maxPlayers: safeMaxPlayers,
        turnTimerSeconds: null,
      });
      return true;
    },
    [nickname, emit, addToast, lang],
  );

  const joinRoom = useCallback(
    (roomId: string, asSpectator = false): boolean => {
      if (!nickname.trim()) {
        addToast("error", t(lang, "errors.enterNickname"));
        return false;
      }
      emit(SOCKET_EVENTS.ROOM_JOIN, { roomId, nickname, asSpectator });
      return true;
    },
    [nickname, emit, addToast, lang],
  );

  return { createRoom, joinRoom };
};

