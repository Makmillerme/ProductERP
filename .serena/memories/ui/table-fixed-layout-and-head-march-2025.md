## Таблиці: fixed layout + TableHead + статуси

**Дата:** 2025-03-25

### Причини поломки статусів
1. У `colgroup` колонка «Назва» мала `width: 1%` — у `table-layout: fixed` це літеральні 1% ширини таблиці, а не «решта місця» → колонки накладались.
2. `TableHead`: обгортка `flex w-full` без `min-w-0` і без узгодження з `text-center` на `th` давала вихід контенту за межі вузьких колонок.

### Що змінено
- **`ui/table.tsx` — `TableHead`:** прибрано дефолтний `whitespace-nowrap` на `th`; внутрішній рядок — `flex min-h-11 w-full min-w-0 items-center`; для заголовків без `whitespace-nowrap` текст у `<span className="min-w-0 truncate">`; якщо в `className` є `text-center` / `text-right` — додаються `justify-center` / `justify-end`. Підклас `whitespace-nowrap` лишає `children` без обгортки (наприклад user sessions).
- **`statuses-management.tsx`:** `colgroup` з відсотками, сума 100% (8 / 34 / 10 / 20 / 28); прибрано зайві `w-*` на `TableHead`; комірка назви — `min-w-0` + `truncate` + `title`.

### Контракт для fixed-таблиць
- Задавати ширини колонок через **`colgroup`** (відсотки або сумісні одиниці), не використовувати `width: 1%` як «гнучку» колонку.
- У `table-fixed` ширини з `th`/`td` менш надійні, ніж `col`.

### Раніше (контекст)
- Дефолтний `min-w-max` на `<table>` прибрано (див. `bugfix/table-remove-default-min-w-max-march-2025`).
