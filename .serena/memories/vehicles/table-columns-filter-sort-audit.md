# Аудит: стовпці таблиці, фільтр, сортування — зв'язок з полями картки

## Поточний стан (перевірено через Serena)

### 1. Стовпці таблиці — ЧАСТКОВО з моделі даних

**Джерело:** `use-list-config.ts` → `deriveTableColumnsFromTabs(data.tabs)`
- Поля: `tabs[].fields[]` де `fieldDefinition.systemColumn != null`
- Джерело: TabField → FieldDefinition (модель даних)
- **Проблема:** `listConfig?.tableColumns?.length` — якщо 0 порожній fallback на `PRODUCT_COLUMNS` (хардкод)

**Fallback:** `types.ts` → `PRODUCT_COLUMNS` — 25+ рядків з фіксованими id, label, dataType. Не з моделі даних.

### 2. Фільтр — ПОВНІСТЮ хардкод

**types.ts:** `ProductFilterState` — фіксовані ключі: product_type, brand, model, year_from, year_to, value_from, value_to

**vehicles-page.tsx:** Dialog фільтра — захардкоджені поля:
- Тип транспорту (filter-type)
- Марка (filter-brand)
- Модель (filter-model)
- Рік від/до (filter-year-from/to)
- Вартість від/до (filter-value-from/to)

**api.ts:** params.set("filter_product_type", ...) — фіксовані ключі

**products-db.ts:** `buildWhere` — hardcoded filter.product_type, filter.brand, filter.model, filter.year_from/to. value_from/to — in-memory filter.

**app/api/products/route.ts:** searchParams.get("filter_product_type") — фіксовані ключі

### 3. Сортування — ЧАСТКОВО з моделі даних

**vehicles-page.tsx:** `sortOptions = tableColumnsSource.map(...)` — береться з config (tableColumnsSource)

**products-db.ts:** `SORT_KEYS` — масив захардкоджених ProductColumnId. `getOrderBy` — map захардкоджений. API приймає sortKey, але products-db валідує проти SORT_KEYS.

### 4. Пошук — захардкод

**products-db.ts:** `buildWhere` search: OR по mrn, vin, serialNumber, brand, model — фіксовані колонки.

## Зв'язок з полями картки

- Картка: VehicleDetailSheet → useVehicleConfig(vehicleTypeId) → tabs[].fields[] → DynamicFieldRenderer
- Поля картки = TabField з systemColumn (system columns) або EAV (custom)
- useListConfig бере ті самі tabs[].fields[] і дерить tableColumns з них
- **Висновок:** таблиця вже використовує поля з картки, але fallback PRODUCT_COLUMNS і фільтр/сортування/пошук — хардкод

## Що потрібно зробити

1. Стовпці: прибрати fallback PRODUCT_COLUMNS або зробити його мінімальним (id, created_at). Якщо listConfig пустий — показувати порожню таблицю або повідомлення.
2. Фільтр: UI з listConfig.filterableFields, API/products-db — динамічний filter_*.
3. Сортування: products-db — приймати будь-який sortKey з tableColumns (не SORT_KEYS).
4. Пошук: products-db — динамічні колонки з listConfig.searchableFieldCodes.