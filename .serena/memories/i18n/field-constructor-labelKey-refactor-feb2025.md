field-constructor.ts refactored: all labels use labelKey for i18n.

CHANGES:
- DATA_TYPES: label -> labelKey (dataTypes.string, etc.)
- WIDGET_TYPES: label -> labelKey (widgetTypes.text_input, etc.)
- Removed WIDGET_TYPE_LABELS, DATA_TYPE_LABELS
- BOOLEAN_PRESET_OPTIONS: label -> labelKey (fieldConstructor.booleanYes/No)
- BOOLEAN_PRESET_VALUES_JSON: now stores [{"value":"true"},{"value":"false"}] - labels resolved at display via resolveBooleanOptionLabels() in field-utils
- TEXT_FORMAT_PRESETS: label -> labelKey
- FILE_SIZE_UNITS: label -> labelKey
- VALIDATION_OPTIONS: label/hint -> labelKey/hintKey
- FIELD_TEMPLATES: label -> labelKey

CONSUMERS UPDATED:
- field-definitions-management: t(labelKey), t(hintKey), removed DATA_TYPE_LABELS/WIDGET_TYPE_LABELS
- composite-subfields-editor: t(w.labelKey), t(opt.labelKey), t(opt.hintKey), t(o.labelKey)
- tabs-config-management: removed WIDGET_TYPE_LABELS, use t(widgetTypesShort.x)
- dynamic-field-renderer: resolveBooleanOptionLabels() for select/radio/multiselect when dataType=boolean

NEW: field-utils.resolveBooleanOptionLabels(opts, t) for boolean options display.