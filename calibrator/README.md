# 🗺️ Europe Cities Calibrator

Интерактивный инструмент для настройки `europeCities` (город + label offset) для
`apps/client/src/lib/maps/europeLayout.ts`.

## Запуск

```bash
npm install
npm run dev
```

Открой: `http://localhost:5173`

## Что умеет

- Drag города (изменяет `x/y`)
- Drag подписи города (изменяет `label.dx/dy`)
- Режимы редактирования: `both`, `city`, `label`
- Копирование готового TypeScript-объекта `europeCities`
- Автосохранение в `localStorage` (`ttr-calibration:v2`)
- Миграция старого формата (`ttr-calibration` с `svgX/svgY`)

## Workflow

1. Выбери город в списке слева.
2. Передвигай точку города и/или текст лейбла на карте.
3. При необходимости используй `Reset city` / `Reset label`.
4. Нажми `Copy europeCities`.
5. Вставь объект в `apps/client/src/lib/maps/europeLayout.ts`.

## Формат вывода

```ts
const europeCities: Record<string, { x: number; y: number; label: { dx: number; dy: number } }> = {
  London: { x: 309, y: 392, label: { dx: -90, dy: -10 } },
  // ...
};
```

