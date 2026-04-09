# План обновления `calibrator` под `europeCities`

## Цель
Обновить калибратор так, чтобы он работал с новым форматом данных `europeCities` из `apps/client/src/lib/maps/europeLayout.ts`:
- перетаскивание **городов** мышкой (`x/y`),
- перетаскивание **лейблов** отдельно (`label.dx/dy`),
- экспорт готового объекта `europeCities` для прямой вставки в клиент.

Карта-источник: `apps/client/public/assets/maps/europe.svg` (в калибраторе локально: `calibrator/public/assets/maps/europe.svg`).

---

## Scope и ограничения
- Калибратор остается отдельным проектом в `calibrator/` без сложного bundler-пайплайна.
- Основной UI-экран остается в `calibrator/public/index.html` (или рядом вынесенный JS-файл).
- Итог экспорта должен быть полностью совместим с `EUROPE_LAYOUT`.

---

## Целевой UX

### 1) Режим перемещения городов
- Клик по городу выбирает его.
- Drag точки города меняет `x/y`.
- Координаты обновляются в реальном времени.

### 2) Режим перемещения лейблов
- Лейбл каждого города имеет отдельный drag-handle.
- Drag меняет только `label.dx/dy` относительно позиции города.
- Визуально отображается линия "город -> лейбл" для понятности.

### 3) Быстрые действия
- `Reset city` (вернуть `x/y` к исходным).
- `Reset label` (вернуть `dx/dy` к исходным).
- Переключатель режима: `City` / `Label` / `Both`.

### 4) Экспорт
- Кнопка `Copy europeCities` копирует финальный объект:

```ts
const europeCities: Record<string, { x: number; y: number; label: { dx: number; dy: number } }> = {
  // ...
};
```

- Опционально: кнопка `Copy derived` для `europeCityPoints` и `europeCityLabelOffsets`.

---

## Data model v2
Вместо разрозненных структур использовать единый state:

```ts
type CityPlacement = {
  x: number;
  y: number;
  label: { dx: number; dy: number };
};

type CalibrationState = {
  board: { width: number; height: number };
  backgroundOffset: { x: number; y: number };
  backgroundSvgSize: { width: number; height: number };
  placements: Record<string, CityPlacement>;
};
```

### Хранилище
- `localStorage` ключ: `ttr-calibration:v2`.
- Добавить миграцию из старого формата (если найден):
  - старые `x/y` переносим в `placements[city].x/y`,
  - для `label` ставим дефолт (например `{ dx: 10, dy: -10 }`) или текущие оффсеты, если есть.

---

## Архитектура изменений (файлы)

### Обновить
- `calibrator/public/index.html`
  - добавить UI-контролы режимов,
  - добавить drag-handle для лейблов,
  - добавить кнопки экспорта `europeCities` и reset-операции.

- `calibrator/README.md`
  - описать новый workflow калибровки городов и лейблов,
  - описать формат экспорта и как вставлять в `apps/client/src/lib/maps/europeLayout.ts`.

### Добавить (рекомендуется)
- `calibrator/public/calibrator.js`
  - вынести логику из inline-script:
    - state/model,
    - рендер,
    - drag/hit testing,
    - экспорт/импорт,
    - localStorage migration.

- `calibrator/public/styles.css` (опционально)
  - стили панели инструментов, состояния active/hover, drag-handle.

---

## Этапы реализации

## Phase 1 — Refactor state + рендер
- Перейти на единый `placements` (с `label`).
- Рендерить город и лейбл как связанные элементы из одного источника.
- Поддержать выбранный город (active state).

## Phase 2 — Drag engine
- Реализовать drag городов (`x/y`).
- Реализовать drag лейблов (`dx/dy`).
- Добавить ограничение в пределах board (минимум для города; лейбл можно свободнее).

## Phase 3 — Export/Import
- Экспорт `europeCities` в буфер обмена.
- Опционально экспорт производных структур.
- Загрузка/восстановление из `localStorage:v2`.

## Phase 4 — Migration + QA
- Миграция старых сохранений к `v2`.
- Smoke-check по всем городам.
- Проверка совместимости вставки в `europeLayout.ts`.

## Phase 5 — Документация
- Обновить `calibrator/README.md` с инструкцией:
  1) открыть калибратор,
  2) переместить города,
  3) переместить лейблы,
  4) скопировать `europeCities`,
  5) вставить в `apps/client/src/lib/maps/europeLayout.ts`.

---

## Формат экспорта (контракт)
Экспортируем только объект `europeCities` (primary):

```ts
const europeCities: Record<string, { x: number; y: number; label: { dx: number; dy: number } }> = {
  London: { x: 309, y: 392, label: { dx: -90, dy: -10 } },
  // ...
};
```

Требования:
- координаты и оффсеты округляются до `int`,
- ключи строго соответствуют именам городов в shared map,
- формат полностью совместим с текущим `europeLayout.ts`.

---

## Риски и как закрываем
- Рассинхрон списка городов между картой и калибратором
  - хранить единый список, валидировать missing/extra перед экспортом.
- Конфликт drag с pan/zoom
  - разделить зоны захвата и при активном drag блокировать pan.
- Случайная порча оффсетов
  - добавить reset для label и undo (минимум 1 шаг, опционально).
- Потеря данных при перезагрузке
  - autosave в `localStorage:v2`.

---

## Критерии готовности (Definition of Done)
- Можно перетаскивать все города и отдельно все лейблы.
- Экспортируется валидный `europeCities` без ручной правки.
- После перезагрузки браузера состояние восстанавливается.
- Проверка полноты: 100% городов присутствуют в экспортируемом объекте.
- Вставка результата в `apps/client/src/lib/maps/europeLayout.ts` проходит без ошибок типизации.

---

## Решения, которые нужно подтвердить перед реализацией
- [ ] Экспортировать только `europeCities` или дополнительно derived-объекты.
- [ ] Нужен ли snap-to-grid для drag (например, шаг 2 px).
- [ ] Политика ограничения label (разрешать уходить далеко за карту или нет).
- [ ] Нужен ли импорт текущего `europeCities` из `europeLayout.ts` автоматически при старте.
- [ ] Нужен ли undo/redo в первом релизе калибратора.

