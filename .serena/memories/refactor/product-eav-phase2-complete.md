Phase 2 EAV рефакторинг завершено.

**Нові файли:**
- `src/lib/product-field-values.ts` — сервіс EAV: `upsertProductFieldValues`, `loadProductFieldValues`, `getFieldDefinitionsForCategory`, `findProductIdByFieldValue`

**Оновлені файли:**
- `src/features/products/types.ts` — Product лише базові поля (id, processed_file_id, pdf_url, brief_pdf_path, product_status_id, product_type_id, category_id, created_at, media) + Record<string, unknown> для динамічних полів
- `src/lib/products-db.ts` — повна переробка: DbProduct тільки актуальні колонки Prisma, dbToProduct обʼєднує Product + fieldValues, createProduct/updateProduct через upsertProductFieldValues, listProducts/getProductById include fieldValues, buildWhere — categoryId/productStatusId/productTypeId, getOrderBy — createdAt/id
- `src/app/api/products/route.ts` — GET без search/searchableFields (Phase 4), POST без payload_json
- `src/app/api/products/[id]/route.ts` — без змін логіки (передає data в updateProduct)
- `src/features/products/components/product-detail-sheet.tsx` — EMPTY_EDIT без хардкод-полів
- `src/features/products/components/dynamic-field-renderer.tsx` — cargo_dimensions: String(...) для сумісності з Record<string, unknown>
- `src/app/api/admin/parser/import/route.ts` — використовує createProduct/updateProduct, findProductIdByFieldValue для mrn/vin, fieldValues з snake_case codes

**Ключові зміни:**
- Усі польові дані зберігаються в ProductFieldValue (EAV)
- Field definitions беруться з табів категорії (getFieldDefinitionsForCategory)
- Маппінг dataType: string/boolean/composite → textValue, integer/float → numericValue, date/datetime → dateValue
- Пошук по полях картки відкладено до Phase 4