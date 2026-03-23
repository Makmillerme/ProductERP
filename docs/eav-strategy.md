# Стратегія EAV (Entity-Attribute-Value)

**Дата:** 2026-02-23  
**Статус:** План створено. Детальний план: `docs/plan-product-eav-refactor.md`.

---

## Рішення: ProductFieldValue (EAV)

Обрано **ProductFieldValue** — існуюча таблиця в схемі. Реалізація за планом у `docs/plan-product-eav-refactor.md`.

### Маппінг dataType → колонка

| dataType     | ProductFieldValue | Приклад           |
|-------------|-------------------|-------------------|
| string      | textValue         | "Текст"           |
| integer, float | numericValue   | 123, 45.67        |
| boolean     | textValue         | "true"/"false"    |
| date, datetime | dateValue      | DateTime          |
| composite, multiselect | textValue | JSON string       |

### UI

- `code` (FieldDefinition) — ключ для читання/запису значень.
- Без systemColumn: всі поля йдуть через EAV.
