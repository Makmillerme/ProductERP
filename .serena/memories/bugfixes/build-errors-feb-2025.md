Виправлення помилок білду (лютий 2025).

**Critical (rules-of-hooks):** product-card-preview-modal — useState/useEffect викликалися після early return. Перенесено shouldRender useState і useEffect на початок компонента.

**TypeScript:** 1) categories route: body.name possibly undefined — винесено в змінну після перевірки. 2) product-card-preview-modal: FieldDefinitionItem без dataType — додано dataType, presetValues, validation, unit, defaultValue, placeholder. 3) removeFieldMut onMutate — типізація prev.tabs.fields. 4) dynamic-field-renderer: Product[typeof productKey] не працює для custom keys — прибрано cast, onUpdate приймає unknown. 5) product-detail-sheet: DynamicTabsProps.onClickAddField — додано row?, col? для узгодженості.

**ESLint:** display-page (displayTabs unused), add-field-dialog (categoryNameById — передається в FieldGroup), field-grid-editor (idx unused), display-settings (tableColumns/filterableFields в useMemo), products-page (useEffect/useCallback deps), product-documents-tab (t, tFormat), field-definitions (useCallback t, useEffect eslint-disable), user-detail-sheet (t).

**Інше:** field-definitions resetForm — видалено setSystemColumn("") після видалення systemColumn state.