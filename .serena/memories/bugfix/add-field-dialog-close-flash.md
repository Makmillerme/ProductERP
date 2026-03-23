## AddFieldDialog: миготіння повного списку при закритті

### Причина
При `addFieldDialogOpen=false`:
1. `useProductConfig(addFieldDialogOpen ? productTypeId : null)` отримував `null` → query disabled
2. `productConfig` ставав `undefined`
3. `assignedFieldIds` = useMemo над `productConfig?.tabs ?? []` → порожній Set
4. `groupedFields` = allFields без фільтра assigned → показувались УСІ поля
5. Radix Dialog тримає контент під час анімації закриття (~200ms)
6. Користувач бачив повний список на пів секунди

### Виправлення
Заміна умови в ProductCardPreviewModal:
- Було: `useProductConfig(addFieldDialogOpen ? productTypeId : null)`
- Стало: `useProductConfig(open && productTypeId ? productTypeId : null)`

Тепер productConfig залишається доступним, поки відкритий батьківський ProductCardPreviewModal. При закритті AddFieldDialog assignedFieldIds і groupedFields залишаються коректними під час exit-анімації.