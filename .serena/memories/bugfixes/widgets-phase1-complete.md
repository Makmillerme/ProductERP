Фаза 1 рефакторингу віджетів завершена (2026-02-23).

Зміни в dynamic-field-renderer.tsx:
1. multiselect на top-level: додано гілку widgetType==="multiselect" з чекбоксами, parsePresetValues, збереження comma-separated.
2. number_input: integer використовує parseInt, step="1"; float — parseFloat, step="any"; коректна обробка NaN.
3. evaluateFormula: винесено FORMULA_EXPR_WHITELIST /^[\d\s+\-*/.()eE]+$/, додано eE для scientific notation, коментар про безпеку.