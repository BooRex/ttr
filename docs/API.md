# Socket API - WebSocket Protocol

## Overview

Ticket to Ride использует Socket.io для real-time синхронизации между frontend и backend.

Все events строго типизированы через `SOCKET_EVENTS` enum.

---

## Connection Flow

```
Frontend
  ↓
socket.connect()
  ↓
Backend listens on 'connection'
  ↓
Emit 'room:list'
  ↓
Get available rooms
  ↓
Emit 'room:join' or 'room:create'
  ↓
Join room namespace
  ↓
Listen for 'game:state' updates
```

---

## Room Events

### room:create
**Purpose:** Создать новую комнату

**Emit from:** Frontend (LobbyScreen)
**Listen on:** Backend (roomService)

**Payload:**
```typescript
{
  nickname: string
  sessionToken: string
  mapId: string
  maxPlayers: number
  turnTimerSeconds: number | null
}
```

**Response:** Game state updated, joined room
```typescript
{
  gameStarted: false
  players: [{ nickname, sessionToken, ... }]
  roomId: string
}
```

### room:join
**Purpose:** Присоединиться к существующей комнате

**Emit from:** Frontend (LobbyScreen)
**Listen on:** Backend (roomService)

**Payload:**
```typescript
{
  roomId: string
  nickname: string
  sessionToken: string
  asSpectator?: boolean
}
```

**Response:** Game state
```typescript
{
  gameStarted: boolean
  players: Player[]
  spectators?: Player[]
}
```

### room:list
**Purpose:** Получить список доступных комнат

**Emit from:** Frontend
**Listen on:** Backend

**Response:**
```typescript
RoomSummary[] = [
  {
    roomId: string
    playersCount: number
    maxPlayers: number
    started: boolean
    timerSeconds?: number
  }
]
```

### room:start
**Purpose:** Начать игру (только для создателя комнаты)

**Emit from:** Frontend (WaitingRoomScreen)
**Listen on:** Backend (gameEngine)

**Payload:**
```typescript
{
  roomId: string
  sessionToken: string
}
```

**Response:** Game state with initial setup
```typescript
{
  started: true
  finished: false
  routes: Route[]
  players: Player[]
  activePlayerIndex: 0
  // ... full game state
}
```

---

## Game Events

### game:draw-card
**Purpose:** Взять карту из колоды или рынка

**Emit from:** Frontend (ActionPanel)
**Listen on:** Backend (gameEngine)

**Payload:**
```typescript
{
  roomId: string
  sessionToken: string
  fromOpenIndex?: number  // если из открытого рынка (0-3)
}
```

**Response:** Updated hand + open cards
```typescript
{
  players: Player[]  // updated hands
  openCards: TrainCard[]  // updated market
  trainDeckCount: number
}
```

### game:draw-destinations
**Purpose:** Взять карты маршрутов

**Emit from:** Frontend (ActionPanel)
**Listen on:** Backend (gameEngine)

**Payload:**
```typescript
{
  roomId: string
  sessionToken: string
}
```

**Response:**
```typescript
{
  pendingDestinationChoice: {
    sessionToken: string
    cards: DestinationCard[]
    minKeep: number
  }
}
```

### game:choose-destinations
**Purpose:** Выбрать какие маршруты оставить

**Emit from:** Frontend (ActionPanel)
**Listen on:** Backend (gameEngine)

**Payload:**
```typescript
{
  roomId: string
  sessionToken: string
  keepIds: string[]  // IDs маршрутов для оставления
}
```

**Response:**
```typescript
{
  players: Player[]  // updated destinations
  pendingDestinationChoice: null  // очищаем
}
```

### game:claim-route
**Purpose:** Захватить маршрут

**Emit from:** Frontend (ActionPanel, onClaimRoute)
**Listen on:** Backend (gameEngine)

**Payload:**
```typescript
{
  roomId: string
  sessionToken: string
  routeId: string
  color: CardColor
  useLocomotives: number
}
```

**Validation:**
- ✅ Достаточно карт в руке
- ✅ Маршрут не занят
- ✅ Цвет совпадает или имеются локомотивы

**Response:**
```typescript
{
  routes: Route[]  // updated (now owned)
  players: Player[]  // updated hands
  activePlayerIndex: nextPlayerIndex  // turn passed
}
```

---

## Broadcast Events (Server → All Clients in Room)

### game:state
**Broadcast from:** Backend (after any action)
**Listen on:** Frontend (socket listener in useGameSession)

**Contains:** Full game state
```typescript
GameState {
  roomId: string
  started: boolean
  finished: boolean
  routes: Route[]
  players: Player[]
  activePlayerIndex: number
  openCards: TrainCard[]
  trainDeckCount: number
  events: GameEvent[]
  pendingDestinationChoice?: {
    sessionToken: string
    cards: DestinationCard[]
    minKeep: number
  }
}
```

**Usage:**
```typescript
socket.on(SOCKET_EVENTS.GAME_STATE, (gameState) => {
  setGame(gameState)  // Update store
})
```

### game:finished
**Broadcast from:** Backend (when game ends)
**Listen on:** Frontend

**Contains:**
```typescript
{
  finished: true
  winner: {
    sessionToken: string
    nickname: string
    points: number
  }
  players: [
    { nickname, sessionToken, points, completedDestinations }
  ]
}
```

---

## Implementation Details

### Type Safety

**Constants (src/lib/constants.ts):**
```typescript
export const SOCKET_EVENTS = {
  // Room
  ROOM_CREATE: "room:create",
  ROOM_JOIN: "room:join",
  ROOM_LIST: "room:list",
  ROOM_START: "room:start",
  
  // Game
  GAME_DRAW_CARD: "game:draw-card",
  GAME_DRAW_DESTINATIONS: "game:draw-destinations",
  GAME_CHOOSE_DESTINATIONS: "game:choose-destinations",
  GAME_CLAIM_ROUTE: "game:claim-route",
} as const

type SocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS]
```

### useSocketEmit Hook

**Usage:**
```typescript
const { emit } = useSocketEmit(roomId, sessionToken)

// Instead of:
socket.emit("room:start", { roomId, sessionToken })

// We do:
emit(SOCKET_EVENTS.ROOM_START)
```

**Auto-adds:**
- roomId
- sessionToken

### Error Handling

**Backend validation:**
```typescript
if (!gameState.players.map(p => p.hand).flat().includes(card)) {
  socket.emit("error", { message: "Insufficient cards" })
  return
}
```

**Frontend catch:**
```typescript
socket.on("error", (error) => {
  addToast("error", error.message)
})
```

---

## Example Flow: Claim Route

### 1. User clicks on route
```typescript
// GameBoardSlot.tsx
onSelectRoute(routeId)  // → App state
```

### 2. User chooses color & locomotives
```typescript
// ActionPanel.tsx
onSelectClaim({ baseColor, locoCount })
setSelectedColor(baseColor)
setSelectedLocoCount(locoCount)
```

### 3. User clicks "Claim"
```typescript
// useGameLogic.ts
claimRoute() → emit(SOCKET_EVENTS.GAME_CLAIM_ROUTE, {
  routeId: selectedRouteId,
  color: selectedColor,
  useLocomotives: selectedLocoCount
})
```

### 4. Backend processes
```typescript
// server/gameEngine.ts
case SOCKET_EVENTS.GAME_CLAIM_ROUTE:
  - Validate cards
  - Validate route available
  - Update game.routes[i].ownerSessionToken
  - Update player.hand
  - Calculate points
  - Change activePlayerIndex
  - Broadcast new game state
```

### 5. Frontend receives update
```typescript
// useGameSession.ts
socket.on(SOCKET_EVENTS.GAME_STATE, (gameState) => {
  setGame(gameState)  // Re-render UI
})

// GameScreen re-renders with:
// - Route now owns by player (color highlight)
// - Next player's turn
// - Event log entry
// - Updated scores
```

---

## Testing Socket Events

### Mock Socket in Tests

```typescript
import { vi } from 'vitest'

const mockSocket = {
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn()
}

// Mock useSocketEmit hook
vi.mock('../hooks/useSocketEmit', () => ({
  useSocketEmit: () => ({
    emit: mockSocket.emit
  })
}))

// Test
it('should emit GAME_CLAIM_ROUTE', () => {
  render(<ActionPanel ... />)
  fireEvent.click(screen.getByTestId('claim-route-btn'))
  
  expect(mockSocket.emit).toHaveBeenCalledWith(
    SOCKET_EVENTS.GAME_CLAIM_ROUTE,
    expect.objectContaining({
      routeId: 'route-1',
      color: 'red'
    })
  )
})
```

---

## Performance Considerations

### 1. Game State Updates
- Broadcast полный `GameState` (не частичные обновления)
- Frontend store замещает весь state
- React memo предотвращает ненужные re-renders

### 2. Open Market
- Синхронизируется через game state
- Client-side обновляет состояние карт

### 3. Connection Stability
- Socket.io встроенная переподключение
- Если disconnect → reconnect with same sessionToken
- Backend восстанавливает game state

---

**Last Updated:** 2026-03-29

