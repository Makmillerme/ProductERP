## Фаза 4 уніфікації UI: empty / loading для management

**Дата:** 2025-03-25

### Файли
- `src/components/management-list-states.tsx` — `ManagementListLoading`, `TableEmptyMessageRow`.

### Споживачі
- products-config: field-definitions, product-types, statuses, tabs-config, categories (тільки loader).
- users-management (loader) + users-table (empty row).
- roles-management (loader) + roles-table (empty row).
- products: `products-page` (рядок завантаження таблиці), `product-documents-tab` (перший fetch документів).

### Залежності (пілот форм)
- Додано `react-hook-form`, `zod`, `@hookform/resolvers`; shadcn `@shadcn/form` → `src/components/ui/form.tsx`.

### Перевірки
- `npx tsc --noEmit`, eslint на змінених файлах — OK.

### Далі (не в рамках фази)
- TanStack Table / DataTable; розширення RHF+Zod на інші sheet’и (див. `refactor/rhf-zod-form-pilot-product-types-2025-03`); порожні стани поза таблицями (напр. categories bordered empty) за потреби окремим патерном.
