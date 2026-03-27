# План рефакторингу Vehicle → Product

**Мета:** Універсалізація домену — замість «авто» використовувати «товар» для підтримки різних галузей.

---

## Фаза 1: Prisma Schema + Migration

**Обсяг:** Схема БД, міграція, генерація клієнта.

| Дія | Деталі |
|-----|--------|
| Vehicle → Product | model Product, @@map("products") |
| VehicleMedia → ProductMedia | vehicleId → productId, @@map("product_media") |
| VehicleDocument → ProductDocument | vehicleId → productId, @@map("product_documents") |
| VehicleType → ProductType | vehicles → products, @@map("product_types") |
| VehicleFieldValue → ProductFieldValue | vehicleId → productId, @@map("product_field_values") |
| TabField | vehicleTypeId → productTypeId, vehicleType → productType |
| Category | vehicleTypes → productTypes |

**Колонки в Product:** vehicleTypeId → productTypeId, vehicleTypeRef → productTypeRef.

**Міграція:** `npx prisma migrate dev --name vehicle_to_product` — перейменує таблиці та колонки.

**Ризики:** Потрібен бекуп БД. Seed-скрипти оновлюються окремо.

---

## Фаза 2: Lib, Types, API Routes

**Обсяг:** `vehicles-db.ts` → `products-db.ts`, типи Vehicle → Product, API.

| Файл/область | Зміни |
|--------------|-------|
| src/lib/vehicles-db.ts | Перейменувати → products-db.ts, Vehicle → Product |
| src/lib/vehicle-media-upload.ts | → product-media-upload.ts |
| src/lib/vehicle-document-upload.ts | → product-document-upload.ts |
| src/features/vehicles/types.ts | Vehicle → Product, VehicleMedia → ProductMedia, VehicleColumnId → ProductColumnId |
| src/app/api/vehicles/* | → api/products/* |
| src/app/api/vehicle-config/* | → api/product-config/* |
| src/app/api/admin/vehicle-types/* | → api/admin/product-types/* |

**Експорти:** Оновити index, re-exports.

---

## Фаза 3: Features (vehicles → products)

**Обсяг:** Папка features/vehicles → features/products, компоненти, хуки.

| Папка/файл | Зміни |
|------------|-------|
| features/vehicles/ | → features/products/ |
| vehicles-page.tsx | → products-page.tsx |
| vehicle-detail-sheet.tsx | → product-detail-sheet.tsx |
| vehicle-media-*.tsx | → product-media-*.tsx |
| vehicle-documents-tab.tsx | → product-documents-tab.tsx |
| use-vehicle-config.ts | → use-product-config.ts |
| vehicles-config/ | → products-config/ (або залишити vehicles-config як конфіг картки) |
| vehicle-types-management | → product-types-management |

**Роути:** catalog/[categoryId], kanban — оновити імпорти.

---

## Фаза 4: UI Labels, i18n

**Обсяг:** Тексти в інтерфейсі, локалізація.

| Ключ/текст | Було | Стане |
|------------|------|-------|
| layout.nav.productCatalog | Облік товару | (вже є) |
| layout.routes.kanban | Облік авто | Облік товару |
| Різні "авто", "картка авто" | — | товар, картка товару |
| uk.json, en.json | Додати/оновити ключі product.* | |

---

## Фаза 5: Cleanup, Navigation, Config

**Обсяг:** Фінальні правки, permissions, query-keys.

| Область | Зміни |
|---------|-------|
| config/permissions.ts | vehicles → products |
| lib/query-keys.ts | vehiclesKeys → productsKeys |
| config/navigation.ts | Перевірити |
| Parser import | cargoDimensions та інші vehicle-специфічні поля — залишити (це дані), але API/UI — product |
| Seed | prisma/seed-vehicle-cms.ts → seed-product-cms.ts або оновити |

---

## Порядок виконання

1. **Фаза 1** — schema + migrate + prisma generate
2. **Фаза 2** — lib, types, API (build має пройти)
3. **Фаза 3** — features (перейменування папок/файлів, імпорти)
4. **Фаза 4** — i18n, UI-тексти
5. **Фаза 5** — cleanup, seed, тести

**Перевірка після кожної фази:** `npm run build`, перевірка основних flow.

---

## Виконання

### Фаза 1 (виконано)
- Prisma schema оновлено: Product, ProductType, ProductMedia, ProductDocument, ProductFieldValue
- Міграція створена: `prisma/migrations/20260224000000_vehicle_to_product/migration.sql`
- Prisma client згенеровано

**Перед застосуванням міграції:** Якщо є drift, виконати `npx prisma migrate reset` (втрата даних) або вирішити drift вручну. Потім `npx prisma migrate deploy`.

### Фаза 2 (виконано)
- `src/lib/products-db.ts` — Prisma Product/ProductMedia, listProducts, getProductById, createProduct, updateProduct, deleteProduct, createProductMedia, deleteProductMediaById
- `src/lib/product-media-upload.ts`, `src/lib/product-document-upload.ts` — шляхи `/uploads/products/{id}/`
- `src/app/api/products/*` — GET/POST list, GET/PATCH/DELETE [id], media, documents
- Видалено: `vehicles-db.ts`, `vehicle-media-upload.ts`, `vehicle-document-upload.ts`, `api/vehicles/*`
- `src/features/vehicles/types.ts` — Product, ProductMedia, ProductFilterState (product_type), ProductColumnId, PRODUCT_COLUMNS
- `src/features/vehicles/api.ts` — BASE `/api/products`, filter_product_type
- `src/features/vehicles/queries.ts`, `vehicles-page.tsx`, `vehicle-detail-sheet.tsx`, `dynamic-field-renderer.tsx` — Product типи
- `vehicle-documents-tab.tsx` — `/api/products/{id}/documents`, ProductDoc
- `config/vehicle-documents.ts` — ProductDoc (productId), VehicleDoc deprecated alias
- API admin: vehicle-types → prisma.productType, categories _count.productTypes, tabs productTypeId
- Build пройшов успішно
