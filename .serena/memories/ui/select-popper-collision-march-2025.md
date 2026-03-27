## Select (shadcn `src/components/ui/select.tsx`)

- **Зміни (2025-03-25):** `SelectContent` за замовчуванням `position="popper"` (Radix Popper + flip при колізіях), `collisionPadding={8}`, `avoidCollisions={true}`.
- **Viewport:** прибрано `h-[var(--radix-select-trigger-height)]` у режимі popper — воно стискало список до висоти тригера й давало зайві scroll-кнопки/обрізання тексту. Залишено `min-w-[var(--radix-select-trigger-width)]` + `w-full`.
- **SelectField:** зайве `position="popper"` прибрано (тепер дефолт).

## PATCH `/api/admin/tabs/[id]` — `stretchInRow`

- У `schema.prisma` у `TabField` є `stretchInRow`; `TabFieldCreateManyInput` у `src/generated/prisma/models/TabField.ts` містить це поле.
- Помика `Unknown argument stretchInRow` зазвичай від **застарілого бандлу** після змін схеми: виконати `npx prisma generate`, за потреби видалити `.next` і перезапустити dev. Міграція БД має додати колонку `stretch_in_row`.
