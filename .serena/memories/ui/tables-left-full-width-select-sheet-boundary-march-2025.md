## Таблиці (ліворуч, ширина)

- `src/components/ui/table.tsx`: обгортка `min-w-0 max-w-full`; `<table>` за замовчуванням `w-full min-w-0 max-w-full table-auto` (колонки з `table-fixed` у сторінках перебивають через `cn`).
- `src/components/table-with-pagination.tsx`: кореневий блок `w-full min-w-0 max-w-full`, внутрішній `flex justify-start` щоб контент не «з’їжджав» по центру.
- `products-page.tsx`: прибрано `w-max` при наявності рядків — завжди `w-full table-auto`; заголовки динамічних колонок `text-left` / `text-right` за `col.align`.
- `user-detail-sheet.tsx`: сесії — `w-full table-auto` замість `w-max`.

## Select / Dropdown / Popover у Sheet і Dialog

- Новий контекст `src/components/ui/overlay-portal-container.tsx`: `OverlayPortalContainerProvider` + `useOverlayPortalContainer` + `mergeRefs`.
- `sheet.tsx` / `dialog.tsx`: `SheetContent` та `DialogContent` на `forwardRef`; ref на корінь контенту + провайдер для нащадків.
- **Портал лишається в document.body** (не всередину sheet — інакше `overflow-hidden` обрізає меню). Замість цього:
  - `SelectContent`, `DropdownMenuContent`, `PopoverContent` передають **`collisionBoundary={[sheetOrDialogRoot]}`** з контексту, якщо не задано явно.
  - `z-[130]` на випадаючих поверх `z-50` оверлею.
  - Select/Popover: **`updatePositionStrategy="always"`** для стабільного оновлення позиції у вкладених скролах.
- Опційний проп `container` на Portal залишено для рідкісних випадків.
