# План рефакторингу Vehicle → Product (покрокові фази)

**Мета:** Універсалізація термінології — система для будь-якого бізнесу, не лише авто.

**Поточний стан:** Prisma вже використовує Product, ProductType, ProductMedia. API `/api/products` існує. **Фаза 1 виконано** — API product-config, admin/product-types. Залишилось: features/vehicles→products, vehicles-config→products-config, permissions, i18n.

---

## Маппінг перейменувань

| Було | Стане |
|------|-------|
| `/api/vehicle-config/*` | `/api/product-config/*` |
| `/api/admin/vehicle-types/*` | `/api/admin/product-types/*` |
| `[vehicleTypeId]` (route param) | `[productTypeId]` |
| `features/vehicles` | `features/products` |
| `vehicles-config` | `products-config` |
| `vehicle-detail-sheet` | `product-detail-sheet` |
| `vehicle-documents-tab` | `product-documents-tab` |
| `vehicle-media-*` | `product-media-*` |
| `vehicles-page` | `products-page` |
| `use-vehicle-config` | `use-product-config` |
| `vehicle-types-management` | `product-types-management` |
| `delete-vehicle-type-dialog` | `delete-product-type-dialog` |
| `config/vehicle-documents.ts` | `config/product-documents.ts` |
| `seed-vehicle-cms.ts` | `seed-product-cms.ts` |
| `vehicleTypeId` (змінні) | `productTypeId` |
| `VehicleConfigResponse` | `ProductConfigResponse` |
| `VehicleConfigTabField` | `ProductConfigTabField` |
| `vehicles` (permission) | `products` |
| `vehicles_config` (permission) | `products_config` |

---

## Фаза 1: API Routes

**Мета:** Перейменувати API-шляхи. Фронтенд залежить від цих URL.

**Порядок дій:**

1. Створити нові route-файли:
   - `app/api/product-config/[productTypeId]/route.ts` ← копія з `vehicle-config/[vehicleTypeId]`
   - `app/api/product-config/category/[categoryId]/route.ts` ← копія
   - `app/api/product-config/default/route.ts` ← копія
   - `app/api/admin/product-types/route.ts` ← копія
   - `app/api/admin/product-types/[id]/route.ts` ← копія

2. У нових файлах замінити:
   - `vehicleTypeId` → `productTypeId` у params
   - `vehicleType` → `productType` у змінних
   - Логи `[GET /api/vehicle-config/...]` → `[GET /api/product-config/...]`

3. Видалити старі route-файли:
   - `app/api/vehicle-config/` (вся папка)
   - `app/api/admin/vehicle-types/` (вся папка)

**Залежності:**
- Імпорти з `@/features/vehicles/lib/field-utils` — залишаються (шлях зміниться у Фазі 3)

**Валідація:** `npm run build` — пройдено.

**Виконано (2026-02-23):** Створено product-config та admin/product-types routes, оновлено всі fetch URLs на фронті, видалено старі routes. Build успішний.

---

## Фаза 2: Types, Hooks, Fetch URLs ✅

**Мета:** Перейменувати типи, хуки та оновити всі URL у fetch.

**Виконано (2026-02-23):** use-product-config.ts, ProductConfigTab/Field/Response, useProductConfig, ListConfig.productType, API returns productType.

**Файли:**

| Файл | Дії |
|------|-----|
| `features/vehicles/hooks/use-vehicle-config.ts` | Перейменувати → `use-product-config.ts`. `VehicleConfigTab` → `ProductConfigTab`, `VehicleConfigTabField` → `ProductConfigTabField`, `VehicleConfigResponse` → `ProductConfigResponse`, `vehicleConfigKeys` → `productConfigKeys`, `fetchVehicleConfig` → `fetchProductConfig`, `useVehicleConfig` → `useProductConfig`, URL `/api/vehicle-config/` → `/api/product-config/` |
| `features/vehicles/hooks/use-list-config.ts` | Імпорт `VehicleConfigResponse` → `ProductConfigResponse`, URL `/api/vehicle-config/category/` → `/api/product-config/category/` |
| `features/vehicles/components/vehicle-detail-sheet.tsx` | Імпорт `useVehicleConfig` → `useProductConfig`, `VehicleConfigTab` → `ProductConfigTab`, URL `/api/vehicle-config/default` → `/api/product-config/default`, queryKey `vehicle-config` → `product-config` |

**Залежності:**
- `use-product-config.ts` експортується з features/products (після перейменування папки у Фазі 3)
- Потрібно виконати разом з Фазою 1 (API) і Фазою 3 (перейменування папки)

**Валідація:** Після Фаз 1+2+3 — `npm run build`, перевірити catalog page.

---

## Фаза 3: Features folder — vehicles → products ✅

**Мета:** Перейменувати папку та всі компоненти.

**Виконано (2026-02-23):** features/products, ProductsPage, ProductDetailSheet, api.ts, queries.ts, dynamic-field-renderer product prop.

**Порядок дій:**

1. Перейменувати папку: `features/vehicles` → `features/products`

2. Перейменувати файли:
   - `vehicle-detail-sheet.tsx` → `product-detail-sheet.tsx`
   - `vehicle-documents-tab.tsx` → `product-documents-tab.tsx`
   - `vehicle-media-gallery.tsx` → `product-media-gallery.tsx`
   - `vehicle-media-uploader.tsx` → `product-media-uploader.tsx`
   - `vehicle-media-lightbox.tsx` → `product-media-lightbox.tsx`
   - `vehicles-page.tsx` → `products-page.tsx`
   - `use-vehicle-config.ts` → `use-product-config.ts` (або вже зроблено у Фазі 2)

3. Оновити імпорти у `features/products/*`:
   - Внутрішні: `./vehicle-*` → `./product-*`
   - Типи: `VehicleConfigTabField` → `ProductConfigTabField`, `VehicleMediaGallery` → `ProductMediaGallery` тощо

4. Оновити зовнішні імпорти:
   - `app/(app)/catalog/[categoryId]/page.tsx`: `@/features/vehicles` → `@/features/products`, `VehiclesPage` → `ProductsPage`
   - `components/layout/app-header.tsx`: `@/features/vehicles/components/calculator-dialog` → `@/features/products/components/calculator-dialog`
   - `lib/products-db.ts`: `@/features/vehicles/types` → `@/features/products/types`
   - `app/api/products/route.ts`: `@/features/vehicles/types` → `@/features/products/types`
   - `app/api/admin/field-definitions/route.ts`, `[id]/route.ts`: `@/features/vehicles/lib/field-utils` → `@/features/products/lib/field-utils`
   - `lib/validate-preset-values.ts`: `@/features/vehicles/lib/field-utils` → `@/features/products/lib/field-utils`

5. Оновити `features/products/index.ts`: `VehiclesPage` → `ProductsPage`, експорт з `./components/products-page`

6. У `dynamic-field-renderer.tsx` (тепер у products):
   - `VehicleMediaGallery` → `ProductMediaGallery`
   - `VehicleMediaUploader` → `ProductMediaUploader`
   - `VehicleDocumentsTab` → `ProductDocumentsTab`
   - `VehicleConfigTabField` → `ProductConfigTabField`
   - `uploadVehicleMedia` → `uploadProductMedia`
   - `deleteVehicleMedia` → `deleteProductMedia`
   - Змінні `vehicle` → `product`, `vehicleId` → `productId`, `vehicleKey` → `productKey` (опційно, для консистентності)

7. У `api.ts` (features/products/api.ts):
   - `ListVehiclesQuery` → `ListProductsQuery`
   - `ListVehiclesResponse` → `ListProductsResponse`
   - `fetchVehicles` → `fetchProducts`
   - `fetchVehicleById` → `fetchProductById`
   - `createVehicle` → `createProduct`
   - `updateVehicle` → `updateProduct`
   - `deleteVehicle` → `deleteProduct`
   - `uploadVehicleMedia` → `uploadProductMedia`
   - `deleteVehicleMedia` → `deleteProductMedia`
   - `VehicleMediaCreated` → `ProductMediaCreated`

8. Оновити всі виклики цих функцій у `products-page.tsx`, `product-detail-sheet.tsx`, `dynamic-field-renderer.tsx`, `queries.ts`

**Валідація:** `npm run build`, відкрити catalog, перевірити відкриття картки товару.

---

## Фаза 4: Management — vehicles-config → products-config ✅

**Мета:** Перейменувати папку конфігурації та компоненти.

**Виконано (2026-02-23):** products-config, ProductTypesManagement, DeleteProductTypeDialog, ProductsConfig, ProductTypeItem.

**Порядок дій:**

1. Перейменувати папку: `features/management/components/vehicles-config` → `products-config`

2. Перейменувати файли:
   - `vehicle-types-management.tsx` → `product-types-management.tsx`
   - `delete-vehicle-type-dialog.tsx` → `delete-product-type-dialog.tsx`
   - `vehicles-config.tsx` → `products-config.tsx`

3. У `product-types-management.tsx`:
   - `VehicleTypesManagement` → `ProductTypesManagement`
   - `DeleteVehicleTypeDialog` → `DeleteProductTypeDialog`
   - `VehicleTypeItem` → `ProductTypeItem`
   - `VEHICLE_TYPES_KEY` → `PRODUCT_TYPES_KEY` = `["admin", "product-types"]`
   - URL `/api/admin/vehicle-types` → `/api/admin/product-types`
   - `fetchVehicleTypes` → `fetchProductTypes`, `createVehicleType` → `createProductType` тощо
   - `vehicleType` → `productType` у змінних
   - `vehicleTypes` → `productTypes`

4. У `delete-product-type-dialog.tsx`:
   - `DeleteVehicleTypeDialog` → `DeleteProductTypeDialog`
   - `vehicleType` prop → `productType`
   - `vehiclesCount` залишається (це кількість продуктів)

5. У `categories-management.tsx`:
   - Імпорт `DeleteVehicleTypeDialog` → `DeleteProductTypeDialog`
   - `VehicleTypeItem` → `ProductTypeItem`
   - `VEHICLE_TYPES_KEY` → `PRODUCT_TYPES_KEY`
   - URL `/api/admin/vehicle-types` → `/api/admin/product-types`
   - `fetchVehicleTypes` → `fetchProductTypes` тощо
   - `requestDeleteVehicleType` → `requestDeleteProductType`
   - `vt` (vehicle type) → `pt` або залишити `vt` як shorthand

6. У `tabs-config-management.tsx`:
   - URL `/api/admin/vehicle-types` → `/api/admin/product-types`
   - `queryKey` `["admin", "vehicle-types"]` → `["admin", "product-types"]`
   - `vehicleTypes` → `productTypes`
   - Імпорт `isFieldAvailableForCategory` з `@/features/products/lib/field-utils`

7. У `field-definitions-management.tsx`:
   - `VEHICLE_TYPES_KEY` → `PRODUCT_TYPES_KEY`
   - URL `/api/admin/vehicle-types` → `/api/admin/product-types`
   - Імпорт з `@/features/products/lib/field-utils`

8. У `products-config.tsx` (було vehicles-config.tsx):
   - `VehicleTypesManagement` → `ProductTypesManagement`

9. У `data-model-page.tsx`:
   - Імпорти з `./products-config/` замість `./vehicles-config/`
   - `VEHICLE_TYPES_KEY` → `PRODUCT_TYPES_KEY`
   - URL `/api/admin/vehicle-types` → `/api/admin/product-types`

10. У `management-page.tsx`:
    - `VehiclesConfig` → `ProductsConfig`
    - Імпорт з `./products-config`

11. У `products-config/index.ts`:
    - `VehiclesConfig` → `ProductsConfig`
    - Експорт з `./products-config` (файл)

12. Оновити `types.ts` у products-config (якщо є): `VehicleTypeItem` → `ProductTypeItem`

**Валідація:** `npm run build`, відкрити Management → Data Model, перевірити типи товарів, категорії, таби.

---

## Фаза 5: Config, Permissions, i18n

**Мета:** Оновити конфіг, права та локалізацію. (Parser видалено з проекту.)

**Порядок дій:**

1. **config/permissions.ts**
   - `vehicles` → `products`, label "Облік авто" → "Облік товарів"
   - `vehicles_config` → `products_config`, label "Налаштування обліку авто" → "Налаштування обліку товарів"

2. **config/vehicle-documents.ts** → **config/product-documents.ts**
   - Перейменувати файл
   - Видалити `VehicleDoc` deprecated alias або залишити як `export type VehicleDoc = ProductDoc` для backward compat
   - Оновити імпорт у `product-documents-tab.tsx`: `@/config/product-documents`

3. **config/api-docs/index.json**
   - `vehicle-config` → `product-config`
   - paths `/api/vehicle-config/...` → `/api/product-config/...`
   - `/api/admin/vehicle-types` → `/api/admin/product-types`

4. **config/locales/en.json, uk.json**
   - `apiDocs.sections.vehicleConfig` → `productConfig`
   - `apiDocs.vehicleConfig` → `apiDocs.productConfig`
   - `apiDocs.admin.vehicleTypes` → `apiDocs.admin.productTypes`
   - `layout.routes.kanban` "Vehicle registry" → "Product registry" / "Реєстр товарів"
   - Інші ключі vehicleConfig, vehicleTypes — оновити на productConfig, productTypes

5. ~~**app/api/admin/parser/import**~~ — видалено (parser не входить у проект)

6. **prisma/seed-vehicle-cms.ts** → **prisma/seed-product-cms.ts**
   - Перейменувати файл
   - Оновити коментарі VehicleType → ProductType
   - Перевірити package.json scripts: `seed-vehicle-cms` → `seed-product-cms`

7. ~~**vmd-parser-config-sheet**~~ — видалено

8. **lib/query-keys.ts**
   - `vehicles` → `products`, `vehicle` → `product`

9. **features/products/queries.ts** (після Фази 3)
   - `vehiclesKeys` → `productsKeys`
   - `ListVehiclesQuery` → `ListProductsQuery` (якщо ще не змінено в api.ts)
   - Коментар "vehicles" → "products"

**Валідація:** `npm run build`, перевірити Management → Roles (права products/products_config), API docs.

---

## Фаза 6: Фінальна перевірка та cleanup

**Мета:** Переконатися, що не залишилось посилань на vehicle.

**Порядок дій:**

1. Grep по всьому `nextjs_vmd/src`:
   ```
   vehicle|Vehicle|vehicleType|vehicleTypes|vehicle-config|vehicle-types
   ```
   Виключити: VehicleDoc (deprecated alias), vehicle_type (поле в парсері snake_case), коментарі "авто" в UI-текстах.

2. Оновити тести:
   - `features/products/lib/field-utils.test.ts` — шлях змінився з vehicles на products

3. Записати в Serena:
   - Підсумок рефакторингу
   - Новий маппінг термінології
   - Breaking changes (якщо були)

**Валідація:** `npm run build`, `npm test` (якщо є), ручна перевірка основних flow.

---

## Діаграма залежностей фаз

```
Фаза 1 (API Routes) ──┬──> Фаза 2 (Types, Hooks, URLs)
                      │
                      └──> Фаза 3 (features/products)
                                    │
                                    └──> Фаза 4 (products-config)
                                                  │
                                                  └──> Фаза 5 (Config, Permissions, i18n)
                                                                    │
                                                                    └──> Фаза 6 (Validation)
```

**Рекомендований порядок:** 1 → 2 → 3 → 4 → 5 → 6 (строго послідовно).

**Альтернатива:** Фази 1+2+3 виконати одним комітом (API + types + folder rename), щоб уникнути проміжного стану з поламаним build.

---

## Міграція БД для permissions

Після зміни `config/permissions.ts` (Фаза 5) потрібно оновити існуючі записи в `role_permissions`:

```sql
-- Міграція: vehicles → products, vehicles_config → products_config
UPDATE role_permissions SET section_id = 'products' WHERE section_id = 'vehicles';
UPDATE role_permissions SET section_id = 'products_config' WHERE section_id = 'vehicles_config';
```

Створити файл `prisma/migrations/YYYYMMDD_permissions_vehicle_to_product/migration.sql` або додати до ручної міграції.

---

## Ризики

| Ризик | Мітигація |
|-------|-----------|
| Парсер надсилає `vehicles` | Підтримати обидва ключі (vehicles/products) у import route або узгодити з клієнтом парсера |
| Ролі в БД: section_id vehicles/vehicles_config | SQL міграція (див. вище) |
| Зовнішні закладки/URL | API docs оновлені; якщо є зовнішні інтеграції — повідомити про breaking change |

---

## Чеклист після кожної фази

- [ ] `npm run build` проходить
- [ ] Немає червоних імпортів у IDE
- [ ] TypeScript без помилок
- [ ] (Фаза 3+) Catalog page відкривається
- [ ] (Фаза 4+) Management → Data Model працює
- [ ] (Фаза 5+) Permissions, API docs перевірені
