## Composite field: hideLabel та уніфікація лейблів підполів

### hideLabel
- **CompositePresetValues** (`src/config/composite-field.ts`): додано `hideLabel?: boolean` — приховує назву складеного поля на картці товару та в прев'ю.
- **CompositeSubFieldsEditor**: чекбокс «Приховати назву складеного поля» поруч з вибором layout.
- **CompositeField** (`dynamic-field-renderer.tsx`): `<Label>{label}</Label>` рендериться тільки якщо `!config.hideLabel`.
- Локалізація: `composite.hideLabel` в uk.json та en.json.

### Лейбли підполів
- Підполя складеного поля тепер використовують `compact={false}` замість `compact={true}`.
- Лейбли підполів мають той самий вигляд (text-sm font-medium), що й звичайні поля на картці товару та в прев'ю.