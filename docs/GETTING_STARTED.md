# Getting Started

## Требования

- Node.js 20+
- npm 10+

## Установка

```bash
npm install
```

## Запуск в разработке

```bash
npm run dev:all
```

Сервисы:

- Client: `http://localhost:5173`
- Server: `http://localhost:3000`
- Health: `http://localhost:3000/health`

## Полезные команды

```bash
npm run build
npm run test
npm run test -w apps/client
npm run test -w apps/server
```

## Структура workspace

- `apps/client` — React приложение
- `apps/server` — Socket.io + Express сервер
- `packages/shared` — типы, карты, общие правила
- `calibrator` — инструмент редактирования `europeCities`

## Минимальный поток разработки

1. Измени код в нужном пакете.
2. Проверь сборку:
   - `npm run build`
3. Прогони тесты целевого пакета.
4. Обнови документацию в `docs/`, если менялся контракт/правила/инфраструктура.

