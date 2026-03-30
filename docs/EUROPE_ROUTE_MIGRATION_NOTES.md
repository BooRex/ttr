# Europe route migration notes

## 1) Cities from your new list: present vs missing

### Missing as exact IDs (need to be added or renamed)
- `Danzig`
- `Pamplona`
- `Salzburg`
- `Wilno`
- `Brussel` (current map uses `Bruxelles`)
- `Bucuresti` (current map uses `Bucharest`)
- `Kiev` (current map uses `Kyiv`)
- `Kobenhavn` (current map uses `Copenhagen`)
- `Munchen` (current map uses `Munich`)
- `Wien` (current map uses `Vienna`)

### Present in current `europe.ts` with the same spelling
- `Amsterdam`
- `Athina`
- `Brindisi`
- `Sarajevo`
- `Smyrna`
- `Barcelona`
- `Marseille`
- `Madrid`
- `Berlin`
- `Essen`
- `Frankfurt`
- `Warszawa`
- `Brest`
- `Dieppe`
- `Paris`
- `Palermo`
- `Roma`
- `Budapest`
- `Constantinople`
- `Sevastopol`
- `Cadiz`
- `Lisboa`
- `Ankara`
- `Sofia`
- `London`
- `Edinburgh`
- `Moskva`
- `Petrograd`
- `Stockholm`
- `Zurich`
- `Venezia`
- `Smolensk`
- `Riga`
- `Sochi`
- `Zagreb`

## 2) Where to add coordinates manually

Coordinates are stored in:
- `packages/shared/src/maps/europe.ts`
- object: `cityPoints`

I added inline TODO comments in that file near `cities` and `cityPoints` with exact insertion examples.

## 3) Extra compatibility notes before importing your route list

- Current route color type supports `pink`, not `purple`.
  - If you want to keep `purple`, add it to `CardColor` in `packages/shared/src/index.ts`, plus UI color config in client.
- Current neutral color is `gray` (US spelling), your list uses `grey`.
  - Normalize all route colors to one variant before import.
- If you keep alias names (e.g. `Kiev` and `Kyiv`), choose one canonical ID for game logic and put transliteration only in i18n labels.

