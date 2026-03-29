# 🚂 Ticket to Ride - Полная документация

## 📚 Содержание

1. **[Быстрая справка](#быстрая-справка)** ← Начни отсюда!
2. **[Архитектура](#архитектура)**
3. **[Структура кода](#структура-кода)**
4. **[Frontend решения](#frontend-решения)**
5. **[API & Socket события](#api--socket-события)**
6. **[Разработка](#разработка)**

---

## 🚀 Быстрая справка

**Новичок в проекте?** → Читай **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)**
- Ключевые концепты
- Как добавить hook/component/event
- Testing patterns
- FAQ

**Интересует архитектура?** → **[ARCHITECTURE.md](./ARCHITECTURE.md)**

**Как был сделан рефакторинг?** → **[REFACTORING.md](./REFACTORING.md)**

**API документация?** → **[API.md](./API.md)**

---

## Обзор проекта

**Ticket to Ride** — это онлайн версия настольной игры "Билет на поезд" на базе:
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Socket.io
- **Shared**: TypeScript types library

### Основные возможности
- ✅ Мультиплеер (2-5 игроков)
- ✅ Реал-тайм синхронизация через WebSocket
- ✅ Локализация (RU, UK, EN, DE)
- ✅ Responsive дизайн (Desktop + Mobile)
- ✅ SVG доска с интерактивными элементами
- ✅ Полная типизация (TypeScript)

---

## Архитектура

### Слои приложения

```
Frontend (React)
    ↓
Application Layer (App.tsx, hooks, screens)
    ↓
Business Logic (hooks, entities, features)
    ↓
UI Components (widgets, components)
    ↓
Infrastructure (socket, i18n, styles)
```

### Компоненты системы

```
Frontend App
├── Game Session (WebSocket connection)
├── Game State (Zustand store)
├── UI Layer (React components)
└── Game Logic (hooks, selectors)

Backend Server
├── Room Service (room management)
├── Game Engine (game logic)
└── Socket Handler (event processing)

Shared
├── Types (Game, Player, Route, etc)
├── Maps (Europa, USA)
└── Constants
```

### Data Flow

```
User Interaction
    ↓
UI Component
    ↓
Hook (useGameLogic, useSocketEmit)
    ↓
Socket.emit(event, data)
    ↓
Backend (game:action)
    ↓
Game validation
    ↓
Broadcast to room
    ↓
Frontend socket listener
    ↓
Store update (setGame)
    ↓
Re-render UI
```

---

## Структура кода

### Главные папки

```
apps/
├── client/
│   ├── src/
│   │   ├── App.tsx              # Root component с routing
│   │   ├── hooks/               # Custom hooks (11 файлов)
│   │   ├── screens/             # Screen components (4 файла)
│   │   ├── components/          # UI components
│   │   ├── widgets/             # Complex widgets
│   │   ├── entities/            # Game logic (selectors, highlights)
│   │   ├── features/            # Feature-specific logic
│   │   ├── lib/                 # Utils, i18n, colors, constants
│   │   ├── processes/           # Game session orchestration
│   │   └── test/                # Unit & integration tests
│   └── vite.config.ts
│
├── server/
│   ├── src/
│   │   ├── main.ts              # Entry point
│   │   ├── gameEngine.ts        # Game logic
│   │   ├── roomService.ts       # Room management
│   │   └── test/
│   └── tsconfig.json
│
└── calibrator/                  # Map calibration tool
    ├── public/
    ├── server.js
    └── README.md

packages/
└── shared/
    ├── src/
    │   ├── index.ts             # Types export
    │   └── maps/                # Map data
    └── tsconfig.json

docs/
├── README.md                    # Эта файл
├── ARCHITECTURE.md              # Детальная архитектура
├── REFACTORING.md              # Решения рефакторинга
├── API.md                       # Socket API
└── ...
```

---

## Frontend решения

### Разделение ответственности

**App.tsx** (202 строк, было 450)
- Управление routing между screens
- Top-level state
- Game session initialization

**Hooks** (11 файлов, ~1000 строк)
- `useGameLogic` — основной game state
- `useSocketEmit` — socket events wrapper
- `useGameSelectors` — мемоизированные селекторы
- `useLobbyLogic` — создание/присоединение к комнате
- `useToasts` — notifications management
- `useLang` — локализация
- `useHoverState` — UI hover states
- И другие...

**Screens** (4 файла, React.memo оптимизированы)
- `LobbyScreen` — список комнат
- `WaitingRoomScreen` — ожидание старта
- `GameScreen` — основной экран игры
- `ResultsScreen` — финальные результаты

### Дедупликация

#### socket.emit паттерн (было 10+, теперь 1)
```typescript
// Было:
socket.emit("room:start", { roomId, sessionToken });

// Теперь:
const { emit } = useSocketEmit(roomId, sessionToken);
emit("room:start");
```

#### Game selectors (было 5 useMemo, теперь 1 hook)
```typescript
// Было:
const me = useMemo(() => selectMe(...), [game, sessionToken]);
const isMyTurn = useMemo(() => selectIsMyTurn(...), [game, sessionToken]);
// ... еще 3 useMemo

// Теперь:
const { me, isMyTurn, activePlayer, winner, canAct } = useGameSelectors(game, sessionToken);
```

### Constants централизованы

**src/lib/constants.ts** (40+ констант)
```typescript
SOCKET_EVENTS       // type-safe events
GAME_DEFAULTS       // default values
TEST_IDS            # Все data-testid
TIMING              # Все таймауты
```

### Performance оптимизация

- ✅ React.memo на всех screens
- ✅ useMemo для селекторов
- ✅ useCallback для handlers
- ✅ Lazy loading SVG
- ✅ Bundle size: ~80 kB (gzip)

---

## API & Socket события

### Socket Events (Type-safe)

**Room Events**
- `room:create` — создать комнату
- `room:join` — присоединиться
- `room:list` — получить список
- `room:start` — начать игру

**Game Events**
- `game:draw-card` — взять карту
- `game:draw-destinations` — взять маршруты
- `game:choose-destinations` — выбрать маршруты
- `game:claim-route` — захватить маршрут

---

## Разработка

### Setup

```bash
cd apps/client
npm install
npm run dev      # Vite dev server
npm run build    # Production build
npm run test     # Unit tests (20 passed)
```

### Architecture документы

Смотри также:
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — детальная архитектура
- [`REFACTORING.md`](./REFACTORING.md) — решения рефакторинга
- [`API.md`](./API.md) — Socket API документация

### Metrics

| Метрика | Значение |
|---------|----------|
| App.tsx lines | 202 (было 450, -55%) |
| Дубликатов | -60% |
| Tests passing | 20/20 ✅ |
| TypeScript errors | 0 |
| Build time | ~1.5s |
| Bundle (gzip) | 80 kB |

---

**Created: 2026-03-29**
**Last updated: 2026-03-29**

