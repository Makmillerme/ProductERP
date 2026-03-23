# Аудит Картки товару: побудова, відображення, зв'язок з полями

## Архітектура

### Побудова (build)
- **TabsConfigManagement**: налаштування табів, призначення полів (рядок/секція)
- **product-config API**: /api/product-config/category/[categoryId] (list), /api/product-config/[productTypeId] (card)
- **TabField**: order, colSpan=1, isRequired=false, productTypeId=null, sectionTitle=null (спрощено)
- **FieldDefinition**: systemColumn (мапінг на Product), code, widgetType, presetValues

### Відображення (display)
- **ProductDetailSheet**: таби, DynamicFieldRenderer, grid 3 cols
- **useProductConfig(productTypeId)**: tabs + fields для картки
- **useListConfig(categoryId)**: tableColumns (тільки systemColumn), filterableFields, searchableFieldCodes
- **products-page**: таблиця з listConfig.tableColumns, клік → ProductDetailSheet

### Зв'язок полів
- **systemColumn**: Product[systemColumn] — системні поля мапляться на колонки Product
- **!systemColumn**: productKey=code — кастомні поля, Product[code]=undefined (Product не має цих ключів)
- **ProductFieldValue**: модель є, але API products НЕ завантажує/зберігає — EAV не реалізовано

## Виявлені проблеми

1. **ProductFieldValue не використовується** — кастомні поля (без systemColumn) показують порожнє значення, збереження не працює для EAV
2. **listConfig.categoryName** — hardcoded fallback "Товари" в use-list-config.ts
3. **field-utils** — параметр vehicleTypes замість productTypes (legacy naming)
4. **product-config/category** — повертає перший productType (orderBy createdAt), може бути не той тип
5. **Два джерела product-config** — category API vs productTypeId API, різна логіка
6. **system-column-mapping.md** — посилається на src/features/vehicles (застарілий шлях)
7. **Відсутній EAV placeholder** — doc каже "EAV (буде додано)", але DynamicFieldRenderer не показує цей placeholder для полів без systemColumn
8. **Product type** — не має index signature для кастомних полів, (product as Record<string,unknown>)[key] використовується

## План рефакторингу (пріоритет)

**P1 (критичні):**
- Немає — ProductFieldValue/EAV це окремий великий фіч

**P2 (консистентність):**
- listConfig: локалізувати fallback categoryName
- field-utils: перейменувати vehicleTypes→productTypes у коментарі/документації
- system-column-mapping.md: оновити шляхи vehicles→products

**P3 (документація):**
- Додати EAV placeholder для полів без systemColumn (або явно document що тільки system fields підтримуються)
- Уточнити в doc: кастомні поля без systemColumn не зберігаються