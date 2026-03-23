# План рефакторингу: Product → EAV, видалення хардкоду

**Дата:** 2025-02-23  
**Статус:** Phase 1–6 виконано (2026-03-23). EAV рефакторинг завершено.  
**Ціль:** Повністю динамічна CMS без фіксованих полів у Product.

---

## 1. Що таке EAV (Entity-Attribute-Value)

### 1.1 Концепція

**EAV** — патерн зберігання сутностей з довільною кількістю атрибутів без зміни схеми БД.

| Термін | Значення в нашій системі |
|--------|--------------------------|
| **Entity** | Товар (Product) — головна сутність |
| **Attribute** | Визначення поля (FieldDefinition) — code, dataType, widgetType |
| **Value** | Значення поля для конкретного товару (ProductFieldValue) |

Класична таблиця:
```
products: id | vin | brand | model | description | ...
```

EAV-подібна структура:
```
products:              id | productTypeId | categoryId | createdAt | ...
product_field_values:  id | productId | fieldDefinitionId | textValue | numericValue | dateValue
field_definitions:    id | code | label | dataType | widgetType | ...
```

**Як це працює:**
- Кожен рядок `ProductFieldValue` = одне значення одного поля одного товару
- `fieldDefinitionId` вказує на атрибут (поле з моделі даних)
- Тип даних визначає, яку колонку використовувати: textValue, numericValue або dateValue

### 1.2 Маппінг dataType → колонка ProductFieldValue

| dataType (FieldDefinition) | ProductFieldValue колонка | Приклад |
|---------------------------|---------------------------|---------|
| string                    | textValue                 | "Текст", "option_a" |
| integer, float            | numericValue              | 123, 45.67 |
| boolean                   | textValue ("true"/"false") або numericValue (1/0) | "true" |
| date, datetime            | dateValue                 | 2025-02-23 |
| composite (JSON)           | textValue (JSON string)   | `{"sub1":"x","sub2":1}` |
| multiselect (масив)       | textValue (JSON array)    | `["a","b"]` |

**Примітка:** Поточна схема ProductFieldValue має тільки textValue, numericValue, dateValue. Для composite/multiselect використовуємо textValue як JSON string.

### 1.3 Переваги EAV

- **Без хардкоду:** нові поля — без міграцій
- **Гнучкість:** зміна структури тільки через FieldDefinition
- **Єдиність джерела:** структура даних = конфіг у БД
- **Масштабованість:** додавання полів без зміни коду

### 1.4 Недоліки та мітігація

| Недолік | Мітігація |
|---------|------------|
| Більше JOIN-ів | Індекси на productId, fieldDefinitionId; кеш на клієнті |
| Складніші фільтри/пошук | Динамічні запити по fieldValues з умовами |
| Потенційно широкі результати (pivot) | Pivot у сервісі або materialized view для складних випадків |

---

## 2. Поточна схема Product (хардкод)

Колонки, що підлягають видаленню:

```
vin, serialNumber, productType (текст), brand, model, modification, yearModel,
producerCountry, location, description, grossWeightKg, payloadKg, engineCm3,
powerKw, wheelFormula, seats, transmission, mileage, bodyType, condition,
fuelType, cargoDimensions, mrn, uktzed, createAtCcd, customsValue,
customsValuePlus10Vat, customsValuePlus20Vat, costWithoutVat, costWithVat,
vatAmount, currency
```

**Залишити (мінімальний Product):**
- id, createdAt
- productTypeId, categoryId, productStatusId (реляційні)
- processedFileId, pdfUrl, briefPdfPath (парсер/імпорт, якщо потрібно)
- payloadJson — можна залишити для legacy або парсера, або видалити після міграції

---

## 3. План імплементації (фази)

### Phase 0: Підготовка (перед міграцією)

1. **Бекап БД** (навіть якщо тестові дані)
2. **Експорт існуючих field definitions** — переконатися, що всі потрібні поля є в FieldDefinition
3. **Видалити systemColumn** з FieldDefinition (вже зроблено в UI, перевірити міграцію)

### Phase 1: Prisma schema + міграція

**1.1 Оновити Product:**

```prisma
model Product {
  id                Int       @id @default(autoincrement())
  productTypeId     String?   @map("product_type_id")
  categoryId        String?   @map("category_id")
  productStatusId   String?   @map("product_status_id")
  processedFileId   Int?      @map("processed_file_id")
  pdfUrl            String?   @map("pdf_url")
  briefPdfPath      String?   @map("brief_pdf_path")
  createdAt         DateTime  @default(now()) @map("created_at")

  productTypeRef    ProductType?  @relation(...)
  category          Category?     @relation(...)
  productStatusRef  ProductStatus? @relation(...)
  media             ProductMedia[]
  documents         ProductDocument[]
  fieldValues       ProductFieldValue[]

  @@index([productTypeId])
  @@index([categoryId])
  @@index([productStatusId])
  @@index([createdAt])
  @@map("products")
}
```

**1.2 ProductFieldValue — перевірити достатність колонок:**

- textValue — string, json, boolean, select/radio
- numericValue — integer, float
- dateValue — date, datetime

Якщо потрібно зберігати boolean окремо — додати `booleanValue`, але можна обійтись textValue.

**1.3 Міграція SQL:**
- DROP колонок з Product
- Очистити products (TRUNCATE) — за домовленістю, тестові дані
- Або: скрипт міграції даних з старих колонок → ProductFieldValue (якщо є цінні дані)

### Phase 2: products-db + типи

**2.1 products-db.ts:**
- Видалити SNAKE_TO_CAMEL, productToCreateInput/productToUpdateInput з польовими колонками
- Новий createProduct: приймає `{ productTypeId, categoryId, productStatusId, fieldValues: Record<fieldDefinitionId, value> }`
- Новий updateProduct: аналогічно
- dbToProduct: повертає плоский об'єкт `{ id, productTypeId, categoryId, ..., fieldValues: { [code]: value } }`
- Завантаження fieldValues через include + pivot у сервісі

**2.2 Product type (TypeScript):**
```ts
type Product = {
  id: number;
  product_type_id: string | null;
  category_id: string | null;
  product_status_id: string | null;
  processed_file_id: number | null;
  pdf_url: string | null;
  brief_pdf_path: string | null;
  created_at: string;
  media?: ProductMedia[];
  // Динамічні поля — по code з FieldDefinition
  [key: string]: unknown;
};
```

**2.3 Сервіс product-field-values.ts:**
- `upsertProductFieldValues(productId, fieldValues: Record<fieldDefId, value>, fieldDefinitions)` — перетворює значення по dataType, записує в ProductFieldValue
- `loadProductFieldValues(productId)` → Record<code, value>
- Маппінг value → textValue/numericValue/dateValue по FieldDefinition.dataType

### Phase 3: API products

**3.1 POST /api/products:**
- Приймає `{ productTypeId, categoryId, productStatusId, fieldValues: { [code]: value } }`
- Створює Product, потім upsert ProductFieldValue для кожного поля

**3.2 PATCH /api/products/[id]:**
- Оновлює Product (метадані), потім upsert fieldValues

**3.3 GET /api/products (list):**
- include: { fieldValues: { include: { fieldDefinition: true } } }
- Трансформувати в плоский об'єкт по code для фронту

**3.4 GET /api/products/[id]:**
- Аналогічно, include fieldValues, pivot по code

### Phase 4: buildWhere, getOrderBy (пошук/фільтр/сортування)

**4.1 Динамічний buildWhere:**
- Для skin filter по fieldCode потрібно join ProductFieldValue + FieldDefinition
- Умова: fieldDefinition.code = X AND (textValue/numericValue/dateValue) matches
- Конфіг полів (filterable) з product-config → список code
- Зібрати Prisma where з some/every по fieldValues

**4.2 Динамічний getOrderBy:**
- Сортування по fieldCode → orderBy через fieldValues (підзапит або join)
- Prisma orderBy для зв'язаних таблиць: `{ fieldValues: { _count: ... } }` або raw для складних випадків

**Примітка:** Postgres + Prisma — orderBy по related може бути складним. Варіанти:
- Raw SQL для list з sort
- Або тимчасово сортування тільки по createdAt до оптимізації

### Phase 5: Frontend (ProductDetailSheet, dynamic-field-renderer)

**5.1 Product type:**
- Фронт отримує `product` з полями по code (не по systemColumn)
- getProductValue(product, code) — product[code] або product.fieldValues[code]

**5.2 onUpdate:**
- Передає (code, value) — API збирає fieldValues по code, знаходить fieldDefinitionId, записує в EAV

**5.3 Видалити всі згадки systemColumn** з коду, config/system-columns.ts

### Phase 6: Очищення

- Видалити config/system-columns.ts
- Видалити SNAKE_TO_CAMEL, VALID_SORT_KEYS (замінити на динаміку)
- Оновити display-config типи (visibleColumnIds = codes)
- Перевірити seed, тести

---

## 4. Міграція даних (опційно)

Якщо потрібно зберегти існуючі дані з Product колонок:

1. Перед DROP: виконати скрипт, що для кожного Product читає старі колонки
2. Для кожної колонки знайти FieldDefinition з systemColumn = ця колонка (або code = snake_case)
3. Створити ProductFieldValue з відповідним значенням
4. Після міграції — DROP колонок

У нашому випадку (тестові дані, очищаємо) — можна пропустити.

---

## 5. Порядок виконання (залежності)

```
Phase 0 (підготовка)
    ↓
Phase 1 (Prisma schema + migrate)
    ↓
Phase 2 (products-db, типи, product-field-values service)
    ↓
Phase 3 (API products CRUD)
    ↓
Phase 4 (buildWhere, getOrderBy) — можна спростити спочатку (без фільтрів по custom fields)
    ↓
Phase 5 (Frontend)
    ↓
Phase 6 (Cleanup)
```

---

## 6. Ризики та мітігація

| Ризик | Мітігація |
|------|-----------|
| Зламаний list/detail після міграції | Послідовне тестування після кожної фази |
| Повільні запити з JOIN | Індекси; при потребі — materialized view або кеш |
| Composite/multiselect — складний маппінг | Чіткі правила: composite → JSON в textValue |
| Порожні products після truncate | Очікувано; створювати через UI |

---

## 7. Перевірка відсутності хардкоду

Після рефакторингу не має бути:
- Фіксованих назв полів Product (vin, brand, model, ...)
- SNAKE_TO_CAMEL з польовими колонками
- system-columns.ts
- Умова `systemColumn` для відображення полів

Джерело правди: FieldDefinition + TabField (картка), ProductFieldValue (значення).
