## Виправлення: лейбл Макет, відступи, radio/multiselect на картці

### 1. Лейбл Макет (field-definitions-management)
- Прибрано text-xs font-normal text-muted-foreground — тепер використовує стандартний Label (text-sm font-medium)
- Додано htmlFor="fd-layout" та id="fd-layout" на SelectTrigger

### 2. Відступи після Макету
- Батьківський блок radio/multiselect: SHEET_FIELD_GAP → SHEET_FORM_GAP (gap-3) між layout і options
- Обгорнуто в div з grid SHEET_FORM_GAP замість fragment

### 3. Radio name collision на картці
- Причина: кілька табів з полями одного коду — однаковий name для radio, групування між табами
- Виправлення: name={code ?? fieldDefinition.id} → name={`radio-${field.id}`}
- field.id унікальний для кожного TabField