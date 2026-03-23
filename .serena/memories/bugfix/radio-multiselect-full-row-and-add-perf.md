## radio/multiselect: повна ширина рядка + оптимізація додавання

### 1. FULL_ROW_WIDGETS (grid-layout.ts)
- Додано "radio" та "multiselect" до FULL_ROW_WIDGETS
- computeGridLayout та getGridColSpan тепер трактують їх як повноширинні (3 колонки)

### 2. colSpan при додаванні
- product-card-preview-modal: colSpan: isFullRow ? 3 : 1 (було завжди 1)
- tabs-config-management: colSpan: isFullRow ? 3 : 1 при addField

### 3. Оптимістичне оновлення з presetValues
- onMutate addFieldMut: бере повне fieldDefinition з allFields (presetValues, validation, unit, defaultValue, placeholder)
- Уникає миготіння "Configure options" при додаванні radio/multiselect