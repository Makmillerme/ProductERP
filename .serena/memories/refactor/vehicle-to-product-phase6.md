# Phase 6: Final validation and cleanup

**Дата:** 2025-02-23

## SQL міграція (виконано)

`prisma/migrations/20250223190000_permissions_vehicle_to_product/migration.sql`:
- UPDATE role_permissions SET section_id = 'products' WHERE section_id = 'vehicles';
- UPDATE role_permissions SET section_id = 'products_config' WHERE section_id = 'vehicles_config';

## Phase 6 зміни

### management-page.tsx
- MANAGEMENT_TABS: vehicles → products
- Tab value "vehicles" → "products", label "Облік авто" → "Облік товарів"
- Backward compat: parse tab=vehicles → products, sessionStorage "vehicles" → "products"

### locales (en.json, uk.json)
- layout.routes.kanban: "Vehicle registry" → "Product registry", "Облік авто" → "Облік товарів"

### products-config
- vehiclesCount → productsCount (delete-product-type-dialog, product-types-management, categories-management)
- pendingDeleteVt.vehiclesCount → productsCount
- requestDeleteVehicleType → requestDeleteProductType
- allVehicleTypes → allProductTypes (data-model-page, categories-management)
- Коментарі: VehicleType → ProductType

### product-detail-sheet
- Prop vehicle → product
- requestedVehicleIdRef → requestedProductIdRef

### products-page
- VISIBLE_COLUMNS_STORAGE_KEY: "vehicles-table-visible-columns" → "products-table-visible-columns"
- VehiclesTableClient → ProductsTableClient, VehiclesTableView → ProductsTableView
- selectedVehicle → selectedProduct

### API fallbacks
- data?.vehicleTypes → data?.productTypes ?? data?.vehicleTypes (tabs-config, product-types-management, field-definitions-management, data-model-page, categories-management)

### field-utils.test.ts
- "substitutes slugs with vehicle values" → "product values"

## Залишені vehicle (навмисно)

- vehicle_type (snake_case поле парсера)
- VehicleDoc (@deprecated alias)
- body.vehicles (backward compat у parser import)
- VehicleStatusOption, VehicleConditionOption, VehicleTransmissionOption (constants.ts — доменні enum)
- formula-editor: testVehicle (внутрішня змінна)
- field-utils: vehicleTypes param у filterProductTypeIdsForCategory, vehicle param у evaluateFormula
