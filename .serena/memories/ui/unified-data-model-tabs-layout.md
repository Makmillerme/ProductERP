# Уніфікований layout табів Data Model

## Зміни (лютий 2025)

1. **data-model-page.tsx**: Dropdown категорії перенесено з рівня сторінки (між TabsList і TabsContent) всередину TabsContent для табів "Поля та дані" і "Картка товару". Структура як у Категорій: flex flex-col gap-4, перший рядок = flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2 (Select + кнопка Add для картки).

2. **FieldDefinitionsManagement**: Прибрано зайвий wrapper div.flex.flex-col.gap-3. Перший рядок тепер flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2 (як Categories) — віджети + пошук в одному рядку.

3. **TabsConfigManagement**: Видалено мертвий блок з кнопкою Add (умова !openAddTabRef завжди false). Кнопка Add тепер тільки в dropdown-рядку на рівні data-model-page.