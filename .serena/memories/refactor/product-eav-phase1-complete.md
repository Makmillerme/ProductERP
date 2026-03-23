Phase 1 EAV refactor виконано (2026-03-23).

**Prisma schema:** Product залишено тільки з id, productTypeId, categoryId, productStatusId, processedFileId, pdfUrl, briefPdfPath, createdAt. Видалено всі польові колонки (vin, brand, model, description, mrn, payload_json тощо).

**Міграція:** 20260323120200_product_eav_remove_field_columns — TRUNCATE products CASCADE, DROP COLUMN для 32 колонок.

**Наступний крок:** Phase 2 — products-db, product-field-values service, Product type. Код зараз зламаний (references до видалених колонок).