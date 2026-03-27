## P2022 при `tabDefinition.findMany` + `include.fields`

Помилка «The column (not available) does not exist» у `GET /api/product-config/category/[categoryId]` виникала, бо в БД не було колонки **`tab_fields.stretch_in_row`** (модель `TabField.stretchInRow`), тоді як Prisma-клієнт очікував її через `include.fields`.

**Виправлення:** застосувати міграцію `20260325120000_add_tab_field_stretch_in_row` (`ALTER TABLE tab_fields ADD COLUMN stretch_in_row ...`). Локально: `npx prisma migrate deploy` (або `migrate dev` у розробці).

Після деплою міграцій ендпоінт має відповідати 200 без P2022.
