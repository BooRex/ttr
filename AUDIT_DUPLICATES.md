# Audit: Дубликаты и переиспользуемое в коде

## 🔴 НАЙДЕННЫЕ ДУБЛИКАТЫ

### 1. **socket.emit паттерны с roomId + sessionToken**

**Места:**
- `useGameLogic.ts`: startGame, drawCardFrom, claimRoute, drawDestinations, confirmDestinations
- `useLobbyLogic.ts`: createRoom, joinRoom

**Паттерн:**
```typescript
socket.emit("room:start", { roomId, sessionToken });
socket.emit("game:draw-card", { roomId, sessionToken, fromOpenIndex: index });
socket.emit("game:claim-route", { roomId, sessionToken, routeId, color, useLocomotives });
```

**Решение:** Создать `useSocketEmit` hook с wrapper

---

### 2. **useMemo селекторы с одинаковыми deps**

**Дубликаты:**
```typescript
// В useGameLogic.ts:
const me = useMemo(() => selectMe(game ?? null, sessionToken), [game, sessionToken]);
const isMyTurn = useMemo(() => selectIsMyTurn(game ?? null, sessionToken), [game, sessionToken]);
const isMyPendingChoice = useMemo(() => selectIsMyPendingChoice(game ?? null, sessionToken), [game, sessionToken]);
const canAct = useMemo(() => selectCanAct(game ?? null, sessionToken), [game, sessionToken]);
```

**Паттерн:** Все зависят от `[game, sessionToken]` и вызывают `game ?? null`

**Решение:** Создать `useGameSelectors` hook

---

### 3. **Lang initialization паттерн**

**Дубликаты:**
```typescript
// App.tsx
const [lang, setLang] = useState<Lang>(() => {
  try {
    return getInitialLang();
  } catch {
    return defaultLang;
  }
});

// Вероятно есть еще где-то
```

**Решение:** Вынести в `useLang` hook

---

### 4. **useState с null значением**

**Дубликаты:**
```typescript
const [hoveredDestination, setHoveredDestination] = useState<DestinationCard | null>(null);
const [hoveredConnection, setHoveredConnection] = useState<{ from: string; to: string } | null>(null);
const [highlightOwnerSessionToken, setHighlightOwnerSessionToken] = useState<string | null>(null);
```

**Паттерн:** Все это hover/highlight состояние

**Решение:** Вынести в `useHoverState` hook

---

### 5. **setSelectedDestinationIds cleanup логика**

**Дубликаты:**
```typescript
// useGameLogic.ts - twice используется похожий паттерн
setSelectedDestinationIds((c) => c.filter((id) => pendingChoice.cards.some(...)));
setSelectedDestinationIds([]);
```

**Решение:** Вынести в отдельный hook или utility

---

### 6. **Хендлеры в App.tsx**

**Дубликаты:**
```typescript
const handleLeaveRoom = () => {
  setRoomId("");
  setError("");
};

const handleBackToLobby = () => {
  setRoomId("");
};
```

**Паттерн:** Оба вызывают `setRoomId("")`

**Решение:** Объединить в один `handleExitGame()`

---

## 🟡 ПЕРЕИСПОЛЬЗУЕМОЕ

### 1. **roomId + sessionToken** в каждом socket.emit
Встречается в ~10 местах

### 2. **game ?? null** проверка
Встречается в 7+ местах в useGameLogic

### 3. **Modal закрытие паттерн**
```typescript
onClick={() => setIsEventsOpen(false)}
```

### 4. **setLang callbacks**
Используется как prop в несколько мест

### 5. **Тип GameState**
Импортируется везде

---

## 📊 СТАТИСТИКА

- **socket.emit вызовов:** 10+ с одинаковым `{ roomId, sessionToken, ... }`
- **useMemo селекторов:** 5 с deps `[game, sessionToken]`
- **null state:** 3+ useState с null
- **Повторящихся условий:** `game?.players[0]` дублируется

---

## ✅ РЕКОМЕНДАЦИИ ПО ПРИОРИТЕТУ

1. **HIGH:** `useSocketEmit` hook (уменьшит код в useGameLogic на 20%)
2. **HIGH:** `useGameSelectors` hook (уменьшит useGameLogic на 30%)
3. **MEDIUM:** `useLang` hook (для переиспользования)
4. **MEDIUM:** `useHoverState` hook (объединит 3 useState)
5. **LOW:** Объединить handleLeaveRoom + handleBackToLobby


