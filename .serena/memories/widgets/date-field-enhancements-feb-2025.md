# Віджет Дата (datepicker) — доопрацювання (лютий 2025)

## Проблеми (до змін)
- datetime не підтримувався — час втрачався при збереженні
- formatDateToYyyyMmDd відкидав час
- validation.required не застосовувався до DateField
- placeholder з конфігу не передавався
- defaultValue з конфігу не передавався для звичайного datepicker
- Composite datepicker не передавав placeholder, required, dataType

## Зміни

### field-utils.ts
- Додано `formatDateForStorage(d, mode: "date" | "datetime")` — для date повертає YYYY-MM-DD, для datetime — ISO string (formatISO)
- parseDateValue вже коректно парсить ISO datetime (new Date)

### date-field.tsx
- Новий проп `mode: "date" | "datetime"` — за замовчуванням "date"
- Для datetime: додано Input type="time" (Shadcn) — окремо біля кнопки та в Popover під Calendar
- Відображення: date — "d MMMM yyyy", datetime — "d MMMM yyyy, HH:mm" (uk locale)
- Збереження: formatDateForStorage(d, mode)
- Пропи `required`, `placeholder` — передаються з конфігу

### dynamic-field-renderer.tsx
- DateField отримує: mode={dataType === "datetime" ? "datetime" : "date"}, placeholder, required, value={rawValue ?? defaultValue ?? null}
- Composite datepicker: parseValidationJson(sf.validation) для required, передає placeholder, mode, required

### Тести (field-utils.test.ts)
- parseDateValue: тест для ISO datetime
- formatDateForStorage: тести для date та datetime режимів

## Файли
- src/features/vehicles/lib/field-utils.ts
- src/features/vehicles/components/widgets/date-field.tsx
- src/features/vehicles/components/dynamic-field-renderer.tsx
- src/features/vehicles/lib/field-utils.test.ts