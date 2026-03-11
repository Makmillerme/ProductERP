# NumberInput: покращення та виправлення

**Дата:** 2025-02-23

## Виправлення

- Видалено дублікат типу `NumberInputProps` та orphaned код у `number-input.tsx`

## Нові можливості NumberInput

| Параметр | Опис | Джерело (validation JSON)
|----------|------|---------------------------
| `step` | Крок для input (1, 0.01, 0.5) | `step`
| `decimalPlaces` | Фіксована кількість знаків після коми | `decimalPlaces`
| `useThousandSeparator` | Роздільник тисяч (1 234,56), type="text" | `useThousandSeparator`
| `required` | Обовʼязкове поле, показує * | `required`
| `error` | Текст помилки (від батьківської валідації) | —

## Одиниці вимірювання для текстових полів

- **field-definitions-management:** блок «Одиниці вимірювання» показується тільки коли `dataType !== "string"`
- **dynamic-field-renderer:** `displayLabel` не включає unit для полів з `dataType === "string"`
- **composite subfields:** text_input, textarea вже мали `needsUnit: false`; при рендері не передаємо `unit` у TextInput для text_input

## field-constructor: нові опції валідації

- **integer:** step
- **float:** step, decimalPlaces, useThousandSeparator (checkbox)
- **ValidationOption:** додано `inputType: "checkbox"`
- **buildValidationJson:** фільтрує `useThousandSeparator: false`
- **parseValidationJson:** парсить `useThousandSeparator` як boolean

## composite-field.ts

- text_input, textarea вже мали needsUnit: false — без змін