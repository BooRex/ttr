# Quick Reference - Быстрая справка

## 📖 Какой документ читать?

### Новичок в проекте?
→ Начни с **[README.md](./README.md)** (этот файл)

### Интересует архитектура?
→ Читай **[ARCHITECTURE.md](./ARCHITECTURE.md)**
- Diagram слоев
- Component hierarchy
- Data flow
- Design decisions

### Хочешь понять рефакторинг?
→ Смотри **[REFACTORING.md](./REFACTORING.md)**
- Проблема (было)
- Решение (теперь)
- Metrics
- Lessons learned

### Нужна API документация?
→ Смотри **[API.md](./API.md)**
- Socket events
- Payloads
- Response examples
- Testing patterns

---

## 🎯 Key Concepts

### 1. Hook-based Architecture
```typescript
// Вместо большого App.tsx, используем custom hooks:
const gameLogic = useGameLogic({ game, roomId, sessionToken })
const { emit } = useSocketEmit(roomId, sessionToken)
const { me, activePlayer, isMyTurn } = useGameSelectors(game, sessionToken)
```

### 2. Screen Components
```typescript
// Screens - это simple components с props, обернутые React.memo
<LobbyScreen ... />
<WaitingRoomScreen ... />
<GameScreen ... />  // Heavy component, мемоизирован
<ResultsScreen ... />
```

### 3. Socket Events (Type-safe)
```typescript
// Использум constants для type-safety
const { emit } = useSocketEmit(roomId, sessionToken)
emit(SOCKET_EVENTS.GAME_CLAIM_ROUTE, { routeId, color })
```

### 4. Constants Centralization
```typescript
// src/lib/constants.ts содержит:
SOCKET_EVENTS   // type-safe events
GAME_DEFAULTS   // defaults (2 игроков, 0 сек таймер)
TEST_IDS        // все data-testid
TIMING          # все таймауты
```

---

## 📊 Stats

| Что | Было | Стало | Улучшение |
|-----|------|-------|-----------|
| App.tsx lines | 450 | 202 | -55% |
| socket.emit дублей | 10+ | 1 | -90% |
| useMemo дублей | 5 | 1 | -80% |
| Magic strings | 15+ | 0 | -100% |
| Hooks | - | 11 | ✨ |
| Tests | 12 | 20 | +67% |

---

## 🚀 Development Workflow

### Добавить новый hook?

```typescript
// src/hooks/useNewFeature.ts
export const useNewFeature = () => {
  const [state, setState] = useState(false)
  const doSomething = useCallback(() => { ... }, [])
  return { state, doSomething }
}

// Экспортировать в index.ts
export { useNewFeature } from "./useNewFeature"

// Использовать в App.tsx или других hooks
```

### Добавить новый socket event?

```typescript
// 1. Добавить в constants
export const SOCKET_EVENTS = {
  // ... existing
  NEW_EVENT: "new:event"
}

// 2. Использовать через useSocketEmit
const { emit } = useSocketEmit(roomId, sessionToken)
emit(SOCKET_EVENTS.NEW_EVENT, payload)

// 3. Слушать на backend
socket.on(SOCKET_EVENTS.NEW_EVENT, (payload) => { ... })
```

### Добавить новый screen?

```typescript
// src/screens/NewScreen.tsx
export const NewScreenComponent = ({ ... }) => {
  return <div>...</div>
}
export const NewScreen = memo(NewScreenComponent)

// Экспортировать в index.ts
export { NewScreen } from "./NewScreen"

// Использовать в App.tsx
{someCondition && <NewScreen ... />}
```

---

## 🧪 Testing

### Unit Test Hook

```typescript
import { renderHook } from '@testing-library/react'
import { useNewHook } from './useNewHook'

it('should do something', () => {
  const { result } = renderHook(() => useNewHook())
  expect(result.current.value).toBe(expectedValue)
})
```

### Component Test

```typescript
import { render, screen } from '@testing-library/react'
import { GameScreen } from './GameScreen'

it('should render game board', () => {
  render(<GameScreen game={mockGame} ... />)
  expect(screen.getByTestId('game-screen')).toBeInTheDocument()
})
```

---

## 📦 Project Structure

```
apps/client/src/
├── App.tsx              # Root + routing (202 lines)
├── hooks/               # 11 custom hooks
├── screens/             # 4 screen components
├── components/          # UI components
├── widgets/             # Complex widgets
├── entities/            # Business logic
├── features/            # Feature-specific
├── lib/                 # Utils & constants
└── test/                # Tests
```

---

## 🔑 File Purposes

| Файл | Назначение |
|------|-----------|
| **App.tsx** | Routing + top-level state |
| **hooks/\*.ts** | Business logic + state management |
| **screens/\*.tsx** | Full-page components |
| **components/\*.tsx** | Reusable UI components |
| **widgets/\*.tsx** | Complex UI blocks |
| **entities/\*/model** | Selectors & algorithms |
| **lib/constants.ts** | All magic values |
| **lib/i18n.ts** | Localization |

---

## 🎨 Styling

- **CSS files** - в `src/styles.css`
- **Colors** - `src/lib/colors.ts`
- **TailwindCSS** - не используется (простой CSS)
- **Responsive** - `@media` queries для mobile

---

## 🌐 Localization

### Добавить новый ключ?

```typescript
// src/lib/locales/en.json
{
  "ui": {
    "newKey": "New Value"
  }
}

// Используем
const label = t(lang, "ui.newKey")
```

**Поддерживаемые языки:** RU, UK, EN, DE

---

## 🐛 Debugging

### React DevTools
- Install React Developer Tools extension
- Open `Components` tab
- Navigate to component, see hooks & props

### Socket DevTools
```typescript
// В browser console
socket.on((event, data) => {
  console.log(`[Socket] ${event}`, data)
})
```

### Performance Profiler
```bash
npm run dev
# Open Chrome DevTools → Performance → Record
```

---

## 📚 Related Documents

- **FRONTEND_REFACTOR_PLAN.md** — 6-фазный план улучшений
- **PHASE1-2_COMPLETE.md** — Итоги Phase 1-2
- **NEXT_STEPS.md** — Phase 3+ планы

---

## ❓ FAQ

**Q: Где хранится game state?**
A: В Zustand store (store.ts), updates приходят через socket events

**Q: Как работает routing?**
A: Простой conditional rendering в App.tsx, no React Router

**Q: Где можно добавить логику?**
A: Либо в hook (useNewLogic), либо в entities/feature/model

**Q: Как избежать prop drilling?**
A: Используем Zustand store или уменьшаем компоненты

**Q: Почему React.memo везде?**
A: Не везде, только на тяжелых screens и components

---

**Last Updated:** 2026-03-29

**Документация завершена! ✅**

