# Видалення таба Відображення

**Дата:** 2025-02-23

## Що зроблено

1. **data-model-page.tsx** — видалено таб `display` з `DATA_MODEL_TABS` та `TAB_LABELS`, прибрано `TabsContent` для display, видалено імпорт `RoleDisplayConfigManagement`.

2. **vehicles-config.tsx** — видалено таб `display` з `VCONFIG_TABS` та `TAB_LABELS`, прибрано `TabsContent` для display, видалено імпорт `RoleDisplayConfigManagement`.

3. **role-display-config-management.tsx** — файл видалено.

4. **vehicles-config/index.ts** — прибрано експорт `RoleDisplayConfigManagement`.

5. **API /api/admin/role-display-config** — route.ts видалено.

6. **API /api/vehicle-config/[vehicleTypeId]** — прибрано логіку отримання `displayConfig` з БД та фільтрації tabs/fields. Тепер завжди повертаються всі таби без фільтрації, `displayConfig: null`.

7. **management-state.ts** — оновлено коментар для `dataModelTab`: statuses | categories | data | card (без display).

## Що залишилось

- Модель `DisplayConfig` у Prisma schema — залишена для майбутньої реалізації в картці товару.
- `scripts/clear-db-except-users.ts` — продовжує видаляти displayConfig при db:clear.

## Примітка

Функціонал відображення буде реалізовано пізніше в картці товару.