# Аудит nextjs_vmd — план рефакторингу (березень 2025)

## 1. Проблеми коду та баги

### 1.1 Дублювання логіки та неконсистентні патерни

| Проблема | Файли | Опис |
|----------|-------|------|
| **Два незалежні API для product config** | `api/product-config/[productTypeId]/route.ts`, `api/product-config/category/[categoryId]/route.ts` | Один ключ — `productTypeId`, інший — `categoryId`. Повертають подібну структуру (tabs, fields), але з різною логікою: category-API додає `displayConfig` і бере перший productType за createdAt; productTypeId-API завжди повертає `displayConfig: null`. |
| ** deriveTableColumns / deriveFilterableFields** | `use-list-config.ts` | Однаковий патерн ітерації `tabs→fields→systemColumn` з дублюванням seen.has/skip-логіки. Можна винести в єдину функцію `deriveListFieldsFromTabs`. |
| **fetchCategories / fetchProductTypes** | `tabs-config-management.tsx`, `display-page.tsx`, `product-card-preview-modal.tsx`, `display-settings-management.tsx` | Кожен компонент має свій `fetchCategories`/`fetchProductTypes` з майже ідентичною логікою. Варто централізувати в `api/admin/categories`, `api/admin/product-types` або хуки. |
| **Інвалідація кешу розкидана** | 8+ файлів | Різні компоненти викликають `invalidateQueries` з різними ключами: `["product-config"]`, `["list-config"]`, `["list-config", categoryId]`, без єдиного фасаду. |

### 1.2 Відсутня обробка помилок та edge cases

| Проблема | Файл | Опис |
|----------|------|------|
| **displayConfig: null** | `api/product-config/[productTypeId]/route.ts:97` | Завжди `displayConfig: null` — якщо хтось використовує product-config за productTypeId для display, отримає порожню конфіг. |
| **Пустий categoryId** | `useListConfig`, `DisplaySettingsManagement` | `categoryId ?? ""` передається в queryKey, виклик з `""` може створювати «зайві» запити (enabled: !!categoryId це частково мітігує). |
| **JSON.parse без typed error** | `composite-field.ts`, `display-config.ts`, `validate-preset-values.ts` | `catch { return default }` ганяє всі помилки — в dev варто логувати. |
| **Продукт без productType** | `product-detail-sheet.tsx` | Використовує `defaultProductType` з `/api/product-config/default` — якщо категорія без productType, може бути undefined/null. |

### 1.3 Типобезпека

| Проблема | Файл | Опис |
|----------|------|------|
| **Product[code]** для кастомних полів | `dynamic-field-renderer.tsx:601-604` | `(code ?? fieldDefinition.id) as keyof Product` — кастомні поля не є ключами Product; використовується `Record<string,unknown>` неявно. |
| **Product type** | `types.ts` | Немає index signature для EAV — кастомні поля не типізовані. |
| **Display config query key** | `display-settings-management.tsx:89` | `[...DISPLAY_CONFIG_KEYS, "display", effectiveCategoryId]` — `DISPLAY_CONFIG_KEYS = ["list-config"]`, змішує list-config і display у одному префіксу. |

### 1.4 Прогалини інвалідації кешу

| Проблема | Опис |
|----------|------|
| **Broad invalidation** | `field-definitions-management` інвалідує `["product-config"]` і `["list-config"]` без categoryId — це правильно (prefix match), але надмірно при зміні одного поля. |
| **Відсутня інвалідація display** | Після збереження display config викликається `invalidateQueries({ queryKey: ["list-config", effectiveCategoryId] })` — це оновлює list-config. Але окрема query `["list-config","display", effectiveCategoryId]` для raw display config отримує інвалідацію лише через `DISPLAY_CONFIG_KEYS` (["list-config"]) — prefix match спрацьовує. |
| **Tab mutations** | tabs-config-management інвалідує product-config і list-config для selectedCategoryId — якщо користувач змінює таб в іншій категорії, ця категорія не інвалідується. |

### 1.5 Race conditions та stale closure

| Проблема | Файл | Опис |
|----------|------|------|
| **hasAppliedDefaultSort** | `products-page.tsx:228-236` | useRef + useEffect — якщо listConfig приходить двома рендерами з різним defaultSort, може застосувати не той. Маловірогливий, але варто додати key для reset. |
| **effectiveCategoryId vs categoryId** | `display-settings-management.tsx` | `effectiveCategoryId = categoryId || sortedCategories[0]?.id` — при зміні категорії можлива коротка race між setState і query. |

---

## 2. Архітектурні проблеми

### 2.1 Неконсистентні форми API-відповідей

| Endpoint | Повертає | Проблема |
|----------|----------|----------|
| `GET /api/product-config/[productTypeId]` | productType, category, tabs, **displayConfig: null** | Завжди null. |
| `GET /api/product-config/category/[categoryId]` | productType, category, tabs, **displayConfig** (з DB) | Інша форма. |
| `GET /api/admin/display-config?categoryId=` | CategoryDisplayConfig (parsed) | Окремий endpoint; display-settings використовує його замість category API. |

**Рекомендація:** Уніфікувати: або product-config завжди повертає displayConfig (з обох endpoint), або використовувати тільки `/api/admin/display-config` для display. Зараз display-settings бере listConfig (tabs) з useListConfig і display з окремого API — подвійне джерело. |

### 2.2 Змішані джерела даних (product-config vs list-config)

| Джерело | Ключ | Використання |
|--------|------|--------------|
| product-config (productTypeId) | `["product-config", productTypeId]` | ProductDetailSheet, ProductCardPreview — картка товару. |
| product-config (categoryId) | `["list-config", categoryId]` | Products table, Display settings, ProductCardPreview — список, фільтри, колонки. |

**Проблема:** list-config це по суті product-config/category + deriveTableColumns + display overlay. Два різні «порті» одних і тих же даних (tabs/fields). |

### 2.3 Нечіткий поділ відповідальностей

| Компонент | Відповідальність | Проблема |
|-----------|------------------|----------|
| **DisplaySettingsManagement** | Display config UI | Залежить від useListConfig (tableColumns, filterableFields) — тобто від структури картки. «Налаштування відображення» залежать від «структури картки». |
| **TabsConfigManagement** | Таби + поля | Містить логіку create/update/delete табів, assigned fields, add-field dialog. Дуже «товстий» компонент. |
| **ProductCardPreviewModal** | Preview | Дублює fetchTabDetail, логіку add field, інвалідацію — схоже на TabsConfigManagement. |

### 2.4 Зайві деривації

| Деривація | Де | Проблема |
|-----------|-----|----------|
| tableColumns з tabs | use-list-config | Обчислюється в useMemo при кожному listConfig. |
| filterableFields з tabs | use-list-config | Те саме. |
| searchableFieldCodes з filterableFields | use-list-config | `filterableFields.filter(f=>dataType==="string").map(f=>f.code)` — ще одна деривація. |

Варто розглянути повернення цих полів з API замість деривації на клієнті. |

### 2.5 Перебільшена зв'язаність

| Компонент | Зв'язки | Проблема |
|-----------|---------|----------|
| **display-settings-management** | useListConfig, fetchDisplayConfig, fetchCategories | Display settings не можуть працювати без картки (tabs). Повідомлення: «Configure the product card first». |
| **product-card-preview-modal** | useListConfig, useProductConfig, fetchProductTypes, fetchFieldDefinitions, fetchTabDetail | Імпортує AddFieldDialog, isFieldAvailableForCategory, FULL_ROW_WIDGETS — велика залежність. |

---

## 3. Незрозумілі та покращувані зони

### 3.1 systemColumn — обов'язковість для таблиці (UX friction)

**Поточна логіка:**
- `deriveTableColumnsFromTabs` і `deriveFilterableFieldsFromTabs` пропускають поля без `systemColumn`.
- Тільки поля з прив'язкою до колонки Product з'являються в таблиці та в Display settings.

**UX:** Користувач повинен вибрати «Колонка таблиці» при створенні поля, інакше поле не потрапляє в список/фільтри. Це створює додаткову когнітивне навантаження і неочевидну залежність. |

**Покращення:** Дозволити кастомні колонки через `code` для полів без systemColumn (потрібна підтримка EAV/ProductFieldValue на API).

### 3.2 Подвійні джерела конфігурації (productTypeId vs category)

- **product-config/[productTypeId]** — для картки товару (конкретний тип).
- **product-config/category/[categoryId]** — для списку (перший productType в категорії).

При категорії з кількома типами продуктів list-config завжди бере перший productType — може бути не той, що очікується.

### 3.3 Display settings залежать від card config

`DisplaySettingsManagement` показує:
- tableColumns — з listConfig (по tabs)
- filterableFields — з listConfig
- Якщо `tableColumns.length === 0` → «Configure the product card first».

Таб «Налаштування відображення» не може існувати без налаштованої картки — логічна залежність, але UX можна поліпшити (наприклад, окремий hint).

### 3.4 Tab/field mutations — розкидана інвалідація

| Мутація | Де | Що інвалідується |
|---------|-----|------------------|
| Create tab | tabs-config-management | tabs, product-config, list-config (selectedCategoryId) |
| Update tab | tabs-config-management | tabs, tab-detail, product-config, list-config |
| Delete tab | tabs-config-management | tabs, product-config, list-config |
| Create field | field-definitions | field-defs, product-config, list-config, tab-detail, category-tabs |
| Update field | field-definitions | field-defs, product-config, list-config, tab-detail, category-tabs |
| Save display | display-settings | list-config (prefix), display query |
| Preview add field | product-card-preview | product-config, list-config, tab-detail, category-tabs |

Єдиного місця для «invalidate after config change» немає — логіка дублюється.

### 3.5 staleTime та стратегія кешу

| Джерело | staleTime | Примітка |
|---------|-----------|----------|
| useProductConfig | 5 min | 
|
| useListConfig | 30 s | Коротше за product-config — можливо навмисно для list? |
| Display fetchDisplayConfig | 60 s | 
|
| MANAGEMENT_STALE_MS | 5 min | Категорії, типи, field-defs, таби. |
| products useProducts | default 60s | З query-client. |
| useProduct (detail) | 5 min | 
|
| users-management | 30 s | 
|

**Неконсистентність:** 30s vs 5min vs 60s без чіткої політики. Рекомендація: визначити рівні (config: 5min, list: 1–2min, detail: 5min).

---

## 4. План рефакторингу

### Пріоритизація

| Пріоритет | Проблеми | Вплив | Складність |
|-----------|----------|-------|------------|
| **Critical** | API response shape (displayConfig null), Cache invalidation centralization | Коректність даних, складність підтримки | Середня |
| **High** | Дублювання fetchCategories/fetchProductTypes, systemColumn UX, Double config sources | Зменшення коду, UX | Середня–висока |
| **Medium** | Display settings dependency, staleTime consistency, Type safety (Product) | Стабільність, передбачуваність | Низька–середня |
| **Low** | deriveTableColumns/deriveFilterableFields consolidation, Error logging in catch | Чистота коду | Низька |

### Конкретні кроки

#### Phase 1: Critical (API + Cache)

1. **Уніфікувати product-config API**
   - Файли: `api/product-config/[productTypeId]/route.ts`, `api/product-config/category/[categoryId]/route.ts`
   - Крок: Додати в productTypeId endpoint завантаження displayConfig для category (як у category endpoint).
   - Альтернатива: Явно задокументувати, що displayConfig тільки з category API.
   - Залежності: немає.
   - Оцінка: 0.5–1 год.

2. **Централізувати інвалідацію config-кешу**
   - Файли: `lib/query-keys.ts`, новий `lib/config-invalidation.ts` або розширення query-keys.
   - Крок: Додати `invalidateProductConfig(categoryId?: string, productTypeId?: string)` і `invalidateListConfig(categoryId?: string)` — один виклик з компонентів.
   - Залежності: немає.
   - Оцінка: 1–2 год.

#### Phase 2: High (Дублювання + Джерела)

3. **Створити хуки useCategories, useProductTypes**
   - Файли: `hooks/use-categories.ts`, `hooks/use-product-types.ts` (або в `features/management/hooks/`).
   - Крок: Винести fetch + query в хуки, замінити дублікати в tabs-config, display-settings, product-card-preview, display-page, data-model-page.
   - Залежності: 1 (query keys).
   - Оцінка: 1–2 год.

4. **Розглянути об'єднання product-config джерел**
   - Файли: use-product-config, use-list-config, API routes.
   - Крок: Визначити, чи list-config може будуватися з product-config/category як єдиного джерела. Можливо, list-config залишається деривацією на клієнті з category API.
   - Залежності: 1, 2.
   - Оцінка: 2–4 год (архітектурне рішення).

5. **systemColumn — optional для table columns (EAV)**
   - Файли: use-list-config, products-db, Product type, API products.
   - Крок: Це частина великого EAV-фіча. Як short-term: покращити UX (hint, tooltip) про необхідність systemColumn для таблиці. Long-term: EAV для кастомних колонок.
   - Залежності: EAV-план.
   - Оцінка: 0.5 год (hint) / 2+ дні (EAV).

#### Phase 3: Medium (Display + Cache policy)

6. **Display settings — зменшити залежність від card**
   - Файли: display-settings-management.tsx.
   - Крок: Показати пустий стан з чітким CTA: «Спочатку налаштуйте таби та поля в Картка товару», без блокування всього UI.
   - Залежності: немає.
   - Оцінка: 0.5 год.

7. **Уніфікувати staleTime**
   - Файли: query-client.ts, use-product-config, use-list-config, display-settings-management, users-management.
   - Крок: Ввести константи CONFIG_STALE_MS=5min, LIST_STALE_MS=2min, DETAIL_STALE_MS=5min. Застосувати консистентно.
   - Залежності: немає.
   - Оцінка: 0.5 год.

8. **Типізація Product для кастомних полів**
   - Файли: types.ts, dynamic-field-renderer.tsx.
   - Крок: `type Product = BaseProduct & Record<string, unknown>` або окремий ProductWithCustomFields. Уникнути `as keyof Product` для code.
   - Залежності: немає.
   - Оцінка: 1 год.

#### Phase 4: Low (Чистота)

9. **Консолідація deriveTableColumns/deriveFilterableFields**
   - Файл: use-list-config.ts.
   - Крок: Єдина функція `deriveListFieldsFromTabs(tabs)` → { tableColumns, filterableFields }, потім searchableFieldCodes як filter + map.
   - Залежності: немає.
   - Оцінка: 0.5 год.

10. **Покращення error handling у catch**
    - Файли: composite-field.ts, display-config.ts, validate-preset-values.
    - Крок: У dev `console.warn` або logger при catch, щоб не губити діагностику.
    - Залежності: немає.
    - Оцінка: 0.5 год.

### Залежності між рефакторами

```
Phase 1.1 (API) ──┬── Phase 2.4 (джерела)
                  └── Phase 3.7 (staleTime)
Phase 1.2 (invalidation) ──┬── Phase 2.3 (хуки)
                           └── Phase 2.4
Phase 2.3 (хуки) ── Phase 2.5 (systemColumn hint)
Phase 3.8 (Product type) ── незалежно
Phase 4.9, 4.10 ── незалежно
```

### Файли для змін по фазах

| Фаза | Файли |
|------|-------|
| 1 | `api/product-config/[productTypeId]/route.ts`, `lib/query-keys.ts` або `lib/config-invalidation.ts`, `tabs-config-management.tsx`, `field-definitions-management.tsx`, `display-settings-management.tsx`, `product-card-preview-modal.tsx` |
| 2 | `hooks/use-categories.ts`, `hooks/use-product-types.ts`, `tabs-config-management.tsx`, `display-settings-management.tsx`, `product-card-preview-modal.tsx`, `display-page.tsx`, `data-model-page.tsx`, `use-list-config.ts` |
| 3 | `display-settings-management.tsx`, `query-client.ts`, `use-product-config.ts`, `use-list-config.ts`, `users-management.tsx`, `types.ts`, `dynamic-field-renderer.tsx` |
| 4 | `use-list-config.ts`, `composite-field.ts`, `display-config.ts`, `validate-preset-values.ts` |
