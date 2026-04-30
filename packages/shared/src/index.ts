import { europeMap } from "./maps/europe.js";
export { getMinRequiredLocomotives, getStationBuildCost } from "./routeRules.js";

export type CardColor =
  | "red"
  | "blue"
  | "green"
  | "yellow"
  | "black"
  | "white"
  | "orange"
  | "pink"
  | "locomotive";

export type TrainCard = { color: CardColor };

export type DestinationCard = {
  id: string;
  from: string;
  to: string;
  points: number;
};

export type Player = {
  sessionToken: string;
  nickname: string;
  wagonsLeft: number;
  stationsLeft?: number;
  hand: TrainCard[];
  destinations: DestinationCard[];
  points: number;
  isSpectator?: boolean;
};

export type Station = {
  city: string;
  ownerSessionToken: string;
};

export type Route = {
  id: string;
  from: string;
  to: string;
  length: number;
  color: Exclude<CardColor, "locomotive"> | "gray";
  routeType?: "normal" | "tunnel" | "ferry" | "double";
  ferryLocomotives?: number;
  ownerSessionToken?: string;
};

export type GameEvent =
  | { id: string; type: "game_started" }
  | { id: string; type: "draw_card"; sessionToken: string; nickname: string; cardColor?: CardColor; from?: "deck" | "open" }
  | { id: string; type: "draw_destinations"; sessionToken: string; nickname: string }
  | { id: string; type: "choose_destinations"; sessionToken: string; nickname: string; keepCount: number }
  | { id: string; type: "claim_route"; sessionToken: string; nickname: string; routeId: string; from: string; to: string; points?: number }
  | { id: string; type: "build_station"; sessionToken: string; nickname: string; city: string }
  | { id: string; type: "final_round"; sessionToken: string; nickname: string; wagonsLeft: number }
  | { id: string; type: "turn_skipped"; sessionToken: string; nickname: string; reason: string }
  | { id: string; type: "game_finished"; winnerSessionToken: string | null; winnerNickname: string | null; winnerPoints: number | null };

type MapDefinition = {
  id: string;
  name: string;
  cities: string[];
  routes: Route[];
  destinationDeck: DestinationCard[];
};

export type GameSettings = {
  turnTimerSeconds: number | null;
  maxPlayers: number;
};

export type TurnAction = "draw_cards" | "draw_destinations" | "claim_route" | "build_station";

export type TurnActionState = {
  action: TurnAction | null;
  drawCardsTaken: number;
};

export type PendingDestinationChoice = {
  sessionToken: string;
  cards: DestinationCard[];
  minKeep: number;
};

export type FinalStanding = {
  sessionToken: string;
  nickname: string;
  points: number;
  completedDestinations: number;
  totalDestinations: number;
  destinationPointsDelta: number;
  stationPointsBonus: number;
  longestPathLength: number;
  longestPathBonus: number;
};

export type GameState = {
  roomId: string;
  mapId: string;
  started: boolean;
  finished: boolean;
  routes: Route[];
  stations: Station[];
  players: Player[];
  spectators: Player[];
  activePlayerIndex: number;
  openCards: TrainCard[];
  trainDeckCount: number;
  discardDeckCount: number;
  destinationDeckCount: number;
  pendingDestinationChoice: PendingDestinationChoice | null;
  lastRoundTriggered: boolean;
  lastRoundEndIndex: number | null;
  winnerSessionToken: string | null;
  finalStandings: FinalStanding[];
  log: string[];
  events: GameEvent[];
  settings: GameSettings;
  turnActionState: TurnActionState;
};

export type RoomSummary = {
  roomId: string;
  hostSessionToken: string;
  mapId: string;
  playersCount: number;
  maxPlayers: number;
  started: boolean;
  timerSeconds: number | null;
};

export type ClientToServerEvents = {
  "room:create": (payload: {
    nickname: string;
    sessionToken: string;
    mapId: string;
    maxPlayers: number;
    turnTimerSeconds: number | null;
  }) => void;
  "room:join": (payload: {
    roomId: string;
    nickname: string;
    sessionToken: string;
    asSpectator?: boolean;
  }) => void;
  "room:list": () => void;
  "room:start": (payload: { roomId: string; sessionToken: string }) => void;
  reconnect: (payload: { roomId: string; sessionToken: string }) => void;
  "game:draw-card": (payload: { roomId: string; sessionToken: string; fromOpenIndex?: number }) => void;
  "game:draw-two-deck": (payload: { roomId: string; sessionToken: string }) => void;
  "game:draw-destinations": (payload: { roomId: string; sessionToken: string }) => void;
  "game:choose-destinations": (payload: { roomId: string; sessionToken: string; keepIds: string[] }) => void;
  "game:claim-route": (payload: {
    roomId: string;
    sessionToken: string;
    routeId: string;
    color: CardColor;
    useLocomotives?: number;
  }) => void;
  "game:build-station": (payload: {
    roomId: string;
    sessionToken: string;
    city: string;
    color: CardColor;
    useLocomotives?: number;
  }) => void;
};

export type ServerToClientEvents = {
  "room:list": (rooms: RoomSummary[]) => void;
  "room:error": (message: string) => void;
  "room:joined": (state: GameState) => void;
  "game:state": (state: GameState) => void;
  "reconnect:success": (state: GameState) => void;
  "reconnect:fail": (message: string) => void;
};

export const TRAIN_COLORS: Exclude<CardColor, "locomotive">[] = [
  "red",
  "blue",
  "green",
  "yellow",
  "black",
  "white",
  "orange",
  "pink"
];


export const MAPS: Record<string, MapDefinition> = {
  europe: europeMap
};

export const pointsForRouteLength = (length: number): number => {
  const table: Record<number, number> = { 1: 1, 2: 2, 3: 4, 4: 7, 5: 10, 6: 15, 7: 18, 8: 21 };
  return table[length] ?? 0;
};

