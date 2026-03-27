## Table: прибрано дефолтний `min-w-max`

**Проблема:** У `src/components/ui/table.tsx` на `<table>` завжди було `min-w-max` (`min-width: max-content`), що ламало `w-full table-fixed` + colgroup у статусах та інших management-таблицях — з’являвся зайвий горизонтальний скрол.

**Зміна:** Дефолт лише `caption-bottom text-sm`; ширину задають виклики:
- фіксовані таблиці: `className="w-full table-fixed"` (як раніше);
- широкі / динамічні колонки (products-page з даними): `w-max`;
- таблиця сесій у `user-detail-sheet`: явно додано `className="w-max"` замість неявного min-w-max.

**Дата:** 2025-03-25
