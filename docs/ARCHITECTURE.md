# Architecture - Детальная архитектура приложения

## Контекст

Ticket to Ride - многопользовательская онлайн игра в реал-тайм с использованием WebSocket.

## Стек технологий

### Frontend
- **React 18** - UI framework
- **TypeScript** - типизация
- **Vite** - bundler
- **Zustand** - state management
- **Socket.io** - WebSocket client
- **Konva** - canvas для доски
- **CSS** - styling

### Backend
- **Node.js** - runtime
- **Express** - web server
- **Socket.io** - WebSocket server
- **TypeScript** - типизация

### Shared
- **TypeScript** - types

## Архитектурные решения

### 1. State Management (Zustand)

**Почему Zustand?**
- Простой API
- Минимальный boilerplate
- Хорошая TypeScript поддержка
- Не требует Context (реже re-renders)

**Store структура (store.ts)**
```typescript
type AppStore = {
  // Lobby
  nickname: string
  roomId: string
  rooms: RoomSummary[]
  
  // Game
  game: GameState | null
  
  // UI
  error: string
  
  // Setters
  setNickname(nickname: string): void
  setGame(game: GameState): void
  // ... etc
}
```

### 2. Hook-based Logic

**Преимущества**
- ✅ Разделение логики от UI
- ✅ Легко тестировать
- ✅ Переиспользуемость
- ✅ Чистые компоненты

**Примеры**
- `useGameLogic` — основная игровая логика, выбор маршрутов, карт
- `useSocketEmit` — wrapper для socket events
- `useGameSelectors` — мемоизированные селекторы
- `useLobbyLogic` — создание/присоединение комнат

### 3. Socket Events (Type-safe)

**Решение: Event name constants**
```typescript
// РАНЬШЕ (unsafe):
socket.emit("room:start", { roomId, sessionToken })

// ТЕПЕРЬ (type-safe):
const { emit } = useSocketEmit(roomId, sessionToken)
emit(SOCKET_EVENTS.ROOM_START)
```

### 4. Screen Routing (without React Router)

**Почему без React Router?**
- Только 3 screens (Lobby, WaitingRoom, Game, Results)
- Простой логике достаточно conditional rendering
- Меньше dependencies

**Routing logic (App.tsx)**
```typescript
{!inRoom && <LobbyScreen />}
{game && !gameStarted && <WaitingRoomScreen />}
{gameStarted && !game.finished && <GameScreen />}
{game?.finished && <ResultsScreen />}
```

### 5. Performance Optimization

#### React.memo на Screens
```typescript
export const GameScreen = memo(GameScreenComponent)
```
- Предотвращает re-renders при неизменных props
- Особенно важно для GameScreen (heavy component)

#### useMemo для Selectors
```typescript
const me = useMemo(() => selectMe(game, sessionToken), [game, sessionToken])
```
- Избегает пересчета селекторов при re-renders

#### useCallback для Handlers
```typescript
const handleExitGame = useCallback(() => {
  setRoomId("")
  setError("")
}, [])
```

### 6. Константы централизованы

**Файл: src/lib/constants.ts**
```typescript
export const SOCKET_EVENTS = {
  ROOM_CREATE: "room:create",
  ROOM_JOIN: "room:join",
  // ...
}

export const GAME_DEFAULTS = {
  MAX_PLAYERS: 2,
  TIMER_DEFAULT: 0,
  // ...
}

export const TEST_IDS = {
  NICKNAME_INPUT: "nickname-input",
  // ...
}
```

**Преимущества**
- ✅ Type-safe (union types)
- ✅ DRY (не дублируются strings)
- ✅ Легко рефакторить (меняем в одном месте)

## Component Hierarchy

```
App
├── useGameSession (WebSocket setup)
├── useLobbyLogic (room creation)
├── useGameLogic (game state)
├── useGameSelectors (memoized selectors)
├── useHoverState (UI state)
│
├── LobbyScreen (memo)
│   ├── useToasts (notifications)
│   └── GAME_DEFAULTS (constants)
│
├── WaitingRoomScreen (memo)
│   └── useGameSelectors (selectors)
│
├── GameScreen (memo, heavy)
│   ├── GameTopbar (widget)
│   ├── GameBoardSlot (widget, Konva canvas)
│   ├── GameRightPanel (widget)
│   ├── ActionPanel (component)
│   └── EventLog (component)
│
├── ResultsScreen (memo)
│   └── useBoardHighlight (memoized)
│
└── ToastHost (notifications)
```

## Data Flow

### Сценарий: Захват маршрута

```
1. User clicks on route on GameBoardSlot
   ↓
2. GameBoardSlot.onSelectRoute(routeId)
   ↓
3. App state: setSelectedRouteId(routeId)
   ↓
4. GameScreen renders with selectedRouteId prop
   ↓
5. ActionPanel shows claim options
   ↓
6. User clicks "Claim"
   ↓
7. ActionPanel.onSelectClaim(color, locoCount)
   ↓
8. App state: setSelectedColor, setSelectedLocoCount
   ↓
9. User clicks "Confirm"
   ↓
10. gameLogic.claimRoute()
    ↓
11. emit(SOCKET_EVENTS.GAME_CLAIM_ROUTE, {
      routeId, color, useLocomotives
    })
    ↓
12. Backend: validates & updates game state
    ↓
13. Backend: broadcasts to room
    ↓
14. Frontend: socket listener updates game
    ↓
15. setGame({ ...game, routes: [...updated] })
    ↓
16. GameScreen re-renders with new route owner
    ↓
17. Route highlights with player color
```

## File Organization

### src/

**Components** - Переиспользуемые UI компоненты
- ActionPanel
- EventLog
- CardChip
- ToastHost

**Widgets** - Комплексные компоненты
- game-board (Konva canvas)
- game-topbar
- game-right-panel

**Entities** - Business domain logic
- game/
  - model/ (selectors, highlights)
  - types (imported from @ttr/shared)

**Features** - Feature-specific logic
- event-log/
  - model/ (formatters)

**Hooks** - Custom React hooks (11 файлов)
- useGameLogic
- useSocketEmit
- useGameSelectors
- useLobbyLogic
- useToasts
- useLang
- useHoverState
- ...

**Screens** - Full-page components (4 файла, memo-wrapped)
- LobbyScreen
- WaitingRoomScreen
- GameScreen
- ResultsScreen

**Lib** - Utilities & constants
- colors.ts
- i18n.ts (localization)
- constants.ts (40+ constants)
- mapLayouts.ts

**Processes** - Orchestration & setup
- game-session/ (WebSocket initialization)

## Key Design Decisions

### 1. No Context API
**Почему?**
- Zustand проще и удобнее
- Меньше re-renders
- Меньше boilerplate

### 2. Socket events wrapper (useSocketEmit)
**Почему?**
- Избегает дублирования `{ roomId, sessionToken }`
- Type-safe events
- Централизованное управление

### 3. Memoization strategy
**Что мемоизируем?**
- ✅ Game selectors (много логики)
- ✅ Screen components (heavy re-renders)
- ✅ Event handlers (в dependencies)

**Что НЕ мемоизируем?**
- ❌ Простые selectors
- ❌ Легкие компоненты
- ❌ Всё подряд (premature optimization)

### 4. Constants over magic strings
**Зачем?**
- ✅ Type safety (TypeScript unions)
- ✅ Single source of truth
- ✅ Легче рефакторить

---

**Last Updated:** 2026-03-29

