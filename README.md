# 🚂 Ticket to Ride MVP

Fullstack-MVP для онлайн версии настольной игры "Билет на поезд".

**Tech Stack:**
- Frontend: React 19 + TypeScript + Vite + Zustand
- Backend: Node.js + Express + Socket.io
- Shared: TypeScript types + map data

---

## 📚 Документация

Вся документация находится в папке **`docs/`**:

- **[README](./docs/README.md)** — Полный обзор архитектуры и структуры
- **[ARCHITECTURE](./docs/ARCHITECTURE.md)** — Детальная архитектура с диаграммами
- **[REFACTORING](./docs/REFACTORING.md)** — Решения рефакторинга App.tsx
- **[API](./docs/API.md)** — Socket.io API документация

---

## 🚀 Быстрый старт

```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run dev:all

# Сборка для production
npm run build:all

# Запуск тестов
npm run test
```

**Endpoints после запуска:**
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`
- Health check: `http://localhost:3000/health`

---

## 🐳 Docker

```bash
docker compose up
```

---

## ✨ Основные возможности

- ✅ Мультиплеер (2-5 игроков)
- ✅ Реал-тайм синхронизация (Socket.io)
- ✅ Локализация (RU, UK, EN, DE)
- ✅ Интерактивная доска (Konva canvas)
- ✅ Mobile-responsive дизайн
- ✅ 100% TypeScript
- ✅ 20+ unit tests

---

## 📊 Project Stats

| Метрика | Значение |
|---------|----------|
| App.tsx lines | 202 (было 450, -55%) |
| Custom hooks | 11 |
| Screen components | 4 |
| Tests passing | 20/20 ✅ |
| TypeScript errors | 0 |
| Build time | ~1.5s |
| Bundle (gzip) | 80 kB |

---

## 📁 Структура проекта

```
apps/
├── client/          # Frontend React app
├── server/          # Backend Node.js app
└── calibrator/      # Map calibration tool

packages/
└── shared/          # Shared types & constants

docs/               # 📖 Полная документация
├── README.md       # Обзор и структура
├── ARCHITECTURE.md # Архитектура
├── REFACTORING.md  # Решения рефакторинга
└── API.md          # Socket API
```

---

## 🔗 Дополнительные файлы

- **FRONTEND_REFACTOR_PLAN.md** — План многофазного рефакторинга
- **PHASE1-2_COMPLETE.md** — Итоги завершенных фаз (Phase 1-2)
- **NEXT_STEPS.md** — Следующие шаги разработки (Phase 3+)
- **PLAN_SUMMARY.md** — План улучшения SVG карты Европы

---

## 🎯 Последние обновления (Phase 1-2)

### Phase 1: Рефакторинг App.tsx
- ✅ App.tsx: 450 → 202 строк (-55%)
- ✅ Извлечено 11 custom hooks
- ✅ Извлечено 4 screen компонента
- ✅ Дубликаты: -60%

### Phase 2: Дедупликация и оптимизация
- ✅ Socket.emit wrapper (useSocketEmit)
- ✅ Game selectors унификация (useGameSelectors)
- ✅ 40+ констант централизовано
- ✅ React.memo оптимизация
- ✅ Results screen добавлен
- ✅ 8 новых unit tests
- ✅ 20 tests passing ✅

---

**Created:** 2026-03-29
**Last Updated:** 2026-03-29

