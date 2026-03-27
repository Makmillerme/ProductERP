**1) Прев'ю без опцій:** `SelectField` / `RadioField` / `MultiselectField` — опційний `previewMode`; порожній стан: коротший текст `dynamicField.configureOptionsPreview` (uk/en), `text-xs`, `line-clamp`, `max-w-full`; у Select — компактний trigger. `dynamic-field-renderer` передає `previewMode` у ці віджети.

**2–3) Сітка:** `computeGridLayout` — перед `items.push(field)`: якщо `isFullWidth && col > 0`, доповнити ряд `empty` до `cols`, перенести на наступний ряд (`col=0`), щоб full-row віджет не «з'їдав» плейсхолдери й не ламав ряд. Сортування полів: `order`, tie-breaker `fieldDefinitionId`.

**Майбутнє (п.4 — план):** автоширина рядка — евристика flex для неповних рядів або поле `stretchRow`/`flexGrow` у TabField + міграція.
