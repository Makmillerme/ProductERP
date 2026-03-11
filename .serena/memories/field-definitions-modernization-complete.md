Field Definitions Modernization завершено (2025-02-23).

Зміни:
- Таблиця: видалено колонку Системне, colSpan 5.
- Форма: прибрано Badge Системне, поле Код завжди редагується, Відображення та Тип даних завжди Select.
- Composite: в колонці Тип даних показується —.
- handleSave: завжди вимагає code, завжди оновлює code/dataType/widgetType/presetValues/validation/defaultValue.
- canDelete: залишено перевірку !selectedField.isSystem для сумісності з API.
- Видалено невикористані: isSystem змінна, Badge імпорт.