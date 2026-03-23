План рефакторингу Product→EAV: повне видалення хардкоду.

**Документ:** docs/plan-product-eav-refactor.md

**EAV:** Entity=Product, Attribute=FieldDefinition, Value=ProductFieldValue. Кожне значення поля товару = рядок ProductFieldValue (productId, fieldDefinitionId, textValue|numericValue|dateValue). Маппінг по dataType: string/boolean/composite→textValue, integer/float→numericValue, date/datetime→dateValue.

**Фази:** 0 підготовка, 1 Prisma schema (видалити польові колонки з Product), 2 products-db+product-field-values service, 3 API products CRUD з EAV, 4 buildWhere/getOrderBy динамічно, 5 Frontend, 6 cleanup (system-columns, SNAKE_TO_CAMEL).

**Product після:** тільки id, productTypeId, categoryId, productStatusId, processedFileId, pdfUrl, briefPdfPath, createdAt + relations. Всі польові дані — в ProductFieldValue.