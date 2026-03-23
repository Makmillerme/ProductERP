# План: Many-to-many для полів + підтримка категорія/тип товару

## Контекст

1. **Ієрархія:** Категорія (Техніка) → Типи товару (Вантажівки, Легкові, Запчастини)
2. **Товар без типів:** якщо категорія не поділяється на типи — товар відноситься лише до категорії
3. **Товар з типами:** товар має productTypeId → тип → категорія
4. **Поля:** мають налаштовуватись під категорію (усі типи) або під конкретний тип

## Поточна схема

```
Category (Техніка)
  └── ProductType (Вантажівки, Легкові)
        └── Product

FieldDefinition.categoryId — одне значення або null (глобальне)
```

## Цільова модель

### Рівні доступності поля

| Рівень | Опис | Приклад |
|--------|------|---------|
| **Глобальне** | Усі категорії, усі типи | Поле "VIN" для всього |
| **Категорія** | Усі типи в категорії | "Пробіг" для Техніки (вантажівки + легкові) |
| **Тип товару** | Лише конкретний тип | "Кількість осей" тільки для Вантажівок |

### Many-to-many зв'язки

```
FieldDefinition
  ├── FieldDefinitionCategory[]   — поля категорії (усі типи)
  └── FieldDefinitionProductType[] — поля типу (конкретний тип)
```

- **Порожні обидва** → глобальне поле
- **Є записи в FieldDefinitionCategory** → поле для обраних категорій (усі типи)
- **Є записи в FieldDefinitionProductType** → поле для обраних типів
- **Можна комбінувати** — поле в категорії A + тип B (логіка OR)

---

## Зміни в Prisma

### 1. Нова таблиця FieldDefinitionCategory

```prisma
model FieldDefinitionCategory {
  fieldDefinitionId String         @map("field_definition_id")
  categoryId        String         @map("category_id")
  fieldDefinition   FieldDefinition @relation(fields: [fieldDefinitionId], references: [id], onDelete: Cascade)
  category          Category       @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@id([fieldDefinitionId, categoryId])
  @@map("field_definition_categories")
}
```

### 2. Нова таблиця FieldDefinitionProductType

```prisma
model FieldDefinitionProductType {
  fieldDefinitionId String         @map("field_definition_id")
  productTypeId    String         @map("product_type_id")
  fieldDefinition  FieldDefinition @relation(fields: [fieldDefinitionId], references: [id], onDelete: Cascade)
  productType      ProductType    @relation(fields: [productTypeId], references: [id], onDelete: Cascade)

  @@id([fieldDefinitionId, productTypeId])
  @@map("field_definition_product_types")
}
```

### 3. Оновлення FieldDefinition

```prisma
model FieldDefinition {
  // ... існуючі поля ...
  // ВИДАЛИТИ: categoryId, category

  categories    Category[]    @relation("FieldDefinitionCategories")
  productTypes ProductType[]  @relation("FieldDefinitionProductTypes")
  // ...
}
```

### 4. Оновлення Category та ProductType

```prisma
model Category {
  // ... існуючі поля ...
  fieldDefinitionCategories FieldDefinitionCategory[]
  // ВИДАЛИТИ: fieldDefinitions (поточна relation через categoryId)
}

model ProductType {
  // ... існуючі поля ...
  fieldDefinitionProductTypes FieldDefinitionProductType[]
}
```

### 5. Product.categoryId (для товарів без типу)

```prisma
model Product {
  // ...
  productTypeId String?  @map("product_type_id")
  categoryId    String?  @map("category_id")  // НОВЕ: коли productTypeId = null
  productType   ProductType? @relation(...)
  category      Category?   @relation(...)   // НОВЕ
  // ...
}
```

Товар має або `productTypeId` (тип → категорія з типу), або `categoryId` (прямо категорія, без типу).

---

## Логіка "поле доступне для товару"

Для продукту P:

```
effectiveCategory = P.categoryId ?? P.productType?.categoryId
effectiveProductType = P.productTypeId
```

Поле F доступне, якщо:

1. **Глобальне:** `F.categories.length === 0 && F.productTypes.length === 0`
2. **Категорія:** `effectiveCategory` є в `F.categories`
3. **Тип:** `effectiveProductType` є в `F.productTypes`

---

## API зміни

### GET /api/admin/field-definitions?categoryId=&productTypeId=

- `categoryId` — показати поля для категорії (глобальні + категорії + типів цієї категорії)
- `productTypeId` — додатково фільтр по типу

**Фільтр:** поле доступне для (categoryId, productTypeId?):

```ts
where: {
  OR: [
    { categories: { none: {} }, productTypes: { none: {} } },  // глобальне
    { categories: { some: { categoryId } } },
    { productTypes: { some: { productTypeId } } }
  ]
}
```

### POST /api/admin/field-definitions

Body: `categoryIds?: string[]`, `productTypeIds?: string[]`

- Порожні обидва → глобальне
- Створити записи в FieldDefinitionCategory, FieldDefinitionProductType

---

## UI зміни

### Sheet налаштувань поля

```
Доступність поля

○ Глобальне (усі категорії та типи)
○ Обрані категорії:
  ☑ Техніка
  ☑ Запчастини
  ☐ Інше
○ Обрані типи товару:
  ☑ Вантажівки
  ☐ Легкові
  ☐ Автобуси
```

Або спрощено: спочатку вибір категорії, потім — якщо є типи — чекбокси типів.

---

## Міграція

1. Створити таблиці `field_definition_categories`, `field_definition_product_types`
2. Додати `Product.categoryId`
3. Міграція даних:
   - `FieldDefinition.categoryId = null` → нічого (глобальне)
   - `FieldDefinition.categoryId = "A"` → запис у `FieldDefinitionCategory(fieldId, "A")`
4. Видалити `FieldDefinition.categoryId`

---

## Фази

| Фаза | Опис | Статус |
|------|------|--------|
| 1 | Many-to-many Category (без ProductType, без Product.categoryId) | ✅ |
| 2 | Many-to-many ProductType | ✅ |
| 3 | Product.categoryId для товарів без типу | ✅ |
| 4 | UI: чекбокси категорій і типів | ✅ |

---

## Реалізовано (2025-02)

### Phase 3 (2025-02-23)
- **Product.categoryId**: Prisma schema + міграція `20260306120000_add_product_category_id`. Product має `categoryId` для товарів без productTypeId.
- **products-db.ts**: DbProduct, dbToProduct, productToCreateInput, productToUpdateInput — додано productTypeId, categoryId. buildWhere — фільтр по категорії включає `productTypeRef.categoryId` або `categoryId`.
- **parser import**: resolveProductType повертає { id, categoryId }; при імпорті встановлює categoryId з типу або з body.categoryId для товарів без типу.
- **vehicle-config/category/[categoryId]**: підтримка категорій без типів — повертає vehicleType: null, category, tabs (поля з productTypeId: null). Фільтрація полів через isFieldAvailableForCategory.
- **vehicle-config/[vehicleTypeId]**: фільтрація полів через isFieldAvailableForCategory.
- **types.ts**: Product — додано product_type_id, category_id.

### Phase 4 (раніше)
- **field-definitions-management.tsx**: Select «Категорія» замінено на чекбокси категорій + типів (згруповані по категорії). handleSave передає `categoryIds`, `productTypeIds`.
- **data-model-page.tsx**: dropdown типів справа від категорії лише коли `typesForSelectedCategory.length > 0`.
- **field-utils.ts**: додано `isFieldAvailableForCategory(field, categoryId, productTypeId?, vehicleTypes?)`.
- **tabs-config-management.tsx**: `groupedUnassignedFields` використовує `isFieldAvailableForCategory` замість `f.categoryId`. Відображення «Інші категорії» — через `f.categoryIds`.

---

## Ризики

- Існуючі записи: categoryId → перенести в FieldDefinitionCategory
- TabField, listConfig, vehicle-config — фільтрація полів по categoryId/productTypeId
- API vehicle-config/category/:categoryId — повертає поля для категорії; потрібно оновити логіку
