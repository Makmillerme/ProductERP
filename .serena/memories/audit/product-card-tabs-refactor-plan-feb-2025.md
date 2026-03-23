# Аудит Картки товару з табами — план рефакторингу

## Виявлені проблеми

### 1. addFieldMut у ProductCardPreviewModal — не враховує FULL_ROW_WIDGETS
- При додаванні поля використовується `order: maxOrder + 1`
- TabsConfigManagement для media_gallery/file_upload/composite/textarea використовує `order = (floor(maxOrder/3)+1)*3`
- Баг: галерея/документи в прев'ю потрапляють не на окремий рядок

### 2. FieldGridEditor — мертвий код
- Компонент існує в field-grid-editor.tsx, але ніде не імпортується
- ProductDetailSheet використовує inline grid у DynamicTabs, не FieldGridEditor
- Рішення: видалити field-grid-editor.tsx або інтегрувати

### 3. Дублювання FULL_ROW_WIDGETS / FULL_WIDTH_WIDGETS
- tabs-config-management: FULL_ROW_WIDGETS
- grid-layout: FULL_WIDTH_WIDGETS (той самий набір)
- Рішення: експортувати з grid-layout, імпортувати в tabs-config

### 4. Hardcoded error messages у product-card-preview-modal
- "Failed to load tab", "Failed to add field", "Failed to remove field"
- Потрібно використовувати t() для i18n

### 5. Застарілий коментар у product-detail-sheet
- Рядок 57: "показує Закрити замість Зберегти" — зараз показуються Скасувати + Зберегти

### 6. Optimistic update addFieldMut — order: 999
- Оптимістичне оновлення ставить order: 999, що не відповідає реальному placement
- Краще використовувати правильний order з mutationFn

### 7. fetchTabDetail викликається двічі при add/remove
- addFieldMut і removeFieldMut обидва fetchTabDetail — нормально, різні мутації
- Можна передати t() в fetchTabDetail для локалізації помилок

## План рефакторингу

1. **grid-layout.ts**: експортувати FULL_WIDTH_WIDGETS як FULL_ROW_WIDGETS (або shared constant)
2. **tabs-config-management**: імпортувати з grid-layout, видалити локальну константу
3. **product-card-preview-modal**: 
   - addFieldMut: обчислювати order для full-row як (floor(maxOrder/3)+1)*3
   - fetchTabDetail: приймати t, використовувати t("productsConfig.tabsConfig.loadTabFailed")
   - Локалізувати "Failed to add field", "Failed to remove field"
4. **product-detail-sheet**: оновити коментар previewMode
5. **field-grid-editor**: видалити (мертвий код) або залишити якщо планується використання — перевірити історію
6. **addFieldMut optimistic**: використовувати правильний order замість 999