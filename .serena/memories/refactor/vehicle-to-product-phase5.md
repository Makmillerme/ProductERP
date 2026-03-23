# Phase 5: vehicle → product (config, permissions, i18n, parser)

**Дата:** 2025-02-23

## Зміни

### config/permissions.ts
- `vehicles` → `products`, label "Облік товарів"
- `vehicles_config` → `products_config`, label "Налаштування обліку товарів"

### config/product-documents.ts
- Перейменовано `vehicle-documents.ts` → `product-documents.ts`
- ProductDoc, VehicleDoc (@deprecated) залишились
- Імпорт оновлено в product-documents-tab.tsx

### config/api-docs/index.json
- Секція `vehicle-config` → `product-config`
- Paths: `/api/vehicle-config/...` → `/api/product-config/[productTypeId]`, `.../category/[categoryId]`
- Admin endpoint: `vehicle-types` → `product-types`
- titleKeys: vehicleConfig → productConfig, vehicleTypes → productTypes

### config/locales (en.json, uk.json)
- apiDocs.sections.vehicleConfig → productConfig
- apiDocs.vehicleConfig → productConfig (byType, byCategory)
- apiDocs.admin.vehicleTypes → productTypes
- parser.import: "vehicles" → "products" (з підтримкою vehicles для сумісності)

### app/api/admin/parser/import/route.ts
- `mapVehicleData` → `mapProductData`
- `body.vehicles` + `body.products`: підтримка обох ключів для backward compat
- `const items = body.products ?? body.vehicles`

### vmd-parser-config-sheet.tsx
- Приклад: `vehicles` → `products` у IMPORT_EXAMPLE

### lib/query-keys.ts
- `vehicles` → `products`, `vehicle` → `product`

### prisma/seed-product-cms.ts
- Перейменовано `seed-vehicle-cms.ts` → `seed-product-cms.ts`
- Коментарі та лог-повідомлення оновлено

## Міграція БД (role_permissions)

```sql
UPDATE role_permissions SET section_id = 'products' WHERE section_id = 'vehicles';
UPDATE role_permissions SET section_id = 'products_config' WHERE section_id = 'vehicles_config';
```

## Білд

Успішний (`npm run build`).