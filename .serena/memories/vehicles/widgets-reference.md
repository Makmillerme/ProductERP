Список віджетів у nextjs_vmd (field-constructor.ts, dynamic-field-renderer.tsx). Фокус: управлінка (Модель даних). Скрінрідер/a11y не потрібні в проєкті.

1. text_input — Текстовий рядок. Є: label, placeholder, unit. Валідація (minLength, maxLength) налаштовується в управлінці, зберігається в БД, але не застосовується на картці товару (поки не ліземо).

2. number_input — Число. Є: label, placeholder, unit, integer/float, step. Немає: min/max на input.

3. textarea — Багаторядковий текст. Є: label, placeholder, rows, resize. Немає: лічильник символів.

4. select — presetValues: JSON [{value, label}]. Є: Shadcn Select. Немає: обробка порожніх опцій.

5. multiselect — presetValues: JSON [{value, label}]. Зберігає comma-separated. Немає: обробка порожніх опцій.

6. radio — presetValues: JSON [{value, label}]. Немає: обробка порожніх опцій.

7. calculated — validation зберігає формулу {x}+{y}. Є: evaluateFormula.

8. media_gallery — Є: carousel, lightbox, upload, delete.

9. file_upload — presetValues: JSON {folders:[{code,label}]}. Є: VehicleDocumentsTab.

10. datepicker — Є: Calendar, uk locale. Немає: кнопка Очистити, datetime (час).

11. composite — presetValues: JSON {layout, gridColumns, gridRows, subFields:[...]}. Є: CompositeSubFieldsEditor. subFields — будь-які віджети крім composite, media_gallery, file_upload.