## radio/multiselect: layout як у складеного поля

### Зміни
1. **RadioField, MultiselectField:** layout row → grid grid-cols-3 gap-2 (було flex flex-wrap gap-3)
2. **layout column:** flex flex-col gap-2 (без змін)
3. **DynamicFieldRenderer:** radio і multiselect завжди col-span-full — займають весь рядок як composite