# Уніфікована структура toolbar на сторінках управління

## Канонічна структура (CategoriesManagement, StatusesManagement)
- Корінь: `div.flex.flex-col.gap-4`
- Toolbar: `div.flex.flex-col.gap-2.sm:flex-row.sm:items-center.sm:gap-2`
- Контент: прямі нащадки gap-4

## Зміни (2025-02)

### FieldDefinitionsManagement
- Видалено зайвий wrapper `div.flex.flex-col.gap-3`
- Toolbar приведено до канону: search (form) + widgets + add в одному рядку `flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2`
- Порядок: пошук, віджети, кнопка + (як у Categories: пошук, дія)

### TabsConfigManagement (Картка товару)
- Toolbar рядок з кнопкою «+» приведено до канону: `flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2`