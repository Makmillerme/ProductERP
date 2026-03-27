## Sheet tabs (product card & user detail)

### ScrollableTabsList (fix overlay + scroll-end flicker 2025-03)
- Кнопки **не absolute**: flex-ряд `[ w-8 кнопка | flex-1 min-w-0 скрол | w-8 кнопка ]`, таби не перекриваються.
- При `hasOverflow` колонки завжди **w-8**; на кінцях скролу кнопки **disabled**, а не зникають — ширина viewport скролу не стрибає.
- `EDGE_EPS=2`, `ResizeObserver` + `rAF`, слухач **`scrollend`** для оновлення після smooth scroll.
- Клік вправо біля кінця підкручує до `maxScroll`.
- Якщо overflow немає — бокові колонки `w-0 overflow-hidden pointer-events-none`.

- `src/config/sheet.ts`: `SHEET_TAB_TRIGGER_CLASS` — `overflow-visible` (не `hidden`), щоб не обрізати `::after` лінії варіанту line; обрізання тексту лише в inner `span.truncate`. Скрол-зона в `ScrollableTabsList`: `pb-1.5`, без `overflow-y-hidden`, щоб смужка під табом була видима.
- `product-detail-sheet.tsx` / `user-detail-sheet.tsx`: тригери з `SHEET_TAB_TRIGGER_CLASS`.
