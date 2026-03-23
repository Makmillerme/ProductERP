# Phase 3: Product.categoryId — завершено

## Дата
2025-02-23

## Що зроблено

### 1. Prisma schema + міграція
- Додано `Product.categoryId` (nullable), FK на Category
- Додано `Category.products` relation
- Міграція `20260306120000_add_product_category_id`

### 2. products-db.ts
- DbProduct: productTypeId, categoryId
- dbToProduct: product_type_id, category_id
- productToCreateInput / productToUpdateInput: productTypeId, categoryId
- buildWhere: фільтр по categoryId — OR (productTypeRef.categoryId, categoryId)

### 3. Product type (features/vehicles/types.ts)
- product_type_id: string | null
- category_id: string | null

### 4. Parser import
- resolveProductType замість resolveProductTypeId — повертає { id, categoryId }
- При імпорті: categoryId з ProductType або body.categoryId (для товарів без типу)

### 5. vehicle-config/category/[categoryId]
- Підтримка категорій без типів: vehicleType: null, category, tabs
- Поля: лише productTypeId: null для категорій без типів
- Фільтрація полів через isFieldAvailableForCategory

### 6. vehicle-config/[vehicleTypeId]
- Фільтрація полів через isFieldAvailableForCategory
- Include fieldDefinitionCategories, fieldDefinitionProductTypes для перевірки доступності

### 7. use-vehicle-config.ts
- VehicleConfigResponse.vehicleType: тепер `| null` для категорій без типів

## Логіка
- Товар з productTypeId → категорія з ProductType.categoryId
- Товар без productTypeId → categoryId напряму (для категорій без типів)
- Фільтр listProducts по categoryId: productTypeRef.categoryId OR categoryId
