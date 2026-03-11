# Sheet: вимкнено горизонтальний скрол (2025-02-23)

## config/sheet.ts
- SHEET_CONTENT_CLASS: додано min-w-0, overflow-x-hidden
- SHEET_BODY_CLASS: додано min-w-0
- SHEET_BODY_SCROLL_CLASS: додано min-w-0, overflow-x-hidden (разом з overflow-y-auto)
- SHEET_SCROLL_CLASS: нова константа "overflow-x-hidden overflow-y-auto"

## Оновлені sheet-компоненти
- role-detail-sheet: overflow-auto → SHEET_SCROLL_CLASS, min-w-0
- user-detail-sheet: TabsContent (profile, sessions) та sessions list → SHEET_SCROLL_CLASS, min-w-0
- vehicle-detail-sheet: TabsContent → SHEET_SCROLL_CLASS, min-w-0
- tabs-config-management: scroll div та options list → SHEET_SCROLL_CLASS, min-w-0

## Результат
Усі sheet мають тільки вертикальний скрол; горизонтальний прогортування вимкнено через overflow-x-hidden та min-w-0 для flex-дітей.