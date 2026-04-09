# Ticket to Ride (Europe)

Мультиплеерная веб-игра по мотивам Ticket to Ride.

## Технологии

- Frontend: React 19 + TypeScript + Vite
- Backend: Node.js + Express + Socket.io
- Shared: общий пакет типов и правил (`packages/shared`)

## Быстрый старт

```bash
npm install
npm run dev:all
```

После запуска:

- Client: `http://localhost:5173`
- Server: `http://localhost:3000`
- Health: `http://localhost:3000/health`

## Основные команды

```bash
npm run build
npm run test
```

## Документация

Актуальная документация находится в `docs/`:

- `docs/README.md` — навигация и зона ответственности документации
- `docs/GETTING_STARTED.md` — запуск локально и структура проекта
- `docs/ARCHITECTURE.md` — архитектура приложения
- `docs/API.md` — Socket.io события и контракты
- `docs/GAMEPLAY.md` — игровой цикл и правила в приложении
- `docs/SCORING_RULES.md` — подсчет очков
- `docs/DEPLOY.md` — деплой (Render + Docker)
- `docs/ROADMAP.md` — ближайшие улучшения

Дополнительно:

- `calibrator/README.md` — калибратор городов/лейблов карты Europe
- `apps/client/test/README.md` — запуск клиентских тестов
