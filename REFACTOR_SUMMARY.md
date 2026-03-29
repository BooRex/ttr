# Рефакторинг App.tsx - ✅ Завершен

## 📊 Что сделано

### Структура проекта ДО:

```
src/
└── App.tsx (450 строк - монолит)
    ├── All UI states
    ├── All business logic
    ├── All event handlers
    ├── All effects
    └── All rendering
```

### Структура проекта ПОСЛЕ:

```
src/
├── App.tsx (202 строк - чистый роутинг)
├── hooks/ (8 файлов)
│   ├── useMediaQueries.ts      - Media queries (portrait, mobile)
│   ├── useToasts.ts            - Toast notifications logic
│   ├── useTurnPulse.ts         - Turn pulse + audio feedback
│   ├── useLobbyLogic.ts        - Create/join room logic
│   ├── useGameLogic.ts         - Game state + derived selectors
│   ├── useGameBodyLock.ts      - Document scroll lock during game
│   ├── useBoardHighlight.ts    - Board hover highlights memoization
│   └── index.ts                - Public API
└── screens/ (4 файла)
    ├── LobbyScreen.tsx         - Lobby UI (rooms list, profile)
    ├── WaitingRoomScreen.tsx   - Pre-game waiting room
    ├── GameScreen.tsx          - Full game board + panels
    └── index.ts                - Public API
```

---

## 🎯 Преимущества

### 1. **Разделение ответственности**
- ✅ App.tsx только управляет routing и top-level state
- ✅ Каждый screen — отдельный компонент
- ✅ Логика вынесена в hooks

### 2. **Переиспользуемость**
- ✅ useGameLogic можно использовать в других компонентах
- ✅ useLobbyLogic не привязана к App
- ✅ Все hooks могут быть протестированы отдельно

### 3. **Тестируемость**
- ✅ Unit-тесты для каждого hook
- ✅ Компоненты screens testable отдельно (чистые props)
- ✅ Нет скрытых зависимостей

### 4. **Простота чтения**
- ✅ App.tsx теперь ~ 200 строк вместо 450
- ✅ Логика логична — каждый файл делает одно
- ✅ Легче найти нужный код

### 5. **Масштабируемость**
- ✅ Легко добавить новые screens (лобби → game → results и т.д.)
- ✅ Легко добавить новые hooks для game features
- ✅ Нет необходимости в дополнительных lib (simple routing)

---

## 📁 Детали файлов

### `App.tsx` (Главный компонент)

**Ответственность:**
- ✅ Routing между тремя screens (Lobby → Waiting → Game)
- ✅ Top-level state (lang, nickname, roomId, error)
- ✅ Глобальные UI state (toasts, hover states)
- ✅ Game session initialization

**Строк:** 202 (vs 450 раньше) = **55% меньше**

---

### Hooks

#### `useLobbyLogic.ts`
- `createRoom(mapId, maxPlayers, timer)` — emit room:create event
- `joinRoom(roomId, asSpectator)` — emit room:join event
- Валидация (nickname check)

#### `useGameLogic.ts` (самый большой hook)
- UI State: selectedRouteId, selectedColor, selectedDestinationIds
- Derived state: selectMe, activePlayer, isMyTurn, winner, canAct
- Actions: startGame, drawCard, claimRoute, chooseDestinations
- Cleanup effects для route/destination selection

#### `useTurnPulse.ts`
- Audio context unlock
- Turn pulse animation
- Sound effect when your turn

#### `useMediaQueries.ts`
- Portrait/landscape detection
- Mobile/desktop layout detection
- Auto-updates при resize

#### `useToasts.ts`
- Toast state management
- Auto-dismiss after 4.5s
- Add/dismiss methods

#### `useGameBodyLock.ts`
- document.body scroll lock during game

#### `useBoardHighlight.ts`
- Memoized highlight calculation для routes
- Supports destination + connection hover

---

### Screens

#### `LobbyScreen.tsx`
**Props:**
- nickname, rooms, maxPlayers, timer, mapId, lang
- callbacks: onNicknameChange, onMaxPlayersChange, onCreateRoom, onJoinRoom

**Содержит:**
- Profile section с input для ника
- Room creation controls (players, timer, map selection)
- Rooms list с join/watch buttons

#### `WaitingRoomScreen.tsx`
**Props:**
- game, lang, sessionToken
- callbacks: onStartGame, onLeave

**Содержит:**
- Room ID display
- Map info
- Players list
- Start game button

#### `GameScreen.tsx`
**Props:**
- Много props (game, lang, sessionToken, все game state + callbacks)
- Это нормально — это главный экран, он комплексный

**Содержит:**
- GameTopbar (header with timer, players, turn info)
- GameBoardSlot (центральная доска)
- ActionPanel (левая панель)
- GameRightPanel (правая панель с картами + вкладками)
- Events modal (мобильный вид)

---

## 🔄 Migration Guide

Если кто-то захочет добавить feature:

### Добавить новый hook

```typescript
// src/hooks/useNewFeature.ts
import { useCallback, useState } from "react";

export const useNewFeature = () => {
  const [state, setState] = useState(false);
  
  const doSomething = useCallback(() => {
    // ...
  }, []);
  
  return { state, doSomething };
};

// Экспортировать в index.ts
export { useNewFeature } from "./useNewFeature";

// Использовать в App.tsx
const { state, doSomething } = useNewFeature();
```

### Добавить новый screen

```typescript
// src/screens/NewScreen.tsx
export const NewScreen = ({ /* props */ }) => {
  return <div>{/* content */}</div>;
};

// Экспортировать в index.ts
export { NewScreen } from "./NewScreen";

// Использовать в App.tsx
{showNewScreen && <NewScreen {...props} />}
```

---

## ✅ Тесты

Вся логика теперь testable:

```typescript
describe('useGameLogic', () => {
  it('should select correct active player', () => {
    const { result } = renderHook(() => 
      useGameLogic({ game: mockGame, sessionToken, roomId })
    );
    expect(result.current.activePlayer).toBe(mockGame.players[0]);
  });
});
```

---

## 🚀 Далее можно сделать

1. **Добавить Results Screen**
   - Scores table, winner celebration
   - Back to lobby button

2. **Optimize GameScreen**
   - Мемоизировать больше selectors
   - Разбить на подкомпоненты (TopBar, Board, RightPanel — это уже отдельные widgets)

3. **Extract more hooks**
   - useGameActions (draw, claim, choose)
   - useGameUI (hover states, selection)

4. **Performance**
   - React.memo() для screens
   - useCallback everywhere

5. **Тесты**
   - Unit тесты для hooks
   - Integration тесты для screens

---

## 📝 Notes

- Все функции уменьшены (меньше params, более специализированные)
- Props drilling на GameScreen — это ок, потому что это главный экран
- Простой routing без React Router — достаточно для 3 screens
- Все типы правильно типизированы (TypeScript happy)
- Build успешен ✅


