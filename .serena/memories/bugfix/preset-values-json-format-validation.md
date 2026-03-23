## presetValues: "Некоректний формат: очікується JSON масив" для radio/multiselect

### Причина
Валідатор validate-preset-values.ts приймав лише масив `[{value, label?}, ...]` для select/radio/multiselect. Але UI для radio/multiselect зберігає формат `{ layout, options }` через stringifyOptionsWithLayout (layout row/column). При збереженні валідація відхиляла коректні дані.

### Виправлення
Оновлено validate-preset-values.ts: приймає обидва формати:
1. Масив: `[{value, label?}, ...]`
2. Об'єкт: `{ layout?, options: [...] }`

Повідомлення про помилку: "Некоректний формат: очікується JSON масив або об'єкт { options: [...] }".