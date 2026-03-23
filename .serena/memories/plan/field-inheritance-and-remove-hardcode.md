# План: Спадковість полів, спільний dropdown категорії та видалення хардкоду

## Контекст

- Поля створюються в моделі даних (FieldDefinition)
- Кожна категорія має свої таби (TabDefinition) з полями (TabField → FieldDefinition)
- Зараз FieldDefinition глобальний (немає categoryId) — усі поля в одному пулі
- Потрібно: (1) поля під категорію, (2) спадковість — перевикористання існуючого поля в інших категоріях (уникнути дублікатів)
- Успадкування структурно вже є: TabField посилається на FieldDefinition — один FieldDefinition може бути в багатьох TabField різних категорій

---

## Phase 0: Спільний dropdown категорії (варіант B)

### 0.1 Єдиний dropdown на рівні data-model-page

- Розмістити dropdown категорії **над контентом** сторінки Модель даних
- Показувати **тільки** для табів «Поля та дані» (data) і «Картка товару» (card)
- Для табів «Статуси» та «Категорії» — не показувати

### 0.2 Синхронізація з getCardCategoryId / setCardCategoryId

- Dropdown читає поточне значення з `getCardCategoryId()`
- При зміні вибору викликає `setCardCategoryId(categoryId)`
- Використовувати той самий ключ `management/card-category-id` у localStorage

### 0.3 Рефакторинг tabs-config-management

- **Прибрати** власний dropdown категорії з TabsConfigManagement
- TabsConfigManagement отримує `categoryId` як **prop** з data-model-page
- data-model-page передає обрану категорію зі спільного dropdown

### 0.4 Ініціалізація при першому відкритті

- Якщо `getCardCategoryId()` порожній — обрати першу категорію зі списку і викликати `setCardCategoryId(first.id)`
- Якщо збережена категорія не існує — скинути на першу доступну

**Результат:** один раз обрана категорія зберігається при перемиканні між «Поля та дані» і «Картка товару», без повторного вибору.

---

## Phase 1: FieldDefinition.categoryId (поля під категорію)

### 1.1 Prisma

- Додати `categoryId String? @map("category_id")` до FieldDefinition
- Relation: `category Category? @relation(...)`
- Index: `@@index([categoryId])`
- Migration або db push

### 1.2 API GET /api/admin/field-definitions

- Query param `?categoryId=xxx`
- When provided: `where: { OR: [{ categoryId }, { categoryId: null }] }` — поля категорії + глобальні
- Without param: all (backward compat)

### 1.3 API POST/PATCH

- Accept `categoryId` в body, зберігати

### 1.4 field-definitions-management

- **Не має** власного dropdown — категорія приходить з data-model-page через prop (з Phase 0)
- Фільтр списку полів: показувати поля обраної категорії + глобальні (categoryId = null)
- При створенні: categoryId = обрана категорія з dropdown (або null, якщо «Усі»)

### 1.5 У sheet створення поля

- Поле «Категорія» з можливістю змінити:
  - За замовчуванням: обрана категорія з dropdown
  - Опція «Глобальне» (null) — для спільного поля

**Результат:** можна створювати поля для конкретної категорії і бачити їх окремо від глобальних.

---

## Phase 2: Inheritance UX (вибір існуючого vs створення)

### 2.1 tabs-config: діалог додавання поля

- При «Додати поле до табу»: Dialog з двома опціями
  - **Вибрати існуюче** — групування:
    - Поля категорії [Назва] (categoryId = tab.categoryId)
    - Глобальні поля (categoryId = null)
    - Поля з інших категорій (categoryId != null, != tab.categoryId)
  - **Створити нове** — відкриває створення поля з categoryId = tab.categoryId

### 2.2 field-definitions-management

- Кнопка «Створити» — при обраній категорії створює поле з categoryId = обрана категорія
- Опція «Глобальне» в sheet — якщо потрібне спільне поле

---

## Phase 3: Видалення хардкоду (таблиця, фільтр, сортування, пошук)

### 3.1 Стовпці таблиці

- Прибрати fallback PRODUCT_COLUMNS
- Використовувати тільки listConfig.tableColumns
- Якщо порожньо — порожня таблиця або повідомлення «Налаштуйте поля картки»

### 3.2 Фільтр

- UI: з listConfig.filterableFields (динамічні поля)
- ProductFilterState: Record<string, string> або динамічний
- API/products-db: filter_${code}=value, buildWhere динамічно

### 3.3 Сортування

- products-db: прибрати SORT_KEYS, приймати sortKey з tableColumns (валідація проти Product columns)

### 3.4 Пошук

- products-db: search по listConfig.searchableFieldCodes (потрібно передавати з API)

---

## Порядок виконання

1. **Phase 0** — спільний dropdown категорії, синхронізація між табами
2. **Phase 1** — categoryId у FieldDefinition, API, UI
3. **Phase 2** — UX спадковості в tabs-config
4. **Phase 3** — видалення хардкоду

---

## Файли для змін

| Phase | Файл | Зміни |
|-------|------|-------|
| 0 | data-model-page.tsx | Спільний dropdown, передача categoryId у TabsConfigManagement і FieldDefinitionsManagement |
| 0 | tabs-config-management.tsx | Прибрати власний dropdown, приймати categoryId як prop |
| 0 | management-state.ts | Вже є getCardCategoryId/setCardCategoryId |
| 1 | prisma/schema.prisma | FieldDefinition.categoryId |
| 1 | api/admin/field-definitions/* | categoryId у GET, POST, PATCH |
| 1 | field-definitions-management.tsx | Фільтр по categoryId, поле «Категорія» в sheet |
| 2 | tabs-config-management.tsx | Діалог додавання поля (вибрати/створити) |
| 3 | vehicles-page.tsx, types.ts | Прибрати PRODUCT_COLUMNS fallback |
| 3 | products-db.ts, api/products | Динамічний filter, sort, search |

---

## Ризики

- Існуючі FieldDefinition без categoryId — залишаються глобальними (null)
- Seed/міграція: системні поля — categoryId = null
- TabsConfigManagement зараз сам ініціалізує категорію — потрібно перенести логіку в data-model-page