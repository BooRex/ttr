# Frontend Refactor Plan

## Цель

Разгрузить `apps/client/src/App.tsx`, разнести логику по слоям, сделать код поддерживаемым и тестируемым без остановки разработки.

## Подход

Постепенный рефакторинг (strangler pattern):
- сначала выделяем безопасные seams (селекторы, форматтеры, хелперы);
- затем переносим socket/session и доменную логику;
- потом дробим UI на widgets/features;
- на каждом этапе держим проект в рабочем состоянии.

---

## Целевая структура (FSD-lite)

`apps/client/src/`

- `app/` — entry, providers, глобальные настройки
- `pages/` — композиция экранов
- `widgets/` — крупные визуальные блоки (topbar, board, side panels)
- `features/` — пользовательские сценарии (claim route, event log, language switch)
- `entities/` — доменные сущности (`game`, `route`, `player`, `destination`)
- `shared/` — общие UI-компоненты, i18n, utils, api adapters

Правило зависимостей: верхний слой может зависеть от нижнего, но не наоборот.

---

## Фазы

### Phase 0 — Baseline и инвентаризация

**Что делаем**
- фиксируем текущие пользовательские флоу;
- выделяем ответственность в `App.tsx`:
  - socket wiring,
  - derived state,
  - действия игрока,
  - форматирование событий,
  - hover/highlight логика.

**Артефакт**
- короткий ADR/README по правилам слоёв.

**Готово, когда**
- есть список зон ответственности и целевые точки выноса.

---

### Phase 1 — Вынести state/selectors из App

**Что делаем**
- переносим derived state в селекторы:
  - `me`, `activePlayer`, `canAct`, `winner`, `isMyTurn`;
- переносим алгоритмы подсветки/вычислений в `entities/game/model`.

**Кандидаты на вынос**
- `buildOwnedDestinationHighlight`
- любые route/city highlight helpers

**Готово, когда**
- `App.tsx` не содержит сложных вычислений доменной логики.

---

### Phase 2 — Socket/session orchestration

**Что делаем**
- выносим подписки/emit и reconnect-поведение из `App.tsx` в модуль процесса:
  - `processes/game-session` (или `features/session`);
- оставляем в `App.tsx` только вызовы высокоуровневых действий.

**Готово, когда**
- socket wiring централизован и не размазан по компонентам.

---

### Phase 3 — Event log как feature

**Что делаем**
- отделяем форматирование событий от отображения:
  - `features/event-log/model/formatters.ts`
  - `features/event-log/ui/EventLog.tsx`;
- рендер логов в правой панели и мобильном модале использует единый компонент.

**Готово, когда**
- нет inline-форматирования событий в `App.tsx`.

---

### Phase 4 — UI decomposition

**Что делаем**
- разбиваем экран игры на виджеты:
  - `widgets/game-topbar`
  - `widgets/game-board`
  - `widgets/game-left-panel`
  - `widgets/game-right-panel`;
- `App.tsx` становится композиционным контейнером.

**Готово, когда**
- `App.tsx` короткий и читабельный (только wiring страницы).

---

### Phase 5 — i18n hardening

**Что делаем**
- продолжаем держать локализацию в JSON;
- убираем «сырые» строковые ключи из компонентов;
- оставляем единый API:
  - `t(lang, key, params)`
  - `cityLabel(lang, city)`
  - `cardLabel(lang, color)`.

**Готово, когда**
- UI/события/названия городов берутся только через i18n-слой.

---

### Phase 6 — Тесты (пирамида)

#### Unit
- селекторы (`entities/game/model/selectors`)
- highlight-алгоритмы
- форматтеры event log
- claim options

#### Component (RTL)
- `ActionPanel`
- `EventLog`
- `DestinationBadge`
- `BoardCanvas` (базовые ветки)

#### Integration
- store + socket handlers
- сценарии обновления стейта по серверным событиям

#### E2E (Playwright)
- create/join/start
- draw/claim/destination
- hover-highlight по destination/event badge
- reconnect smoke

**Готово, когда**
- есть стабильный regression suite на ключевые сценарии.

---

## Definition of Done (итог)

- `App.tsx` — только композиция и минимум glue-кода.
- Доменные вычисления вынесены в `entities/*/model`.
- События визуализируются через feature-модуль, а не вручную.
- Socket/session orchestration не живёт в page-компоненте.
- Основные сценарии покрыты тестами на нескольких уровнях.

---

## Риски и mitigation

1. **Регрессии real-time поведения**
   - Митигируем: branch-by-abstraction, мелкие PR, совместимость старого/нового слоя.

2. **Ломкость Konva-подсветок**
   - Митигируем: pure-алгоритмы + unit-тесты на вычисление highlight.

3. **Нестабильные UI/e2e тесты**
   - Митигируем: fake timers, deterministic fixtures, минимизация анимаций в тестовом режиме.

4. **Дрейф типов client/shared**
   - Митигируем: единые типы из `@ttr/shared`, без локальных дублей.

---

## Стратегия миграции без остановки разработки

- Вертикальные срезы (по feature), не «большой взрыв».
- Каждый PR — deployable.
- Старый и новый слои могут временно сосуществовать.
- Удаляем legacy-код только после зелёных тестов.

---

## Предложение по коммитам (фазы)

1. `refactor(client): extract game selectors and highlight model`
2. `refactor(client): move socket session orchestration out of app`
3. `refactor(client): isolate event-log feature and formatters`
4. `refactor(client): split game screen into widgets`
5. `chore(i18n): enforce json-driven typed translation usage`
6. `test(client): add unit/component/integration coverage for game flow`
7. `test(e2e): add multiplayer smoke scenarios`

