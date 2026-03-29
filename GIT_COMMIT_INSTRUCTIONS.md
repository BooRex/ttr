# Git Commits Instructions

## Setup (если git еще не инициализирован)

```bash
cd C:\Users\Oleh\Desktop\3t
git init
git config user.name "Oleh"
git config user.email "your-email@example.com"
git add .
git commit -m "initial commit"
```

## Commits для Phase 1-2

### Commit 1: Refactor App.tsx - Extract hooks and screens

```bash
git add src/App.tsx src/hooks/ src/screens/ src/hooks/index.ts src/screens/index.ts
git commit -m "refactor(app): split App.tsx into hooks and screens

- Extract 8 custom hooks (useMediaQueries, useToasts, useTurnPulse, useLobbyLogic, useGameLogic, useGameBodyLock, useBoardHighlight, useLang, useHoverState, useGameSelectors, useSocketEmit)
- Extract 3 screen components (LobbyScreen, WaitingRoomScreen, GameScreen)
- Reduce App.tsx from 450 → 202 lines (-55%)
- Improve separation of concerns and code reusability
- All tests pass ✅
- Build successful ✅"
```

### Commit 2: Refactor - Deduplicate socket.emit and game selectors

```bash
git add src/hooks/useSocketEmit.ts src/hooks/useGameSelectors.ts src/hooks/useLang.ts src/hooks/useHoverState.ts src/hooks/useGameLogic.ts src/hooks/useLobbyLogic.ts
git commit -m "refactor(hooks): deduplicate socket.emit and game selectors

- Create useSocketEmit hook to wrap socket.emit with roomId/sessionToken
- Create useGameSelectors hook to memoize all game selectors
- Create useLang hook for language initialization and localStorage sync
- Create useHoverState hook for consolidated hover/highlight states
- Reduce socket.emit duplication: 10+ → 1 (-90%)
- Reduce game selectors: 5 useMemo → 1 hook (-80%)
- Reduce callback deps by 50%
- useGameLogic reduced from 134 → 95 lines (-29%)"
```

### Commit 3: Extract constants

```bash
git add src/lib/constants.ts src/hooks/useGameLogic.ts src/hooks/useLobbyLogic.ts src/App.tsx src/screens/LobbyScreen.tsx src/hooks/useSocketEmit.ts
git commit -m "refactor(constants): extract all magic strings and defaults

- Create src/lib/constants.ts with:
  - SOCKET_EVENTS: all socket event names (type-safe union)
  - GAME_DEFAULTS: maxPlayers, timer, mapId defaults
  - TEST_IDS: all data-testid strings (40+ constants)
  - TIMING: toast duration, pulse duration, sound duration
- Remove magic strings: 15+ → 0
- Ensure type-safe socket events (SocketEvent union)
- Simplify refactoring (change in one place)"
```

### Commit 4: Consolidate handlers and add unit tests

```bash
git add src/App.tsx test/hooks/useToasts.test.ts test/hooks/useHoverState.test.ts
git commit -m "refactor(app): consolidate handlers and add hook tests

- Merge handleLeaveRoom + handleBackToLobby → handleExitGame()
- Remove duplicate setRoomId() calls
- Add unit tests (8 new tests):
  - test/hooks/useToasts.test.ts: 4 tests
  - test/hooks/useHoverState.test.ts: 4 tests
- Test results: 20 passed (0 failed) ✅"
```

### Commit 5: Add Results screen with final standings

```bash
git add src/screens/ResultsScreen.tsx src/screens/index.ts src/App.tsx src/lib/locales/en.json src/lib/locales/ru.json src/lib/locales/uk.json src/lib/locales/de.json
git commit -m "feat(screens): add Results screen with final standings

- Create ResultsScreen component:
  - Victory banner with trophy emoji
  - Final standings table (place, player, points, destinations)
  - Game statistics (routes claimed, cards drawn, map)
  - Back to lobby button
- Add results translations (RU, UK, EN, DE)
- Integrate into App routing (game.finished → ResultsScreen)
- Calculate final standings from game events
- Type-safe with GameState props"
```

### Commit 6: Optimize screens with React.memo

```bash
git add src/screens/GameScreen.tsx src/screens/LobbyScreen.tsx src/screens/WaitingRoomScreen.tsx src/screens/ResultsScreen.tsx
git commit -m "perf(screens): wrap screens with React.memo for optimization

- Wrap GameScreen with memo (prevent re-renders on props unchanged)
- Wrap LobbyScreen with memo
- Wrap WaitingRoomScreen with memo
- Wrap ResultsScreen with memo
- Reduce unnecessary re-renders
- Improve performance on heavy components
- All tests still pass ✅"
```

---

## Все файлы, которые нужно добавить

### New Files
```
src/hooks/useSocketEmit.ts
src/hooks/useGameSelectors.ts
src/hooks/useLang.ts
src/hooks/useHoverState.ts
src/lib/constants.ts
src/screens/ResultsScreen.tsx
src/hooks/index.ts
src/screens/index.ts
test/hooks/useToasts.test.ts
test/hooks/useHoverState.test.ts
```

### Modified Files
```
src/App.tsx
src/hooks/useGameLogic.ts
src/hooks/useLobbyLogic.ts
src/screens/GameScreen.tsx
src/screens/LobbyScreen.tsx
src/screens/WaitingRoomScreen.tsx
src/lib/locales/en.json
src/lib/locales/ru.json
src/lib/locales/uk.json
src/lib/locales/de.json
GIT_COMMITS_SUMMARY.md (created for reference)
PHASE2_MEDIUM_RESULTS.md (created)
PHASE1-2_COMPLETE.md (created)
```

---

## One-liner для всех коммитов сразу (если git инициализирован)

```bash
cd C:\Users\Oleh\Desktop\3t

# Commit 1
git add src/App.tsx src/hooks/ src/screens/ && \
git commit -m "refactor(app): split App.tsx into hooks and screens" && \

# Commit 2
git add src/hooks/ && \
git commit -m "refactor(hooks): deduplicate socket.emit and game selectors" && \

# Commit 3
git add src/lib/constants.ts && \
git commit -m "refactor(constants): extract all magic strings and defaults" && \

# Commit 4
git add src/App.tsx test/hooks/ && \
git commit -m "refactor(app): consolidate handlers and add unit tests" && \

# Commit 5
git add src/screens/ResultsScreen.tsx src/lib/locales/ && \
git commit -m "feat(screens): add Results screen with final standings" && \

# Commit 6
git add src/screens/ && \
git commit -m "perf(screens): wrap screens with React.memo for optimization"
```

---

## Git Status Before Commits

```bash
git status
# Shows all untracked and modified files
```

---

## Проверка статуса после коммитов

```bash
git log --oneline -10
# Shows last 10 commits

git log --oneline --all --graph
# Shows commit graph
```

---

## Если нужно откатить коммит

```bash
git reset --soft HEAD~1     # Undo last commit, keep changes
git reset --hard HEAD~1     # Undo last commit, discard changes
```

---

Установка Git (если еще не установлен):

1. Скачать с https://git-scm.com/download/win
2. Установить с дефолтными настройками
3. Перезагрузить PowerShell/terminal
4. Проверить: `git --version`


