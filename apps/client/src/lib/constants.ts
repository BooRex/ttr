/**
 * Socket event names
 * Типо-безопасное использование event names
 */
export const SOCKET_EVENTS = {
  // Room events
  ROOM_CREATE: "room:create",
  ROOM_JOIN: "room:join",
  ROOM_LIST: "room:list",
  ROOM_START: "room:start",

  // Game events
  GAME_DRAW_CARD: "game:draw-card",
  GAME_DRAW_DESTINATIONS: "game:draw-destinations",
  GAME_CHOOSE_DESTINATIONS: "game:choose-destinations",
  GAME_CLAIM_ROUTE: "game:claim-route",

  // Connection
  RECONNECT: "reconnect",
} as const;

/**
 * Default game settings
 */
export const GAME_DEFAULTS = {
  MAX_PLAYERS: 2,
  MIN_PLAYERS: 2,
  MAX_PLAYERS_LIMIT: 5,
  TIMER_DEFAULT: 0,
  MAP_DEFAULT: "europe",
  LANGUAGE_DEFAULT: "ru",
} as const;

/**
 * TestID constants для более удобного тестирования
 */
export const TEST_IDS = {
  // Lobby
  NICKNAME_INPUT: "nickname-input",
  CREATE_ROOM_BTN: "create-room-btn",
  ROOMS_LIST: "rooms-list",
  ROOM_ROW: (roomId: string) => `room-row-${roomId}`,
  JOIN_ROOM_BTN: (roomId: string) => `join-room-btn-${roomId}`,

  // Waiting room
  WAITING_ROOM_SCREEN: "waiting-room-screen",
  START_GAME_BTN: "start-game-btn",

  // Game screen
  GAME_SCREEN: "game-screen",
  ACTION_PANEL: "action-panel",
  DRAW_CARDS_BTN: "draw-cards-btn",
  DRAW_OPEN_CARD: (index: number) => `draw-open-card-${index}`,
  CLAIM_ROUTE_BTN: "claim-route-btn",
  PASS_TURN_BTN: "pass-turn-btn",
  CONFIRM_DESTINATIONS_BTN: "confirm-destinations-btn",

  // Board
  ROUTE: (from: string, to: string) => `route-${from}-${to}`,
  CONNECTION_HIGHLIGHT: "connection-highlight",

  // Cards
  CARD: (color: string) => `card-${color}`,
  CARD_LOCOMOTIVE: "card-locomotive",

  // Destinations
  DESTINATION: (id: string) => `destination-${id}`,
  DESTINATION_MODAL: "destination-modal",

  // Events
  EVENT_LOG: "event-log",
  EVENT_ITEM: (index: number) => `event-item-${index}`,

  // UI
  GAME_ROUND_COUNTER: "game-round-counter",
  TIMER: "timer",
  PLAYER_LIST: "player-list",
  PLAYER: (playerId: string) => `player-${playerId}`,
} as const;

/**
 * Animation/timing constants
 */
export const TIMING = {
  TOAST_DURATION: 4500,
  TURN_PULSE_DURATION: 1100,
  TURN_PULSE_SOUND_DURATION: 850,
} as const;

