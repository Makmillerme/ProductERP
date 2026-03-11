Аудит віджетів (2026-02-23). 11 віджетів: text_input, number_input, textarea, select, multiselect, radio, calculated, media_gallery, file_upload, datepicker, composite.

Прогалини: multiselect відсутній на top-level у DynamicFieldRenderer (fallback до text); EAV placeholder для !isSystem; CompositeField fallback для невідомого widgetType.

Баги: number_input top-level використовує parseFloat для integer (рядок 843); evaluateFormula через Function() — ризик injection; presetValues без валідації JSON.

План: Фаза 1 (P0-P1) multiselect, integer/float, formula whitelist; Фаза 2 винести віджети в widgets/*; Фаза 3 валідація presetValues, тести; Фаза 4 docs systemColumn; Фаза 5 step, cleanup.

Детальний план: docs/PLAN-widgets-refactoring.md