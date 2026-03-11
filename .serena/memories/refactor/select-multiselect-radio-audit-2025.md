# Аудит Select, Multiselect, Radio (2025-02)

## Огляд функціоналу

### OptionsEditor (options-editor.tsx)
- Валідація value за dataType: string (slugify), integer, float, boolean
- Для integer/float/boolean — два інпути: підпис + значення
- Перевірка дублікатів, помилки валідації

### parsePresetValues (field-utils.ts)
- JSON → масив SelectOption[]
- Фільтр: value має бути string, не порожній
- label fallback: o.label ?? o.value

### Віджети
- **SelectField**: Radix Select, value не в options → додаємо тимчасову опцію
- **RadioField**: input type=radio, value === o.value
- **MultiselectField**: value = comma-separated, split/join
- **Порожні опції**: показуємо "Налаштуйте опції в конфігурації поля"

### dynamic-field-renderer
- Top-level: systemColumn + isSystem (status використовує statusOptions)
- Composite: підполя з sf.presetValues
- Multiselect для status не має окремого statusOptions — потрібні presetValues

### validate-preset-values
- select/radio/multiselect: масив з value непустим
- file_upload: folders
- composite: subFields

## Виправлення (2025-02)

1. **parsePresetValues**: фільтр value.trim() !== ""
2. **validate-preset-values**: відхиляємо value === ""
3. **SelectField**: value не в options → додаємо {value, label: value}
4. **SelectField, RadioField, MultiselectField**: empty options → placeholder "Налаштуйте опції" 

## Залишилось (не критично)

- required проп для select/radio/multiselect не передається
- Multiselect: orphan-значення (в value не в options) не показуються
- Унікальність value в validate-preset-values не перевіряється