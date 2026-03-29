import { create } from "zustand";
import type { GameState, RoomSummary } from "@ttr/shared";

type AppStore = {
  nickname: string;
  sessionToken: string;
  roomId: string;
  rooms: RoomSummary[];
  game: GameState | null;
  error: string;
  setNickname: (nickname: string) => void;
  setSessionToken: (token: string) => void;
  setRooms: (rooms: RoomSummary[]) => void;
  setRoomId: (roomId: string) => void;
  setGame: (game: GameState) => void;
  setError: (error: string) => void;
};

const storedToken = localStorage.getItem("ttr_session_token") ?? "";
const storedNickname = localStorage.getItem("ttr_nickname") ?? "";

export const useAppStore = create<AppStore>((set) => ({
  nickname: storedNickname,
  sessionToken: storedToken,
  roomId: "",
  rooms: [],
  game: null,
  error: "",
  setNickname: (nickname) => {
    localStorage.setItem("ttr_nickname", nickname);
    set({ nickname });
  },
  setSessionToken: (sessionToken) => {
    localStorage.setItem("ttr_session_token", sessionToken);
    set({ sessionToken });
  },
  setRooms: (rooms) => set({ rooms }),
  setRoomId: (roomId) => set({ roomId }),
  setGame: (game) => set({ game, roomId: game.roomId }),
  setError: (error) => set({ error })
}));

