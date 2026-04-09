# Socket API

Актуальные события определены в `packages/shared/src/index.ts`.

## Client -> Server

### Room

- `room:list`
- `room:create`
  - `{ nickname, sessionToken, mapId, maxPlayers, turnTimerSeconds }`
- `room:join`
  - `{ roomId, nickname, sessionToken, asSpectator? }`
- `room:start`
  - `{ roomId, sessionToken }`

### Game

- `game:draw-card`
  - `{ roomId, sessionToken, fromOpenIndex? }`
- `game:draw-two-deck`
  - `{ roomId, sessionToken }`
- `game:draw-destinations`
  - `{ roomId, sessionToken }`
- `game:choose-destinations`
  - `{ roomId, sessionToken, keepIds }`
- `game:claim-route`
  - `{ roomId, sessionToken, routeId, color, useLocomotives? }`
- `game:build-station`
  - `{ roomId, sessionToken, city, color, useLocomotives? }`

### Reconnect

- `reconnect`
  - `{ roomId, sessionToken }`

## Server -> Client

- `room:list` — список комнат.
- `room:error` — ошибка валидации/действия.
- `room:joined` — состояние комнаты после входа.
- `game:state` — актуальное состояние игры.
- `reconnect:success` — успешное восстановление сессии.
- `reconnect:fail` — ошибка восстановления.

## Примечания

- Клиент отправляет действия, но финальную валидацию всегда делает сервер.
- Состояние соперников маскируется сервером для конкретного viewer.
- Любое изменение в payload или названии события требует синхронного обновления:
  - `packages/shared/src/index.ts`
  - клиентских emit/handlers
  - серверных listeners
  - этого документа.
