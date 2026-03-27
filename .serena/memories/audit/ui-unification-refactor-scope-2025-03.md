## Оцінка проєкту nextjs_vmd (уніфікація UI / рефакторинг)

### Вже централізовано
- i18n: JSON + generate:locales + useLocale
- shadcn: components/ui (button, sheet, dialog, alert-dialog, table, input, select, calendar, …) — набір не повний vs «ідеальний» стек (немає form.tsx)
- Sheet: config/sheet.ts + SheetFormLayout
- Таблиці-обгортка: TableWithPagination — лише border + слот пагінації, без логіки
- nuqs: таби на management/products/settings/api-integrations/data-model; products-page — view + pageSize в URL
- Toolbar management: частково вирівняно (док. ui/unified-management-toolbar-structure)

### Дублювання / пріоритети рефакторингу
1. **Пагінація списків** — одна й та ж розмітка (Chevron/Chevrons, page input, page size Dropdown) скопійована у field-definitions-management, statuses-management, tabs-config-management, users-management, products-page; різні PAGE_SIZES ([10,20,50] vs розширений набір на products). → Компонент типу `TablePaginationBar` + опції `pageSizes`, i18n.
2. **Таблиці** — немає @tanstack/react-table у залежностях; усі таблиці — ручний map по даних. Для сортування/колонок/фільтрів на рівні таблиці майбутній крок — спільний DataTable або легкий хук; зараз найбільший ROI — пагінація + empty/loading рядки.
3. **Форми** — у package.json немає react-hook-form і zod; форми на useState + ручна валідація в sheet’ах. Це розходиться з цільовим стеком; поетапне впровадження RHF+Zod+shadcn Form для нових/важких форм.
4. **Підтвердження видалення** — багато AlertDialog «на місці» + частина окремих *Dialog; можна узгодити один `ConfirmDialog` (props: title, description, onConfirm, loading) + спільні ключі common.*
5. **API в management** — повторювані fetch-функції в кожному файлі (categories-management, …). Шар `lib/api/admin/*` або клієнт з типами зменшить копіпасту.
6. **Великі файли** — products-page, field-definitions-management, statuses-management тощо: варто дробити на підкомпоненти/хуки (окремо від «дизайн-системи»).

### Фаза 1 (виконано)
- Додано `src/components/table-pagination-bar.tsx` (`TablePaginationBar`): спільні кнопки first/prev/номер сторінки/next/last + rows-per-page; i18n `common.pagination.*`; опції `isReady`/`isLoading` для products-page (hydration + loading).
- Підключено замість дубльованого JSX у: `statuses-management`, `field-definitions-management`, `tabs-config-management`, `users-management`, `products-page`.

### Фаза 2 (виконано)
- `src/components/confirm-destructive-dialog.tsx`: уніфікований AlertDialog (title, description, optional children + errorMessage, cancel/confirm labels, confirmPending, confirmTone destructive|default, preventDefault on confirm).
- Міграція: delete-category / delete-product-type / delete-user / unban / ban (children + форма), field-grid-editor, product-documents-tab, product-detail-sheet, product-card-preview-modal, composite-subfields-editor, product-media-lightbox, user-detail-sheet (transfer), tabs-config (delete tab), field-definitions (data type change, tone default).

### Фаза 3 (виконано)
- `src/lib/api/admin/client.ts`: `adminApiPath`, `adminFetch`, `parseAdminErrorMessage`, `adminGetJson`, `adminMutationJson` (POST/PUT/PATCH/DELETE; для DELETE без body).
- `src/lib/api/admin/catalog.ts`: `fetchAdminCategories`, `fetchAdminProductTypes(loadFailedKey?)`.
- Management-компоненти переведені з прямого fetch на `/api/admin` через клієнт: data-model-page, display-*, tabs-config, field-definitions, categories, product-types, statuses, user-detail-sheet, product-card-preview-modal (тип `PreviewTabDetail` для `adminGetJson`).
- У `src/features/management` немає залишкових прямих викликів fetch на `/api/admin` у компонентах (перевірка grep).

### Фаза 4 (виконано)
- `src/components/management-list-states.tsx`: `ManagementListLoading` (центрований спінер, опційно `screenReaderText`) та `TableEmptyMessageRow` (єдиний порожній рядок таблиці з `colSpan`).
- Підключено в: field-definitions-management, product-types-management, statuses-management, tabs-config-management, categories-management (лише завантаження дерева), users-management + users-table, roles-management + roles-table, **products-page** (рядок завантаження таблиці), **product-documents-tab** (завантаження списку документів).
- П.2 аудиту (empty/loading для списків): пагінація вже була у фазі 1; у фазі 4 уніфіковано саме стани завантаження та порожньої таблиці.

### Пілот форм (після фази 4)
- Залежності: `react-hook-form`, `zod`, `@hookform/resolvers`; shadcn **Form** (`src/components/ui/form.tsx`).
- Міграції форм: **product-types-management** (назва + опис), **statuses-management** (назва, колір, порядок, опис, default) — Zod + `FormField` + submit.

### Ризики
- Не вводити «одну таблицю на все» одним MR; міграція ітераціями (спочатку pagination bar + confirm).
- TanStack Table — лише якщо з’являться складні таблиці (sort multi-column, column resize); інакше залишити простий Table.
