# План локалізації проекту (i18n)

**Мета:** Перевести весь жорстко закодований текст на i18n (uk.json, en.json).

## Поточний стан

- Є `useLocale()`, `t(key)`, `tFormat(key, params)` з `@/lib/locale-provider`
- Локалі в `src/config/locales/uk.json`, `en.json` (layout, fieldSettings, validation, apiDocs, integrations, settings, widgetTypes)
- Багато тексту залишилось безпосередньо в компонентах

---

## Жорстко закодований текст (аудит)

### 1. Toast-повідомлення (toast.success/error)

| Файл | Текст |
|------|-------|
| categories-management | Категорію створено/збережено/видалено, Тип товару створено/збережено/видалено |
| product-types-management | Тип авто створено/збережено/видалено |
| field-definitions-management | Поле створено/збережено/видалено |
| statuses-management | Статус створено/збережено/видалено |
| tabs-config-management | Таб створено/збережено/видалено |
| roles-management | Роль створено, Права збережено |
| users-management | Користувача заблоковано/розблоковано/видалено |
| user-detail-sheet | Права власника передано. Ви тепер адмін. |
| product-documents-tab | Файл видалено |
| products-page | Зміни збережено |

### 2. Валідаційні повідомлення (toast.error)

- Вкажіть назву категорії
- Вкажіть назву типу товару / типу авто
- Вкажіть назву поля
- Вкажіть назву статусу
- Вкажіть назву табу
- Вкажіть назву та код ролі

### 3. UI-елементи (кнопки, labels, заголовки)

**management-page:** Завантажувач, Облік товарів, Користувачі та Ролі, Швидкі періоди..., Поточний місяць, Свій діапазон, Запустити завантаження, Користувачі, Ролі

**catalog page:** Немає категорій, Щоб вести облік товару..., Створити категорію

**login:** Вхід у застосунок, Пароль, Завантаження…

**auth-modal:** Увійти або зареєструватися, Введіть email..., Перевірте пошту...

**products-config:** Редагувати, Додати тип, Видалити, Немає типів товару, Автодетект, Назва, Іконка, Порядок, Опис, Скасувати, Додати папку, Папки документів, Віджети, Сторінка, Рядків на сторінці, Тип даних, Відображення, Використань, За замовчуванням, Приховано на картці, Категорії та типи, Змінити тип даних?, Продовжити

**delete-dialogs:** Видалити категорію?, Видалити тип товару?, текст підтвердження

**product-detail-sheet:** Немає табів, Немає полів, Видалити авто?, Видалити

**products-page:** Таблиця, Канбан, Фільтр, Відображення стовпців, Очистити, Застосувати, Готово, Завантаження…, Немає даних

**users-management:** Заблокувати/Розблокувати користувача, Профіль, Сесії, Передати права власника, Заблоковано, Активний

**roles-management:** Права доступу, Системна роль за замовчуванням

### 4. API / throw new Error

- Помилка завантаження документів (product-documents-tab)
- Failed to fetch categories (catalog-nav-item)
- Failed to fetch statuses (use-statuses)

### 5. field-utils, formula-editor

- validateFormula: "Вкажіть формулу"
- formula-editor: "Немає доступних полів", "Нічого не знайдено", "Оберіть поле або введіть назву для пошуку", "Перевірка (тестові значення 1)"

---

## Фази локалізації

### Фаза 1: Toast та валідація (пріоритет)

**Обсяг:** ~25 toast.success/error  
**Файли:** products-config/*, roles-management, users-management, product-documents-tab, products-page  
**Дії:**
1. Додати секцію `toasts` та розширити `validation` в uk.json, en.json
2. Замінити всі `toast.success/error` на `t("toasts.xxx")`
3. Підключити `useLocale()` у компонентах, де його ще немає

### Фаза 2: Management (таби, кнопки, labels)

**Обсяг:** management-page, products-config dialogs, categories-management, product-types-management, statuses-management, tabs-config-management  
**Дії:**
1. management.tabs, management.uploader, management.buttons
2. productsConfig.labels, productsConfig.buttons, productsConfig.emptyStates
3. deleteDialogs (deleteCategory, deleteProductType, deleteTab)

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
1. fieldDefinitions (частково вже в fieldSettings)
2. formulaEditor.labels
3. widgets (multiselect, radio — "Налаштуйте опції в конфігурації поля")

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
    "productTypeSaved": "Тип товару збережено",
    "productTypeDeleted": "Тип товару видалено",
    "fieldCreated": "Поле створено",
    "fieldSaved": "Поле збережено",
    "fieldDeleted": "Поле видалено",
    "statusCreated": "Статус створено",
    "tabCreated": "Таб створено",
    "roleCreated": "Роль створено",
    "permissionsSaved": "Права збережено",
    "userBanned": "Користувача заблоковано",
    "userUnbanned": "Користувача розблоковано",
    "userDeleted": "Користувача видалено",
    "ownerTransferred": "Права власника передано. Ви тепер адмін.",
    "fileDeleted": "Файл видалено",
    "changesSaved": "Зміни збережено"
  },
  "validation": {
    "categoryNameRequired": "Вкажіть назву категорії",
    "productTypeNameRequired": "Вкажіть назву типу товару",
    "fieldNameRequired": "Вкажіть назву поля",
    "statusNameRequired": "Вкажіть назву статусу",
    "tabNameRequired": "Вкажіть назву табу",
    "roleNameAndCodeRequired": "Вкажіть назву та код ролі",
    "formulaRequired": "Вкажіть формулу"
  },
  "management": {
    "tabs": {
      "uploader": "Завантажувач",
      "products": "Облік товарів",
      "users": "Користувачі та Ролі"
    },
    "uploader": {
      "quickPeriods": "Швидкі періоди: останні 7 днів, 30 днів або поточний місяць. Або вкажіть власний діапазон дат.",
      "currentMonth": "Поточний місяць",
      "customRange": "Свій діапазон",
      "runUpload": "Запустити завантаження"
    },
    "users": "Користувачі",
    "roles": "Ролі"
  }
}
```

---

## Залежності

- Кожна фаза незалежна — можна виконувати послідовно
- Фаза 1 дає найбільший ефект (toast видно скрізь)
- Потрібно переконатися, що `useLocale()` доступний у всіх компонентах (LocaleProvider в layout)
