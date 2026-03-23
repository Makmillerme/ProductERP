# Allow Duplicate Codes (slug) — завершено

## Дата
2025-02-23

## Що зроблено

### 1. Prisma schema
- **Role.code** — прибрано @unique
- **ProductStatus.code** — прибрано @unique
- **Category.code** — прибрано @unique
- **ProductType.code** — прибрано @unique
- **FieldDefinition.code** — прибрано @unique
- **TabDefinition** — прибрано @@unique([categoryId, code]), додано @@index([categoryId, code])

### 2. Міграція 20260307120000_allow_duplicate_codes
- DROP INDEX для roles_code_key, product_statuses_code_key, categories_code_key, product_types_code_key, field_definitions_code_key, tab_definitions_category_id_code_key
- CREATE INDEX для categories_code_idx, product_types_code_idx, field_definitions_code_idx

### 3. API — прибрано перевірки "Code already exists"
- field-definitions: POST, PATCH
- categories: POST, PATCH
- vehicle-types: POST, PATCH
- product-statuses: POST, PATCH
- categories/[id]/tabs: POST (прибрано findUnique categoryId_code)
- roles: POST
- parser/field-mapping: findFirst замість findUnique

### 4. Parser (імпорт VMD)
- **import/route.ts**: findFirst замість findUnique для ProductType code при створенні
- **auto-detect-types/route.ts**: findFirst замість findUnique

### 5. vehicle-config/default
- Вже використовує findFirst — без змін

## Результат
- Кожна категорія може мати типи з однаковим code (наприклад "default")
- Кожен тип може мати поле з однаковим code (наприклад "payload")
- API працює через id для lookups
- Парсер при створенні нового ProductType генерує унікальний code при колізії: `slugify(name)-${Date.now()}`
