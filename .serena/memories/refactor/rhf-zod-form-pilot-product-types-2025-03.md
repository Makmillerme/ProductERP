## Пілот RHF + Zod + shadcn Form

**Дата:** 2025-03-25

### Залежності
- `react-hook-form`, `zod`, `@hookform/resolvers` (npm).
- `npx shadcn add @shadcn/form --overwrite` → `src/components/ui/form.tsx` (оновлення `button.tsx` з CLI).

### Пілот
- `product-types-management.tsx`: sheet типу продукту (назва, опис).
- `statuses-management.tsx`: sheet статусу (назва, колір hex, порядок `z.number().int()`, опис, прапорець «за замовчуванням»); колір — прихований native picker + текстове поле в одному `FormField`; `statusFormDefaults()` для create/close з `order: total`.

### Патерн для наступних форм
- Схема Zod у `useMemo([t])` для локалізованих повідомлень.
- `form.reset` у `openForCreate` / `openForEdit` / `closeSheet`.

### Перевірки
- `tsc`, eslint на змінених файлах — OK.
