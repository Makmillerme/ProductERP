Phase 5 (Widget Refactoring) completed.

5.1 step for number_input: Already implemented in Phase 1 — NumberInput uses step={isInteger ? "1" : "any"}.

5.2 SubFieldWidgetSettings deduplication: Added COMPOSITE_SUBFIELD_SETTINGS in src/config/composite-field.ts — single source of truth for needsPlaceholder, needsDefaultValue, needsUnit, needsPresets, needsFormula, needsValidation per WidgetType. Replaced inline arrays and WIDGETS_WITH_PRESETS/WIDGETS_WITH_FORMULA includes in composite-subfields-editor.tsx with config lookup. Removed imports of WIDGETS_WITH_PRESETS and WIDGETS_WITH_FORMULA from composite-subfields-editor.