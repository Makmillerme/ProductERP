## field-definitions-management sheet: уніфікація відступів

### Зміни
- needsPresetValues: батьківський блок використовує SHEET_FIELD_GAP (gap-2)
- radio/multiselect: прибрано grid-cols-2 (був один елемент — зайвий простір), layout і options у двох окремих блоках з SHEET_FIELD_GAP
- composite, boolean, select: обгорнуто в grid SHEET_FIELD_GAP для консистентності
- fd-code: замінено inline grid gap-2 на SHEET_FIELD_GAP