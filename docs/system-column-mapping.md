# Мапінг systemColumn → Product

**Дата:** 2026-02-23  
**Контекст:** FieldDefinition.systemColumn зберігає ключ колонки таблиці Product. DynamicFieldRenderer використовує його для читання/запису значень на картці товару.

---

## Правила

- **isSystem=true** і **systemColumn** задані — поле мапиться на колонку Product, рендериться відповідним віджетом.
- **!isSystem || !systemColumn** — показується placeholder «EAV (буде додано)»; значення зберігатимуться в EAV після реалізації.
- **composite**: `vehicleKey = isSystem && systemColumn ? systemColumn : code` — для системного composite використовується systemColumn, інакше code (EAV).

---

## Валідні значення systemColumn (ключі Product)

Усі ключі мають збігатися з `keyof Product` (окрім `id`, `payload_json`).

### Таб товару — загальний блок
| systemColumn | Тип | Примітка |
|--------------|-----|----------|
| status | string | Статус |
| vin | string | Синхронізується з serial_number |
| serial_number | string | |
| product_type | string | |

### Таб Авто — загальні характеристики
| systemColumn | Тип | |
|--------------|-----|---|
| brand | string | |
| model | string | |
| modification | string | |
| year_model | number | |
| producer_country | string | |
| location | string | |
| description | string | |

### Таб Авто — технічні характеристики
| systemColumn | Тип | Примітка |
|--------------|-----|----------|
| gross_weight_kg | number | |
| payload_kg | number | |
| engine_cm3 | number | |
| power_kw | number | |
| wheel_formula | string | |
| seats | number | |
| transmission | string | |
| mileage | number | |
| body_type | string | |
| condition | string | |
| fuel_type | string | |
| cargo_dimensions | string | Спеціальний UI: 3 поля Д×Ш×В |

### Таб ВМД
| systemColumn | Тип | Примітка |
|--------------|-----|----------|
| mrn | string | |
| uktzed | string | |
| create_at_ccd | string | |
| created_at | string | Read-only, форматується |
| customs_value | number | |
| customs_value_plus_10_vat | number | |
| customs_value_plus_20_vat | number | |

### Таб Вартість
| systemColumn | Тип | |
|--------------|-----|---|
| cost_without_vat | number | |
| cost_with_vat | number | |
| vat_amount | number | |
| currency | string | |

### Медіа та файли
| systemColumn | Тип | Примітка |
|--------------|-----|----------|
| media | ProductMedia[] | widgetType=media_gallery; не з Product напряму |

**file_upload** — не мапить на одну колонку Product; документи зберігаються окремо.

---

## Спеціальна обробка в DynamicFieldRenderer

- **code=cargo_dimensions** — завжди CargoDimensionsField (3×number), незалежно від systemColumn.
- **code=created_at** — read-only, форматування дати.
- **code=vin** — при зміні оновлює також serial_number.

---

## isSystem у UI

Після модернізації (PLAN-field-definitions-modernization):
- Колонка «Системне» та Badge у формі видалено.
- isSystem використовується лише для canDelete — системні поля не можна видалити.
- API та Prisma зберігають isSystem для parser/import.

---

## Джерела

- `src/features/vehicles/types.ts` — тип Product
- `src/features/vehicles/components/dynamic-field-renderer.tsx` — логіка рендерингу
- `prisma/schema.prisma` — FieldDefinition.isSystem, systemColumn
