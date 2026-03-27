## Список товарів: ліворуч + min/max колонок + горизонтальний скрол

**Патерн (CSS):** обгортка з `overflow-x-auto` (`components/ui/table.tsx`), на `<table>` для цього списку: `table-auto min-w-full w-max max-w-none` — таблиця **не вужча за контейнер** (`min-w-full`), але ширина як **max-content** (`w-max`), тож коли сума колонок (min/max на `th`/`td`) перевищує контейнер, з’являється горизонтальний скрол; вирівнювання зліва через звичайний потік.

**Константи** (`types.ts`): `TABLE_COLUMN_MIN_WIDTH` (9rem), `TABLE_COLUMN_MAX_WIDTH` (18rem), `TABLE_INDEX_COLUMN_MIN_WIDTH` / `MAX` для «№».

**Код:** `productListDataColumnStyle`, `indexColumnStyle`; прибрано `colgroup` + `table-fixed`.

