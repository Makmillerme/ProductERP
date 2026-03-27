# Уніфікація таблиць (скрол лише за потреби)

**Дата:** 2025-03-25

- `@/components/ui/table`: за замовчуванням `<table>` — `table-auto min-w-full w-max max-w-none` (+ обгортка `overflow-x-auto`). Патерн `max(100%, max-content)`: якщо колонки поміщаються — без зайвого скролу; якщо ні — горизонтальний скрол.
- Management: `mgmtTableLayoutClass` у `config/management-table.ts` — `table-fixed min-w-full w-max max-w-none`; `MgmtTableColGroup` додає `minWidth: MGMT_TABLE_COL_MIN_WIDTH` (8rem) на кожен `<col>` разом з `%` ширини.
- Ролі/користувачі: прибрано зовнішній `div.overflow-hidden`, який різав скрол.
- Облік товару та сесії в `user-detail-sheet`: достатньо `<Table>` без дубльованих класів.
