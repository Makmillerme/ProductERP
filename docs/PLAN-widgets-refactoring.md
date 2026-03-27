# План рефакторингу віджетів

**Дата:** 2026-03-06  
**Контекст:** 11 типів віджетів, DynamicFieldRenderer, CompositeSubFieldsEditor, field-definitions-management.

---

## 1. Матриця віджетів: де рендериться кожен

| Віджет | field-constructor | DynamicFieldRenderer (top-level) | CompositeField (subfields) | field-definitions-management |
|--------|------------------|----------------------------------|-----------------------------|------------------------------|
| **text_input** | ✓ | ✓ (fallback) | ✓ | ✓ |
| **number_input** | ✓ | ✓ | ✓ | ✓ |
| **textarea** | ✓ | ✓ | ✓ | ✓ |
| **select** | ✓ | ✓ (status + presetValues) | ✓ | ✓ |
| **multiselect** | ✓ | ❌ **відсутній** | ✓ | ✓ |
| **radio** | ✓ | ✓ | ✓ | ✓ |
| **calculated** | ✓ | ✓ | ✓ | ✓ |
| **media_gallery** | ✓ | ✓ | — | ✓ |
| **file_upload** | ✓ | ✓ | — | ✓ |
| **datepicker** | ✓ | ✓ | ✓ | ✓ |
| **composite** | ✓ | ✓ | — | ✓ |

**COMPOSITE_ALLOWED_WIDGETS** (підполя composite): text_input, number_input, textarea, select, multiselect, radio, datepicker, calculated.  
**Виключені:** composite, media_gallery, file_upload.

---

## 2. Виявлені прогалини

### 2.1 Критична: multiselect на top-level

**Проблема:** У `DynamicFieldRenderer` немає гілки для `widgetType === "multiselect" when isSystem && systemColumn.`

**Поведінка:** multiselect падає в fallback до text input (рядки 606–616). Тобто поле з чекбоксами зберігається як текст, але на картці відображається як текстовий рядок.

**Файл:** `src/features/vehicles/components/dynamic-field-renderer.tsx`  
**Рішення:** Додати гілку `widgetType === "multiselect"` з логікою як у CompositeField (parsePresetValues, чекбокси, збереження через comma-separated string).

### 2.2 EAV placeholder

**Проблема:** Поля з `!isSystem || !systemColumn` показують placeholder "EAV (буде додано)" (рядки 468–482).

**Наслідок:** Користувач може створити поле з будь-яким віджетом, але воно не показуватиметься на картці, якщо немає systemColumn.

**Рішення:**  
- Короткостроково: залишити як є, зрозуміти з PM, чи потрібен EAV.  
- Довгостроково: підтримка EAV або зміна моделі (наприклад, JSON columns).

### 2.3 Некоректний fallback у CompositeField

**Проблема:** У CompositeField (рядки 384–341) для невідомого `widgetType` використовується generic `<Input>`. Якщо додати новий віджет в COMPOSITE_ALLOWED_WIDGETS, але забути його в CompositeField — буде Input замість потрібного UI.

**Рішення:** Додати явний switch або map з exhaustive check — щоб TypeScript не дозволяв невідомий widgetType.

---

## 3. Виявлені баги

### 3.1 number_input: integer vs float

**Файл:** `dynamic-field-renderer.tsx`, рядки 579–600.  
**Проблема:** У top-level використовується `parseFloat(v)` для всіх числових полів. Для integer краще `parseInt(v, 10)`.

**Рішення:**  
```ts
const v = e.target.value;
const parsed = dataType === "integer" ? parseInt(v, 10) : parseFloat(v);
onUpdate(vehicleKey, (v === "" ? null : (Number.isNaN(parsed) ? null : parsed)) as Product[typeof vehicleKey]);
```

### 3.2 Валідація presetValues

**Проблема:** `parsePresetValues` і `parseCompositePresetValues` не валідують формат JSON. Некоректний JSON дає порожній масив без помилки.

**Рішення:** Додати toast/error при невалідному JSON у UI або при збереженні (field-definitions-management).

### 3.3 Формула calculated: безпека

**Проблема:** `evaluateFormula` використовує `Function('"use strict"; return (' + expr + ")")()` — ризик code injection, якщо expr не обмежений.

**Файл:** `dynamic-field-renderer.tsx`, рядки 62–80.  
**Рішення:** Додати whitelist дозволених операторів (+, -, *, /, (, ), числа) або використовувати безпечний парсер виразів.

### 3.4 multiselect: default value

**Проблема:** У CompositeField для multiselect `defaultValue` очікується як рядок (comma-separated), але `sf.defaultValue` може бути некоректним JSON.

**Рішення:** Уніфікувати формат defaultValue для multiselect (рядок або масив) і додати парсинг.

---

## 4. Архітектурні проблеми

### 4.1 isSystem / systemColumn

**Поточна логіка:**  
- `DynamicFieldRenderer`: якщо `!isSystem || !systemColumn` → EAV placeholder.  
- composite: `vehicleKey = isSystem && systemColumn ? systemColumn : code`.  
- composite може зберігати JSON у `code` (EAV) або у `systemColumn` (Product).

**Проблеми:**  
- Складність: два шляхи (system vs EAV) для одного рендерера.  
- Плутанина: `isSystem` з API, але не використовується в UI (field-definitions-management).  
- Немає чіткого мапінгу systemColumn → Product для всіх полів.

**Рекомендація:** Залишити isSystem/systemColumn для canDelete. Документувати мапінг systemColumn → Product в окремому файлі.

### 4.2 Дублювання логіки

**Проблема:** Логіка select/radio/multiselect/datepicker/calculated повторюється в DynamicFieldRenderer і в CompositeField. Різні реалізації (наприклад, DateField).

**Рішення:** Винести віджети в окремі компоненти (наприклад, `src/features/vehicles/components/widgets/`) і передавати їм уніфікований props: `value`, `onChange`, `options`, `disabled`, тощо.

### 4.3 ЕAV placeholder

**Проблема:** Поля без systemColumn показують "EAV (буде додано)" — замість цього можна показувати read-only або disabled input з поточним значенням з EAV (якщо воно буде).

**Рішення:** Вирішити залежно від плану EAV.

---

## 5. Пріоритизований план рефакторингу

### Фаза 1: Критичні виправлення (1–2 дні)

| # | Задача | Файл | Пріоритет |
|---|--------|------|-----------|
| 1.1 | Додати multiselect на top-level у DynamicFieldRenderer | dynamic-field-renderer.tsx | P0 |
| 1.2 | Виправити integer/float для number_input | dynamic-field-renderer.tsx | P1 |
| 1.3 | Обмежити evaluateFormula (whitelist regex) | dynamic-field-renderer.tsx | P1 |

### Фаза 2: Уніфікація віджетів (2–3 дні)

| # | Задача | Файл | Пріоритет |
|---|--------|------|-----------|
| 2.1 | Винести віджети в окремі компоненти | widgets/*.tsx | P2 |
| 2.2 | Використовувати єдині компоненти в DynamicFieldRenderer і CompositeField | dynamic-field-renderer.tsx, composite-subfields-editor.tsx | P2 |
| 2.3 | Додати exhaustive switch для widgetType у CompositeField | dynamic-field-renderer.tsx (CompositeField) | P2 |

### Фаза 3: Типи та валідація (1–2 дні)

| # | Задача | Файл | Пріоритет |
|---|--------|------|-----------|
| 3.1 | Валідація presetValues при збереженні | field-definitions-management.tsx, API | P3 |
| 3.2 | Уточнити типи для multiselect defaultValue | composite-field.ts, CompositeSubField | P3 |
| 3.3 | Додати unit tests для parsePresetValues, parseCompositePresetValues | __tests__/ | P3 |

### Фаза 4: Архітектура (1–2 дні)

| # | Задача | Файл | Пріоритет |
|---|--------|------|-----------|
| 4.1 | Документувати мапінг systemColumn → Product | docs/ | P4 |
| 4.2 | Визначити стратегію EAV (placeholder vs read-only) | docs/ | P4 |
| 4.3 | Розглянути видалення/спрощення isSystem у UI (вже частково PLAN-field-definitions-modernization) | field-definitions-management.tsx | P4 |

### Фаза 5: Cleanup (опційно)

| # | Задача | Пріоритет |
|---|--------|-----------|
| 5.1 | Покращити step для number_input (integer → step="1") | P5 |
| 5.2 | Видалення дублікатів у SubFieldWidgetSettings | P5 |

---

## 6. Порядок виконання

1. **Фаза 1** — критичні баги (multiselect, integer, formula)
2. **Фаза 2** — уніфікація віджетів (зменшення дублювання)
3. **Фаза 3** — валідація та тести
4. **Фаза 4** — документація та архітектура
5. **Фаза 5** — дрібні покращення

---

## 7. Залежності

- `field-constructor.ts`: WIDGET_TYPES, DATA_TYPES, WIDGETS_WITH_PRESETS — не змінювати без узгодження
- `composite-field.ts`: COMPOSITE_ALLOWED_WIDGETS — синхронізувати з DynamicFieldRenderer при додаванні нового віджета
- `use-vehicle-config.ts`: VehicleConfigTabField.fieldDefinition — isSystem, systemColumn приходять з API
- Prisma: FieldDefinition.isSystem, systemColumn — залишити для сумісності
