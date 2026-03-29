# Client Test Suite

Тесты клиента запускаются через Vitest + jsdom.

## Что покрыто

- unit: `entities/game/model/selectors`
- unit: `entities/game/model/highlights`
- unit: `features/event-log/model/formatters`
- component: `components/EventLog`

## Быстрый запуск

```powershell
cd "C:\Users\Oleh\Desktop\3t"
npm run test -w apps/client
```

## Режим наблюдения

```powershell
cd "C:\Users\Oleh\Desktop\3t"
npm run test:watch -w apps/client
```

