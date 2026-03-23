Рефакторинг таблиці обліку товару: прибрано прив'язку до systemColumn.

**Зміни:**
1. **use-list-config.ts**: deriveTableColumnsFromTabs і deriveFilterableFieldsFromTabs — включено ВСІ поля з картки товару, крім media_gallery та file_upload. Column id = systemColumn ?? code ?? fieldDefinition.id. Немає фільтрації за наявністю systemColumn.
2. **products/types.ts**: ProductColumnId розширено до `| string` для динамічних codes.
3. **products-page.tsx**: cell value береться через (row as Record<string, unknown>)[col.id] для підтримки кастомних колонок. formatCell обробляє object-значення.
4. **field-definitions-management.tsx**: Видалено UI блок «Колонка таблиці» (systemColumn). При збереженні полів передається systemColumn: null.

**Результат:** Таблиця динамічно генерується з полів картки. Відображаються всі поля крім галереї та документів. Пошук/фільтр/сортування для кастомних полів (без Product-колонки) поки не підтримуються — API products-db використовує тільки SNAKE_TO_CAMEL.