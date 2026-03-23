Phase 4 EAV: динамічний пошук та фільтрація.

**buildWhere (products-db):**
- search + searchableFieldCodes: пошук по textValue в ProductFieldValue де fieldDefinition.code IN codes, contains + insensitive
- filter по EAV: code_from/code_to → numericValue gte/lte; code → textValue contains. product_status_id/product_type_id лишаються базовими.

**API GET /api/products:**
- Параметри search, searchableFields (comma-separated codes) повернені та передаються в listProducts.

**ListProductsParams:** search, searchableFieldCodes додано.

**Сортування по полю EAV:** відкладено (Prisma не підтримує orderBy по one-to-many). sortKey=created_at|id працює; для field code — fallback на createdAt.

**product-field-values:** getFieldDefinitionByCode додано для майбутнього sort by field.