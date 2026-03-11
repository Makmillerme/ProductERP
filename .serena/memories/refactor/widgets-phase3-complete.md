Фаза 3 рефакторингу віджетів завершена (2026-02-23).

3.1 Валідація presetValues:
- src/lib/validate-preset-values.ts: validatePresetValuesForWidget(json, widgetType) — перевірка JSON для select/radio/multiselect, file_upload, composite
- field-definitions-management: виклик валідації перед handleSave, toast при помилці
- API POST/PATCH: валідація presetValues, 400 при некоректному форматі

3.2 Типи multiselect:
- composite-field.ts: JSDoc для defaultValue — comma-separated для multiselect

3.3 Unit-тести:
- vitest додано, vitest.config.ts, vitest.setup.ts
- field-utils.test.ts: parsePresetValues, evaluateFormula, parseDateValue, formatDateToYyyyMmDd
- composite-field.test.ts: parseCompositePresetValues, stringifyCompositePresetValues
- validate-preset-values.test.ts: validatePresetValuesForWidget
- postcss.config.mjs: plugins object format для сумісності з vitest
- tsconfig: exclude vitest.config.ts, vitest.setup.ts