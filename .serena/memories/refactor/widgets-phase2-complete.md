Фаза 2 рефакторингу віджетів завершена (2026-02-23).

Створено:
- src/features/vehicles/lib/field-utils.ts: parsePresetValues, evaluateFormula, parseDateValue, formatDateToYyyyMmDd, SelectOption, FORMULA_EXPR_WHITELIST
- src/features/vehicles/components/widgets/: SelectField, RadioField, MultiselectField, DateField, NumberInput, TextInput, TextareaField, CalculatedField

Зміни:
- DynamicFieldRenderer: використовує віджети з ./widgets, видалено локальні DateField/SelectField, parsePresetValues, evaluateFormula
- CompositeField: switch по sf.widgetType з усіма COMPOSITE_ALLOWED_WIDGETS, default fallback до TextInput
- Видалено невикористані імпорти: format, isValid, uk, Popover, Calendar, Button, CalendarIcon, Select, Textarea