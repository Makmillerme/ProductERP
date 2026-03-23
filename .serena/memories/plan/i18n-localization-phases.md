# План локалізації проекту (i18n)

**Мета:** Перевести весь жорстко закодований текст на i18n (uk.json, en.json).

## Поточний стан

- Є `useLocale()`, `t(key)`, `tFormat(key, params)`
- Локалі в uk.json, en.json (layout, fieldSettings, validation, apiDocs, integrations, settings, widgetTypes)
- Багато тексту залишилось в компонентах

---

## Жорстко закодований текст (аудит)

### 1. Toast-повідомлення (toast.success/error)

| Файл | Текст | Ключ пропозиція |
|------|------|----------------|
| categories-management | Категорію створено/збережено/видалено, Тип товару створено/збережено/видалено | toasts.categoryCreated, ... |
| product-types-management | Тип авто створено/збережено/видалено | toasts.productTypeCreated, ... |
| field-definitions-management | Поле створено/збережено/видалено | toasts.fieldCreated, ... |
| statuses-management | Статус створено/збережено/видалено | toasts.statusCreated, ... |
| tabs-config-management | Таб створено/збережено/видалено | toasts.tabCreated, ... |
| roles-management | Роль створено, Права збережено | toasts.roleCreated, ... |
| users-management | Користувача заблоковано/розблоковано/видалено | toasts.userBanned, ... |
| user-detail-sheet | Права власника передано | toasts.ownerTransferred |
| product-documents-tab | Файл видалено | toasts.fileDeleted |
| products-page | Зміни збережено | toasts.changesSaved |

### 2. Валідаційні повідомлення (toast.error)

- Вкажіть назву категорії/типу товару/поля/статусу/табу
- Вкажіть назву та код ролі

### 3. UI-елементи (кнопки, labels, заголовки)

- **management-page:** Завантажувач, Облік товарів, Користувачі та Ролі, Швидкі періоди..., Поточний місяць, Свій діапазон, Запустити завантаження, Користувачі, Ролі
- **catalog page:** Немає категорій, Щоб вести облік..., Створити категорію
- **login:** Вхід у застосунок, Пароль, Завантаження…
- **auth-modal:** Увійти або зареєструватися, Введіть email..., Перевірте пошту...
- **categories-management:** Редагувати, Додати тип, Видалити, Немає типів товару, Автодетект, Назва, Іконка, Порядок, Опис, Скасувати
- **delete-category-dialog, delete-product-type-dialog:** Видалити категорію/тип?, текст підтвердження, Скасувати
- **field-definitions-management:** Віджети, Сторінка, з {n}, Рядків на сторінці, Назва, Код, Тип даних, Відображення, Використань, Генерується автоматично..., Приховано на картці, Категорії та типи, Змінити тип даних?
- **product-detail-sheet:** Немає табів, Видалити авто?, Видалити
- **products-page:** Таблиця, Канбан, Фільтр, Відображення стовпців, Очистити, Застосувати, Готово, Завантаження…
- **users-management:** Заблокувати/Розблокувати користувача, Профіль, Сесії, Передати права власника
- **roles-management:** Права доступу, Системна роль...

### 4. API/throw new Error

- Помилка завантаження документів (product-documents-tab)
- Failed to fetch categories/statuses (en)

### 5. Інші

- field-utils: validateFormula — "Вкажіть формулу"
- formula-editor: "Немає доступних полів", "Нічого не знайдено"

---

## Фази локалізації

### Фаза 1: Toast та валідація (пріоритет)

**Обсяг:** ~25 toast.success/error
**Файли:** products-config/*, roles-management, users-management, product-documents-tab, products-page
**Дії:**
1. Додати секцію `toasts` та `validation` в uk.json, en.json
2. Замінити всі toast.success/error на t("toasts.xxx")
3. Замінити toast.error валідації на t("validation.xxx")

### Фаза 2: Management (таби, кнопки, labels)

**Обсяг:** management-page, products-config dialogs, categories-management, product-types-management
**Дії:**
1. management.tabs, management.uploader, management.buttons
2. productsConfig.labels, productsConfig.buttons, productsConfig.emptyStates
3. deleteDialogs (deleteCategory, deleteProductType)

### Фаза 3: Users та Roles

**Обсяг:** users-management, roles-management, user-detail-sheet, ban/unban/delete dialogs
**Дії:**
1. users.labels, users.buttons, users.statuses
2. roles.labels, roles.permissions
3. banUser, unbanUser, deleteUser, transferOwner

### Фаза 4: Products (картка, таблиця, медіа)

**Обсяг:** product-detail-sheet, products-page, product-documents-tab, product-media-*
**Дії:**
1. productDetail.emptyStates, productDetail.buttons
2. productsPage.viewModes, productsPage.filter, productsPage.columns
3. productDocuments, productMedia

### Фаза 5: Auth, Login, Catalog, Home

**Обсяг:** login, auth-modal, catalog page, home-page, kanban
**Дії:**
1. login.labels, login.buttons
2. authModal.title, authModal.description
3. catalog.empty, home.cards

### Фаза 6: Field definitions, Formula, Widgets

**Обсяг:** field-definitions-management, formula-editor, composite-subfields-editor, widgets
**Дії:**
1. fieldDefinitions (вже частково в fieldSettings)
2. formulaEditor.labels
3. widgets (multiselect, radio — "Налаштуйте опції...")

### Фаза 7: API errors, field-utils

**Обсяг:** throw new Error, validateFormula
**Дії:**
1. errors.documentLoad, errors.fetchCategories, errors.fetchStatuses
2. validation.formulaRequired (field-utils)

---

## Структура ключів (приклад)

```json
{
  "toasts": {
    "categoryCreated": "Категорію створено",
    "categorySaved": "Категорію збережено",
    "categoryDeleted": "Категорію видалено",
    "productTypeCreated": "Тип товару створено",
    ...
  },
  "validation": {
    "nameRequired": "Вкажіть назву",
    "categoryNameRequired": "Вкажіть назву категорії",
    ...
  },
  "management": {
    "tabs": { "uploader": "Завантажувач", "products": "Облік товарів", "users": "Користувачі та Ролі" },
    ...
  }
}
```

---

## Залежності

- Кожна фаза незалежна — можна виконувати послідовно
- Фаза 1 дає найбільший ефект (toast видно скрізь)
- Потрібно переконатися, що useLocale() доступний у всіх компонентах (LocaleProvider)
