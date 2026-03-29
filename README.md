# Ticket to Ride MVP (локальный)

Минимальный fullstack-MVP для игры с друзьями:
- гостевой вход по нику + `sessionToken` в `localStorage`
- лобби и комнаты (2-5 игроков)
- старт игры, базовые действия (взять карту, захватить маршрут)
- финальный раунд и автоматическое завершение партии
- подсчет очков по destination-картам и таблица итогов
- наблюдатели
- реконнект по `sessionToken`
- real-time синхронизация через Socket.io

## Структура

- `apps/server` - Node.js + Express + Socket.io
- `apps/client` - React 19 + Vite + Zustand
- `packages/shared` - общие типы и данные карты USA (mini)

## Быстрый запуск (локально)

```bash
npm install
npm run dev:all
```

После запуска:
- клиент: `http://localhost:5173`
- сервер: `http://localhost:3000`
- health-check: `http://localhost:3000/health`

## Запуск в Docker

```bash
docker compose up
```

## Как подключить друзей

### 1) Через ngrok (самый простой способ)

```bash
ngrok http 5173
```

Отправь друзьям публичный URL от ngrok.

### 2) Через Tailscale

Поднимите Tailscale на всех устройствах и откройте `http://<tailscale-ip>:5173`.

## Тесты

```bash
npm run test -w apps/server
```

## Что уже есть

- In-memory состояние игры (без БД)
- RoomService + GameEngine
- Реалтайм события комнаты/игры
- Базовые правила захвата маршрута и начисления очков

## Что дальше (следующий шаг)

1. Полная карта USA (все города и маршруты)
2. Действие `draw_destinations` + проверка выполненных маршрутов
3. Таймер хода на сервере
4. Mobile-first UI + board rendering (Konva)
5. История игр (опционально: SQLite или Postgres)

