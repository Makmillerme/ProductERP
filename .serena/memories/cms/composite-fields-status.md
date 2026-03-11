# Складні поля (Composite) — статус (2026-02)

## Що працює

### 1. Редактор налаштувань (CompositeSubFieldsEditor)
- Layout: row, column, grid (з gridColumns, gridRows)
- Підполя: label, code (slug), widgetType, dataType
- Віджети підполів: text_input, number_input, textarea, select, multiselect, radio, datepicker, calculated
- Одиниці: категорія + розмірність (MEASUREMENT_CATEGORIES), власне значення (CUSTOM_UNIT_VALUE)
- Placeholder, defaultValue, presetValues (JSON), formula (для calculated), validation
- Видалення: червоний X, AlertDialog з підтвердженням
- i18n через useLocale()

### 2. Відображення (DynamicFieldRenderer → CompositeField)
- Системне поле cargo_dimensions: зберігається в Vehicle.cargo_dimensions, оновлюється через onUpdate
- Підтримка всіх віджетів підполів: text_input, number_input, textarea, select, radio, multiselect, datepicker, calculated
- Layout: row, column, grid
- parseCompositeValue: JSON або legacy формат (×)
- evaluateFormula для calculated з плейсхолдерами {slug}

### 3. Конфігурація (field-definitions-management)
- widgetType=composite показує CompositeSubFieldsEditor замість presetValues textarea
- Приховано для composite: unit, placeholder, defaultValue (на рівні поля)
- presetValues зберігає CompositePresetValues (layout, subFields)

## Що НЕ працює

### 1. Кастомні (несистемні) складені поля
- compositeKey = code (бо !isSystem)
- Vehicle тип має фіксовані ключі — vehicle[code] завжди undefined
- VehicleFieldValue (EAV) не інтегрований: getVehicleById не завантажує fieldValues
- onUpdate(vehicleKey, value) для code не зберігається — vehicles-db не знає про динамічні ключі

### 2. Потрібно для кастомних composite
- API: при getVehicle включати fieldValues, мерджити в обʼєкт vehicle по fieldDefinition.code
- API: при update vehicle — зберігати composite JSON у VehicleFieldValue (textValue) за fieldDefinitionId
- Або: розширити Vehicle тип/таблицю для динамічних полів (менш гнучко)

## Файли
- src/config/composite-field.ts — типи, parse/stringify
- src/features/management/.../composite-subfields-editor.tsx — редактор
- src/features/management/.../field-definitions-management.tsx — форма поля
- src/features/vehicles/.../dynamic-field-renderer.tsx — CompositeField, рендер